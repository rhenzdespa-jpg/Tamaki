import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/')
      } else {
        router.push('/login')
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">💕</div>
        <p className="font-display text-bubblegum text-xl">Logging you in...</p>
      </div>
    </div>
  )
}
