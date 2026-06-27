import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/auth'
import { BottomNav } from './BottomNav'

type LayoutProps = {
  children: ReactNode
  title?: string
  showBack?: boolean
}

export function Layout({ children, title, showBack = false }: LayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">💕</div>
          <p className="font-display text-bubblegum text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-cream">
      {title && (
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 py-3">
          <div className="max-w-md mx-auto flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center text-bubblegum hover:bg-pink-100 transition-colors"
              >
                ←
              </button>
            )}
            <h1 className="font-display text-xl text-bubblegum">{title}</h1>
          </div>
        </header>
      )}

      <main className="max-w-md mx-auto px-4 pt-4 main-content">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
