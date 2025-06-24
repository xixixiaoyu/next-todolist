# 18 - 测试配置

本章将详细介绍如何为 Next.js 14+ 项目配置完整的测试环境，包括单元测试、集成测试和端到端测试。

## 🎯 学习目标

- 理解现代前端测试的重要性和策略
- 掌握 Jest 和 React Testing Library 的配置
- 学会编写高质量的测试用例
- 了解测试覆盖率和持续集成
- 掌握测试最佳实践和常见模式

## 🏗️ 测试金字塔

```
        ┌─────────────────┐
        │   E2E Tests     │  少量，高价值
        │   (Playwright)  │  测试完整用户流程
        └─────────────────┘
      ┌───────────────────────┐
      │  Integration Tests    │  适量，测试组件交互
      │  (Testing Library)    │  和 API 集成
      └───────────────────────┘
    ┌─────────────────────────────┐
    │      Unit Tests             │  大量，快速执行
    │   (Jest + Testing Library)  │  测试单个函数/组件
    └─────────────────────────────┘
```

## ⚙️ Jest 配置

### 1. 基础配置

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 应用的路径
  dir: './',
})

// Jest 自定义配置
const customJestConfig = {
  // 测试环境设置
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
  },
  
  // 覆盖率配置
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
  ],
  
  // 转换配置
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // 忽略转换的模块
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // 测试超时时间
  testTimeout: 10000,
}

module.exports = createJestConfig(customJestConfig)
```

### 2. 测试环境设置

```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// 全局测试配置
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock Next.js 路由
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js 图片组件
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
      range: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
  }),
}))

// Mock 环境变量
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// Mock window 对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch
global.fetch = jest.fn()

// 清理函数
afterEach(() => {
  jest.clearAllMocks()
})
```

## 🧪 测试工具函数

### 1. 自定义渲染函数

```typescript
// src/test-utils/render.tsx
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ToastProvider } from '@/components/ui/toast'

// 测试包装器
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  )
}

// 自定义渲染函数
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// 重新导出所有内容
export * from '@testing-library/react'
export { customRender as render }
```

### 2. 测试数据工厂

```typescript
// src/test-utils/factories.ts
import { Todo, User } from '@/types'

// 用户数据工厂
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  ...overrides,
})

// Todo 数据工厂
export const createMockTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-123',
  title: '测试任务',
  description: '这是一个测试任务',
  completed: false,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  user_id: 'user-123',
  ...overrides,
})

// 批量创建数据
export const createMockTodos = (count: number, overrides: Partial<Todo> = {}): Todo[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockTodo({
      id: `todo-${index + 1}`,
      title: `测试任务 ${index + 1}`,
      ...overrides,
    })
  )
}

// API 响应工厂
export const createMockApiResponse = <T>(data: T, overrides = {}) => ({
  data,
  error: null,
  message: 'success',
  ...overrides,
})

export const createMockApiError = (message = '请求失败', code = 'ERROR') => ({
  data: null,
  error: {
    code,
    message,
    timestamp: new Date().toISOString(),
  },
})
```

### 3. 测试辅助函数

```typescript
// src/test-utils/helpers.ts
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// 等待加载完成
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByText(/加载中/i)).not.toBeInTheDocument()
  })

// 填写表单
export const fillForm = async (fields: Record<string, string>) => {
  const user = userEvent.setup()
  
  for (const [label, value] of Object.entries(fields)) {
    const field = screen.getByLabelText(new RegExp(label, 'i'))
    await user.clear(field)
    await user.type(field, value)
  }
}

// 提交表单
export const submitForm = async (buttonText = /提交/i) => {
  const user = userEvent.setup()
  const submitButton = screen.getByRole('button', { name: buttonText })
  await user.click(submitButton)
}

// 等待错误消息
export const waitForErrorMessage = (message: string | RegExp) =>
  waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument()
  })

// 等待成功消息
export const waitForSuccessMessage = (message: string | RegExp) =>
  waitFor(() => {
    expect(screen.getByText(message)).toBeInTheDocument()
  })

// Mock 定时器
export const mockTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })
}

// Mock 网络请求
export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: jest.fn().mockResolvedValue(response),
  })
}
```

## 🧩 组件测试示例

### 1. 基础组件测试

```typescript
// src/components/ui/__tests__/button.test.tsx
import { render, screen } from '@/test-utils/render'
import userEvent from '@testing-library/user-event'
import { Button } from '../button'

describe('Button', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByRole('button', { name: /点击我/i })).toBeInTheDocument()
  })

  it('应该处理点击事件', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>点击我</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('应该在禁用时不响应点击', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick} disabled>点击我</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    
    await user.click(button)
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
})
```

### 2. 表单组件测试

```typescript
// src/components/todo/__tests__/todo-form.test.tsx
import { render, screen, waitFor } from '@/test-utils/render'
import userEvent from '@testing-library/user-event'
import { TodoForm } from '../todo-form'
import { fillForm, submitForm } from '@/test-utils/helpers'

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
    render(<TodoForm onSubmit={mockOnSubmit} />)
    
    await submitForm()
    
    await waitFor(() => {
      expect(screen.getByText(/标题不能为空/i)).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('应该提交有效的表单数据', async () => {
    render(<TodoForm onSubmit={mockOnSubmit} />)
    
    await fillForm({
      '任务标题': '完成项目文档',
      '任务描述': '编写详细的项目文档',
    })
    
    await submitForm()
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: '完成项目文档',
        description: '编写详细的项目文档',
        priority: 'medium',
        dueDate: '',
        tags: [],
      })
    })
  })

  it('应该处理标签添加和删除', async () => {
    const user = userEvent.setup()
    render(<TodoForm onSubmit={mockOnSubmit} />)
    
    // 添加标签
    const tagInput = screen.getByPlaceholderText(/添加标签/i)
    await user.type(tagInput, '重要')
    await user.click(screen.getByRole('button', { name: /添加/i }))
    
    expect(screen.getByText('重要')).toBeInTheDocument()
    
    // 删除标签
    const deleteButton = screen.getByRole('button', { name: /删除标签/i })
    await user.click(deleteButton)
    
    expect(screen.queryByText('重要')).not.toBeInTheDocument()
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
})
```

### 3. 状态管理测试

```typescript
// src/store/__tests__/todos.test.ts
import { renderHook, act } from '@testing-library/react'
import { useTodoStore } from '../todos'
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

describe('useTodoStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useTodoStore.getState().reset()
    jest.clearAllMocks()
  })

  it('应该有正确的初始状态', () => {
    const { result } = renderHook(() => useTodoStore())
    
    expect(result.current.todos).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.filter).toBe('all')
  })

  it('应该添加新的 todo', async () => {
    const mockTodo = createMockTodo()
    
    // Mock API 响应
    mockSupabase.from().single.mockResolvedValue({
      data: mockTodo,
      error: null,
    })
    
    const { result } = renderHook(() => useTodoStore())
    
    await act(async () => {
      await result.current.addTodo({
        title: mockTodo.title,
        description: mockTodo.description,
        user_id: mockTodo.user_id,
      })
    })
    
    expect(result.current.todos).toContain(mockTodo)
  })

  it('应该更新现有的 todo', async () => {
    const mockTodo = createMockTodo()
    const updatedTodo = { ...mockTodo, completed: true }
    
    // 设置初始状态
    act(() => {
      useTodoStore.setState({ todos: [mockTodo] })
    })
    
    // Mock API 响应
    mockSupabase.from().single.mockResolvedValue({
      data: updatedTodo,
      error: null,
    })
    
    const { result } = renderHook(() => useTodoStore())
    
    await act(async () => {
      await result.current.updateTodo(mockTodo.id, { completed: true })
    })
    
    const updatedTodoInStore = result.current.todos.find(t => t.id === mockTodo.id)
    expect(updatedTodoInStore?.completed).toBe(true)
  })

  it('应该正确过滤 todos', () => {
    const completedTodo = createMockTodo({ id: '1', completed: true })
    const activeTodo = createMockTodo({ id: '2', completed: false })
    
    act(() => {
      useTodoStore.setState({ 
        todos: [completedTodo, activeTodo],
        filter: 'completed'
      })
    })
    
    const { result } = renderHook(() => useTodoStore())
    const filtered = result.current.filteredTodos()
    
    expect(filtered).toHaveLength(1)
    expect(filtered[0].completed).toBe(true)
  })

  it('应该处理 API 错误', async () => {
    const error = new Error('网络错误')
    
    // Mock API 错误
    mockSupabase.from().single.mockRejectedValue(error)
    
    const { result } = renderHook(() => useTodoStore())
    
    await act(async () => {
      try {
        await result.current.addTodo({
          title: '测试任务',
          user_id: 'user-123',
        })
      } catch (e) {
        // 预期的错误
      }
    })
    
    expect(result.current.error).toBe('网络错误')
  })
})
```

## 📊 测试覆盖率

### 1. 覆盖率配置

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false"
  }
}
```

### 2. 覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看详细报告
open coverage/lcov-report/index.html
```

## 🔄 持续集成

### 1. GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run type check
        run: pnpm type-check
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run tests
        run: pnpm test:ci
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 🤔 思考题

1. 什么是好的测试？如何平衡测试覆盖率和测试质量？
2. 如何测试异步操作和副作用？
3. 什么时候应该使用 Mock，什么时候应该使用真实数据？
4. 如何设计可维护的测试用例？

## 📚 扩展阅读

- [Jest 官方文档](https://jestjs.io/docs/getting-started)
- [React Testing Library 指南](https://testing-library.com/docs/react-testing-library/intro/)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [测试金字塔理论](https://martinfowler.com/articles/practical-test-pyramid.html)

## 🔗 下一步

完成测试配置后，下一章我们将学习如何编写单元测试。

[下一章：单元测试 →](./19-unit-testing.md)
