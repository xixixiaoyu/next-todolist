'use client'

import { useState } from 'react'
import { formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TodoForm } from './todo-form'
import { Check, Edit2, Trash2, Clock, RotateCcw } from 'lucide-react'
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
    if (window.confirm('确定要删除这个任务吗？')) {
      setLoading(true)
      try {
        await onDelete(todo.id)
      } finally {
        setLoading(false)
      }
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
    <Card className={`transition-all duration-200 ${todo.completed ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 完成状态按钮 */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleComplete}
            disabled={loading}
            className={`mt-1 flex-shrink-0 ${
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
            <h3 className={`font-medium text-lg leading-tight ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className={`mt-1 text-sm ${
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

          {/* 操作按钮 */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              disabled={loading}
              aria-label="编辑任务"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="删除任务"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
