// 数据库类型定义
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Todo 相关类型
export type Todo = Database['public']['Tables']['todos']['Row']
export type TodoInsert = Database['public']['Tables']['todos']['Insert']
export type TodoUpdate = Database['public']['Tables']['todos']['Update']

// 认证相关类型
export interface User {
  id: string
  email: string
  created_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

// 表单验证类型
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
}

export interface TodoFormData {
  title: string
  description?: string
}

// API 响应类型
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// 组件 Props 类型
export interface TodoItemProps {
  todo: Todo
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export interface TodoListProps {
  todos: Todo[]
  loading: boolean
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export interface TodoFormProps {
  onSubmit: (data: TodoFormData) => Promise<void>
  loading?: boolean
  initialData?: TodoFormData
  mode?: 'create' | 'edit'
  onCancel?: () => void
}

// 过滤和排序类型
export type TodoFilter = 'all' | 'active' | 'completed'
export type TodoSort = 'created_at' | 'updated_at' | 'title'
export type SortOrder = 'asc' | 'desc'

export interface TodoFilters {
  filter: TodoFilter
  sort: TodoSort
  order: SortOrder
  search?: string
}

// 错误类型
export interface AppError {
  message: string
  code?: string
  details?: any
}

// 加载状态类型
export interface LoadingState {
  todos: boolean
  auth: boolean
  submit: boolean
}
