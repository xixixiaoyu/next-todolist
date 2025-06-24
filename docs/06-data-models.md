# 06 - 数据模型

本章将详细介绍如何设计和实现类型安全的数据模型，包括 TypeScript 类型定义、数据库模式和 API 接口。

## 🎯 学习目标

- 理解类型驱动开发的重要性
- 掌握 TypeScript 类型系统的高级用法
- 学会设计可扩展的数据模型
- 了解数据库模式与 TypeScript 类型的映射
- 掌握 API 接口的类型定义

## 🏗️ 类型系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   类型层次结构                           │
├─────────────────────────────────────────────────────────┤
│  Database Types (数据库类型)                            │
│  ├── Table Row Types (表行类型)                         │
│  ├── Insert Types (插入类型)                            │
│  └── Update Types (更新类型)                            │
├─────────────────────────────────────────────────────────┤
│  Domain Types (领域类型)                                │
│  ├── Business Models (业务模型)                         │
│  ├── Value Objects (值对象)                             │
│  └── Enums (枚举类型)                                   │
├─────────────────────────────────────────────────────────┤
│  Component Types (组件类型)                             │
│  ├── Props Interfaces (属性接口)                        │
│  ├── State Types (状态类型)                             │
│  └── Event Handlers (事件处理器)                        │
├─────────────────────────────────────────────────────────┤
│  API Types (API 类型)                                   │
│  ├── Request Types (请求类型)                           │
│  ├── Response Types (响应类型)                          │
│  └── Error Types (错误类型)                             │
└─────────────────────────────────────────────────────────┘
```

## 🗄️ 数据库类型定义

### 1. 数据库模式类型

```typescript
// src/types/database.ts
export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          title: string
          description: string | null
          completed: boolean
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          completed?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      // 未来可扩展其他表
      categories?: {
        Row: {
          id: string
          name: string
          color: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      todo_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      priority_level: 'low' | 'medium' | 'high' | 'urgent'
    }
  }
}
```

### 2. 表类型提取

```typescript
// src/types/index.ts
import { Database } from './database'

// 基础表类型
export type Todo = Database['public']['Tables']['todos']['Row']
export type TodoInsert = Database['public']['Tables']['todos']['Insert']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

// 可选的分类类型
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

// 枚举类型
export type TodoStatus = Database['public']['Enums']['todo_status']
export type PriorityLevel = Database['public']['Enums']['priority_level']
```

## 🎯 领域模型设计

### 1. 业务实体类型

```typescript
// src/types/models.ts

// 扩展的 Todo 模型，包含计算属性
export interface TodoModel extends Todo {
  // 计算属性
  isOverdue: boolean
  daysUntilDue: number | null
  completionPercentage: number
  
  // 关联数据
  category?: Category
  tags?: string[]
  
  // 元数据
  createdBy: string
  lastModifiedBy: string
}

// 用户模型
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  
  // 用户偏好设置
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'zh-CN' | 'en-US'
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    reminders: boolean
  }
}

// 统计数据模型
export interface TodoStats {
  total: number
  completed: number
  pending: number
  overdue: number
  completionRate: number
  averageCompletionTime: number // 以小时为单位
}
```

### 2. 值对象类型

```typescript
// src/types/value-objects.ts

// 日期范围
export interface DateRange {
  start: Date
  end: Date
}

// 分页信息
export interface Pagination {
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrev: boolean
}

// 排序配置
export interface SortConfig<T = string> {
  field: T
  direction: 'asc' | 'desc'
}

// 过滤配置
export interface FilterConfig {
  status?: TodoStatus[]
  priority?: PriorityLevel[]
  category?: string[]
  dateRange?: DateRange
  search?: string
}

// 颜色值对象
export interface Color {
  hex: string
  rgb: [number, number, number]
  hsl: [number, number, number]
  name?: string
}
```

## 🎨 组件类型定义

### 1. 组件 Props 接口

```typescript
// src/types/components.ts

// 基础组件 Props
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  'data-testid'?: string
}

// Todo 相关组件 Props
export interface TodoItemProps extends BaseComponentProps {
  todo: TodoModel
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleComplete: (id: string) => Promise<void>
  isSelected?: boolean
  isDragging?: boolean
}

export interface TodoListProps extends BaseComponentProps {
  todos: TodoModel[]
  loading: boolean
  error?: string | null
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onBulkAction?: (action: BulkAction, todoIds: string[]) => Promise<void>
  sortConfig?: SortConfig<keyof TodoModel>
  filterConfig?: FilterConfig
}

export interface TodoFormProps extends BaseComponentProps {
  initialData?: Partial<TodoInsert>
  mode: 'create' | 'edit'
  onSubmit: (data: TodoFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  categories?: Category[]
}

// 表单数据类型
export interface TodoFormData {
  title: string
  description?: string
  priority?: PriorityLevel
  category_id?: string
  due_date?: string
  tags?: string[]
}
```

### 2. 状态管理类型

```typescript
// src/types/store.ts

// 认证状态
export interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  error?: string | null
  
  // 方法
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
  initialize: () => Promise<void>
}

// Todo 状态
export interface TodoState {
  // 数据
  todos: TodoModel[]
  categories: Category[]
  stats: TodoStats | null
  
  // UI 状态
  loading: boolean
  error?: string | null
  selectedTodos: string[]
  
  // 过滤和排序
  filter: FilterConfig
  sort: SortConfig<keyof TodoModel>
  pagination: Pagination
  
  // 方法
  fetchTodos: (options?: FetchOptions) => Promise<void>
  addTodo: (todo: TodoInsert) => Promise<void>
  updateTodo: (id: string, updates: TodoUpdate) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  bulkAction: (action: BulkAction, todoIds: string[]) => Promise<void>
  
  // 过滤和排序方法
  setFilter: (filter: Partial<FilterConfig>) => void
  setSort: (sort: SortConfig<keyof TodoModel>) => void
  setPagination: (pagination: Partial<Pagination>) => void
  
  // 选择方法
  selectTodo: (id: string) => void
  selectAllTodos: () => void
  clearSelection: () => void
}

// 获取选项
export interface FetchOptions {
  page?: number
  limit?: number
  filter?: FilterConfig
  sort?: SortConfig<keyof TodoModel>
  refresh?: boolean
}

// 批量操作类型
export type BulkAction = 
  | 'complete'
  | 'incomplete' 
  | 'delete'
  | 'archive'
  | 'change_category'
  | 'change_priority'
```

## 🌐 API 类型定义

### 1. 请求和响应类型

```typescript
// src/types/api.ts

// 基础 API 响应
export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
  message?: string
  meta?: ResponseMeta
}

// API 错误类型
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

// 响应元数据
export interface ResponseMeta {
  pagination?: Pagination
  total?: number
  took?: number // 请求耗时（毫秒）
  version?: string
}

// 分页响应
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: Pagination
  }
}

// Todo API 类型
export interface TodosResponse extends PaginatedResponse<TodoModel> {}

export interface TodoResponse extends ApiResponse<TodoModel> {}

export interface TodoCreateRequest {
  todo: TodoInsert
}

export interface TodoUpdateRequest {
  updates: TodoUpdate
}

export interface TodoBulkActionRequest {
  action: BulkAction
  todo_ids: string[]
  options?: Record<string, any>
}
```

### 2. 错误处理类型

```typescript
// src/types/errors.ts

// 应用错误基类
export interface AppError {
  name: string
  message: string
  code?: string
  cause?: Error
  timestamp: Date
}

// 验证错误
export interface ValidationError extends AppError {
  name: 'ValidationError'
  field: string
  value: any
  constraint: string
}

// 网络错误
export interface NetworkError extends AppError {
  name: 'NetworkError'
  status?: number
  url?: string
  method?: string
}

// 认证错误
export interface AuthError extends AppError {
  name: 'AuthError'
  type: 'unauthorized' | 'forbidden' | 'token_expired' | 'invalid_credentials'
}

// 业务逻辑错误
export interface BusinessError extends AppError {
  name: 'BusinessError'
  domain: string
  operation: string
}

// 错误联合类型
export type ApplicationError = 
  | ValidationError 
  | NetworkError 
  | AuthError 
  | BusinessError
```

## 🔧 工具类型

### 1. 实用工具类型

```typescript
// src/types/utils.ts

// 深度可选
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// 深度只读
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// 选择性必需
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// 选择性可选
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 非空类型
export type NonNullable<T> = T extends null | undefined ? never : T

// 提取数组元素类型
export type ArrayElement<T> = T extends (infer U)[] ? U : never

// 函数参数类型
export type Parameters<T> = T extends (...args: infer P) => any ? P : never

// 函数返回类型
export type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any

// 异步函数返回类型
export type AsyncReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : any
```

### 2. 类型守卫

```typescript
// src/types/guards.ts

// 基础类型守卫
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

// 业务类型守卫
export function isTodo(value: unknown): value is Todo {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isBoolean(value.completed) &&
    isString(value.user_id)
  )
}

export function isApiError(value: unknown): value is ApiError {
  return (
    isObject(value) &&
    isString(value.code) &&
    isString(value.message)
  )
}

// 状态类型守卫
export function isLoadingState<T>(state: { loading: boolean; data?: T }): state is { loading: true; data?: T } {
  return state.loading === true
}

export function isErrorState<T>(state: { error?: string | null; data?: T }): state is { error: string; data?: T } {
  return state.error != null
}
```

## 📊 类型使用示例

### 1. 组件中的类型使用

```typescript
// src/components/todo/todo-item.tsx
import { TodoItemProps, TodoUpdate } from '@/types'

export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const handleUpdate = async (updates: TodoUpdate) => {
    try {
      await onUpdate(todo.id, updates)
    } catch (error) {
      // TypeScript 知道这里的 error 类型
      console.error('更新失败:', error)
    }
  }

  // TypeScript 提供完整的类型提示
  const isCompleted: boolean = todo.completed
  const title: string = todo.title
  const description: string | null = todo.description

  return (
    <div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      <button onClick={() => handleUpdate({ completed: !isCompleted })}>
        {isCompleted ? '标记未完成' : '标记完成'}
      </button>
    </div>
  )
}
```

### 2. Store 中的类型使用

```typescript
// src/store/todos.ts
import { create } from 'zustand'
import { TodoState, TodoModel, TodoInsert, TodoUpdate } from '@/types'

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  error: null,
  
  addTodo: async (todo: TodoInsert) => {
    set({ loading: true, error: null })
    
    try {
      // TypeScript 确保 todo 符合 TodoInsert 类型
      const newTodo = await createTodo(todo)
      
      set((state) => ({
        todos: [newTodo, ...state.todos],
        loading: false
      }))
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : '创建失败' 
      })
    }
  },
  
  // 其他方法...
}))
```

## 🤔 思考题

1. 为什么要区分 Row、Insert 和 Update 类型？
2. 如何设计可扩展的类型系统？
3. 类型守卫在什么场景下最有用？
4. 如何平衡类型安全和开发效率？

## 📚 扩展阅读

- [TypeScript 高级类型](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [类型驱动开发](https://blog.ploeh.dk/2015/08/10/type-driven-development/)
- [Supabase 类型生成](https://supabase.com/docs/guides/api/generating-types)
- [Zod 运行时验证](https://zod.dev/)

## 🔗 下一步

完成数据模型设计后，下一章我们将开始构建 UI 组件库。

[下一章：UI 组件库 →](./07-ui-components.md)
