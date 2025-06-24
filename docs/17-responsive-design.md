# 17 - 响应式设计

本章将详细介绍如何使用 Tailwind CSS 实现完美的响应式设计，确保应用在各种设备上都有出色的用户体验。

## 🎯 学习目标

- 掌握移动优先的设计理念
- 学会使用 Tailwind CSS 响应式工具类
- 了解不同设备的适配策略
- 掌握触摸友好的交互设计

## 📱 移动优先设计

### 断点系统

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '475px',   // 超小屏幕
      'sm': '640px',   // 小屏幕
      'md': '768px',   // 中等屏幕
      'lg': '1024px',  // 大屏幕
      'xl': '1280px',  // 超大屏幕
      '2xl': '1536px', // 2K 屏幕
    },
  },
}

// 使用示例
const ResponsiveGrid = () => (
  <div className="
    grid 
    grid-cols-1 
    sm:grid-cols-2 
    lg:grid-cols-3 
    xl:grid-cols-4 
    gap-4 
    p-4
  ">
    {/* 网格内容 */}
  </div>
)
```

## 🎨 响应式布局

### 1. 自适应导航

```typescript
// src/components/layout/responsive-navigation.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, CheckSquare, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ResponsiveNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigationItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/todos', label: '任务', icon: CheckSquare },
    { href: '/profile', label: '个人资料', icon: User },
    { href: '/settings', label: '设置', icon: Settings },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-gray-900">
              TodoApp
            </Link>
          </div>

          {/* 桌面导航 */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <item.icon className="inline h-4 w-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 移动端菜单按钮 */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="打开菜单"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="inline h-5 w-5 mr-3" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
```

### 2. 响应式卡片布局

```typescript
// src/components/layout/responsive-card-grid.tsx
interface ResponsiveCardGridProps {
  children: React.ReactNode
  variant?: 'default' | 'compact' | 'wide'
}

export function ResponsiveCardGrid({ 
  children, 
  variant = 'default' 
}: ResponsiveCardGridProps) {
  const gridClasses = {
    default: `
      grid 
      grid-cols-1 
      sm:grid-cols-2 
      lg:grid-cols-3 
      xl:grid-cols-4 
      gap-4 
      sm:gap-6
    `,
    compact: `
      grid 
      grid-cols-1 
      xs:grid-cols-2 
      sm:grid-cols-3 
      md:grid-cols-4 
      lg:grid-cols-5 
      xl:grid-cols-6 
      gap-3 
      sm:gap-4
    `,
    wide: `
      grid 
      grid-cols-1 
      lg:grid-cols-2 
      xl:grid-cols-3 
      gap-6 
      lg:gap-8
    `,
  }

  return (
    <div className={`
      ${gridClasses[variant]}
      p-4 
      sm:p-6 
      lg:p-8
    `}>
      {children}
    </div>
  )
}
```

### 3. 自适应侧边栏

```typescript
// src/components/layout/responsive-sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ResponsiveSidebarProps {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function ResponsiveSidebar({ 
  children, 
  defaultCollapsed = false 
}: ResponsiveSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed md:static
          top-0 left-0
          h-full
          bg-white
          border-r border-gray-200
          transition-all duration-300 ease-in-out
          z-50
          ${isCollapsed 
            ? 'w-0 md:w-16 -translate-x-full md:translate-x-0' 
            : 'w-64'
          }
        `}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-gray-900">
              菜单
            </h2>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* 侧边栏内容 */}
        <div className={`
          overflow-hidden
          ${isCollapsed ? 'opacity-0 md:opacity-100' : 'opacity-100'}
          transition-opacity duration-300
        `}>
          {children}
        </div>
      </aside>
    </>
  )
}
```

## 📐 响应式组件

### 1. 自适应 Todo 项目

```typescript
// src/components/todo/responsive-todo-item.tsx
export function ResponsiveTodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  return (
    <div className="
      bg-white 
      rounded-lg 
      border border-gray-200 
      p-3 sm:p-4 
      hover:shadow-md 
      transition-shadow
    ">
      <div className="
        flex 
        flex-col sm:flex-row 
        sm:items-center 
        gap-3 sm:gap-4
      ">
        {/* 复选框和标题 */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onUpdate(todo.id, { completed: !todo.completed })}
            className="
              flex-shrink-0 
              w-5 h-5 sm:w-6 sm:h-6 
              mt-0.5 sm:mt-0
              rounded-full 
              border-2 
              transition-colors
              touch-manipulation
              ${todo.completed 
                ? 'bg-green-500 border-green-500' 
                : 'border-gray-300 hover:border-green-400'
              }
            "
            aria-label={`${todo.completed ? '取消完成' : '标记完成'} ${todo.title}`}
          >
            {todo.completed && (
              <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={`
              text-sm sm:text-base 
              font-medium 
              break-words
              ${todo.completed 
                ? 'line-through text-gray-500' 
                : 'text-gray-900'
              }
            `}>
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className="
                text-xs sm:text-sm 
                text-gray-600 
                mt-1 
                break-words
              ">
                {todo.description}
              </p>
            )}

            {/* 移动端元信息 */}
            <div className="
              flex 
              flex-wrap 
              gap-2 
              mt-2 
              text-xs 
              text-gray-500
              sm:hidden
            ">
              <span className="
                px-2 py-1 
                bg-gray-100 
                rounded-full
              ">
                {todo.priority}
              </span>
              <span>
                {formatRelativeTime(todo.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* 桌面端元信息和操作 */}
        <div className="
          hidden sm:flex 
          items-center 
          gap-4 
          flex-shrink-0
        ">
          <span className="
            px-2 py-1 
            text-xs 
            bg-gray-100 
            rounded-full
          ">
            {todo.priority}
          </span>
          
          <span className="text-sm text-gray-500">
            {formatRelativeTime(todo.created_at)}
          </span>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(todo)}
            >
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(todo.id)}
              className="text-red-600 hover:text-red-700"
            >
              删除
            </Button>
          </div>
        </div>

        {/* 移动端操作按钮 */}
        <div className="
          flex 
          gap-2 
          sm:hidden
        ">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(todo)}
            className="flex-1"
          >
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(todo.id)}
            className="flex-1 text-red-600 hover:text-red-700"
          >
            删除
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### 2. 响应式表单

```typescript
// src/components/forms/responsive-todo-form.tsx
export function ResponsiveTodoForm({ onSubmit }: { onSubmit: (data: TodoFormData) => void }) {
  return (
    <form className="
      space-y-4 sm:space-y-6
      p-4 sm:p-6
      bg-white
      rounded-lg
      border border-gray-200
    ">
      {/* 标题字段 */}
      <div className="space-y-2">
        <label className="
          block 
          text-sm 
          font-medium 
          text-gray-700
        ">
          任务标题
        </label>
        <input
          type="text"
          className="
            w-full
            px-3 py-2
            sm:px-4 sm:py-3
            border border-gray-300
            rounded-md
            text-sm sm:text-base
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors
          "
          placeholder="输入任务标题..."
        />
      </div>

      {/* 描述字段 */}
      <div className="space-y-2">
        <label className="
          block 
          text-sm 
          font-medium 
          text-gray-700
        ">
          任务描述
        </label>
        <textarea
          rows={3}
          className="
            w-full
            px-3 py-2
            sm:px-4 sm:py-3
            border border-gray-300
            rounded-md
            text-sm sm:text-base
            resize-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors
          "
          placeholder="输入任务描述（可选）..."
        />
      </div>

      {/* 优先级和日期 - 响应式布局 */}
      <div className="
        grid 
        grid-cols-1 
        sm:grid-cols-2 
        gap-4
      ">
        <div className="space-y-2">
          <label className="
            block 
            text-sm 
            font-medium 
            text-gray-700
          ">
            优先级
          </label>
          <select className="
            w-full
            px-3 py-2
            sm:px-4 sm:py-3
            border border-gray-300
            rounded-md
            text-sm sm:text-base
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-colors
          ">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="
            block 
            text-sm 
            font-medium 
            text-gray-700
          ">
            截止日期
          </label>
          <input
            type="date"
            className="
              w-full
              px-3 py-2
              sm:px-4 sm:py-3
              border border-gray-300
              rounded-md
              text-sm sm:text-base
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              transition-colors
            "
          />
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="
        flex 
        flex-col sm:flex-row 
        gap-3 sm:gap-4 
        pt-2
      ">
        <Button
          type="submit"
          className="
            w-full sm:w-auto
            px-6 py-3
            text-sm sm:text-base
            font-medium
            touch-manipulation
          "
        >
          添加任务
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="
            w-full sm:w-auto
            px-6 py-3
            text-sm sm:text-base
            touch-manipulation
          "
        >
          取消
        </Button>
      </div>
    </form>
  )
}
```

## 📱 触摸友好设计

### 1. 触摸目标大小

```css
/* src/styles/touch.css */

/* 确保触摸目标至少 44x44px */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 移动端按钮样式 */
@media (max-width: 768px) {
  .btn {
    min-height: 48px;
    padding: 12px 16px;
    font-size: 16px; /* 防止 iOS 缩放 */
  }
  
  .btn-icon {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 触摸反馈 */
.touch-feedback {
  transition: transform 0.1s ease;
}

.touch-feedback:active {
  transform: scale(0.95);
}
```

### 2. 手势支持

```typescript
// src/hooks/use-touch-gestures.ts
import { useRef, useCallback } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: TouchGestureOptions) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (Math.max(absDeltaX, absDeltaY) < threshold) return

    if (absDeltaX > absDeltaY) {
      // 水平滑动
      if (deltaX > 0) {
        onSwipeRight?.()
      } else {
        onSwipeLeft?.()
      }
    } else {
      // 垂直滑动
      if (deltaY > 0) {
        onSwipeDown?.()
      } else {
        onSwipeUp?.()
      }
    }

    touchStart.current = null
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  }
}
```

## 🔧 响应式工具

### 1. 断点检测 Hook

```typescript
// src/hooks/use-breakpoint.ts
import { useState, useEffect } from 'react'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const breakpoints = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('xs')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm')
      } else {
        setCurrentBreakpoint('xs')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  const isAbove = (breakpoint: Breakpoint) => {
    return breakpoints[currentBreakpoint] >= breakpoints[breakpoint]
  }

  const isBelow = (breakpoint: Breakpoint) => {
    return breakpoints[currentBreakpoint] < breakpoints[breakpoint]
  }

  return {
    currentBreakpoint,
    isAbove,
    isBelow,
    isMobile: isBelow('md'),
    isTablet: currentBreakpoint === 'md',
    isDesktop: isAbove('lg'),
  }
}
```

### 2. 视口检测

```typescript
// src/hooks/use-viewport.ts
import { useState, useEffect } from 'react'

export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  return {
    ...viewport,
    isMobile: viewport.width < 768,
    isTablet: viewport.width >= 768 && viewport.width < 1024,
    isDesktop: viewport.width >= 1024,
    isLandscape: viewport.width > viewport.height,
    isPortrait: viewport.height > viewport.width,
  }
}
```

## 🤔 思考题

1. 如何在不同设备上保持一致的用户体验？
2. 如何优化移动端的性能和加载速度？
3. 如何处理不同屏幕密度的适配？
4. 如何设计适合触摸操作的交互？

## 📚 扩展阅读

- [Tailwind CSS 响应式设计](https://tailwindcss.com/docs/responsive-design)
- [移动端 Web 开发指南](https://developers.google.com/web/fundamentals/design-and-ux/responsive)
- [触摸友好设计](https://material.io/design/usability/accessibility.html)
- [CSS Grid 响应式布局](https://css-tricks.com/snippets/css/complete-guide-grid/)

## 🔗 下一步

完成响应式设计后，下一章我们将学习单元测试的编写。

[下一章：单元测试 →](./19-unit-testing.md)
