# 13 - 搜索过滤

本章将详细介绍如何实现高效的搜索和过滤功能，提升用户查找和管理任务的体验。

## 🎯 学习目标

- 掌握全文搜索的实现方法
- 学会设计灵活的过滤系统
- 了解搜索性能优化技巧
- 掌握搜索结果的高亮显示

## 🔍 搜索功能实现

### 1. 搜索组件

```typescript
// src/components/todo/todo-search.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Filter } from 'lucide-react'

interface TodoSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  showFilterButton?: boolean
  onFilterClick?: () => void
}

export function TodoSearch({
  value,
  onChange,
  onClear,
  placeholder = "搜索任务...",
  showFilterButton = true,
  onFilterClick,
}: TodoSearchProps) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)

  useEffect(() => {
    onChange(debouncedValue)
  }, [debouncedValue, onChange])

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = () => {
    setLocalValue('')
    onClear()
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            localValue && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )
          }
          className="pr-10"
        />
      </div>
      
      {showFilterButton && (
        <Button
          variant="outline"
          size="icon"
          onClick={onFilterClick}
          aria-label="打开过滤器"
        >
          <Filter className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
```

### 2. 高级过滤器

```typescript
// src/components/todo/todo-filters.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Calendar, Tag, Clock, CheckCircle, X } from 'lucide-react'
import type { TodoFilter, PriorityLevel, TodoStatus } from '@/types'

interface TodoFiltersProps {
  filters: TodoFilter
  onFiltersChange: (filters: TodoFilter) => void
  onClose?: () => void
}

export function TodoFilters({ filters, onFiltersChange, onClose }: TodoFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TodoFilter>(filters)

  const handleApply = () => {
    onFiltersChange(localFilters)
    onClose?.()
  }

  const handleReset = () => {
    const resetFilters: TodoFilter = {
      status: [],
      priority: [],
      tags: [],
      dateRange: undefined,
      search: '',
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const statusOptions = [
    { value: 'active', label: '进行中', icon: Clock },
    { value: 'completed', label: '已完成', icon: CheckCircle },
  ]

  const priorityOptions = [
    { value: 'low', label: '低优先级', color: 'text-green-600' },
    { value: 'medium', label: '中优先级', color: 'text-yellow-600' },
    { value: 'high', label: '高优先级', color: 'text-red-600' },
  ]

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">过滤器</CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 状态过滤 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            任务状态
          </h4>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={localFilters.status?.includes(option.value as TodoStatus) || false}
                  onChange={(checked) => {
                    const newStatus = checked
                      ? [...(localFilters.status || []), option.value as TodoStatus]
                      : (localFilters.status || []).filter(s => s !== option.value)
                    setLocalFilters({ ...localFilters, status: newStatus })
                  }}
                />
                <option.icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 优先级过滤 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            优先级
          </h4>
          <div className="space-y-2">
            {priorityOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  checked={localFilters.priority?.includes(option.value as PriorityLevel) || false}
                  onChange={(checked) => {
                    const newPriority = checked
                      ? [...(localFilters.priority || []), option.value as PriorityLevel]
                      : (localFilters.priority || []).filter(p => p !== option.value)
                    setLocalFilters({ ...localFilters, priority: newPriority })
                  }}
                />
                <span className={`text-sm ${option.color}`}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 日期范围过滤 */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            创建日期
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="开始日期"
              value={localFilters.dateRange?.start?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const startDate = e.target.value ? new Date(e.target.value) : undefined
                setLocalFilters({
                  ...localFilters,
                  dateRange: {
                    start: startDate,
                    end: localFilters.dateRange?.end,
                  }
                })
              }}
            />
            <Input
              type="date"
              placeholder="结束日期"
              value={localFilters.dateRange?.end?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                const endDate = e.target.value ? new Date(e.target.value) : undefined
                setLocalFilters({
                  ...localFilters,
                  dateRange: {
                    start: localFilters.dateRange?.start,
                    end: endDate,
                  }
                })
              }}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleApply} className="flex-1">
            应用过滤器
          </Button>
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 3. 搜索逻辑实现

```typescript
// src/lib/search.ts
import type { Todo, TodoFilter } from '@/types'

export interface SearchOptions {
  caseSensitive?: boolean
  exactMatch?: boolean
  searchFields?: (keyof Todo)[]
}

export function searchTodos(
  todos: Todo[],
  query: string,
  options: SearchOptions = {}
): Todo[] {
  if (!query.trim()) return todos

  const {
    caseSensitive = false,
    exactMatch = false,
    searchFields = ['title', 'description']
  } = options

  const normalizedQuery = caseSensitive ? query : query.toLowerCase()

  return todos.filter(todo => {
    return searchFields.some(field => {
      const fieldValue = todo[field]
      if (!fieldValue) return false

      const normalizedValue = caseSensitive 
        ? String(fieldValue) 
        : String(fieldValue).toLowerCase()

      return exactMatch
        ? normalizedValue === normalizedQuery
        : normalizedValue.includes(normalizedQuery)
    })
  })
}

export function filterTodos(todos: Todo[], filters: TodoFilter): Todo[] {
  let filtered = [...todos]

  // 状态过滤
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(todo => {
      if (filters.status!.includes('active')) {
        return !todo.completed
      }
      if (filters.status!.includes('completed')) {
        return todo.completed
      }
      return false
    })
  }

  // 优先级过滤
  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(todo => 
      filters.priority!.includes(todo.priority as any)
    )
  }

  // 日期范围过滤
  if (filters.dateRange) {
    const { start, end } = filters.dateRange
    filtered = filtered.filter(todo => {
      const todoDate = new Date(todo.created_at)
      if (start && todoDate < start) return false
      if (end && todoDate > end) return false
      return true
    })
  }

  // 标签过滤
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(todo =>
      filters.tags!.some(tag => todo.tags?.includes(tag))
    )
  }

  return filtered
}

export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>')
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
```

### 4. 搜索结果高亮

```typescript
// src/components/todo/highlighted-text.tsx
'use client'

import { useMemo } from 'react'

interface HighlightedTextProps {
  text: string
  searchTerm: string
  className?: string
}

export function HighlightedText({ text, searchTerm, className }: HighlightedTextProps) {
  const highlightedText = useMemo(() => {
    if (!searchTerm.trim()) return text

    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) => {
      const isMatch = regex.test(part)
      return isMatch ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    })
  }, [text, searchTerm])

  return <span className={className}>{highlightedText}</span>
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
```

## 🔧 性能优化

### 1. 防抖搜索

```typescript
// src/hooks/use-debounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### 2. 虚拟化长列表

```typescript
// src/components/todo/virtualized-todo-list.tsx
'use client'

import { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { TodoItem } from './todo-item'
import type { Todo, TodoUpdate } from '@/types'

interface VirtualizedTodoListProps {
  todos: Todo[]
  height: number
  itemHeight: number
  onUpdate: (id: string, updates: TodoUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function VirtualizedTodoList({
  todos,
  height,
  itemHeight,
  onUpdate,
  onDelete,
}: VirtualizedTodoListProps) {
  const ItemRenderer = useMemo(() => {
    return ({ index, style }: { index: number; style: React.CSSProperties }) => (
      <div style={style}>
        <TodoItem
          todo={todos[index]}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    )
  }, [todos, onUpdate, onDelete])

  if (todos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        没有找到匹配的任务
      </div>
    )
  }

  return (
    <List
      height={height}
      itemCount={todos.length}
      itemSize={itemHeight}
      itemData={todos}
    >
      {ItemRenderer}
    </List>
  )
}
```

### 3. 搜索索引

```typescript
// src/lib/search-index.ts
import Fuse from 'fuse.js'
import type { Todo } from '@/types'

export class TodoSearchIndex {
  private fuse: Fuse<Todo>

  constructor(todos: Todo[]) {
    this.fuse = new Fuse(todos, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.3 },
      ],
      threshold: 0.3, // 模糊匹配阈值
      includeScore: true,
      includeMatches: true,
    })
  }

  search(query: string): Array<{ item: Todo; score?: number; matches?: any[] }> {
    if (!query.trim()) return []
    return this.fuse.search(query)
  }

  updateIndex(todos: Todo[]) {
    this.fuse.setCollection(todos)
  }
}

// 使用示例
export function useFuzzySearch(todos: Todo[]) {
  const [searchIndex, setSearchIndex] = useState<TodoSearchIndex | null>(null)

  useEffect(() => {
    setSearchIndex(new TodoSearchIndex(todos))
  }, [todos])

  const search = useCallback((query: string) => {
    if (!searchIndex) return []
    return searchIndex.search(query).map(result => result.item)
  }, [searchIndex])

  return { search }
}
```

## 📊 搜索分析

### 1. 搜索统计

```typescript
// src/hooks/use-search-analytics.ts
import { useState, useEffect } from 'react'

interface SearchAnalytics {
  totalSearches: number
  popularQueries: Array<{ query: string; count: number }>
  averageResultCount: number
  noResultQueries: string[]
}

export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    popularQueries: [],
    averageResultCount: 0,
    noResultQueries: [],
  })

  const trackSearch = (query: string, resultCount: number) => {
    setAnalytics(prev => {
      const newTotalSearches = prev.totalSearches + 1
      const newAverageResultCount = 
        (prev.averageResultCount * prev.totalSearches + resultCount) / newTotalSearches

      // 更新热门查询
      const existingQuery = prev.popularQueries.find(q => q.query === query)
      const newPopularQueries = existingQuery
        ? prev.popularQueries.map(q => 
            q.query === query ? { ...q, count: q.count + 1 } : q
          )
        : [...prev.popularQueries, { query, count: 1 }]

      // 记录无结果查询
      const newNoResultQueries = resultCount === 0 && !prev.noResultQueries.includes(query)
        ? [...prev.noResultQueries, query]
        : prev.noResultQueries

      return {
        totalSearches: newTotalSearches,
        popularQueries: newPopularQueries.sort((a, b) => b.count - a.count).slice(0, 10),
        averageResultCount: newAverageResultCount,
        noResultQueries: newNoResultQueries,
      }
    })
  }

  return { analytics, trackSearch }
}
```

## 🤔 思考题

1. 如何实现更智能的搜索建议？
2. 如何处理大量数据的搜索性能问题？
3. 如何实现搜索历史和收藏功能？
4. 如何设计多语言搜索支持？

## 📚 扩展阅读

- [Fuse.js 模糊搜索库](https://fusejs.io/)
- [React Window 虚拟化](https://react-window.vercel.app/)
- [搜索 UX 最佳实践](https://www.nngroup.com/articles/search-interface/)
- [全文搜索算法](https://en.wikipedia.org/wiki/Full-text_search)

## 🔗 下一步

完成搜索过滤功能后，下一章我们将实现错误处理机制。

[下一章：错误处理 →](./14-error-handling.md)
