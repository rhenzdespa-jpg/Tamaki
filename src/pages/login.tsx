import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/lib/auth'
import { FcGoogle } from 'react-icons/fc'
import { MdFavorite } from 'react-icons/md'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-6xl animate-bounce">💕</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 via-cream to-lavender/30 px-4 relative overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute top-10 left-10 text-4xl animate-float opacity-60">🌸</div>
      <div className="absolute top-20 right-8 text-3xl animate-float opacity-60" style={{animationDelay: '0.5s'}}>✨</div>
      <div className="absolute bottom-20 left-8 text-3xl animate-float opacity-60" style={{animationDelay: '1s'}}>🎀</div>
      <div className="absolute bottom-32 right-12 text-4xl animate-float opacity-60" style={{animationDelay: '1.5s'}}>💖</div>
      <div className="absolute top-1/2 left-4 text-2xl animate-float opacity-40" style={{animationDelay: '0.8s'}}>⭐</div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Logo / Tamagotchi Character */}
        <div className="mb-6">
          <div className="inline-block">
            <TamaCharacterSVG mood="happy" size={140} />
          </div>
        </div>

        {/* App name */}
        <h1 className="font-display text-5xl text-bubblegum mb-2 drop-shadow-sm">
          Tamakita! 💕
        </h1>
        <p className="text-pink-400 font-bold text-lg mb-1">
          Mahal kita, pero 20 lang pera ko
        </p>
        <p className="text-gray-400 text-sm font-medium mb-10">
          Your cute couple app for budget dates 🍜
        </p>

        {/* Features preview */}
        <div className="flex gap-3 justify-center mb-8 flex-wrap">
          {[
            { icon: '📓', label: 'Couple Journal' },
            { icon: '📍', label: 'Cheap Food Spots' },
            { icon: '🗓️', label: 'Date Planner' },
            { icon: '🐾', label: 'Pet Tamagotchi' },
          ].map((f) => (
            <div key={f.label} className="bg-white/70 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center gap-1.5 shadow-sm border border-pink-100">
              <span className="text-lg">{f.icon}</span>
              <span className="text-xs font-bold text-gray-600">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Google Sign In */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={signInWithGoogle}
          className="w-full max-w-xs bg-white text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-soft flex items-center justify-center gap-3 border-2 border-pink-100 hover:border-bubblegum transition-all duration-200 mx-auto"
        >
          <FcGoogle size={24} />
          <span className="font-display text-lg">Sign in with Google</span>
        </motion.button>

        <p className="text-gray-400 text-xs mt-4 font-medium">
          Free forever 💸 No hidden fees!
        </p>
      </motion.div>
    </div>
  )
}

// Inline Tamagotchi SVG for login page
function TamaCharacterSVG({ mood, size = 120 }: { mood: string; size?: number }) {
  const eyeExpression = mood === 'happy' ? 'arc' : mood === 'love' ? 'heart' : 'normal'

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="60" cy="72" rx="38" ry="36" fill="#FFF3C4" />
      {/* Head */}
      <ellipse cx="60" cy="50" rx="32" ry="30" fill="#FFF3C4" />
      {/* Hair/Top */}
      <ellipse cx="60" cy="25" rx="18" ry="14" fill="#4A90D9" />
      <ellipse cx="52" cy="20" rx="8" ry="6" fill="#4A90D9" />
      <ellipse cx="68" cy="20" rx="8" ry="6" fill="#4A90D9" />
      {/* Cheeks */}
      <ellipse cx="45" cy="55" rx="7" ry="5" fill="#FFB3CC" opacity="0.7" />
      <ellipse cx="75" cy="55" rx="7" ry="5" fill="#FFB3CC" opacity="0.7" />
      {/* Eyes */}
      {eyeExpression === 'arc' ? (
        <>
          <path d="M50 48 Q54 44 58 48" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M62 48 Q66 44 70 48" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="54" cy="48" r="5" fill="#333" />
          <circle cx="66" cy="48" r="5" fill="#333" />
          <circle cx="56" cy="46" r="1.5" fill="white" />
          <circle cx="68" cy="46" r="1.5" fill="white" />
        </>
      )}
      {/* Smile */}
      <path d="M52 60 Q60 67 68 60" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Hearts */}
      <text x="85" y="35" fontSize="12" fill="#FF6B9D">♥</text>
      <text x="18" y="40" fontSize="10" fill="#FF6B9D">♥</text>
      {/* Feet */}
      <ellipse cx="47" cy="105" rx="10" ry="7" fill="#4A90D9" />
      <ellipse cx="73" cy="105" rx="10" ry="7" fill="#4A90D9" />
    </svg>
  )
}
