'use client'

import React from 'react'
import { TodoItem } from './todo-item'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock } from 'lucide-react'
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
  onDelete,
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
  const activeTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)

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
              <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
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
              <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
