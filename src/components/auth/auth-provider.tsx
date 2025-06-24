'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { createClient } from '@/lib/supabase/client'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialize, initialized, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    if (!initialized) {
      initialize()

      // 设置认证状态监听
      const supabase = createClient()
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [initialize, initialized, setUser, setLoading])

  return <>{children}</>
}
