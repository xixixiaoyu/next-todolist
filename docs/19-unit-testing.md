# 19 - 单元测试

本章将详细介绍如何编写高质量的单元测试，确保代码的可靠性和可维护性。

## 🎯 学习目标

- 掌握单元测试的核心概念和最佳实践
- 学会测试 React 组件和自定义 Hook
- 了解测试驱动开发（TDD）方法
- 掌握 Mock 和测试替身的使用

## 🧪 测试基础

### 测试金字塔

```
        ┌─────────────────┐
        │   E2E Tests     │  少量，高成本，高价值
        │   (Playwright)  │  测试完整用户流程
        └─────────────────┘
      ┌───────────────────────┐
      │  Integration Tests    │  适量，中等成本
      │  (Testing Library)    │  测试组件交互
      └───────────────────────┘
    ┌─────────────────────────────┐
    │      Unit Tests             │  大量，低成本，快速
    │   (Jest + Testing Library)  │  测试单个函数/组件
    └─────────────────────────────┘
```

## 🔧 工具函数测试

### 1. 基础工具函数

```typescript
// src/lib/__tests__/utils.test.ts
import { 
  formatDate, 
  formatRelativeTime, 
  validateEmail, 
  debounce,
  cn 
} from '../utils'

describe('formatDate', () => {
  it('应该正确格式化日期', () => {
    const date = new Date('2023-12-25T10:30:00Z')
    expect(formatDate(date)).toBe('2023-12-25')
  })

  it('应该处理无效日期', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
  })

  it('应该支持自定义格式', () => {
    const date = new Date('2023-12-25T10:30:00Z')
    expect(formatDate(date, 'yyyy/MM/dd')).toBe('2023/12/25')
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // 固定当前时间用于测试
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-12-25T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('应该显示相对时间', () => {
    const oneHourAgo = new Date('2023-12-25T11:00:00Z')
    expect(formatRelativeTime(oneHourAgo)).toBe('1 小时前')
  })

  it('应该显示刚刚', () => {
    const now = new Date('2023-12-25T12:00:00Z')
    expect(formatRelativeTime(now)).toBe('刚刚')
  })
})

describe('validateEmail', () => {
  it('应该验证有效邮箱', () => {
    expect(validateEmail('test@example.com')).toBe(true)
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
  })

  it('应该拒绝无效邮箱', () => {
    expect(validateEmail('invalid-email')).toBe(false)
    expect(validateEmail('test@')).toBe(false)
    expect(validateEmail('@example.com')).toBe(false)
    expect(validateEmail('')).toBe(false)
  })
})

describe('debounce', () => {
  it('应该延迟执行函数', async () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('test')
    expect(mockFn).not.toHaveBeenCalled()

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('应该取消之前的调用', async () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('first')
    debouncedFn('second')
    debouncedFn('third')

    await new Promise(resolve => setTimeout(resolve, 150))
    expect(mockFn).toHaveBeenCalledWith('third')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

describe('cn (className utility)', () => {
  it('应该合并类名', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('应该处理条件类名', () => {
    expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
  })

  it('应该去重类名', () => {
    expect(cn('duplicate', 'duplicate', 'unique')).toBe('duplicate unique')
  })
})
```

### 2. 验证函数测试

```typescript
// src/lib/__tests__/validations.test.ts
import { z } from 'zod'
import { todoSchema, loginSchema, registerSchema } from '../validations'

describe('todoSchema', () => {
  it('应该验证有效的 todo 数据', () => {
    const validTodo = {
      title: '测试任务',
      description: '这是一个测试任务',
      priority: 'medium' as const,
      dueDate: '2023-12-31',
    }

    expect(() => todoSchema.parse(validTodo)).not.toThrow()
  })

  it('应该拒绝空标题', () => {
    const invalidTodo = {
      title: '',
      description: '描述',
      priority: 'medium' as const,
    }

    expect(() => todoSchema.parse(invalidTodo)).toThrow()
  })

  it('应该拒绝过长的标题', () => {
    const invalidTodo = {
      title: 'a'.repeat(101), // 超过 100 字符
      priority: 'medium' as const,
    }

    expect(() => todoSchema.parse(invalidTodo)).toThrow()
  })

  it('应该拒绝无效的优先级', () => {
    const invalidTodo = {
      title: '测试任务',
      priority: 'invalid' as any,
    }

    expect(() => todoSchema.parse(invalidTodo)).toThrow()
  })
})

describe('loginSchema', () => {
  it('应该验证有效的登录数据', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'password123',
    }

    expect(() => loginSchema.parse(validLogin)).not.toThrow()
  })

  it('应该拒绝无效邮箱', () => {
    const invalidLogin = {
      email: 'invalid-email',
      password: 'password123',
    }

    expect(() => loginSchema.parse(invalidLogin)).toThrow()
  })

  it('应该拒绝短密码', () => {
    const invalidLogin = {
      email: 'test@example.com',
      password: '123', // 少于 6 个字符
    }

    expect(() => loginSchema.parse(invalidLogin)).toThrow()
  })
})
```

## 🎨 组件测试

### 1. 基础组件测试

```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen, fireEvent } from '@/test-utils'
import { Button } from '../button'

describe('Button', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByRole('button', { name: /点击我/i })).toBeInTheDocument()
  })

  it('应该处理点击事件', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>点击我</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('应该在禁用时不响应点击', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick} disabled>点击我</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('应该显示加载状态', () => {
    render(<Button loading>点击我</Button>)
    
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/加载中/i)).toBeInTheDocument()
  })

  it('应该应用正确的变体样式', () => {
    render(<Button variant="destructive">删除</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-error-600')
  })

  it('应该支持自定义类名', () => {
    render(<Button className="custom-class">按钮</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('应该转发 ref', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref}>按钮</Button>)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
```

### 2. 复杂组件测试

```typescript
// src/components/todo/__tests__/todo-item.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import { TodoItem } from '../todo-item'
import { createMockTodo } from '@/test-utils/factories'

describe('TodoItem', () => {
  const mockOnUpdate = jest.fn()
  const mockOnDelete = jest.fn()
  
  beforeEach(() => {
    mockOnUpdate.mockClear()
    mockOnDelete.mockClear()
  })

  it('应该渲染 todo 信息', () => {
    const todo = createMockTodo({
      title: '测试任务',
      description: '这是一个测试任务',
      completed: false,
    })

    render(
      <TodoItem 
        todo={todo} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    expect(screen.getByText('测试任务')).toBeInTheDocument()
    expect(screen.getByText('这是一个测试任务')).toBeInTheDocument()
  })

  it('应该切换完成状态', async () => {
    const todo = createMockTodo({ completed: false })

    render(
      <TodoItem 
        todo={todo} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const toggleButton = screen.getByRole('button', { name: /标记完成/i })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(todo.id, { completed: true })
    })
  })

  it('应该显示已完成状态', () => {
    const todo = createMockTodo({ 
      title: '已完成任务',
      completed: true 
    })

    render(
      <TodoItem 
        todo={todo} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const title = screen.getByText('已完成任务')
    expect(title).toHaveClass('line-through')
  })

  it('应该处理删除操作', async () => {
    const todo = createMockTodo()
    
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <TodoItem 
        todo={todo} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const deleteButton = screen.getByRole('button', { name: /删除/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(todo.id)
    })

    confirmSpy.mockRestore()
  })

  it('应该取消删除操作', async () => {
    const todo = createMockTodo()
    
    // Mock window.confirm 返回 false
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <TodoItem 
        todo={todo} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const deleteButton = screen.getByRole('button', { name: /删除/i })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockOnDelete).not.toHaveBeenCalled()
    })

    confirmSpy.mockRestore()
  })

  it('应该进入编辑模式', () => {
    const todo = createMockTodo()

    render(
      <TodoItem 
        todo={todo} 
        onUpdate={mockOnUpdate} 
        onDelete={mockOnDelete} 
      />
    )

    const editButton = screen.getByRole('button', { name: /编辑/i })
    fireEvent.click(editButton)

    // 应该显示编辑表单
    expect(screen.getByDisplayValue(todo.title)).toBeInTheDocument()
  })
})
```

### 3. 表单组件测试

```typescript
// src/components/todo/__tests__/todo-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { TodoForm } from '../todo-form'

describe('TodoForm', () => {
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('应该渲染表单字段', () => {
    render(<TodoForm onSubmit={mockOnSubmit} />)
    
    expect(screen.getByLabelText(/任务标题/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/任务描述/i)).toBeInTheDocument()
    expect(screen.getByText(/优先级/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /添加任务/i })).toBeInTheDocument()
  })

  it('应该验证必填字段', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />)
    
    const submitButton = screen.getByRole('button', { name: /添加任务/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/标题不能为空/i)).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('应该提交有效的表单数据', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />)
    
    // 填写表单
    await user.type(screen.getByLabelText(/任务标题/i), '完成项目文档')
    await user.type(screen.getByLabelText(/任务描述/i), '编写详细的项目文档')
    
    // 提交表单
    await user.click(screen.getByRole('button', { name: /添加任务/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: '完成项目文档',
        description: '编写详细的项目文档',
        priority: 'medium',
        dueDate: '',
      })
    })
  })

  it('应该在编辑模式下预填充数据', () => {
    const initialData = {
      title: '现有任务',
      description: '现有描述',
      priority: 'high' as const,
    }
    
    render(
      <TodoForm 
        mode="edit" 
        initialData={initialData} 
        onSubmit={mockOnSubmit} 
      />
    )
    
    expect(screen.getByDisplayValue('现有任务')).toBeInTheDocument()
    expect(screen.getByDisplayValue('现有描述')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /保存更改/i })).toBeInTheDocument()
  })

  it('应该处理取消操作', async () => {
    const user = userEvent.setup()
    const mockOnCancel = jest.fn()
    
    render(
      <TodoForm 
        mode="edit" 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    )
    
    await user.click(screen.getByRole('button', { name: /取消/i }))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('应该显示加载状态', () => {
    render(<TodoForm onSubmit={mockOnSubmit} loading />)
    
    const submitButton = screen.getByRole('button', { name: /添加任务/i })
    expect(submitButton).toBeDisabled()
  })
})
```

## 🪝 Hook 测试

### 1. 自定义 Hook 测试

```typescript
// src/hooks/__tests__/use-debounce.test.ts
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../use-debounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('应该返回初始值', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('应该延迟更新值', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    expect(result.current).toBe('initial')

    // 更新值
    rerender({ value: 'updated', delay: 500 })
    expect(result.current).toBe('initial') // 还没有更新

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated') // 现在应该更新了
  })

  it('应该取消之前的延迟', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    )

    // 快速连续更新
    rerender({ value: 'first', delay: 500 })
    rerender({ value: 'second', delay: 500 })
    rerender({ value: 'final', delay: 500 })

    // 快进时间
    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('final') // 应该是最后一个值
  })
})
```

### 2. 复杂 Hook 测试

```typescript
// src/hooks/__tests__/use-todos.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTodos } from '../use-todos'
import { createMockTodo } from '@/test-utils/factories'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('useTodos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该获取 todos', async () => {
    const mockTodos = [
      createMockTodo({ id: '1', title: '任务 1' }),
      createMockTodo({ id: '2', title: '任务 2' }),
    ]

    mockSupabase.from().select().order.mockResolvedValue({
      data: mockTodos,
      error: null,
    })

    const { result } = renderHook(() => useTodos())

    await waitFor(() => {
      expect(result.current.todos).toEqual(mockTodos)
      expect(result.current.loading).toBe(false)
    })
  })

  it('应该处理获取错误', async () => {
    const error = new Error('获取失败')
    mockSupabase.from().select().order.mockResolvedValue({
      data: null,
      error,
    })

    const { result } = renderHook(() => useTodos())

    await waitFor(() => {
      expect(result.current.error).toBe('获取失败')
      expect(result.current.loading).toBe(false)
    })
  })

  it('应该添加新 todo', async () => {
    const newTodo = createMockTodo({ title: '新任务' })
    
    mockSupabase.from().insert().select().single.mockResolvedValue({
      data: newTodo,
      error: null,
    })

    const { result } = renderHook(() => useTodos())

    await act(async () => {
      await result.current.addTodo({
        title: '新任务',
        user_id: 'user-123',
      })
    })

    expect(mockSupabase.from().insert).toHaveBeenCalledWith([{
      title: '新任务',
      user_id: 'user-123',
    }])
  })

  it('应该更新 todo', async () => {
    const updatedTodo = createMockTodo({ 
      id: '1', 
      title: '更新的任务',
      completed: true 
    })
    
    mockSupabase.from().update().eq().select().single.mockResolvedValue({
      data: updatedTodo,
      error: null,
    })

    const { result } = renderHook(() => useTodos())

    await act(async () => {
      await result.current.updateTodo('1', { 
        title: '更新的任务',
        completed: true 
      })
    })

    expect(mockSupabase.from().update).toHaveBeenCalledWith({
      title: '更新的任务',
      completed: true,
    })
    expect(mockSupabase.from().eq).toHaveBeenCalledWith('id', '1')
  })
})
```

## 🎭 Mock 和测试替身

### 1. API Mock

```typescript
// src/test-utils/api-mocks.ts
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { createMockTodo, createMockUser } from './factories'

export const handlers = [
  // 获取 todos
  rest.get('/api/todos', (req, res, ctx) => {
    const todos = [
      createMockTodo({ id: '1', title: '任务 1' }),
      createMockTodo({ id: '2', title: '任务 2' }),
    ]
    
    return res(ctx.json({ data: todos }))
  }),

  // 创建 todo
  rest.post('/api/todos', async (req, res, ctx) => {
    const body = await req.json()
    const newTodo = createMockTodo({
      id: Math.random().toString(),
      ...body,
    })
    
    return res(ctx.json({ data: newTodo }))
  }),

  // 更新 todo
  rest.put('/api/todos/:id', async (req, res, ctx) => {
    const { id } = req.params
    const body = await req.json()
    const updatedTodo = createMockTodo({
      id: id as string,
      ...body,
    })
    
    return res(ctx.json({ data: updatedTodo }))
  }),

  // 删除 todo
  rest.delete('/api/todos/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),

  // 认证相关
  rest.post('/api/auth/login', async (req, res, ctx) => {
    const { email, password } = await req.json()
    
    if (email === 'test@example.com' && password === 'password') {
      return res(ctx.json({
        user: createMockUser({ email }),
        token: 'mock-token',
      }))
    }
    
    return res(
      ctx.status(401),
      ctx.json({ error: '邮箱或密码错误' })
    )
  }),
]

export const server = setupServer(...handlers)
```

### 2. 组件 Mock

```typescript
// src/test-utils/component-mocks.tsx
import React from 'react'

// Mock Next.js 组件
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock 复杂组件
jest.mock('@/components/ui/modal', () => ({
  Modal: ({ children, open }: { children: React.ReactNode; open: boolean }) => 
    open ? <div data-testid="modal">{children}</div> : null,
}))

// Mock 图表组件
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))
```

## 🤔 思考题

1. 如何确定测试的边界和范围？
2. 什么时候应该使用 Mock，什么时候使用真实实现？
3. 如何测试异步操作和副作用？
4. 如何平衡测试覆盖率和测试质量？

## 📚 扩展阅读

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [React Testing Library 指南](https://testing-library.com/docs/react-testing-library/intro/)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TDD 实践指南](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## 🔗 下一步

完成单元测试后，下一章我们将学习集成测试的编写。

[下一章：集成测试 →](./20-integration-testing.md)
