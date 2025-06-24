# 08 - 状态管理

本章将详细介绍如何使用 Zustand 实现高效的状态管理，包括状态设计、异步操作和性能优化。

## 🎯 学习目标

- 理解现代状态管理的核心概念
- 掌握 Zustand 的使用方法和最佳实践
- 学会设计可扩展的状态结构
- 了解异步状态管理的处理方式
- 掌握状态持久化和中间件使用

## 🏗️ 状态管理架构

```
┌─────────────────────────────────────────────────────────┐
│                    应用状态层                            │
├─────────────────────────────────────────────────────────┤
│  Global State (全局状态)                                │
│  ├── Auth State (认证状态)                              │
│  ├── Todo State (Todo 状态)                             │
│  ├── UI State (界面状态)                                │
│  └── Settings State (设置状态)                          │
├─────────────────────────────────────────────────────────┤
│  Local State (本地状态)                                 │
│  ├── Component State (组件状态)                         │
│  ├── Form State (表单状态)                              │
│  └── Temporary State (临时状态)                         │
├─────────────────────────────────────────────────────────┤
│  Derived State (派生状态)                               │
│  ├── Computed Values (计算值)                           │
│  ├── Filtered Data (过滤数据)                           │
│  └── Aggregated Data (聚合数据)                         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Zustand 基础

### 1. 为什么选择 Zustand？

```typescript
// 对比其他状态管理库

// Redux - 样板代码多
const INCREMENT = 'INCREMENT'
const increment = () => ({ type: INCREMENT })
const counterReducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case INCREMENT:
      return { ...state, count: state.count + 1 }
    default:
      return state
  }
}

// Zustand - 简洁直观
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

**Zustand 优势：**
- 🪶 **轻量级**: 体积小，性能好
- 🎯 **简单易用**: API 简洁，学习成本低
- 🔧 **TypeScript 友好**: 完美的类型支持
- 🚀 **无样板代码**: 相比 Redux 更简洁
- 🔄 **灵活**: 支持多种使用模式

### 2. 基础 Store 创建

```typescript
// src/store/counter.ts - 简单示例
import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterStore = create<CounterState>((set, get) => ({
  count: 0,
  
  increment: () => set((state) => ({ count: state.count + 1 })),
  
  decrement: () => set((state) => ({ count: state.count - 1 })),
  
  reset: () => set({ count: 0 }),
}))

// 在组件中使用
function Counter() {
  const { count, increment, decrement, reset } = useCounterStore()
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

## 🔐 认证状态管理

```typescript
// src/store/auth.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  // 状态数据
  user: User | null
  loading: boolean
  initialized: boolean
  error: string | null
  
  // 认证方法
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  
  // 状态管理方法
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      loading: true,
      initialized: false,
      error: null,

      // 登录方法
      signIn: async (email: string, password: string) => {
        const supabase = createClient()
        
        try {
          set({ loading: true, error: null })
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          set({ 
            user: data.user, 
            loading: false,
            error: null 
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '登录失败'
          set({ 
            loading: false, 
            error: message,
            user: null 
          })
          throw error
        }
      },

      // 注册方法
      signUp: async (email: string, password: string) => {
        const supabase = createClient()
        
        try {
          set({ loading: true, error: null })
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })

          if (error) throw error

          set({ 
            user: data.user, 
            loading: false,
            error: null 
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '注册失败'
          set({ 
            loading: false, 
            error: message,
            user: null 
          })
          throw error
        }
      },

      // 登出方法
      signOut: async () => {
        const supabase = createClient()
        
        try {
          set({ loading: true, error: null })
          
          const { error } = await supabase.auth.signOut()
          if (error) throw error

          set({ 
            user: null, 
            loading: false,
            error: null 
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '登出失败'
          set({ 
            loading: false, 
            error: message 
          })
          throw error
        }
      },

      // 更新用户资料
      updateProfile: async (updates: Partial<User>) => {
        const supabase = createClient()
        const currentUser = get().user
        
        if (!currentUser) {
          throw new Error('用户未登录')
        }
        
        try {
          set({ loading: true, error: null })
          
          const { data, error } = await supabase.auth.updateUser(updates)
          if (error) throw error

          set({ 
            user: data.user, 
            loading: false,
            error: null 
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : '更新失败'
          set({ 
            loading: false, 
            error: message 
          })
          throw error
        }
      },

      // 状态设置方法
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // 初始化方法
      initialize: async () => {
        const supabase = createClient()
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('获取会话失败:', error)
          }

          set({ 
            user: session?.user ?? null, 
            loading: false, 
            initialized: true,
            error: null
          })
        } catch (error) {
          console.error('初始化认证失败:', error)
          set({ 
            loading: false, 
            initialized: true,
            error: '初始化失败'
          })
        }
      },
    }),
    {
      name: 'auth-storage', // 存储键名
      partialize: (state) => ({ 
        user: state.user,
        initialized: state.initialized 
      }), // 只持久化部分状态
    }
  )
)

// 选择器 - 优化性能
export const useUser = () => useAuthStore((state) => state.user)
export const useAuthLoading = () => useAuthStore((state) => state.loading)
export const useAuthError = () => useAuthStore((state) => state.error)
export const useAuthActions = () => useAuthStore((state) => ({
  signIn: state.signIn,
  signUp: state.signUp,
  signOut: state.signOut,
  updateProfile: state.updateProfile,
  clearError: state.clearError,
}))
```

## 📝 Todo 状态管理

```typescript
// src/store/todos.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { Todo, TodoInsert, TodoUpdate, TodoFilter, TodoSort, SortOrder } from '@/types'

interface TodoState {
  // 数据状态
  todos: Todo[]
  loading: boolean
  error: string | null
  
  // UI 状态
  selectedTodos: string[]
  filter: TodoFilter
  sort: TodoSort
  order: SortOrder
  search: string
  
  // 分页状态
  page: number
  limit: number
  total: number
  hasMore: boolean
  
  // CRUD 操作
  fetchTodos: (options?: FetchOptions) => Promise<void>
  addTodo: (todo: TodoInsert) => Promise<void>
  updateTodo: (id: string, updates: TodoUpdate) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  bulkAction: (action: BulkAction, todoIds: string[]) => Promise<void>
  
  // 过滤和排序
  setFilter: (filter: TodoFilter) => void
  setSort: (sort: TodoSort, order?: SortOrder) => void
  setSearch: (search: string) => void
  
  // 选择操作
  selectTodo: (id: string) => void
  selectAllTodos: () => void
  clearSelection: () => void
  
  // 计算属性
  filteredTodos: () => Todo[]
  selectedTodosData: () => Todo[]
  stats: () => TodoStats
  
  // 实时订阅
  subscribeToTodos: () => () => void
  
  // 状态重置
  reset: () => void
}

interface FetchOptions {
  page?: number
  limit?: number
  append?: boolean
  refresh?: boolean
}

interface BulkAction {
  type: 'complete' | 'incomplete' | 'delete' | 'archive'
  data?: any
}

interface TodoStats {
  total: number
  completed: number
  pending: number
  completionRate: number
}

export const useTodoStore = create<TodoState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    todos: [],
    loading: false,
    error: null,
    selectedTodos: [],
    filter: 'all',
    sort: 'created_at',
    order: 'desc',
    search: '',
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,

    // 获取 Todos
    fetchTodos: async (options = {}) => {
      const { page = 1, limit = 20, append = false, refresh = false } = options
      const supabase = createClient()
      
      try {
        if (!append) {
          set({ loading: true, error: null })
        }

        const { data, error, count } = await supabase
          .from('todos')
          .select('*', { count: 'exact' })
          .order(get().sort, { ascending: get().order === 'asc' })
          .range((page - 1) * limit, page * limit - 1)

        if (error) throw error

        set((state) => ({
          todos: append ? [...state.todos, ...(data || [])] : (data || []),
          loading: false,
          error: null,
          page,
          total: count || 0,
          hasMore: (count || 0) > page * limit,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '获取失败'
        set({ 
          loading: false, 
          error: message 
        })
        throw error
      }
    },

    // 添加 Todo
    addTodo: async (todo: TodoInsert) => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('todos')
          .insert([todo])
          .select()
          .single()

        if (error) throw error

        set((state) => ({
          todos: [data, ...state.todos],
          total: state.total + 1,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '添加失败'
        set({ error: message })
        throw error
      }
    },

    // 更新 Todo
    updateTodo: async (id: string, updates: TodoUpdate) => {
      const supabase = createClient()

      try {
        const { data, error } = await supabase
          .from('todos')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? data : todo
          ),
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新失败'
        set({ error: message })
        throw error
      }
    },

    // 删除 Todo
    deleteTodo: async (id: string) => {
      const supabase = createClient()

      try {
        const { error } = await supabase
          .from('todos')
          .delete()
          .eq('id', id)

        if (error) throw error

        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
          selectedTodos: state.selectedTodos.filter((todoId) => todoId !== id),
          total: state.total - 1,
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '删除失败'
        set({ error: message })
        throw error
      }
    },

    // 切换完成状态
    toggleTodo: async (id: string) => {
      const todo = get().todos.find((t) => t.id === id)
      if (!todo) return

      await get().updateTodo(id, { completed: !todo.completed })
    },

    // 批量操作
    bulkAction: async (action: BulkAction, todoIds: string[]) => {
      const supabase = createClient()

      try {
        let updates: TodoUpdate = {}
        
        switch (action.type) {
          case 'complete':
            updates = { completed: true }
            break
          case 'incomplete':
            updates = { completed: false }
            break
          case 'delete':
            const { error } = await supabase
              .from('todos')
              .delete()
              .in('id', todoIds)
            
            if (error) throw error
            
            set((state) => ({
              todos: state.todos.filter((todo) => !todoIds.includes(todo.id)),
              selectedTodos: [],
              total: state.total - todoIds.length,
            }))
            return
          default:
            throw new Error(`未知的批量操作: ${action.type}`)
        }

        const { data, error } = await supabase
          .from('todos')
          .update(updates)
          .in('id', todoIds)
          .select()

        if (error) throw error

        set((state) => ({
          todos: state.todos.map((todo) => {
            const updated = data?.find((d) => d.id === todo.id)
            return updated || todo
          }),
          selectedTodos: [],
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : '批量操作失败'
        set({ error: message })
        throw error
      }
    },

    // 过滤和排序
    setFilter: (filter) => set({ filter }),
    setSort: (sort, order = 'desc') => set({ sort, order }),
    setSearch: (search) => set({ search }),

    // 选择操作
    selectTodo: (id) => set((state) => ({
      selectedTodos: state.selectedTodos.includes(id)
        ? state.selectedTodos.filter((todoId) => todoId !== id)
        : [...state.selectedTodos, id]
    })),
    
    selectAllTodos: () => set((state) => ({
      selectedTodos: state.selectedTodos.length === state.filteredTodos().length
        ? []
        : state.filteredTodos().map((todo) => todo.id)
    })),
    
    clearSelection: () => set({ selectedTodos: [] }),

    // 计算属性
    filteredTodos: () => {
      const { todos, filter, search } = get()
      
      let filtered = todos

      // 应用搜索
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = filtered.filter((todo) =>
          todo.title.toLowerCase().includes(searchLower) ||
          (todo.description && todo.description.toLowerCase().includes(searchLower))
        )
      }

      // 应用过滤
      switch (filter) {
        case 'active':
          filtered = filtered.filter((todo) => !todo.completed)
          break
        case 'completed':
          filtered = filtered.filter((todo) => todo.completed)
          break
        default:
          break
      }

      return filtered
    },

    selectedTodosData: () => {
      const { todos, selectedTodos } = get()
      return todos.filter((todo) => selectedTodos.includes(todo.id))
    },

    stats: () => {
      const todos = get().todos
      const total = todos.length
      const completed = todos.filter((todo) => todo.completed).length
      const pending = total - completed
      const completionRate = total > 0 ? (completed / total) * 100 : 0

      return {
        total,
        completed,
        pending,
        completionRate,
      }
    },

    // 实时订阅
    subscribeToTodos: () => {
      const supabase = createClient()
      
      const subscription = supabase
        .channel('todos')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'todos',
          },
          (payload) => {
            const { eventType, new: newRecord, old: oldRecord } = payload

            set((state) => {
              switch (eventType) {
                case 'INSERT':
                  return {
                    todos: [newRecord as Todo, ...state.todos],
                    total: state.total + 1,
                  }
                case 'UPDATE':
                  return {
                    todos: state.todos.map((todo) =>
                      todo.id === newRecord.id ? (newRecord as Todo) : todo
                    ),
                  }
                case 'DELETE':
                  return {
                    todos: state.todos.filter((todo) => todo.id !== oldRecord.id),
                    selectedTodos: state.selectedTodos.filter((id) => id !== oldRecord.id),
                    total: state.total - 1,
                  }
                default:
                  return state
              }
            })
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    },

    // 重置状态
    reset: () => set({
      todos: [],
      loading: false,
      error: null,
      selectedTodos: [],
      filter: 'all',
      sort: 'created_at',
      order: 'desc',
      search: '',
      page: 1,
      total: 0,
      hasMore: true,
    }),
  }))
)

// 性能优化的选择器
export const useTodos = () => useTodoStore((state) => state.filteredTodos())
export const useTodoStats = () => useTodoStore((state) => state.stats())
export const useTodoLoading = () => useTodoStore((state) => state.loading)
export const useTodoError = () => useTodoStore((state) => state.error)
export const useSelectedTodos = () => useTodoStore((state) => state.selectedTodos)
export const useTodoActions = () => useTodoStore((state) => ({
  fetchTodos: state.fetchTodos,
  addTodo: state.addTodo,
  updateTodo: state.updateTodo,
  deleteTodo: state.deleteTodo,
  toggleTodo: state.toggleTodo,
  bulkAction: state.bulkAction,
}))
```

## 🔧 中间件和工具

### 1. 持久化中间件

```typescript
// src/store/middleware/persist.ts
import { persist, createJSONStorage } from 'zustand/middleware'

// 自定义存储
const customStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // 静默失败
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // 静默失败
    }
  },
}))

// 使用示例
export const usePersistedStore = create(
  persist(
    (set, get) => ({
      // store 定义
    }),
    {
      name: 'app-storage',
      storage: customStorage,
      partialize: (state) => ({
        // 只持久化需要的状态
        user: state.user,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('状态已恢复:', state)
      },
    }
  )
)
```

### 2. 开发工具中间件

```typescript
// src/store/middleware/devtools.ts
import { devtools } from 'zustand/middleware'

export const useStoreWithDevtools = create(
  devtools(
    (set, get) => ({
      // store 定义
    }),
    {
      name: 'todo-store', // DevTools 中显示的名称
      serialize: true,    // 序列化状态
    }
  )
)
```

## 🤔 思考题

1. 什么时候应该使用全局状态，什么时候使用本地状态？
2. 如何设计状态结构以支持未来的扩展？
3. 异步操作的错误处理最佳实践是什么？
4. 如何优化大型应用的状态管理性能？

## 📚 扩展阅读

- [Zustand 官方文档](https://zustand-demo.pmnd.rs/)
- [React 状态管理指南](https://react.dev/learn/managing-state)
- [状态管理模式对比](https://blog.logrocket.com/react-state-management-tools/)
- [性能优化最佳实践](https://react.dev/learn/render-and-commit)

## 🔗 下一步

完成状态管理后，下一章我们将学习表单处理的实现。

[下一章：表单处理 →](./09-form-handling.md)
