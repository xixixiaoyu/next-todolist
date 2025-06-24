import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { code?: string; error?: string }
}) {
  const { code, error } = searchParams

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">认证失败</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/auth"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            返回登录页面
          </a>
        </div>
      </div>
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">认证失败</h1>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <a
              href="/auth"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              返回登录页面
            </a>
          </div>
        </div>
      )
    }

    // 认证成功，重定向到首页
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
}
