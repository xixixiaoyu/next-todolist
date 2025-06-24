'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { todoSchema, type TodoFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'

interface TodoFormProps {
  onSubmit: (data: TodoFormData) => Promise<void>
  loading?: boolean
  initialData?: TodoFormData
  mode?: 'create' | 'edit'
  onCancel?: () => void
}

export function TodoForm({ 
  onSubmit, 
  loading = false, 
  initialData, 
  mode = 'create',
  onCancel 
}: TodoFormProps) {
  const [error, setError] = useState<string>('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: initialData || { title: '', description: '' },
  })

  const handleFormSubmit = async (data: TodoFormData) => {
    try {
      setError('')
      await onSubmit(data)
      if (mode === 'create') {
        reset()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {mode === 'create' ? '添加新任务' : '编辑任务'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              placeholder="输入任务标题..."
              {...register('title')}
              aria-invalid={errors.title ? 'true' : 'false'}
            />
            {errors.title && (
              <p className="text-sm text-red-600" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">任务描述</Label>
            <textarea
              id="description"
              placeholder="输入任务描述（可选）..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('description')}
              aria-invalid={errors.description ? 'true' : 'false'}
            />
            {errors.description && (
              <p className="text-sm text-red-600" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? '保存中...' : (mode === 'create' ? '添加任务' : '保存更改')}
            </Button>
            {mode === 'edit' && onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                <X className="h-4 w-4" />
                取消
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
