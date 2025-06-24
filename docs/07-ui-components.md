# 07 - UI 组件库

本章将详细介绍如何构建可复用的 UI 组件库，包括设计系统、组件架构和最佳实践。

## 🎯 学习目标

- 理解组件化设计的核心原则
- 掌握 Tailwind CSS 的高级用法
- 学会构建可复用的 UI 组件
- 了解设计系统的建立方法
- 掌握组件的可访问性实现

## 🎨 设计系统基础

### 1. 设计令牌 (Design Tokens)

```typescript
// src/lib/design-tokens.ts

// 颜色系统
export const colors = {
  // 主色调
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    900: '#1e3a8a',
  },
  
  // 语义化颜色
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  
  // 中性色
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
}

// 间距系统
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
}

// 字体系统
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}

// 阴影系统
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
}

// 圆角系统
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
}
```

### 2. Tailwind 配置扩展

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"
import { colors, spacing, typography, shadows, borderRadius } from './src/lib/design-tokens'

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors,
      spacing,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      boxShadow: shadows,
      borderRadius,
      
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

## 🧱 基础组件实现

### 1. Button 组件

```typescript
// src/components/ui/button.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from './loading'

// 变体定义
const buttonVariants = {
  variant: {
    default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    destructive: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'text-primary-600 underline-offset-4 hover:underline focus:ring-primary-500',
  },
  size: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg',
    icon: 'h-10 w-10',
  },
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <button
        className={cn(
          // 基础样式
          'inline-flex items-center justify-center gap-2 rounded-md font-medium',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // 变体样式
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" />}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
```

### 2. Input 组件

```typescript
// src/components/ui/input.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className,
    containerClassName,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    id,
    ...props 
  }, ref) => {
    const inputId = id || React.useId()
    const hasError = Boolean(error)

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{leftIcon}</div>
            </div>
          )}
          
          <input
            id={inputId}
            className={cn(
              // 基础样式
              'block w-full rounded-md border-gray-300 shadow-sm',
              'placeholder:text-gray-400',
              'focus:border-primary-500 focus:ring-primary-500',
              'disabled:bg-gray-50 disabled:text-gray-500',
              'transition-colors duration-200',
              
              // 图标间距
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              
              // 错误状态
              hasError && 'border-error-300 focus:border-error-500 focus:ring-error-500',
              
              className
            )}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : 
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="text-gray-400">{rightIcon}</div>
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={`${inputId}-error`}
            className="text-sm text-error-600"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p 
            id={`${inputId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

### 3. Card 组件

```typescript
// src/components/ui/card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 基础样式
          'rounded-lg bg-white',
          
          // 变体样式
          {
            'shadow-sm border border-gray-200': variant === 'default',
            'border-2 border-gray-200': variant === 'outlined',
            'shadow-lg border border-gray-100': variant === 'elevated',
          },
          
          // 内边距
          {
            'p-0': padding === 'none',
            'p-4': padding === 'sm',
            'p-6': padding === 'md',
            'p-8': padding === 'lg',
          },
          
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

// Card 子组件
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'
```

## 🎭 复合组件

### 1. Modal 组件

```typescript
// src/components/ui/modal.tsx
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { Button } from './button'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  React.useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, closeOnEscape, onClose])

  if (!mounted || !open) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* 模态框内容 */}
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl',
          'w-full max-h-[90vh] overflow-hidden',
          'animate-scale-in',
          sizeClasses[size]
        )}
      >
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p id="modal-description" className="mt-1 text-sm text-gray-600">
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
        
        {/* 内容 */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
```

### 2. Dropdown 组件

```typescript
// src/components/ui/dropdown.tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
  className?: string
}

export function Dropdown({ 
  trigger, 
  children, 
  align = 'start',
  side = 'bottom',
  className 
}: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  }

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      
      {open && (
        <div
          className={cn(
            'absolute z-50 min-w-[8rem]',
            'bg-white rounded-md shadow-lg border border-gray-200',
            'py-1 animate-slide-down',
            alignClasses[align],
            sideClasses[side],
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export const DropdownItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    destructive?: boolean
  }
>(({ className, destructive, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'w-full text-left px-4 py-2 text-sm',
      'hover:bg-gray-100 focus:bg-gray-100',
      'focus:outline-none transition-colors',
      destructive && 'text-error-600 hover:bg-error-50 focus:bg-error-50',
      className
    )}
    {...props}
  />
))
DropdownItem.displayName = 'DropdownItem'
```

## 🎯 组件最佳实践

### 1. 组件设计原则

```typescript
// 1. 单一职责原则
// ✅ 好的例子：专注于按钮功能
export function Button({ children, onClick, variant }) {
  return <button onClick={onClick} className={getVariantClass(variant)}>{children}</button>
}

// ❌ 不好的例子：混合了太多职责
export function ButtonWithModalAndForm({ children, formData, onSubmit }) {
  // 包含了按钮、模态框、表单逻辑...
}

// 2. 开放封闭原则
// ✅ 通过 props 扩展，而不修改组件内部
export function Card({ variant = 'default', className, ...props }) {
  return (
    <div 
      className={cn(getVariantClass(variant), className)} 
      {...props} 
    />
  )
}

// 3. 组合优于继承
// ✅ 使用组合模式
export function Modal({ children }) {
  return (
    <div className="modal">
      <ModalHeader />
      <ModalContent>{children}</ModalContent>
      <ModalFooter />
    </div>
  )
}
```

### 2. 可访问性实现

```typescript
// src/components/ui/accessible-button.tsx
export function AccessibleButton({
  children,
  loading,
  disabled,
  'aria-label': ariaLabel,
  ...props
}) {
  return (
    <button
      // 状态属性
      aria-disabled={disabled || loading}
      aria-busy={loading}
      
      // 标签属性
      aria-label={ariaLabel}
      
      // 键盘导航
      tabIndex={disabled ? -1 : 0}
      
      // 焦点管理
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          props.onClick?.(e)
        }
      }}
      
      {...props}
    >
      {loading && <span aria-hidden="true">⏳</span>}
      {children}
    </button>
  )
}
```

### 3. 性能优化

```typescript
// 使用 React.memo 优化重渲染
export const OptimizedCard = React.memo(function Card({ title, content }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  )
})

// 使用 forwardRef 支持 ref 传递
export const ForwardRefButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(props, ref) {
  return <button ref={ref} {...props} />
})

// 使用 useCallback 优化事件处理器
export function TodoItem({ todo, onUpdate }) {
  const handleToggle = React.useCallback(() => {
    onUpdate(todo.id, { completed: !todo.completed })
  }, [todo.id, todo.completed, onUpdate])

  return (
    <div>
      <input 
        type="checkbox" 
        checked={todo.completed}
        onChange={handleToggle}
      />
      {todo.title}
    </div>
  )
}
```

## 🤔 思考题

1. 如何设计一个既灵活又易用的组件 API？
2. 什么时候应该拆分组件，什么时候应该合并？
3. 如何平衡组件的可定制性和一致性？
4. 如何确保组件库的可访问性？

## 📚 扩展阅读

- [React 组件设计模式](https://react.dev/learn/thinking-in-react)
- [Tailwind CSS 组件库](https://tailwindui.com/components)
- [Web 可访问性指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [设计系统构建指南](https://www.designsystems.com/)

## 🔗 下一步

完成 UI 组件库后，下一章我们将学习状态管理的实现。

[下一章：状态管理 →](./08-state-management.md)
