import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Todo, TodoInsert, TodoUpdate, TodoFilter, TodoSort, SortOrder } from '@/types'

interface TodoState {
  todos: Todo[]
  loading: boolean
  filter: TodoFilter
  sort: TodoSort
  order: SortOrder
  search: string

  // Actions
  fetchTodos: () => Promise<void>
  addTodo: (todo: TodoInsert) => Promise<void>
  updateTodo: (id: string, updates: TodoUpdate) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>

  // Filters and sorting
  setFilter: (filter: TodoFilter) => void
  setSort: (sort: TodoSort, order?: SortOrder) => void
  setSearch: (search: string) => void

  // Computed
  filteredTodos: () => Todo[]

  // Real-time subscription
  subscribeToTodos: () => () => void
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  loading: false,
  filter: 'all',
  sort: 'created_at',
  order: 'desc',
  search: '',

  fetchTodos: async () => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching todos:', error)
        throw new Error(`获取任务失败: ${error.message}`)
      }

      set({ todos: data || [], loading: false })
    } catch (error) {
      console.error('Error fetching todos:', error)
      set({ loading: false })
      throw error
    }
  },

  addTodo: async (todo: TodoInsert) => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from('todos').insert([todo]).select().single()

      if (error) {
        throw error
      }

      set((state) => ({
        todos: [data, ...state.todos],
      }))
    } catch (error) {
      console.error('Error adding todo:', error)
      throw error
    }
  },

  updateTodo: async (id: string, updates: TodoUpdate) => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      set((state) => ({
        todos: state.todos.map((todo) => (todo.id === id ? data : todo)),
      }))
    } catch (error) {
      console.error('Error updating todo:', error)
      throw error
    }
  },

  deleteTodo: async (id: string) => {
    const supabase = createClient()

    try {
      const { error } = await supabase.from('todos').delete().eq('id', id)

      if (error) {
        throw error
      }

      set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      }))
    } catch (error) {
      console.error('Error deleting todo:', error)
      throw error
    }
  },

  toggleTodo: async (id: string) => {
    const todo = get().todos.find((t) => t.id === id)
    if (!todo) return

    await get().updateTodo(id, { completed: !todo.completed })
  },

  setFilter: (filter: TodoFilter) => {
    set({ filter })
  },

  setSort: (sort: TodoSort, order: SortOrder = 'desc') => {
    set({ sort, order })
  },

  setSearch: (search: string) => {
    set({ search })
  },

  filteredTodos: () => {
    const { todos, filter, sort, order, search } = get()

    let filtered = todos

    // 应用搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(searchLower) ||
          (todo.description && todo.description.toLowerCase().includes(searchLower))
      )
    }

    // 应用状态过滤
    switch (filter) {
      case 'active':
        filtered = filtered.filter((todo) => !todo.completed)
        break
      case 'completed':
        filtered = filtered.filter((todo) => todo.completed)
        break
      default:
        // 'all' - 不过滤
        break
    }

    // 应用排序
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sort) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        default: // 'created_at'
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  },

  subscribeToTodos: () => {
    const supabase = createClient()

    const subscription = supabase
      .channel('todos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          set((state) => {
            switch (eventType) {
              case 'INSERT':
                return {
                  todos: [newRecord as Todo, ...state.todos],
                }
              case 'UPDATE':
                return {
                  todos: state.todos.map((todo) =>
                    todo.id === newRecord.id ? (newRecord as Todo) : todo
                  ),
                }
              case 'DELETE':
                return {
                  todos: state.todos.filter((todo) => todo.id !== oldRecord.id),
                }
              default:
                return state
            }
          })
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  },
}))
