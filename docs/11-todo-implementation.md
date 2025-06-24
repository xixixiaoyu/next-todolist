# 11 - Todo 功能实现

本章将详细介绍如何实现 Todo 应用的核心 CRUD 功能，包括任务的创建、读取、更新和删除操作。

## 🎯 学习目标

- 掌握完整的 CRUD 操作实现
- 学会处理复杂的业务逻辑
- 了解数据同步和状态管理
- 掌握用户交互的最佳实践

## 📝 Todo 核心功能

### 1. Todo 列表组件

```typescript
// src/components/todo/todo-list.tsx
'use client'

import React from 'react'
import { TodoItem } from './todo-item'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { Todo, TodoUpdate } from '@/types'

interface TodoListProps {
  todos: Todo[]
  loading: boolean
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export const TodoList = React.memo(function TodoList({ 
  todos, 
  loading, 
  onUpdate, 
  onDelete 
}: TodoListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (todos.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">暂无任务</h3>
            <p className="text-sm">添加您的第一个任务开始使用吧！</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 按完成状态分组
  const activeTodos = todos.filter(todo => !todo.completed)
  const completedTodos = todos.filter(todo => todo.completed)

  return (
    <div className="space-y-6">
      {/* 进行中的任务 */}
      {activeTodos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            进行中 ({activeTodos.length})
          </div>
          <div className="space-y-3">
            {activeTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* 已完成的任务 */}
      {completedTodos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CheckCircle className="h-4 w-4" />
            已完成 ({completedTodos.length})
          </div>
          <div className="space-y-3">
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
```

### 2. Todo 项目组件

```typescript
// src/components/todo/todo-item.tsx
'use client'

import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TodoForm } from './todo-form'
import { Check, Edit2, Trash2, Clock, RotateCcw, MoreHorizontal } from 'lucide-react'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import type { Todo, TodoUpdate } from '@/types'
import type { TodoFormData } from '@/lib/validations'

interface TodoItemProps {
  todo: Todo
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggleComplete = async () => {
    setLoading(true)
    try {
      await onUpdate(todo.id, { completed: !todo.completed })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (data: TodoFormData) => {
    setLoading(true)
    try {
      await onUpdate(todo.id, {
        title: data.title,
        description: data.description || null,
      })
      setIsEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`确定要删除任务"${todo.title}"吗？此操作无法撤销。`)) {
      setLoading(true)
      try {
        await onDelete(todo.id)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDuplicate = async () => {
    setLoading(true)
    try {
      await onUpdate(todo.id, {
        title: `${todo.title} (副本)`,
        description: todo.description,
        completed: false,
      })
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <TodoForm
        mode="edit"
        initialData={{
          title: todo.title,
          description: todo.description || '',
        }}
        onSubmit={handleEdit}
        onCancel={() => setIsEditing(false)}
        loading={loading}
      />
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      todo.completed ? 'opacity-75 bg-gray-50' : 'bg-white'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 完成状态按钮 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleComplete}
            disabled={loading}
            className={`mt-1 flex-shrink-0 transition-colors ${
              todo.completed 
                ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200' 
                : 'hover:bg-gray-100'
            }`}
            aria-label={todo.completed ? '标记为未完成' : '标记为已完成'}
          >
            {todo.completed ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </Button>

          {/* 任务内容 */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-lg leading-tight break-words ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className={`mt-1 text-sm break-words ${
                todo.completed ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {todo.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                创建于 {formatRelativeTime(todo.created_at)}
              </span>
              {todo.updated_at !== todo.created_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  更新于 {formatRelativeTime(todo.updated_at)}
                </span>
              )}
            </div>
          </div>

          {/* 操作菜单 */}
          <div className="flex-shrink-0">
            <Dropdown
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={loading}
                  aria-label="更多操作"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            >
              <DropdownItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                编辑
              </DropdownItem>
              <DropdownItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </DropdownItem>
              <DropdownItem onClick={handleDelete} destructive>
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. Todo 表单组件（增强版）

```typescript
// src/components/todo/todo-form.tsx
'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { todoSchema, type TodoFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Save, Calendar } from 'lucide-react'

interface TodoFormProps {
  initialData?: Partial<TodoFormData>
  mode?: 'create' | 'edit'
  onSubmit: (data: TodoFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function TodoForm({ 
  initialData, 
  mode = 'create', 
  onSubmit, 
  onCancel,
  loading = false 
}: TodoFormProps) {
  const [isExpanded, setIsExpanded] = useState(mode === 'edit')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid, isDirty },
    watch,
    reset,
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      dueDate: initialData?.dueDate || '',
    },
    mode: 'onChange',
  })

  const watchedTitle = watch('title')

  const handleFormSubmit = async (data: TodoFormData) => {
    try {
      await onSubmit(data)
      if (mode === 'create') {
        reset()
        setIsExpanded(false)
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleQuickAdd = async () => {
    if (!watchedTitle.trim()) return
    
    try {
      await onSubmit({
        title: watchedTitle.trim(),
        description: '',
        priority: 'medium',
        dueDate: '',
      })
      reset()
    } catch (error) {
      console.error('快速添加失败:', error)
    }
  }

  const priorityOptions = [
    { value: 'low', label: '低', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: '中', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: '高', color: 'bg-red-100 text-red-800' },
  ] as const

  if (mode === 'create' && !isExpanded) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="添加新任务..."
              value={watchedTitle}
              {...register('title')}
              onFocus={() => setIsExpanded(true)}
              className="flex-1"
            />
            <Button
              onClick={handleQuickAdd}
              disabled={!watchedTitle.trim() || loading || isSubmitting}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {mode === 'create' ? (
              <>
                <Plus className="h-5 w-5" />
                添加新任务
              </>
            ) : (
              <>
                <Edit2 className="h-5 w-5" />
                编辑任务
              </>
            )}
          </CardTitle>
          {mode === 'create' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExpanded(false)
                reset()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 标题字段 */}
          <div className="space-y-2">
            <Input
              placeholder="任务标题..."
              {...register('title')}
              error={errors.title?.message}
              autoFocus={mode === 'create'}
            />
          </div>

          {/* 描述字段 */}
          <div className="space-y-2">
            <textarea
              placeholder="任务描述（可选）..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* 优先级和截止日期 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 优先级 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">优先级</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-1">
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          field.value === option.value
                            ? option.color
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>

            {/* 截止日期 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">截止日期</label>
              <Input
                type="date"
                {...register('dueDate')}
                error={errors.dueDate?.message}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* 表单操作 */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || loading}
              loading={isSubmitting || loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {mode === 'create' ? '添加任务' : '保存更改'}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || loading}
              >
                取消
              </Button>
            )}
          </div>

          {/* 表单状态提示 */}
          {mode === 'edit' && (
            <div className="text-xs text-gray-500 text-center">
              {isDirty ? '表单已修改' : '表单未修改'}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
```

## 🔄 批量操作功能

### 1. 批量选择组件

```typescript
// src/components/todo/todo-bulk-actions.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X, Trash2, Archive, MoreHorizontal } from 'lucide-react'

interface TodoBulkActionsProps {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBulkComplete: () => Promise<void>
  onBulkIncomplete: () => Promise<void>
  onBulkDelete: () => Promise<void>
}

export function TodoBulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkComplete,
  onBulkIncomplete,
  onBulkDelete,
}: TodoBulkActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleBulkAction = async (action: () => Promise<void>) => {
    setLoading(true)
    try {
      await action()
    } finally {
      setLoading(false)
    }
  }

  const isAllSelected = selectedCount === totalCount && totalCount > 0
  const isPartialSelected = selectedCount > 0 && selectedCount < totalCount

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartialSelected}
          onChange={isAllSelected ? onClearSelection : onSelectAll}
        />
        <span className="text-sm font-medium text-blue-900">
          {selectedCount > 0 ? `已选择 ${selectedCount} 个任务` : '选择任务'}
        </span>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction(onBulkComplete)}
            disabled={loading}
          >
            <Check className="h-4 w-4 mr-1" />
            标记完成
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction(onBulkIncomplete)}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            标记未完成
          </Button>

          <Dropdown
            trigger={
              <Button size="sm" variant="outline" disabled={loading}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            <DropdownItem 
              onClick={() => handleBulkAction(onBulkDelete)}
              destructive
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除选中
            </DropdownItem>
          </Dropdown>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
          >
            取消选择
          </Button>
        </div>
      )}
    </div>
  )
}
```

## 📊 统计和分析

### 1. Todo 统计组件

```typescript
// src/components/todo/todo-stats.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, TrendingUp, Target } from 'lucide-react'
import type { Todo } from '@/types'

interface TodoStatsProps {
  todos: Todo[]
}

export function TodoStats({ todos }: TodoStatsProps) {
  const total = todos.length
  const completed = todos.filter(todo => todo.completed).length
  const pending = total - completed
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // 计算今日完成的任务
  const today = new Date().toDateString()
  const completedToday = todos.filter(todo => 
    todo.completed && new Date(todo.updated_at).toDateString() === today
  ).length

  const stats = [
    {
      title: '总任务数',
      value: total,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: '已完成',
      value: completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: '进行中',
      value: pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: '今日完成',
      value: completedToday,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 完成率卡片 */}
      <Card className="col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-lg">完成率</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>进度</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {completed} / {total} 个任务已完成
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 🤔 思考题

1. 如何实现任务的拖拽排序功能？
2. 如何处理大量任务的性能问题？
3. 如何实现任务的分类和标签功能？
4. 如何设计任务的优先级和截止日期提醒？

## 📚 扩展阅读

- [React 性能优化指南](https://react.dev/learn/render-and-commit)
- [用户体验设计原则](https://www.nngroup.com/articles/usability-heuristics/)
- [无障碍设计指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [状态管理最佳实践](https://kentcdodds.com/blog/application-state-management-with-react)

## 🔗 下一步

完成 Todo 功能实现后，下一章我们将实现实时数据同步功能。

[下一章：实时同步 →](./12-realtime-sync.md)
