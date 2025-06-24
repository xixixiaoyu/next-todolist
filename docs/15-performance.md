# 15 - 性能优化

本章将详细介绍如何优化 Next.js 应用的性能，包括代码分割、缓存策略、图片优化等关键技术。

## 🎯 学习目标

- 理解现代 Web 应用性能优化原理
- 掌握 Next.js 性能优化最佳实践
- 学会使用性能监控和分析工具
- 了解用户体验优化技巧

## ⚡ 性能优化策略

### 性能指标

```typescript
// src/lib/performance-metrics.ts
export interface WebVitals {
  CLS: number  // Cumulative Layout Shift
  FID: number  // First Input Delay
  FCP: number  // First Contentful Paint
  LCP: number  // Largest Contentful Paint
  TTFB: number // Time to First Byte
}

export function measureWebVitals(): Promise<WebVitals> {
  return new Promise((resolve) => {
    const metrics: Partial<WebVitals> = {}

    // 测量 FCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          metrics.FCP = entry.startTime
        }
      }
    })
    observer.observe({ entryTypes: ['paint'] })

    // 测量 LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.LCP = lastEntry.startTime
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    // 测量 CLS
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      metrics.CLS = clsValue
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })

    // 测量 FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        metrics.FID = (entry as any).processingStart - entry.startTime
      }
    })
    fidObserver.observe({ entryTypes: ['first-input'] })

    // 测量 TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    metrics.TTFB = navigation.responseStart - navigation.requestStart

    // 等待所有指标收集完成
    setTimeout(() => {
      resolve(metrics as WebVitals)
    }, 3000)
  })
}
```

## 🚀 代码分割优化

### 1. 动态导入

```typescript
// src/components/lazy-components.tsx
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading'

// 懒加载重型组件
export const TodoChart = dynamic(() => import('./todo-chart'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // 禁用 SSR（如果组件依赖浏览器 API）
})

export const TodoExport = dynamic(() => import('./todo-export'), {
  loading: () => <div>加载导出功能...</div>,
})

// 条件加载
export const AdminPanel = dynamic(() => import('./admin-panel'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
})

// 使用示例
export function TodoDashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      <h1>Todo 仪表板</h1>
      
      <Suspense fallback={<LoadingSpinner />}>
        <TodoChart />
      </Suspense>

      {isAdmin && (
        <Suspense fallback={<div>加载管理面板...</div>}>
          <AdminPanel />
        </Suspense>
      )}
    </div>
  )
}
```

### 2. 路由级别分割

```typescript
// src/app/layout.tsx
import dynamic from 'next/dynamic'

// 懒加载非关键组件
const Analytics = dynamic(() => import('@/components/analytics'), {
  ssr: false,
})

const CookieConsent = dynamic(() => import('@/components/cookie-consent'), {
  ssr: false,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  )
}
```

## 🖼️ 图片优化

### 1. Next.js Image 组件

```typescript
// src/components/optimized-image.tsx
import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL || generateBlurDataURL(width, height)}
          className={`transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true)
            setIsLoading(false)
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-200 text-gray-500">
          图片加载失败
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

// 生成模糊占位符
function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL()
}
```

### 2. 图片懒加载

```typescript
// src/hooks/use-intersection-observer.ts
import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        
        if (entry.isIntersecting && triggerOnce) {
          observer.unobserve(element)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, triggerOnce])

  return { ref, isIntersecting }
}

// 懒加载图片组件
export function LazyImage({ src, alt, ...props }: any) {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <div ref={ref}>
      {isIntersecting ? (
        <OptimizedImage src={src} alt={alt} {...props} />
      ) : (
        <div className="bg-gray-200 animate-pulse" style={{ aspectRatio: '4/3' }} />
      )}
    </div>
  )
}
```

## 💾 缓存策略

### 1. HTTP 缓存

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 2. 客户端缓存

```typescript
// src/lib/cache.ts
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class ClientCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null

    const isExpired = Date.now() - item.timestamp > item.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const clientCache = new ClientCache()

// 定期清理过期缓存
setInterval(() => {
  clientCache.cleanup()
}, 5 * 60 * 1000) // 每 5 分钟清理一次
```

### 3. SWR 数据获取

```typescript
// src/hooks/use-cached-todos.ts
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import type { Todo } from '@/types'

const fetcher = async (url: string): Promise<Todo[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export function useCachedTodos() {
  const { data, error, mutate, isLoading } = useSWR('/api/todos', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000, // 5 秒内的重复请求会被去重
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  return {
    todos: data || [],
    isLoading,
    error,
    mutate,
  }
}
```

## 🔄 React 性能优化

### 1. 组件优化

```typescript
// src/components/optimized-todo-item.tsx
import React, { memo, useCallback, useMemo } from 'react'
import type { Todo, TodoUpdate } from '@/types'

interface TodoItemProps {
  todo: Todo
  onUpdate: (id: string, updates: TodoUpdate) => void
  onDelete: (id: string) => void
}

export const OptimizedTodoItem = memo(function TodoItem({
  todo,
  onUpdate,
  onDelete,
}: TodoItemProps) {
  // 使用 useCallback 缓存事件处理器
  const handleToggle = useCallback(() => {
    onUpdate(todo.id, { completed: !todo.completed })
  }, [todo.id, todo.completed, onUpdate])

  const handleDelete = useCallback(() => {
    onDelete(todo.id)
  }, [todo.id, onDelete])

  // 使用 useMemo 缓存计算结果
  const formattedDate = useMemo(() => {
    return new Date(todo.created_at).toLocaleDateString()
  }, [todo.created_at])

  const priorityColor = useMemo(() => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    }
    return colors[todo.priority] || colors.medium
  }, [todo.priority])

  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
      />
      <span className={todo.completed ? 'line-through' : ''}>
        {todo.title}
      </span>
      <span className={priorityColor}>
        {todo.priority}
      </span>
      <span className="text-gray-500">
        {formattedDate}
      </span>
      <button onClick={handleDelete}>删除</button>
    </div>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return (
    prevProps.todo.id === nextProps.todo.id &&
    prevProps.todo.title === nextProps.todo.title &&
    prevProps.todo.completed === nextProps.todo.completed &&
    prevProps.todo.priority === nextProps.todo.priority
  )
})
```

### 2. 虚拟化长列表

```typescript
// src/components/virtualized-list.tsx
import { FixedSizeList as List } from 'react-window'
import { memo } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  renderItem: (props: { index: number; style: React.CSSProperties; data: T[] }) => React.ReactElement
}

export function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
}: VirtualizedListProps<T>) {
  const ItemRenderer = memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    return renderItem({ index, style, data: items })
  })

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      itemData={items}
      overscanCount={5} // 预渲染额外的项目
    >
      {ItemRenderer}
    </List>
  )
}
```

## 📊 性能监控

### 1. 性能指标收集

```typescript
// src/lib/performance-tracker.ts
class PerformanceTracker {
  private metrics: Map<string, number> = new Map()

  startTiming(name: string): void {
    this.metrics.set(`${name}_start`, performance.now())
  }

  endTiming(name: string): number {
    const startTime = this.metrics.get(`${name}_start`)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.metrics.set(name, duration)
    this.metrics.delete(`${name}_start`)

    return duration
  }

  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value)
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // 发送指标到分析服务
  async sendMetrics(): Promise<void> {
    const metrics = this.getMetrics()
    
    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          url: window.location.href,
        }),
      })
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }
}

export const performanceTracker = new PerformanceTracker()

// 使用示例
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    performanceTracker.startTiming(`${componentName}_render`)
    
    return () => {
      const duration = performanceTracker.endTiming(`${componentName}_render`)
      console.log(`${componentName} render time:`, duration)
    }
  }, [componentName])
}
```

### 2. Bundle 分析

```bash
# 安装 bundle 分析工具
npm install --save-dev @next/bundle-analyzer

# package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build",
    "analyze:server": "BUNDLE_ANALYZE=server next build",
    "analyze:browser": "BUNDLE_ANALYZE=browser next build"
  }
}
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // 其他配置
})
```

## 🎯 用户体验优化

### 1. 加载状态

```typescript
// src/components/loading-states.tsx
export function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  )
}

export function TodoListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4 border rounded">
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. 预加载策略

```typescript
// src/hooks/use-prefetch.ts
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function usePrefetch(routes: string[]) {
  const router = useRouter()

  useEffect(() => {
    routes.forEach(route => {
      router.prefetch(route)
    })
  }, [router, routes])
}

// 使用示例
export function Navigation() {
  // 预加载可能访问的路由
  usePrefetch(['/todos', '/profile', '/settings'])

  return (
    <nav>
      {/* 导航内容 */}
    </nav>
  )
}
```

## 🤔 思考题

1. 如何平衡性能优化和开发复杂度？
2. 什么时候应该使用服务端渲染 vs 客户端渲染？
3. 如何为不同网络条件的用户优化体验？
4. 如何设计性能预算和监控策略？

## 📚 扩展阅读

- [Next.js 性能优化](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals 指南](https://web.dev/vitals/)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Bundle 分析工具](https://github.com/vercel/next.js/tree/canary/packages/next-bundle-analyzer)

## 🔗 下一步

完成性能优化后，下一章我们将学习可访问性实现。

[下一章：可访问性 →](./16-accessibility.md)
