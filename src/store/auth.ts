import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,

  signIn: async (email: string, password: string) => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      set({ user: data.user, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string) => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      set({ user: data.user, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    const supabase = createClient()
    set({ loading: true })

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }

      set({ user: null, loading: false })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  initialize: async () => {
    const supabase = createClient()

    try {
      // 获取当前会话
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
      }

      set({
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      })

      // 监听认证状态变化
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        set({
          user: session?.user ?? null,
          loading: false,
        })
      })

      // 注意：这里不能返回 unsubscribe 函数，因为接口定义返回 void
      // 实际的 unsubscribe 应该在组件的 useEffect cleanup 中处理
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false, initialized: true })
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },
}))
