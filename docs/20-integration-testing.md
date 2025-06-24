# 20 - 集成测试

本章将详细介绍如何编写集成测试，验证组件间的交互和数据流，确保应用的整体功能正常。

## 🎯 学习目标

- 理解集成测试的重要性和适用场景
- 掌握组件集成测试的编写方法
- 学会测试用户完整的操作流程
- 了解 API 集成测试的实现

## 🔗 集成测试概念

### 测试层级对比

| 测试类型 | 范围 | 速度 | 成本 | 价值 |
|---------|------|------|------|------|
| 单元测试 | 单个函数/组件 | 快 | 低 | 中 |
| 集成测试 | 多个组件交互 | 中 | 中 | 高 |
| E2E 测试 | 完整用户流程 | 慢 | 高 | 高 |

## 🧩 组件集成测试

### 1. Todo 应用集成测试

```typescript
// src/components/todo/__tests__/todo-app.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { TodoApp } from '../todo-app'
import { server } from '@/test-utils/api-mocks'
import { createMockTodo } from '@/test-utils/factories'

describe('TodoApp Integration', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('应该完成完整的 todo 管理流程', async () => {
    const user = userEvent.setup()
    
    render(<TodoApp />)

    // 1. 等待初始数据加载
    await waitFor(() => {
      expect(screen.getByText('任务 1')).toBeInTheDocument()
      expect(screen.getByText('任务 2')).toBeInTheDocument()
    })

    // 2. 添加新任务
    const titleInput = screen.getByPlaceholderText(/添加新任务/i)
    await user.type(titleInput, '新的测试任务')
    
    const addButton = screen.getByRole('button', { name: /添加任务/i })
    await user.click(addButton)

    // 3. 验证新任务已添加
    await waitFor(() => {
      expect(screen.getByText('新的测试任务')).toBeInTheDocument()
    })

    // 4. 标记任务为完成
    const checkbox = screen.getByRole('checkbox', { name: /标记完成 新的测试任务/i })
    await user.click(checkbox)

    // 5. 验证任务状态更新
    await waitFor(() => {
      expect(checkbox).toBeChecked()
      expect(screen.getByText('新的测试任务')).toHaveClass('line-through')
    })

    // 6. 编辑任务
    const editButton = screen.getByRole('button', { name: /编辑任务 新的测试任务/i })
    await user.click(editButton)

    // 7. 更新任务标题
    const editInput = screen.getByDisplayValue('新的测试任务')
    await user.clear(editInput)
    await user.type(editInput, '更新后的任务')
    
    const saveButton = screen.getByRole('button', { name: /保存更改/i })
    await user.click(saveButton)

    // 8. 验证任务已更新
    await waitFor(() => {
      expect(screen.getByText('更新后的任务')).toBeInTheDocument()
      expect(screen.queryByText('新的测试任务')).not.toBeInTheDocument()
    })

    // 9. 删除任务
    const deleteButton = screen.getByRole('button', { name: /删除任务 更新后的任务/i })
    
    // Mock confirm dialog
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    await user.click(deleteButton)

    // 10. 验证任务已删除
    await waitFor(() => {
      expect(screen.queryByText('更新后的任务')).not.toBeInTheDocument()
    })

    confirmSpy.mockRestore()
  })

  it('应该正确处理搜索和过滤', async () => {
    const user = userEvent.setup()
    
    render(<TodoApp />)

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('任务 1')).toBeInTheDocument()
    })

    // 1. 测试搜索功能
    const searchInput = screen.getByPlaceholderText(/搜索任务/i)
    await user.type(searchInput, '任务 1')

    await waitFor(() => {
      expect(screen.getByText('任务 1')).toBeInTheDocument()
      expect(screen.queryByText('任务 2')).not.toBeInTheDocument()
    })

    // 2. 清除搜索
    await user.clear(searchInput)

    await waitFor(() => {
      expect(screen.getByText('任务 1')).toBeInTheDocument()
      expect(screen.getByText('任务 2')).toBeInTheDocument()
    })

    // 3. 测试过滤功能
    const filterButton = screen.getByRole('button', { name: /过滤器/i })
    await user.click(filterButton)

    const completedFilter = screen.getByLabelText(/已完成/i)
    await user.click(completedFilter)

    const applyButton = screen.getByRole('button', { name: /应用过滤器/i })
    await user.click(applyButton)

    // 验证只显示已完成的任务
    await waitFor(() => {
      const completedTasks = screen.queryAllByText(/任务/i).filter(
        element => element.closest('[data-completed="true"]')
      )
      expect(completedTasks.length).toBeGreaterThan(0)
    })
  })

  it('应该处理批量操作', async () => {
    const user = userEvent.setup()
    
    render(<TodoApp />)

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('任务 1')).toBeInTheDocument()
    })

    // 1. 选择多个任务
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /全选/i })
    await user.click(selectAllCheckbox)

    // 2. 验证批量操作栏显示
    expect(screen.getByText(/已选择/i)).toBeInTheDocument()

    // 3. 批量标记完成
    const bulkCompleteButton = screen.getByRole('button', { name: /标记完成/i })
    await user.click(bulkCompleteButton)

    // 4. 验证所有任务都被标记为完成
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox')
      const todoCheckboxes = checkboxes.filter(cb => 
        cb.getAttribute('aria-label')?.includes('标记')
      )
      todoCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked()
      })
    })
  })
})
```

### 2. 认证流程集成测试

```typescript
// src/components/auth/__tests__/auth-flow.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@/test-utils'
import userEvent from '@testing-library/user-event'
import { AuthFlow } from '../auth-flow'
import { server } from '@/test-utils/api-mocks'

describe('Auth Flow Integration', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('应该完成完整的登录流程', async () => {
    const user = userEvent.setup()
    
    render(<AuthFlow />)

    // 1. 验证登录表单显示
    expect(screen.getByRole('heading', { name: /欢迎回来/i })).toBeInTheDocument()

    // 2. 填写登录信息
    await user.type(screen.getByLabelText(/邮箱/i), 'test@example.com')
    await user.type(screen.getByLabelText(/密码/i), 'password')

    // 3. 提交登录
    await user.click(screen.getByRole('button', { name: /登录/i }))

    // 4. 验证登录成功后的状态
    await waitFor(() => {
      expect(screen.getByText(/登录成功/i)).toBeInTheDocument()
    })
  })

  it('应该处理登录错误', async () => {
    const user = userEvent.setup()
    
    render(<AuthFlow />)

    // 1. 填写错误的登录信息
    await user.type(screen.getByLabelText(/邮箱/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/密码/i), 'wrongpassword')

    // 2. 提交登录
    await user.click(screen.getByRole('button', { name: /登录/i }))

    // 3. 验证错误信息显示
    await waitFor(() => {
      expect(screen.getByText(/邮箱或密码错误/i)).toBeInTheDocument()
    })
  })

  it('应该在登录和注册之间切换', async () => {
    const user = userEvent.setup()
    
    render(<AuthFlow />)

    // 1. 验证初始为登录模式
    expect(screen.getByRole('heading', { name: /欢迎回来/i })).toBeInTheDocument()

    // 2. 切换到注册模式
    await user.click(screen.getByRole('button', { name: /立即注册/i }))

    // 3. 验证注册表单显示
    expect(screen.getByRole('heading', { name: /创建账户/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/确认密码/i)).toBeInTheDocument()

    // 4. 切换回登录模式
    await user.click(screen.getByRole('button', { name: /立即登录/i }))

    // 5. 验证回到登录表单
    expect(screen.getByRole('heading', { name: /欢迎回来/i })).toBeInTheDocument()
  })
})
```

## 🌐 API 集成测试

### 1. Supabase 集成测试

```typescript
// src/lib/__tests__/supabase.integration.test.ts
import { createClient } from '@/lib/supabase/client'
import { TodoService } from '@/lib/services/todo-service'
import { createMockTodo } from '@/test-utils/factories'

// 使用测试数据库
const supabase = createClient()
const todoService = new TodoService(supabase)

describe('Supabase Integration', () => {
  let testUserId: string
  let createdTodoIds: string[] = []

  beforeAll(async () => {
    // 创建测试用户
    const { data: authData } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword',
    })
    testUserId = authData.user?.id || ''
  })

  afterEach(async () => {
    // 清理创建的测试数据
    if (createdTodoIds.length > 0) {
      await supabase
        .from('todos')
        .delete()
        .in('id', createdTodoIds)
      createdTodoIds = []
    }
  })

  afterAll(async () => {
    // 清理测试用户
    await supabase.auth.signOut()
  })

  it('应该创建和获取 todo', async () => {
    // 1. 创建 todo
    const todoData = {
      title: '集成测试任务',
      description: '这是一个集成测试任务',
      user_id: testUserId,
    }

    const createdTodo = await todoService.create(todoData)
    createdTodoIds.push(createdTodo.id)

    expect(createdTodo).toMatchObject({
      title: '集成测试任务',
      description: '这是一个集成测试任务',
      completed: false,
      user_id: testUserId,
    })

    // 2. 获取 todo
    const fetchedTodo = await todoService.getById(createdTodo.id)
    expect(fetchedTodo).toEqual(createdTodo)
  })

  it('应该更新 todo', async () => {
    // 1. 创建 todo
    const todoData = {
      title: '待更新任务',
      user_id: testUserId,
    }

    const createdTodo = await todoService.create(todoData)
    createdTodoIds.push(createdTodo.id)

    // 2. 更新 todo
    const updates = {
      title: '已更新任务',
      completed: true,
    }

    const updatedTodo = await todoService.update(createdTodo.id, updates)

    expect(updatedTodo).toMatchObject({
      ...createdTodo,
      ...updates,
    })
  })

  it('应该删除 todo', async () => {
    // 1. 创建 todo
    const todoData = {
      title: '待删除任务',
      user_id: testUserId,
    }

    const createdTodo = await todoService.create(todoData)

    // 2. 删除 todo
    await todoService.delete(createdTodo.id)

    // 3. 验证 todo 已删除
    const fetchedTodo = await todoService.getById(createdTodo.id)
    expect(fetchedTodo).toBeNull()
  })

  it('应该获取用户的所有 todos', async () => {
    // 1. 创建多个 todos
    const todoData1 = {
      title: '任务 1',
      user_id: testUserId,
    }
    const todoData2 = {
      title: '任务 2',
      user_id: testUserId,
    }

    const todo1 = await todoService.create(todoData1)
    const todo2 = await todoService.create(todoData2)
    createdTodoIds.push(todo1.id, todo2.id)

    // 2. 获取所有 todos
    const todos = await todoService.getByUserId(testUserId)

    expect(todos).toHaveLength(2)
    expect(todos.map(t => t.title)).toContain('任务 1')
    expect(todos.map(t => t.title)).toContain('任务 2')
  })

  it('应该处理 RLS 权限', async () => {
    // 1. 创建另一个用户的 todo
    const { data: otherUser } = await supabase.auth.signUp({
      email: 'other@example.com',
      password: 'testpassword',
    })

    const otherTodoData = {
      title: '其他用户的任务',
      user_id: otherUser.user?.id || '',
    }

    // 2. 尝试以当前用户身份访问其他用户的 todo
    // 这应该被 RLS 策略阻止
    const todos = await todoService.getByUserId(testUserId)
    const otherUserTodos = todos.filter(t => t.user_id !== testUserId)
    
    expect(otherUserTodos).toHaveLength(0)
  })
})
```

### 2. 实时功能集成测试

```typescript
// src/lib/__tests__/realtime.integration.test.ts
import { createClient } from '@/lib/supabase/client'
import { RealtimeManager } from '@/lib/realtime-manager'

describe('Realtime Integration', () => {
  let supabase: ReturnType<typeof createClient>
  let realtimeManager: RealtimeManager
  let testUserId: string

  beforeAll(async () => {
    supabase = createClient()
    realtimeManager = new RealtimeManager(supabase)

    // 登录测试用户
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword',
    })
    testUserId = data.user?.id || ''
  })

  afterAll(async () => {
    realtimeManager.disconnect()
    await supabase.auth.signOut()
  })

  it('应该接收实时 todo 更新', async () => {
    const updates: any[] = []
    
    // 1. 订阅实时更新
    const unsubscribe = realtimeManager.subscribeTodos(testUserId, (update) => {
      updates.push(update)
    })

    // 2. 创建新 todo
    const { data: newTodo } = await supabase
      .from('todos')
      .insert([{
        title: '实时测试任务',
        user_id: testUserId,
      }])
      .select()
      .single()

    // 3. 等待实时更新
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 4. 验证收到更新
    expect(updates).toHaveLength(1)
    expect(updates[0]).toMatchObject({
      eventType: 'INSERT',
      new: expect.objectContaining({
        title: '实时测试任务',
      }),
    })

    // 5. 更新 todo
    await supabase
      .from('todos')
      .update({ completed: true })
      .eq('id', newTodo.id)

    // 6. 等待更新事件
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 7. 验证收到更新事件
    expect(updates).toHaveLength(2)
    expect(updates[1]).toMatchObject({
      eventType: 'UPDATE',
      new: expect.objectContaining({
        completed: true,
      }),
    })

    // 清理
    unsubscribe()
    await supabase.from('todos').delete().eq('id', newTodo.id)
  })
})
```

## 🔄 状态管理集成测试

### 1. Store 集成测试

```typescript
// src/store/__tests__/todo-store.integration.test.ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTodoStore } from '../todos'
import { server } from '@/test-utils/api-mocks'

describe('Todo Store Integration', () => {
  beforeAll(() => server.listen())
  afterEach(() => {
    server.resetHandlers()
    // 重置 store 状态
    useTodoStore.getState().reset()
  })
  afterAll(() => server.close())

  it('应该完成完整的 CRUD 流程', async () => {
    const { result } = renderHook(() => useTodoStore())

    // 1. 获取初始数据
    await act(async () => {
      await result.current.fetchTodos()
    })

    expect(result.current.todos).toHaveLength(2)
    expect(result.current.loading).toBe(false)

    // 2. 添加新 todo
    await act(async () => {
      await result.current.addTodo({
        title: '新任务',
        user_id: 'user-123',
      })
    })

    expect(result.current.todos).toHaveLength(3)
    expect(result.current.todos[0].title).toBe('新任务')

    // 3. 更新 todo
    const todoToUpdate = result.current.todos[0]
    await act(async () => {
      await result.current.updateTodo(todoToUpdate.id, {
        title: '更新的任务',
        completed: true,
      })
    })

    const updatedTodo = result.current.todos.find(t => t.id === todoToUpdate.id)
    expect(updatedTodo?.title).toBe('更新的任务')
    expect(updatedTodo?.completed).toBe(true)

    // 4. 删除 todo
    await act(async () => {
      await result.current.deleteTodo(todoToUpdate.id)
    })

    expect(result.current.todos).toHaveLength(2)
    expect(result.current.todos.find(t => t.id === todoToUpdate.id)).toBeUndefined()
  })

  it('应该正确处理过滤和搜索', async () => {
    const { result } = renderHook(() => useTodoStore())

    // 获取初始数据
    await act(async () => {
      await result.current.fetchTodos()
    })

    // 1. 测试过滤
    act(() => {
      result.current.setFilter('completed')
    })

    const completedTodos = result.current.filteredTodos()
    expect(completedTodos.every(todo => todo.completed)).toBe(true)

    // 2. 测试搜索
    act(() => {
      result.current.setFilter('all')
      result.current.setSearch('任务 1')
    })

    const searchResults = result.current.filteredTodos()
    expect(searchResults.every(todo => 
      todo.title.includes('任务 1')
    )).toBe(true)
  })
})
```

## 🤔 思考题

1. 如何确定集成测试的边界和范围？
2. 如何处理集成测试中的异步操作？
3. 如何模拟复杂的用户交互场景？
4. 如何平衡集成测试的覆盖率和执行时间？

## 📚 扩展阅读

- [Testing Library 最佳实践](https://testing-library.com/docs/guiding-principles/)
- [集成测试策略](https://martinfowler.com/bliki/IntegrationTest.html)
- [MSW API 模拟](https://mswjs.io/docs/)
- [React 测试模式](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🔗 下一步

完成集成测试后，下一章我们将学习生产环境配置。

[下一章：生产配置 →](./21-production-config.md)
