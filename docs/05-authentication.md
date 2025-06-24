# 05 - 认证系统

本章将详细介绍如何实现完整的用户认证系统，包括注册、登录、登出和会话管理。

## 🎯 学习目标

- 理解现代 Web 应用的认证流程
- 掌握 Supabase Auth 的使用方法
- 学会实现安全的认证状态管理
- 了解 JWT 令牌的工作原理
- 掌握路由保护和权限控制

## 🔐 认证系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   用户界面      │    │   认证状态      │    │  Supabase Auth  │
│  (Login Form)   │◄──►│   (Zustand)     │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   路由保护      │    │   会话管理      │    │   JWT 令牌      │
│ (ProtectedRoute)│    │  (Middleware)   │    │   验证存储      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Supabase 客户端配置

### 1. 客户端配置

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
```

### 2. 服务端配置

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types'

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 中调用 setAll 时可以忽略此错误
          }
        },
      },
    }
  )
}
```

### 3. 中间件配置

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 获取用户信息，刷新会话
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return supabaseResponse
}
```

## 🏪 认证状态管理

使用 Zustand 管理全局认证状态：

```typescript
// src/store/auth.ts
import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  signIn: async (email: string, password: string) => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      set({ user: data.user, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string) => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
      set({ user: data.user, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  initialize: async () => {
    const supabase = createClient()
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      }

      set({ 
        user: session?.user ?? null, 
        loading: false, 
        initialized: true 
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false, initialized: true })
    }
  },

  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
}))
```

## 📝 表单验证

使用 Zod 定义验证规则：

```typescript
// src/lib/validations.ts
import { z } from 'zod'

// 登录表单验证
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '邮箱不能为空')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '密码不能为空')
    .min(6, '密码至少需要 6 个字符')
})

// 注册表单验证
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, '邮箱不能为空')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(1, '密码不能为空')
    .min(6, '密码至少需要 6 个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含至少一个大写字母、一个小写字母和一个数字'
    ),
  confirmPassword: z
    .string()
    .min(1, '请确认密码')
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword']
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
```

## 🎨 认证组件实现

### 1. 登录表单

```typescript
// src/components/auth/login-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [error, setError] = useState<string>('')
  const { signIn, loading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('')
      await signIn(data.email, data.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>
          输入您的邮箱和密码来登录您的账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              aria-invalid={errors.email ? 'true' : 'false'}
            />
            {errors.email && (
              <p className="text-sm text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
            />
            {errors.password && (
              <p className="text-sm text-red-600" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onToggleMode}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              还没有账户？点击注册
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 2. 认证提供者

```typescript
// src/components/auth/auth-provider.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, initialized, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()
      
      // 设置认证状态监听
      const supabase = createClient()
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [initialize, initialized, setUser, setLoading])

  return <>{children}</>
}
```

### 3. 路由保护

```typescript
// src/components/auth/protected-route.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, initialized, router])

  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // 将重定向到认证页面
  }

  return <>{children}</>
}
```

## 🛡️ 中间件集成

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🔄 认证流程详解

### 1. 用户注册流程

```
用户填写注册表单 → 客户端验证 → Supabase Auth → 发送确认邮件 → 用户点击确认 → 账户激活
```

### 2. 用户登录流程

```
用户填写登录表单 → 客户端验证 → Supabase Auth → 返回 JWT 令牌 → 存储到 Cookie → 更新应用状态
```

### 3. 会话管理流程

```
页面加载 → 中间件检查 Cookie → 验证 JWT 令牌 → 刷新会话 → 更新用户状态
```

## 🔐 安全最佳实践

### 1. 密码安全

- ✅ 最小长度要求（6+ 字符）
- ✅ 复杂度要求（大小写字母 + 数字）
- ✅ 客户端和服务端双重验证
- ❌ 不在客户端存储明文密码

### 2. 令牌安全

- ✅ 使用 HttpOnly Cookie 存储令牌
- ✅ 自动刷新过期令牌
- ✅ 登出时清除所有令牌
- ❌ 不在 localStorage 存储敏感信息

### 3. 会话安全

- ✅ 设置合理的会话过期时间
- ✅ 检测异常登录行为
- ✅ 支持多设备登录管理
- ✅ 实现安全的登出机制

## 🧪 测试认证功能

```typescript
// src/__tests__/auth/auth.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'

// Mock Supabase
jest.mock('@/lib/supabase/client')

describe('LoginForm', () => {
  it('should validate email format', async () => {
    render(<LoginForm onToggleMode={() => {}} />)
    
    const emailInput = screen.getByLabelText(/邮箱/i)
    const submitButton = screen.getByRole('button', { name: /登录/i })
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的邮箱地址/i)).toBeInTheDocument()
    })
  })
})
```

## 🤔 思考题

1. 为什么要使用 HttpOnly Cookie 而不是 localStorage？
2. JWT 令牌的过期时间应该如何设置？
3. 如何防止 CSRF 攻击？
4. 多设备登录时如何管理会话？

## 📚 扩展阅读

- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [JWT 令牌详解](https://jwt.io/introduction)
- [Web 安全最佳实践](https://owasp.org/www-project-top-ten/)
- [Next.js 认证模式](https://nextjs.org/docs/authentication)

## 🔗 下一步

完成认证系统后，下一章我们将定义数据模型和类型系统。

[下一章：数据模型 →](./06-data-models.md)
