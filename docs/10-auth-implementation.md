# 10 - 认证功能实现

本章将详细介绍如何实现完整的用户认证功能，包括登录、注册、登出和会话管理的具体实现。

## 🎯 学习目标

- 掌握完整的认证流程实现
- 学会处理认证状态的边界情况
- 了解安全的会话管理方式
- 掌握认证相关的用户体验优化

## 🔐 认证流程实现

### 1. 登录功能实现

```typescript
// src/components/auth/login-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToastActions } from '@/components/ui/toast'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

interface LoginFormProps {
  onToggleMode: () => void
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { signIn, loading } = useAuthStore()
  const toast = useToastActions()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signIn(data.email, data.password)
      toast.success('登录成功', '欢迎回来！')
      router.push('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      
      // 根据错误类型设置不同的错误信息
      if (message.includes('Invalid login credentials')) {
        setError('email', { message: '邮箱或密码错误' })
        setError('password', { message: '邮箱或密码错误' })
      } else if (message.includes('Email not confirmed')) {
        setError('email', { message: '请先验证您的邮箱' })
      } else {
        toast.error('登录失败', message)
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">欢迎回来</CardTitle>
        <CardDescription>
          登录您的账户以继续使用 Todo List
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 邮箱字段 */}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="邮箱地址"
              leftIcon={<Mail className="h-4 w-4" />}
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />
          </div>

          {/* 密码字段 */}
          <div className="space-y-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
              error={errors.password?.message}
              autoComplete="current-password"
            />
          </div>

          {/* 登录按钮 */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || isSubmitting}
            loading={loading || isSubmitting}
          >
            登录
          </Button>

          {/* 切换到注册 */}
          <div className="text-center text-sm">
            <span className="text-gray-600">还没有账户？</span>
            <button
              type="button"
              onClick={onToggleMode}
              className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              立即注册
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 2. 注册功能实现

```typescript
// src/components/auth/register-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '@/store/auth'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToastActions } from '@/components/ui/toast'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

interface RegisterFormProps {
  onToggleMode: () => void
}

export function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const { signUp, loading } = useAuthStore()
  const toast = useToastActions()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password)
      setRegistrationSuccess(true)
      toast.success('注册成功', '请检查您的邮箱以验证账户')
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      
      if (message.includes('User already registered')) {
        setError('email', { message: '该邮箱已被注册' })
      } else if (message.includes('Password should be at least 6 characters')) {
        setError('password', { message: '密码至少需要 6 个字符' })
      } else {
        toast.error('注册失败', message)
      }
    }
  }

  if (registrationSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">注册成功！</CardTitle>
          <CardDescription>
            我们已向您的邮箱发送了验证链接，请点击链接完成账户验证。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-sm text-gray-600">
              没有收到邮件？请检查垃圾邮件文件夹，或者
            </div>
            <Button
              variant="outline"
              onClick={onToggleMode}
              className="w-full"
            >
              返回登录
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">创建账户</CardTitle>
        <CardDescription>
          注册新账户开始使用 Todo List
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 邮箱字段 */}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="邮箱地址"
              leftIcon={<Mail className="h-4 w-4" />}
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />
          </div>

          {/* 密码字段 */}
          <div className="space-y-2">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码（至少 6 个字符）"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('password')}
              error={errors.password?.message}
              autoComplete="new-password"
            />
          </div>

          {/* 确认密码字段 */}
          <div className="space-y-2">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="确认密码"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              autoComplete="new-password"
            />
          </div>

          {/* 密码强度指示器 */}
          {password && (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">密码强度：</div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      getPasswordStrength(password) >= level
                        ? level <= 2 ? 'bg-red-500' : level === 3 ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 注册按钮 */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || isSubmitting}
            loading={loading || isSubmitting}
          >
            注册
          </Button>

          {/* 切换到登录 */}
          <div className="text-center text-sm">
            <span className="text-gray-600">已有账户？</span>
            <button
              type="button"
              onClick={onToggleMode}
              className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              立即登录
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// 密码强度计算函数
function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  return Math.min(strength, 4)
}
```

### 3. 认证页面容器

```typescript
// src/app/auth/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { LoginForm } from '@/components/auth/login-form'
import { RegisterForm } from '@/components/auth/register-form'
import { LoadingSpinner } from '@/components/ui/loading'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (initialized && user && !loading) {
      router.push('/')
    }
  }, [user, loading, initialized, router])

  // 显示加载状态
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // 如果已登录，不显示认证表单
  if (user) {
    return null
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {mode === 'login' ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  )
}
```

## 🔄 会话管理

### 1. 认证状态初始化

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
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
          
          switch (event) {
            case 'SIGNED_IN':
              setUser(session?.user ?? null)
              setLoading(false)
              break
            case 'SIGNED_OUT':
              setUser(null)
              setLoading(false)
              break
            case 'TOKEN_REFRESHED':
              setUser(session?.user ?? null)
              break
            case 'USER_UPDATED':
              setUser(session?.user ?? null)
              break
            default:
              setLoading(false)
          }
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

### 2. 路由保护实现

```typescript
// src/components/auth/protected-route.tsx
'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { LoadingSpinner } from '@/components/ui/loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (initialized && !loading && !user) {
      // 保存当前路径，登录后可以重定向回来
      const returnUrl = pathname !== '/auth' ? pathname : '/'
      router.push(`/auth?returnUrl=${encodeURIComponent(returnUrl)}`)
    }
  }, [user, loading, initialized, router, pathname])

  // 显示加载状态
  if (!initialized || loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">正在验证身份...</p>
        </div>
      </div>
    )
  }

  // 未登录时不显示内容
  if (!user) {
    return null
  }

  return <>{children}</>
}
```

## 🔒 安全增强

### 1. 密码重置功能

```typescript
// src/components/auth/forgot-password-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToastActions } from '@/components/ui/toast'
import { Mail, ArrowLeft } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
})

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [emailSent, setEmailSent] = useState(false)
  const toast = useToastActions()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setEmailSent(true)
      toast.success('邮件已发送', '请检查您的邮箱')
    } catch (error) {
      const message = error instanceof Error ? error.message : '发送失败'
      toast.error('发送失败', message)
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">邮件已发送</CardTitle>
          <CardDescription>
            我们已向 {getValues('email')} 发送了密码重置链接
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              请检查您的邮箱并点击链接重置密码
            </p>
            <Button variant="outline" onClick={onBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回登录
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">重置密码</CardTitle>
        <CardDescription>
          输入您的邮箱地址，我们将发送重置链接
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="邮箱地址"
              leftIcon={<Mail className="h-4 w-4" />}
              {...register('email')}
              error={errors.email?.message}
              autoComplete="email"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            发送重置链接
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回登录
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### 2. 会话超时处理

```typescript
// src/hooks/use-session-timeout.ts
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { useToastActions } from '@/components/ui/toast'

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 分钟
const WARNING_TIME = 5 * 60 * 1000 // 提前 5 分钟警告

export function useSessionTimeout() {
  const { user, signOut } = useAuthStore()
  const toast = useToastActions()
  const timeoutRef = useRef<NodeJS.Timeout>()
  const warningRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!user) return

    const resetTimer = () => {
      // 清除现有定时器
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)

      // 设置警告定时器
      warningRef.current = setTimeout(() => {
        toast.warning('会话即将过期', '您的会话将在 5 分钟后过期，请保存您的工作')
      }, SESSION_TIMEOUT - WARNING_TIME)

      // 设置超时定时器
      timeoutRef.current = setTimeout(async () => {
        toast.error('会话已过期', '请重新登录')
        await signOut()
      }, SESSION_TIMEOUT)
    }

    // 监听用户活动
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    const resetTimerHandler = () => resetTimer()

    events.forEach(event => {
      document.addEventListener(event, resetTimerHandler, true)
    })

    // 初始化定时器
    resetTimer()

    return () => {
      // 清理定时器和事件监听器
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      
      events.forEach(event => {
        document.removeEventListener(event, resetTimerHandler, true)
      })
    }
  }, [user, signOut, toast])
}
```

## 🤔 思考题

1. 如何处理网络断开时的认证状态？
2. 如何实现"记住我"功能？
3. 如何防止 CSRF 攻击？
4. 如何实现多设备登录管理？

## 📚 扩展阅读

- [Supabase Auth 深入指南](https://supabase.com/docs/guides/auth)
- [Web 认证最佳实践](https://web.dev/sign-in-form-best-practices/)
- [JWT 安全指南](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [会话管理安全](https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication)

## 🔗 下一步

完成认证功能实现后，下一章我们将实现 Todo 的核心 CRUD 功能。

[下一章：Todo 功能实现 →](./11-todo-implementation.md)
