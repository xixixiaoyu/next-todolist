# 09 - 表单处理

本章将详细介绍如何使用 React Hook Form 和 Zod 实现高性能的表单处理，包括验证、错误处理和用户体验优化。

## 🎯 学习目标

- 理解现代表单处理的最佳实践
- 掌握 React Hook Form 的核心概念
- 学会使用 Zod 进行类型安全的验证
- 了解表单性能优化技巧
- 掌握复杂表单场景的处理方法

## 🏗️ 表单处理架构

```
┌─────────────────────────────────────────────────────────┐
│                    表单处理层                            │
├─────────────────────────────────────────────────────────┤
│  Form Schema (Zod 验证模式)                             │
│  ├── Field Validation (字段验证)                        │
│  ├── Cross-field Validation (跨字段验证)                │
│  └── Async Validation (异步验证)                        │
├─────────────────────────────────────────────────────────┤
│  Form State Management (表单状态管理)                   │
│  ├── Field Values (字段值)                              │
│  ├── Validation Errors (验证错误)                       │
│  ├── Touched Fields (已触摸字段)                        │
│  └── Submission State (提交状态)                        │
├─────────────────────────────────────────────────────────┤
│  Form Components (表单组件)                             │
│  ├── Input Components (输入组件)                        │
│  ├── Validation Display (验证显示)                      │
│  └── Form Actions (表单操作)                            │
└─────────────────────────────────────────────────────────┘
```

## 🔧 React Hook Form 基础

### 1. 为什么选择 React Hook Form？

```typescript
// 传统受控组件 - 每次输入都重渲染
function TraditionalForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  return (
    <form>
      <input 
        value={email}
        onChange={(e) => setEmail(e.target.value)} // 每次输入都重渲染
      />
      <input 
        value={password}
        onChange={(e) => setPassword(e.target.value)} // 每次输入都重渲染
      />
    </form>
  )
}

// React Hook Form - 最小化重渲染
function OptimizedForm() {
  const { register, handleSubmit } = useForm()
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} /> {/* 无重渲染 */}
      <input {...register('password')} /> {/* 无重渲染 */}
    </form>
  )
}
```

**React Hook Form 优势：**
- 🚀 **高性能**: 最小化重渲染
- 🎯 **易用性**: 简洁的 API
- 🔧 **灵活性**: 支持多种验证方式
- 📦 **轻量级**: 体积小，无依赖
- 🛡️ **类型安全**: 完美的 TypeScript 支持

### 2. 基础表单实现

```typescript
// src/components/forms/basic-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 定义验证模式
const formSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要 6 个字符'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof formSchema>

export function BasicForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // 实时验证
  })

  const onSubmit = async (data: FormData) => {
    try {
      console.log('提交数据:', data)
      // 处理表单提交
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟 API 调用
      reset() // 重置表单
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={`input ${errors.email ? 'input-error' : ''}`}
        />
        {errors.email && (
          <p className="text-red-600 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={`input ${errors.password ? 'input-error' : ''}`}
        />
        {errors.password && (
          <p className="text-red-600 text-sm">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword">确认密码</label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
        />
        {errors.confirmPassword && (
          <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
}
```

## 🛡️ Zod 验证详解

### 1. 基础验证规则

```typescript
// src/lib/validations/user.ts
import { z } from 'zod'

// 字符串验证
export const emailSchema = z
  .string()
  .min(1, '邮箱不能为空')
  .email('请输入有效的邮箱地址')
  .max(100, '邮箱长度不能超过 100 个字符')

export const passwordSchema = z
  .string()
  .min(8, '密码至少需要 8 个字符')
  .max(100, '密码长度不能超过 100 个字符')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')

// 数字验证
export const ageSchema = z
  .number()
  .int('年龄必须是整数')
  .min(0, '年龄不能为负数')
  .max(150, '年龄不能超过 150')

// 日期验证
export const birthDateSchema = z
  .date()
  .max(new Date(), '出生日期不能是未来时间')
  .refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear()
      return age >= 13
    },
    '用户年龄必须满 13 岁'
  )

// 枚举验证
export const genderSchema = z.enum(['male', 'female', 'other'], {
  errorMap: () => ({ message: '请选择有效的性别' })
})

// 数组验证
export const tagsSchema = z
  .array(z.string().min(1, '标签不能为空'))
  .min(1, '至少需要一个标签')
  .max(5, '最多只能有 5 个标签')

// 对象验证
export const addressSchema = z.object({
  street: z.string().min(1, '街道地址不能为空'),
  city: z.string().min(1, '城市不能为空'),
  zipCode: z.string().regex(/^\d{6}$/, '邮政编码必须是 6 位数字'),
  country: z.string().default('中国'),
})
```

### 2. 高级验证技巧

```typescript
// src/lib/validations/advanced.ts
import { z } from 'zod'

// 条件验证
export const userSchema = z.object({
  type: z.enum(['individual', 'company']),
  name: z.string().min(1, '姓名不能为空'),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === 'company') {
      return data.companyName && data.taxId
    }
    return true
  },
  {
    message: '企业用户必须填写公司名称和税号',
    path: ['companyName'],
  }
)

// 异步验证
export const usernameSchema = z
  .string()
  .min(3, '用户名至少需要 3 个字符')
  .refine(
    async (username) => {
      // 模拟 API 检查用户名是否可用
      const response = await fetch(`/api/check-username?username=${username}`)
      const { available } = await response.json()
      return available
    },
    '用户名已被占用'
  )

// 文件验证
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, '文件大小不能超过 5MB')
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    '只支持 JPEG、PNG 和 WebP 格式'
  )

// 自定义验证函数
const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export const phoneSchema = z
  .string()
  .refine(isValidPhoneNumber, '请输入有效的手机号码')

// 转换和预处理
export const numberStringSchema = z
  .string()
  .transform((val) => parseInt(val, 10))
  .pipe(z.number().min(0, '数值不能为负数'))

export const trimmedStringSchema = z
  .string()
  .transform((val) => val.trim())
  .pipe(z.string().min(1, '内容不能为空'))
```

## 📝 Todo 表单实现

```typescript
// src/components/todo/todo-form.tsx
'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X } from 'lucide-react'

// 验证模式
const todoSchema = z.object({
  title: z
    .string()
    .min(1, '标题不能为空')
    .max(100, '标题不能超过 100 个字符')
    .trim()
    .refine((val) => val.length > 0, '标题不能只包含空格'),
  description: z
    .string()
    .max(500, '描述不能超过 500 个字符')
    .optional()
    .or(z.literal(''))
    .transform((val) => val === '' ? undefined : val),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: '请选择有效的优先级' })
  }).default('medium'),
  dueDate: z
    .string()
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        return new Date(date) > new Date()
      },
      '截止日期必须是未来时间'
    ),
  tags: z
    .array(z.string().min(1, '标签不能为空'))
    .max(5, '最多只能添加 5 个标签')
    .default([]),
})

type TodoFormData = z.infer<typeof todoSchema>

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
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [tagInput, setTagInput] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || 'medium',
      dueDate: initialData?.dueDate || '',
      tags: initialData?.tags || [],
    },
    mode: 'onChange',
  })

  const watchedPriority = watch('priority')

  const handleFormSubmit = async (data: TodoFormData) => {
    try {
      await onSubmit({ ...data, tags })
      if (mode === 'create') {
        reset()
        setTags([])
      }
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      setValue('tags', newTags)
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    setValue('tags', newTags)
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 标题字段 */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              placeholder="输入任务标题..."
              {...register('title')}
              error={errors.title?.message}
            />
          </div>

          {/* 描述字段 */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              任务描述
            </label>
            <textarea
              id="description"
              placeholder="输入任务描述（可选）..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* 优先级字段 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">优先级</label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => field.onChange(priority)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        field.value === priority
                          ? priorityColors[priority]
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {priority === 'low' && '低'}
                      {priority === 'medium' && '中'}
                      {priority === 'high' && '高'}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* 截止日期字段 */}
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              截止日期
            </label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate')}
              error={errors.dueDate?.message}
            />
          </div>

          {/* 标签字段 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">标签</label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="添加标签..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                size="sm"
              >
                添加
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {errors.tags && (
              <p className="text-sm text-red-600">{errors.tags.message}</p>
            )}
          </div>

          {/* 表单操作 */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || loading}
              className="flex-1"
            >
              {isSubmitting || loading ? '保存中...' : (mode === 'create' ? '添加任务' : '保存更改')}
            </Button>
            
            {mode === 'edit' && onCancel && (
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

          {/* 表单状态指示 */}
          {mode === 'edit' && (
            <div className="text-xs text-gray-500">
              {isDirty ? '表单已修改' : '表单未修改'}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
```

## 🎯 表单性能优化

### 1. 减少重渲染

```typescript
// 使用 useCallback 优化事件处理器
const handleInputChange = useCallback((field: string) => (value: string) => {
  setValue(field, value, { shouldValidate: true })
}, [setValue])

// 使用 React.memo 优化子组件
const FormField = React.memo(({ label, error, children }) => (
  <div className="form-field">
    <label>{label}</label>
    {children}
    {error && <span className="error">{error}</span>}
  </div>
))

// 使用 Controller 优化复杂组件
<Controller
  name="customField"
  control={control}
  render={({ field, fieldState }) => (
    <CustomComponent
      {...field}
      error={fieldState.error?.message}
    />
  )}
/>
```

### 2. 智能验证策略

```typescript
const { register, handleSubmit } = useForm({
  mode: 'onBlur',        // 失焦时验证
  reValidateMode: 'onChange', // 重新验证时机
  shouldFocusError: true,     // 自动聚焦到错误字段
  shouldUnregister: false,    // 保持字段注册状态
})
```

## 🤔 思考题

1. 什么时候应该使用受控组件，什么时候使用非受控组件？
2. 如何处理复杂的跨字段验证？
3. 表单性能优化的关键点有哪些？
4. 如何设计可复用的表单组件？

## 📚 扩展阅读

- [React Hook Form 官方文档](https://react-hook-form.com/)
- [Zod 验证库文档](https://zod.dev/)
- [表单可访问性指南](https://www.w3.org/WAI/tutorials/forms/)
- [表单 UX 最佳实践](https://uxdesign.cc/form-design-best-practices/)

## 🔗 下一步

完成表单处理后，下一章我们将实现完整的认证功能。

[下一章：认证功能实现 →](./10-auth-implementation.md)
