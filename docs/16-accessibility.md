# 16 - 可访问性

本章将详细介绍如何实现 Web 可访问性（a11y），确保应用对所有用户都友好，包括使用辅助技术的用户。

## 🎯 学习目标

- 理解 Web 可访问性的重要性和原则
- 掌握 ARIA 属性的正确使用
- 学会实现键盘导航和屏幕阅读器支持
- 了解可访问性测试方法

## ♿ 可访问性原则

### WCAG 2.1 四大原则

1. **可感知（Perceivable）** - 信息必须能被用户感知
2. **可操作（Operable）** - 界面组件必须可操作
3. **可理解（Understandable）** - 信息和操作必须可理解
4. **健壮（Robust）** - 内容必须足够健壮

## 🎨 语义化 HTML

### 1. 正确的 HTML 结构

```typescript
// src/components/accessible/semantic-todo-list.tsx
export function SemanticTodoList({ todos, onUpdate, onDelete }: TodoListProps) {
  return (
    <main role="main" aria-labelledby="todo-heading">
      <header>
        <h1 id="todo-heading">我的任务列表</h1>
        <p aria-live="polite" aria-atomic="true">
          共 {todos.length} 个任务，{todos.filter(t => t.completed).length} 个已完成
        </p>
      </header>

      <section aria-labelledby="add-todo-heading">
        <h2 id="add-todo-heading" className="sr-only">添加新任务</h2>
        <TodoForm onSubmit={handleAddTodo} />
      </section>

      <section aria-labelledby="todo-list-heading">
        <h2 id="todo-list-heading" className="sr-only">任务列表</h2>
        {todos.length === 0 ? (
          <div role="status" aria-live="polite">
            暂无任务，添加您的第一个任务开始使用吧！
          </div>
        ) : (
          <ul role="list" aria-label="任务列表">
            {todos.map((todo) => (
              <li key={todo.id} role="listitem">
                <AccessibleTodoItem
                  todo={todo}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
```

### 2. 可访问的表单

```typescript
// src/components/accessible/accessible-todo-form.tsx
export function AccessibleTodoForm({ onSubmit }: { onSubmit: (data: TodoFormData) => void }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const titleRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证逻辑
    const newErrors: Record<string, string> = {}
    if (!title.trim()) {
      newErrors.title = '任务标题不能为空'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // 聚焦到第一个错误字段
      titleRef.current?.focus()
      return
    }

    try {
      await onSubmit({ title, description })
      // 成功后的处理
    } catch (error) {
      setErrors({ submit: '提交失败，请重试' })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset>
        <legend className="sr-only">添加新任务</legend>
        
        <div className="form-group">
          <label htmlFor="todo-title" className="required">
            任务标题
            <span aria-label="必填" className="text-red-500">*</span>
          </label>
          <input
            ref={titleRef}
            id="todo-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-required="true"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : 'title-help'}
            className={errors.title ? 'error' : ''}
          />
          <div id="title-help" className="help-text">
            输入您要完成的任务标题
          </div>
          {errors.title && (
            <div
              id="title-error"
              role="alert"
              aria-live="polite"
              className="error-message"
            >
              {errors.title}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="todo-description">任务描述</label>
          <textarea
            id="todo-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby="description-help"
            rows={3}
          />
          <div id="description-help" className="help-text">
            可选：添加任务的详细描述
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-describedby={errors.submit ? 'submit-error' : undefined}
        >
          {loading ? (
            <>
              <span aria-hidden="true">⏳</span>
              <span className="sr-only">正在添加任务</span>
              添加中...
            </>
          ) : (
            '添加任务'
          )}
        </button>

        {errors.submit && (
          <div
            id="submit-error"
            role="alert"
            aria-live="assertive"
            className="error-message"
          >
            {errors.submit}
          </div>
        )}
      </fieldset>
    </form>
  )
}
```

## ⌨️ 键盘导航

### 1. 键盘事件处理

```typescript
// src/hooks/use-keyboard-navigation.ts
export function useKeyboardNavigation(items: any[], onSelect: (index: number) => void) {
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1))
        break
      
      case 'ArrowUp':
        event.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      
      case 'Home':
        event.preventDefault()
        setFocusedIndex(0)
        break
      
      case 'End':
        event.preventDefault()
        setFocusedIndex(items.length - 1)
        break
      
      case 'Enter':
      case ' ':
        event.preventDefault()
        onSelect(focusedIndex)
        break
      
      case 'Escape':
        event.preventDefault()
        // 处理退出逻辑
        break
    }
  }, [items.length, focusedIndex, onSelect])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { focusedIndex, setFocusedIndex }
}
```

### 2. 可访问的下拉菜单

```typescript
// src/components/accessible/accessible-dropdown.tsx
export function AccessibleDropdown({
  trigger,
  children,
  onOpenChange,
}: {
  trigger: React.ReactNode
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return

    switch (event.key) {
      case 'Escape':
        setIsOpen(false)
        triggerRef.current?.focus()
        break
      
      case 'Tab':
        // 处理 Tab 键导航
        if (!menuRef.current?.contains(event.target as Node)) {
          setIsOpen(false)
        }
        break
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // 聚焦到菜单的第一个可聚焦元素
      const firstFocusable = menuRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      firstFocusable?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? 'dropdown-menu' : undefined}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          id="dropdown-menu"
          role="menu"
          aria-orientation="vertical"
          className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  )
}
```

## 🔊 屏幕阅读器支持

### 1. ARIA 属性

```typescript
// src/components/accessible/accessible-todo-item.tsx
export function AccessibleTodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  const handleToggleComplete = async () => {
    const newCompleted = !todo.completed
    await onUpdate(todo.id, { completed: newCompleted })
    
    // 为屏幕阅读器提供反馈
    setAnnouncement(
      newCompleted 
        ? `任务"${todo.title}"已标记为完成` 
        : `任务"${todo.title}"已标记为未完成`
    )
  }

  const handleDelete = async () => {
    if (window.confirm(`确定要删除任务"${todo.title}"吗？`)) {
      await onDelete(todo.id)
      setAnnouncement(`任务"${todo.title}"已删除`)
    }
  }

  return (
    <article
      className="todo-item"
      aria-labelledby={`todo-title-${todo.id}`}
      aria-describedby={`todo-meta-${todo.id}`}
    >
      {/* 屏幕阅读器公告 */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="todo-content">
        <button
          onClick={handleToggleComplete}
          aria-label={`${todo.completed ? '取消完成' : '标记完成'} ${todo.title}`}
          aria-pressed={todo.completed}
          className="toggle-button"
        >
          <span aria-hidden="true">
            {todo.completed ? '✓' : '○'}
          </span>
        </button>

        <div className="todo-text">
          <h3
            id={`todo-title-${todo.id}`}
            className={todo.completed ? 'completed' : ''}
          >
            {todo.title}
          </h3>
          
          {todo.description && (
            <p className="todo-description">
              {todo.description}
            </p>
          )}

          <div id={`todo-meta-${todo.id}`} className="todo-meta">
            <span>优先级：{todo.priority}</span>
            <span>创建时间：{formatDate(todo.created_at)}</span>
            {todo.completed && (
              <span>完成时间：{formatDate(todo.updated_at)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="todo-actions" role="group" aria-label="任务操作">
        <button
          onClick={() => setIsEditing(true)}
          aria-label={`编辑任务 ${todo.title}`}
        >
          编辑
        </button>
        
        <button
          onClick={handleDelete}
          aria-label={`删除任务 ${todo.title}`}
          className="danger"
        >
          删除
        </button>
      </div>
    </article>
  )
}
```

### 2. 实时更新通知

```typescript
// src/components/accessible/live-announcer.tsx
export function LiveAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  // 全局公告函数
  useEffect(() => {
    window.announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (priority === 'assertive') {
        setAssertiveMessage(message)
        setTimeout(() => setAssertiveMessage(''), 1000)
      } else {
        setPoliteMessage(message)
        setTimeout(() => setPoliteMessage(''), 1000)
      }
    }

    return () => {
      delete window.announceToScreenReader
    }
  }, [])

  return (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </>
  )
}

// 类型声明
declare global {
  interface Window {
    announceToScreenReader?: (message: string, priority?: 'polite' | 'assertive') => void
  }
}
```

## 🎨 视觉可访问性

### 1. 颜色对比度

```css
/* src/styles/accessibility.css */

/* 确保足够的颜色对比度 */
.text-primary {
  color: #1f2937; /* 对比度 > 4.5:1 */
}

.text-secondary {
  color: #4b5563; /* 对比度 > 3:1 */
}

.button-primary {
  background-color: #2563eb;
  color: #ffffff; /* 对比度 > 4.5:1 */
}

.button-primary:hover {
  background-color: #1d4ed8;
}

.button-primary:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* 错误状态 */
.error {
  color: #dc2626; /* 对比度 > 4.5:1 */
  border-color: #dc2626;
}

/* 成功状态 */
.success {
  color: #059669; /* 对比度 > 4.5:1 */
  border-color: #059669;
}

/* 警告状态 */
.warning {
  color: #d97706; /* 对比度 > 4.5:1 */
  border-color: #d97706;
}
```

### 2. 焦点管理

```typescript
// src/hooks/use-focus-management.ts
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null)

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    const focusableElements = focusRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements || focusableElements.length === 0) return

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }, [])

  const enableFocusTrap = useCallback(() => {
    document.addEventListener('keydown', trapFocus)
  }, [trapFocus])

  const disableFocusTrap = useCallback(() => {
    document.removeEventListener('keydown', trapFocus)
  }, [trapFocus])

  return {
    focusRef,
    enableFocusTrap,
    disableFocusTrap,
  }
}
```

## 🧪 可访问性测试

### 1. 自动化测试

```typescript
// src/tests/accessibility.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { TodoList } from '@/components/todo/todo-list'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  test('TodoList should not have accessibility violations', async () => {
    const { container } = render(
      <TodoList
        todos={mockTodos}
        onUpdate={jest.fn()}
        onDelete={jest.fn()}
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('Form should be accessible', async () => {
    const { container } = render(<TodoForm onSubmit={jest.fn()} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 2. 手动测试清单

```typescript
// src/utils/accessibility-checklist.ts
export const accessibilityChecklist = {
  keyboard: [
    '所有交互元素都可以通过键盘访问',
    'Tab 键顺序符合逻辑',
    '焦点指示器清晰可见',
    'Escape 键可以关闭模态框和下拉菜单',
    '方向键可以在列表中导航',
  ],
  
  screenReader: [
    '所有图片都有适当的 alt 文本',
    '表单字段都有关联的标签',
    '错误消息通过 aria-live 区域公告',
    '页面结构使用正确的标题层级',
    '链接文本具有描述性',
  ],
  
  visual: [
    '文本和背景的对比度至少为 4.5:1',
    '不仅仅依赖颜色传达信息',
    '字体大小至少为 16px',
    '点击目标至少为 44x44px',
    '页面在 200% 缩放下仍可使用',
  ],
  
  cognitive: [
    '错误消息清晰易懂',
    '提供帮助文本和说明',
    '重要操作需要确认',
    '会话超时前有警告',
    '复杂表单分步骤进行',
  ],
}

export function runAccessibilityAudit() {
  console.group('🔍 可访问性审计')
  
  Object.entries(accessibilityChecklist).forEach(([category, items]) => {
    console.group(`📋 ${category}`)
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item}`)
    })
    console.groupEnd()
  })
  
  console.groupEnd()
}
```

## 🛠️ 可访问性工具

### 1. ESLint 插件

```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error"
  }
}
```

### 2. 开发工具

```typescript
// src/utils/dev-tools.ts
export function enableA11yDevTools() {
  if (process.env.NODE_ENV === 'development') {
    import('@axe-core/react').then(axe => {
      axe.default(React, ReactDOM, 1000)
    })
  }
}
```

## 🤔 思考题

1. 如何平衡可访问性和视觉设计？
2. 如何为不同类型的残障用户优化体验？
3. 如何在团队中推广可访问性最佳实践？
4. 如何测试复杂交互的可访问性？

## 📚 扩展阅读

- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA 最佳实践](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core 测试工具](https://github.com/dequelabs/axe-core)
- [可访问性设计模式](https://inclusive-components.design/)

## 🔗 下一步

完成可访问性实现后，下一章我们将学习响应式设计。

[下一章：响应式设计 →](./17-responsive-design.md)
