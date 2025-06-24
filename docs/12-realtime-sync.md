# 12 - 实时同步

本章将详细介绍如何使用 Supabase Realtime 实现多设备间的实时数据同步，让用户在不同设备上都能看到最新的数据变化。

## 🎯 学习目标

- 理解实时数据同步的原理和重要性
- 掌握 Supabase Realtime 的使用方法
- 学会处理实时数据的冲突和同步
- 了解实时功能的性能优化技巧

## ⚡ 实时同步原理

### WebSocket 连接流程

```
客户端 A                    Supabase                    客户端 B
    │                         │                         │
    ├─── 建立 WebSocket 连接 ──→│                         │
    │                         ├─── 建立 WebSocket 连接 ──→│
    │                         │                         │
    ├─── 插入新 Todo ─────────→│                         │
    │                         ├─── 广播变化 ─────────────→│
    │                         │                         ├─ 更新本地状态
    │                         │                         │
    │                    ←──── 确认插入 ─────────────────┤
    ├─ 更新本地状态            │                         │
```

## 🔧 Realtime 配置

### 1. 数据库配置

```sql
-- 启用 Realtime 功能
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;

-- 确保 RLS 策略正确
-- 用户只能接收自己的数据变化
CREATE POLICY "Users can receive own todo changes" ON public.todos
    FOR SELECT USING (auth.uid() = user_id);
```

### 2. 客户端订阅设置

```typescript
// src/hooks/use-realtime-todos.ts
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTodoStore } from '@/store/todos'
import { useAuthStore } from '@/store/auth'
import type { Todo } from '@/types'

export function useRealtimeTodos() {
  const { user } = useAuthStore()
  const { todos, setTodos } = useTodoStore()
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()

    // 创建 Realtime 订阅
    const subscription = supabase
      .channel('todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`, // 只监听当前用户的数据
        },
        (payload) => {
          console.log('Realtime event:', payload)
          handleRealtimeEvent(payload)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    subscriptionRef.current = subscription

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [user])

  const handleRealtimeEvent = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        handleInsert(newRecord as Todo)
        break
      case 'UPDATE':
        handleUpdate(newRecord as Todo)
        break
      case 'DELETE':
        handleDelete(oldRecord as Todo)
        break
    }
  }

  const handleInsert = (newTodo: Todo) => {
    // 检查是否已存在（避免重复）
    const exists = todos.some(todo => todo.id === newTodo.id)
    if (!exists) {
      useTodoStore.setState(state => ({
        todos: [newTodo, ...state.todos],
        total: state.total + 1,
      }))
    }
  }

  const handleUpdate = (updatedTodo: Todo) => {
    useTodoStore.setState(state => ({
      todos: state.todos.map(todo =>
        todo.id === updatedTodo.id ? updatedTodo : todo
      ),
    }))
  }

  const handleDelete = (deletedTodo: Todo) => {
    useTodoStore.setState(state => ({
      todos: state.todos.filter(todo => todo.id !== deletedTodo.id),
      selectedTodos: state.selectedTodos.filter(id => id !== deletedTodo.id),
      total: state.total - 1,
    }))
  }
}
```

### 3. 实时状态指示器

```typescript
// src/components/ui/realtime-indicator.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wifi, WifiOff, Activity } from 'lucide-react'

type ConnectionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'

export function RealtimeIndicator() {
  const [status, setStatus] = useState<ConnectionStatus>('CLOSED')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const subscription = supabase
      .channel('connection-test')
      .on('presence', { event: 'sync' }, () => {
        setLastUpdate(new Date())
      })
      .subscribe((status) => {
        setStatus(status as ConnectionStatus)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getStatusInfo = () => {
    switch (status) {
      case 'SUBSCRIBED':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: '实时连接',
        }
      case 'TIMED_OUT':
      case 'CHANNEL_ERROR':
        return {
          icon: WifiOff,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: '连接异常',
        }
      default:
        return {
          icon: Activity,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: '连接中',
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium">
      <div className={`p-1 rounded-full ${statusInfo.bgColor}`}>
        <statusInfo.icon className={`h-3 w-3 ${statusInfo.color}`} />
      </div>
      <span className={statusInfo.color}>{statusInfo.text}</span>
      {lastUpdate && status === 'SUBSCRIBED' && (
        <span className="text-gray-500">
          {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}
```

## 🔄 冲突解决

### 1. 乐观更新策略

```typescript
// src/store/todos-optimistic.ts
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Todo, TodoInsert, TodoUpdate } from '@/types'

interface OptimisticTodoState {
  todos: Todo[]
  pendingOperations: Map<string, 'insert' | 'update' | 'delete'>
  
  // 乐观更新方法
  optimisticAdd: (todo: TodoInsert) => Promise<void>
  optimisticUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  optimisticDelete: (id: string) => Promise<void>
  
  // 回滚方法
  rollbackOperation: (operationId: string) => void
}

export const useOptimisticTodoStore = create<OptimisticTodoState>((set, get) => ({
  todos: [],
  pendingOperations: new Map(),

  optimisticAdd: async (todoData: TodoInsert) => {
    const tempId = `temp-${Date.now()}`
    const optimisticTodo: Todo = {
      id: tempId,
      ...todoData,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // 立即更新 UI
    set(state => ({
      todos: [optimisticTodo, ...state.todos],
      pendingOperations: new Map(state.pendingOperations).set(tempId, 'insert'),
    }))

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single()

      if (error) throw error

      // 替换临时数据为真实数据
      set(state => {
        const newPendingOps = new Map(state.pendingOperations)
        newPendingOps.delete(tempId)
        
        return {
          todos: state.todos.map(todo =>
            todo.id === tempId ? data : todo
          ),
          pendingOperations: newPendingOps,
        }
      })
    } catch (error) {
      // 回滚操作
      set(state => {
        const newPendingOps = new Map(state.pendingOperations)
        newPendingOps.delete(tempId)
        
        return {
          todos: state.todos.filter(todo => todo.id !== tempId),
          pendingOperations: newPendingOps,
        }
      })
      throw error
    }
  },

  optimisticUpdate: async (id: string, updates: TodoUpdate) => {
    const originalTodo = get().todos.find(todo => todo.id === id)
    if (!originalTodo) return

    // 立即更新 UI
    set(state => ({
      todos: state.todos.map(todo =>
        todo.id === id 
          ? { ...todo, ...updates, updated_at: new Date().toISOString() }
          : todo
      ),
      pendingOperations: new Map(state.pendingOperations).set(id, 'update'),
    }))

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 更新为服务器返回的数据
      set(state => {
        const newPendingOps = new Map(state.pendingOperations)
        newPendingOps.delete(id)
        
        return {
          todos: state.todos.map(todo =>
            todo.id === id ? data : todo
          ),
          pendingOperations: newPendingOps,
        }
      })
    } catch (error) {
      // 回滚到原始状态
      set(state => {
        const newPendingOps = new Map(state.pendingOperations)
        newPendingOps.delete(id)
        
        return {
          todos: state.todos.map(todo =>
            todo.id === id ? originalTodo : todo
          ),
          pendingOperations: newPendingOps,
        }
      })
      throw error
    }
  },

  optimisticDelete: async (id: string) => {
    const originalTodo = get().todos.find(todo => todo.id === id)
    if (!originalTodo) return

    // 立即从 UI 移除
    set(state => ({
      todos: state.todos.filter(todo => todo.id !== id),
      pendingOperations: new Map(state.pendingOperations).set(id, 'delete'),
    }))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 确认删除成功
      set(state => {
        const newPendingOps = new Map(state.pendingOperations)
        newPendingOps.delete(id)
        return { pendingOperations: newPendingOps }
      })
    } catch (error) {
      // 恢复删除的项目
      set(state => {
        const newPendingOps = new Map(state.pendingOperations)
        newPendingOps.delete(id)
        
        return {
          todos: [originalTodo, ...state.todos],
          pendingOperations: newPendingOps,
        }
      })
      throw error
    }
  },

  rollbackOperation: (operationId: string) => {
    set(state => {
      const newPendingOps = new Map(state.pendingOperations)
      newPendingOps.delete(operationId)
      return { pendingOperations: newPendingOps }
    })
  },
}))
```

### 2. 冲突检测和解决

```typescript
// src/lib/conflict-resolution.ts
import type { Todo } from '@/types'

export interface ConflictInfo {
  type: 'update' | 'delete'
  localVersion: Todo
  serverVersion: Todo
  conflictFields: string[]
}

export function detectConflict(local: Todo, server: Todo): ConflictInfo | null {
  const conflictFields: string[] = []

  // 检查各个字段是否有冲突
  if (local.title !== server.title) conflictFields.push('title')
  if (local.description !== server.description) conflictFields.push('description')
  if (local.completed !== server.completed) conflictFields.push('completed')

  if (conflictFields.length === 0) return null

  return {
    type: 'update',
    localVersion: local,
    serverVersion: server,
    conflictFields,
  }
}

export function resolveConflict(conflict: ConflictInfo, strategy: 'local' | 'server' | 'merge'): Todo {
  switch (strategy) {
    case 'local':
      return conflict.localVersion
    
    case 'server':
      return conflict.serverVersion
    
    case 'merge':
      // 简单的合并策略：优先使用最新的更新时间
      const localTime = new Date(conflict.localVersion.updated_at).getTime()
      const serverTime = new Date(conflict.serverVersion.updated_at).getTime()
      
      return localTime > serverTime ? conflict.localVersion : conflict.serverVersion
    
    default:
      return conflict.serverVersion
  }
}
```

## 🎯 性能优化

### 1. 连接管理

```typescript
// src/lib/realtime-manager.ts
class RealtimeManager {
  private static instance: RealtimeManager
  private connections: Map<string, any> = new Map()
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  subscribe(channelName: string, config: any) {
    if (this.connections.has(channelName)) {
      console.warn(`Channel ${channelName} already subscribed`)
      return this.connections.get(channelName)
    }

    const supabase = createClient()
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', config, config.callback)
      .subscribe((status) => {
        console.log(`Channel ${channelName} status:`, status)
        
        if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          this.handleConnectionError(channelName, config)
        } else if (status === 'SUBSCRIBED') {
          this.reconnectAttempts = 0
        }
      })

    this.connections.set(channelName, subscription)
    return subscription
  }

  unsubscribe(channelName: string) {
    const subscription = this.connections.get(channelName)
    if (subscription) {
      subscription.unsubscribe()
      this.connections.delete(channelName)
    }
  }

  private async handleConnectionError(channelName: string, config: any) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnection attempts reached for ${channelName}`)
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    console.log(`Reconnecting ${channelName} in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      this.unsubscribe(channelName)
      this.subscribe(channelName, config)
    }, delay)
  }

  unsubscribeAll() {
    this.connections.forEach((subscription, channelName) => {
      subscription.unsubscribe()
    })
    this.connections.clear()
  }
}

export const realtimeManager = RealtimeManager.getInstance()
```

### 2. 数据去重和缓存

```typescript
// src/hooks/use-realtime-deduplication.ts
import { useRef, useCallback } from 'react'

interface RealtimeEvent {
  id: string
  timestamp: number
  type: string
  data: any
}

export function useRealtimeDeduplication(windowMs: number = 1000) {
  const eventCache = useRef<Map<string, RealtimeEvent>>(new Map())

  const isDuplicate = useCallback((event: RealtimeEvent): boolean => {
    const cached = eventCache.current.get(event.id)
    
    if (!cached) {
      eventCache.current.set(event.id, event)
      return false
    }

    // 检查是否在时间窗口内
    const timeDiff = event.timestamp - cached.timestamp
    if (timeDiff < windowMs) {
      return true
    }

    // 更新缓存
    eventCache.current.set(event.id, event)
    return false
  }, [windowMs])

  const cleanup = useCallback(() => {
    const now = Date.now()
    const entries = Array.from(eventCache.current.entries())
    
    entries.forEach(([id, event]) => {
      if (now - event.timestamp > windowMs * 2) {
        eventCache.current.delete(id)
      }
    })
  }, [windowMs])

  // 定期清理过期事件
  useEffect(() => {
    const interval = setInterval(cleanup, windowMs)
    return () => clearInterval(interval)
  }, [cleanup, windowMs])

  return { isDuplicate }
}
```

## 🔔 实时通知

### 1. 浏览器通知

```typescript
// src/hooks/use-realtime-notifications.ts
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export function useRealtimeNotifications() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user || !('Notification' in window)) return

    // 请求通知权限
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [user])

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted' && document.hidden) {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      })
    }
  }

  return { showNotification }
}
```

### 2. 应用内通知

```typescript
// src/components/realtime/realtime-notifications.tsx
'use client'

import { useEffect } from 'react'
import { useRealtimeTodos } from '@/hooks/use-realtime-todos'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'
import { useToastActions } from '@/components/ui/toast'

export function RealtimeNotifications() {
  const { showNotification } = useRealtimeNotifications()
  const toast = useToastActions()

  useEffect(() => {
    const supabase = createClient()
    
    const subscription = supabase
      .channel('todo-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'todos',
      }, (payload) => {
        const newTodo = payload.new as Todo
        
        // 浏览器通知
        showNotification('新任务添加', {
          body: newTodo.title,
          tag: 'todo-added',
        })
        
        // 应用内通知
        toast.info('新任务', `"${newTodo.title}" 已添加`)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [showNotification, toast])

  return null
}
```

## 🤔 思考题

1. 如何处理网络断开时的数据同步？
2. 实时功能对应用性能有什么影响？
3. 如何设计更复杂的冲突解决策略？
4. 如何实现离线优先的数据同步？

## 📚 扩展阅读

- [Supabase Realtime 文档](https://supabase.com/docs/guides/realtime)
- [WebSocket 最佳实践](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [乐观更新模式](https://www.apollographql.com/docs/react/performance/optimistic-ui/)
- [冲突解决算法](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)

## 🔗 下一步

完成实时同步功能后，下一章我们将实现搜索和过滤功能。

[下一章：搜索过滤 →](./13-search-filter.md)
