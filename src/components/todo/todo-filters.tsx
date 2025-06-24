'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react'
import type { TodoFilter, TodoSort, SortOrder } from '@/types'

interface TodoFiltersProps {
  filter: TodoFilter
  sort: TodoSort
  order: SortOrder
  search: string
  onFilterChange: (filter: TodoFilter) => void
  onSortChange: (sort: TodoSort, order?: SortOrder) => void
  onSearchChange: (search: string) => void
  totalCount: number
  activeCount: number
  completedCount: number
}

export function TodoFilters({
  filter,
  sort,
  order,
  search,
  onFilterChange,
  onSortChange,
  onSearchChange,
  totalCount,
  activeCount,
  completedCount,
}: TodoFiltersProps) {
  const handleSortClick = (newSort: TodoSort) => {
    if (sort === newSort) {
      // 如果点击的是当前排序字段，切换排序方向
      onSortChange(newSort, order === 'asc' ? 'desc' : 'asc')
    } else {
      // 如果点击的是新的排序字段，使用默认方向
      onSortChange(newSort, 'desc')
    }
  }

  const getSortIcon = (sortField: TodoSort) => {
    if (sort !== sortField) {
      return <SortDesc className="h-4 w-4 opacity-50" />
    }
    return order === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    )
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索任务..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 过滤器 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">过滤</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('all')}
            >
              全部 ({totalCount})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('active')}
            >
              进行中 ({activeCount})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange('completed')}
            >
              已完成 ({completedCount})
            </Button>
          </div>
        </div>

        {/* 排序 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SortDesc className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">排序</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={sort === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortClick('created_at')}
              className="flex items-center gap-1"
            >
              创建时间
              {getSortIcon('created_at')}
            </Button>
            <Button
              variant={sort === 'updated_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortClick('updated_at')}
              className="flex items-center gap-1"
            >
              更新时间
              {getSortIcon('updated_at')}
            </Button>
            <Button
              variant={sort === 'title' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSortClick('title')}
              className="flex items-center gap-1"
            >
              标题
              {getSortIcon('title')}
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>总任务数：{totalCount}</div>
            <div>进行中：{activeCount} | 已完成：{completedCount}</div>
            {totalCount > 0 && (
              <div>完成率：{Math.round((completedCount / totalCount) * 100)}%</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
