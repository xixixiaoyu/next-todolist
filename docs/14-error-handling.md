# 14 - 错误处理

本章将详细介绍如何构建健壮的错误处理机制，提升应用的稳定性和用户体验。

## 🎯 学习目标

- 理解错误处理的重要性和策略
- 掌握 React 错误边界的使用
- 学会设计用户友好的错误提示
- 了解错误监控和日志记录

## 🛡️ 错误处理策略

### 错误分类

```typescript
// src/types/errors.ts
export interface AppError {
  name: string
  message: string
  code?: string
  cause?: Error
  timestamp: Date
  context?: Record<string, any>
}

export class ValidationError extends Error implements AppError {
  name = 'ValidationError'
  code = 'VALIDATION_ERROR'
  timestamp = new Date()
  
  constructor(
    message: string,
    public field?: string,
    public context?: Record<string, any>
  ) {
    super(message)
  }
}

export class NetworkError extends Error implements AppError {
  name = 'NetworkError'
  code = 'NETWORK_ERROR'
  timestamp = new Date()
  
  constructor(
    message: string,
    public status?: number,
    public url?: string,
    public context?: Record<string, any>
  ) {
    super(message)
  }
}

export class AuthError extends Error implements AppError {
  name = 'AuthError'
  timestamp = new Date()
  
  constructor(
    message: string,
    public code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'TOKEN_EXPIRED' | 'INVALID_CREDENTIALS',
    public context?: Record<string, any>
  ) {
    super(message)
  }
}

export class BusinessError extends Error implements AppError {
  name = 'BusinessError'
  code = 'BUSINESS_ERROR'
  timestamp = new Date()
  
  constructor(
    message: string,
    public domain: string,
    public operation: string,
    public context?: Record<string, any>
  ) {
    super(message)
  }
}
```

## 🚨 React 错误边界

### 1. 全局错误边界

```typescript
// src/components/error/error-boundary.tsx
'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo,
    })

    // 调用错误回调
    this.props.onError?.(error, errorInfo)

    // 发送错误到监控服务
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 发送到错误监控服务（如 Sentry）
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack,
      //     },
      //   },
      // })
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props
      
      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

// 默认错误回退组件
function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            出现了一些问题
          </CardTitle>
          <CardDescription>
            应用遇到了意外错误，我们正在努力修复。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDevelopment && error && (
            <details className="bg-gray-100 p-3 rounded text-xs">
              <summary className="cursor-pointer font-medium">错误详情</summary>
              <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button onClick={retry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              回到首页
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              const subject = encodeURIComponent('应用错误报告')
              const body = encodeURIComponent(`错误信息：${error?.message}\n\n请描述您遇到问题时的操作步骤：`)
              window.open(`mailto:support@example.com?subject=${subject}&body=${body}`)
            }}
            className="w-full"
          >
            <Bug className="h-4 w-4 mr-2" />
            报告问题
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. 异步错误处理

```typescript
// src/hooks/use-async-error.ts
import { useCallback } from 'react'

export function useAsyncError() {
  const throwError = useCallback((error: Error) => {
    // 将异步错误转换为同步错误，让 ErrorBoundary 能够捕获
    setTimeout(() => {
      throw error
    }, 0)
  }, [])

  return throwError
}

// 使用示例
export function useAsyncOperation() {
  const throwAsyncError = useAsyncError()

  const performOperation = async () => {
    try {
      // 异步操作
      await someAsyncOperation()
    } catch (error) {
      // 让 ErrorBoundary 捕获异步错误
      throwAsyncError(error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  return { performOperation }
}
```

## 🎨 用户友好的错误提示

### 1. Toast 通知系统

```typescript
// src/components/ui/toast.tsx
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])

    // 自动移除
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, description?: string) => {
    addToast({ type: 'success', title, description })
  }, [addToast])

  const error = useCallback((title: string, description?: string) => {
    addToast({ type: 'error', title, description, duration: 0 }) // 错误不自动消失
  }, [addToast])

  const warning = useCallback((title: string, description?: string) => {
    addToast({ type: 'warning', title, description })
  }, [addToast])

  const info = useCallback((title: string, description?: string) => {
    addToast({ type: 'info', title, description })
  }, [addToast])

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast 容器组件
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

// 单个 Toast 组件
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const Icon = icons[toast.type]

  return (
    <div className={`max-w-sm w-full border rounded-lg p-4 shadow-lg ${colors[toast.type]} animate-slide-in`}>
      <div className="flex items-start">
        <Icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">{toast.title}</h4>
          {toast.description && (
            <p className="mt-1 text-sm opacity-90">{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-2 flex-shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

### 2. 错误状态组件

```typescript
// src/components/error/error-states.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  WifiOff, 
  AlertCircle, 
  RefreshCw, 
  Search,
  Lock,
  Server,
  Clock
} from 'lucide-react'

interface ErrorStateProps {
  type: 'network' | 'not-found' | 'unauthorized' | 'server' | 'timeout' | 'generic'
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  showRetry?: boolean
  onRetry?: () => void
}

export function ErrorState({ 
  type, 
  title, 
  description, 
  action, 
  showRetry = true, 
  onRetry 
}: ErrorStateProps) {
  const errorConfigs = {
    network: {
      icon: WifiOff,
      defaultTitle: '网络连接失败',
      defaultDescription: '请检查您的网络连接并重试',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    'not-found': {
      icon: Search,
      defaultTitle: '未找到内容',
      defaultDescription: '您要查找的内容不存在或已被删除',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    unauthorized: {
      icon: Lock,
      defaultTitle: '访问被拒绝',
      defaultDescription: '您没有权限访问此内容，请先登录',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    server: {
      icon: Server,
      defaultTitle: '服务器错误',
      defaultDescription: '服务器暂时无法处理您的请求，请稍后重试',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    timeout: {
      icon: Clock,
      defaultTitle: '请求超时',
      defaultDescription: '请求处理时间过长，请检查网络连接并重试',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    generic: {
      icon: AlertCircle,
      defaultTitle: '出现错误',
      defaultDescription: '发生了意外错误，请重试或联系支持',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  }

  const config = errorConfigs[type]
  const Icon = config.icon

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <div className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
          <Icon className={`h-8 w-8 ${config.color}`} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title || config.defaultTitle}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {description || config.defaultDescription}
        </p>

        <div className="space-y-3">
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          )}
          
          {action && (
            <Button 
              variant="outline" 
              onClick={action.onClick}
              className="w-full"
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

## 📊 错误监控

### 1. 错误收集器

```typescript
// src/lib/error-tracker.ts
interface ErrorEvent {
  id: string
  timestamp: Date
  error: Error
  context: {
    url: string
    userAgent: string
    userId?: string
    sessionId: string
    buildVersion: string
  }
  breadcrumbs: Array<{
    timestamp: Date
    category: string
    message: string
    level: 'info' | 'warning' | 'error'
  }>
}

class ErrorTracker {
  private breadcrumbs: ErrorEvent['breadcrumbs'] = []
  private sessionId: string = Math.random().toString(36).substr(2, 9)

  addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error' = 'info') {
    this.breadcrumbs.push({
      timestamp: new Date(),
      category,
      message,
      level,
    })

    // 保持最近 50 条记录
    if (this.breadcrumbs.length > 50) {
      this.breadcrumbs = this.breadcrumbs.slice(-50)
    }
  }

  captureError(error: Error, context?: Record<string, any>) {
    const errorEvent: ErrorEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION || 'unknown',
        ...context,
      },
      breadcrumbs: [...this.breadcrumbs],
    }

    // 发送到监控服务
    this.sendToMonitoring(errorEvent)

    // 本地存储（用于离线时的错误收集）
    this.storeLocally(errorEvent)
  }

  private async sendToMonitoring(errorEvent: ErrorEvent) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorEvent),
      })
    } catch (error) {
      console.error('Failed to send error to monitoring:', error)
    }
  }

  private storeLocally(errorEvent: ErrorEvent) {
    try {
      const stored = localStorage.getItem('error-events') || '[]'
      const events = JSON.parse(stored)
      events.push(errorEvent)
      
      // 保持最近 10 条错误记录
      const recentEvents = events.slice(-10)
      localStorage.setItem('error-events', JSON.stringify(recentEvents))
    } catch (error) {
      console.error('Failed to store error locally:', error)
    }
  }

  // 发送离线时收集的错误
  async flushOfflineErrors() {
    try {
      const stored = localStorage.getItem('error-events')
      if (!stored) return

      const events = JSON.parse(stored)
      for (const event of events) {
        await this.sendToMonitoring(event)
      }

      localStorage.removeItem('error-events')
    } catch (error) {
      console.error('Failed to flush offline errors:', error)
    }
  }
}

export const errorTracker = new ErrorTracker()

// 全局错误处理
window.addEventListener('error', (event) => {
  errorTracker.captureError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorTracker.captureError(
    new Error(event.reason?.message || 'Unhandled Promise Rejection'),
    { reason: event.reason }
  )
})
```

### 2. 性能监控

```typescript
// src/lib/performance-monitor.ts
interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  context?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []

  recordMetric(name: string, value: number, context?: Record<string, any>) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      context,
    })

    // 定期发送指标
    if (this.metrics.length >= 10) {
      this.flushMetrics()
    }
  }

  recordPageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart)
      this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
      this.recordMetric('first_paint', this.getFirstPaint())
    }
  }

  private getFirstPaint(): number {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint?.startTime || 0
  }

  private async flushMetrics() {
    if (this.metrics.length === 0) return

    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.metrics),
      })

      this.metrics = []
    } catch (error) {
      console.error('Failed to send metrics:', error)
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
```

## 🤔 思考题

1. 如何设计更智能的错误恢复机制？
2. 如何平衡错误信息的详细程度和用户体验？
3. 如何处理不同类型用户的错误反馈？
4. 如何设计错误预防机制？

## 📚 扩展阅读

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry 错误监控](https://sentry.io/welcome/)
- [Web Vitals 性能指标](https://web.dev/vitals/)
- [错误处理最佳实践](https://www.smashingmagazine.com/2022/01/error-handling-react-applications/)

## 🔗 下一步

完成错误处理后，下一章我们将学习性能优化技巧。

[下一章：性能优化 →](./15-performance.md)
