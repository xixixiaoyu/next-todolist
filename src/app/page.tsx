'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useTodoStore } from '@/store/todos'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Header } from '@/components/layout/header'
import { TodoForm } from '@/components/todo/todo-form'
import { TodoList } from '@/components/todo/todo-list'
import { TodoFilters } from '@/components/todo/todo-filters'
import { getErrorMessage } from '@/lib/utils'
import { useToastActions } from '@/components/ui/toast'
import type { TodoFormData } from '@/lib/validations'

export default function Home() {
  const { user } = useAuthStore()
  const {
    todos,
    loading,
    filter,
    sort,
    order,
    search,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    setFilter,
    setSort,
    setSearch,
    filteredTodos,
    subscribeToTodos,
  } = useTodoStore()

  const [error, setError] = useState<string>('')
  const toast = useToastActions()

  // 初始化数据和实时订阅
  useEffect(() => {
    if (user) {
      fetchTodos().catch((err) => {
        setError(getErrorMessage(err))
      })

      // 设置实时订阅
      const unsubscribe = subscribeToTodos()
      return unsubscribe
    }
  }, [user, fetchTodos, subscribeToTodos])

  const handleAddTodo = async (data: TodoFormData) => {
    if (!user) return

    try {
      setError('')
      await addTodo({
        title: data.title,
        description: data.description || null,
        user_id: user.id,
      })
      toast.success('任务添加成功', '新任务已添加到您的列表中')
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      toast.error('添加任务失败', errorMessage)
      throw err
    }
  }

  const handleUpdateTodo = async (id: string, updates: any) => {
    try {
      setError('')
      await updateTodo(id, updates)
      toast.success('任务更新成功', '任务信息已保存')
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      toast.error('更新任务失败', errorMessage)
      throw err
    }
  }

  const handleDeleteTodo = async (id: string) => {
    try {
      setError('')
      await deleteTodo(id)
      toast.success('任务删除成功', '任务已从列表中移除')
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      toast.error('删除任务失败', errorMessage)
      throw err
    }
  }

  const filtered = filteredTodos()
  const activeCount = todos.filter((todo) => !todo.completed).length
  const completedCount = todos.filter((todo) => todo.completed).length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <Header />

          {error && (
            <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：添加任务表单和过滤器 */}
            <div className="lg:col-span-1 space-y-6">
              <TodoForm onSubmit={handleAddTodo} />

              <TodoFilters
                filter={filter}
                sort={sort}
                order={order}
                search={search}
                onFilterChange={setFilter}
                onSortChange={setSort}
                onSearchChange={setSearch}
                totalCount={todos.length}
                activeCount={activeCount}
                completedCount={completedCount}
              />
            </div>

            {/* 右侧：任务列表 */}
            <div className="lg:col-span-2">
              <TodoList
                todos={filtered}
                loading={loading}
                onUpdate={handleUpdateTodo}
                onDelete={handleDeleteTodo}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
