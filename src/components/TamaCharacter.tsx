import { motion } from 'framer-motion'

type TamaProps = {
  mood?: string
  size?: number
  isAnimated?: boolean
  className?: string
}

export function TamaCharacter({ mood = 'happy', size = 120, isAnimated = true, className = '' }: TamaProps) {
  const getEyes = () => {
    switch (mood) {
      case 'happy':
        return (
          <>
            <path d="M47 47 Q52 42 57 47" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M63 47 Q68 42 73 47" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )
      case 'love':
        return (
          <>
            <text x="44" y="52" fontSize="14" fill="#FF6B9D">♥</text>
            <text x="62" y="52" fontSize="14" fill="#FF6B9D">♥</text>
          </>
        )
      case 'sleeping':
        return (
          <>
            <path d="M47 47 Q52 50 57 47" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M63 47 Q68 50 73 47" stroke="#333" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )
      case 'sad':
        return (
          <>
            <circle cx="52" cy="48" r="5" fill="#333" />
            <circle cx="68" cy="48" r="5" fill="#333" />
            <circle cx="54" cy="46" r="1.5" fill="white" />
            <circle cx="70" cy="46" r="1.5" fill="white" />
          </>
        )
      default:
        return (
          <>
            <circle cx="52" cy="48" r="5" fill="#333" />
            <circle cx="68" cy="48" r="5" fill="#333" />
            <circle cx="54" cy="46" r="1.5" fill="white" />
            <circle cx="70" cy="46" r="1.5" fill="white" />
          </>
        )
    }
  }

  const getMouth = () => {
    switch (mood) {
      case 'happy':
        return <path d="M52 60 Q60 67 68 60" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      case 'sleeping':
        return <path d="M55 63 Q60 63 65 63" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      case 'sad':
        return <path d="M52 64 Q60 58 68 64" stroke="#666" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      case 'love':
        return <path d="M52 60 Q60 67 68 60" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      default:
        return <path d="M52 60 Q60 65 68 60" stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    }
  }

  const getExtras = () => {
    switch (mood) {
      case 'sleeping':
        return (
          <>
            <text x="78" y="30" fontSize="10" fill="#A0AEC0">z</text>
            <text x="88" y="22" fontSize="14" fill="#A0AEC0">z</text>
          </>
        )
      case 'love':
        return (
          <>
            <text x="88" y="28" fontSize="12" fill="#FF6B9D">♥</text>
            <text x="18" y="35" fontSize="10" fill="#FF6B9D">♥</text>
          </>
        )
      case 'happy':
        return (
          <>
            <text x="88" y="32" fontSize="10" fill="#FF6B9D">✨</text>
          </>
        )
      default:
        return null
    }
  }

  const characterSVG = (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <ellipse cx="60" cy="76" rx="36" ry="34" fill="#FFF3C4" />
      {/* Head */}
      <ellipse cx="60" cy="50" rx="32" ry="30" fill="#FFF3C4" />
      {/* Hair/Top - Blue */}
      <ellipse cx="60" cy="24" rx="20" ry="16" fill="#4A90D9" />
      <ellipse cx="50" cy="19" rx="10" ry="8" fill="#4A90D9" />
      <ellipse cx="70" cy="19" rx="10" ry="8" fill="#4A90D9" />
      {/* Hair highlight */}
      <ellipse cx="55" cy="18" rx="4" ry="3" fill="#6BB3F0" opacity="0.5" />
      {/* Cheeks */}
      <ellipse cx="43" cy="57" rx="7" ry="5" fill="#FFB3CC" opacity="0.7" />
      <ellipse cx="77" cy="57" rx="7" ry="5" fill="#FFB3CC" opacity="0.7" />
      {/* Eyes */}
      {getEyes()}
      {/* Mouth */}
      {getMouth()}
      {/* Extras (hearts, stars, etc) */}
      {getExtras()}
      {/* Feet */}
      <ellipse cx="46" cy="108" rx="11" ry="8" fill="#4A90D9" />
      <ellipse cx="74" cy="108" rx="11" ry="8" fill="#4A90D9" />
      {/* Tiny highlight on body */}
      <ellipse cx="52" cy="70" rx="6" ry="4" fill="white" opacity="0.3" />
    </svg>
  )

  if (!isAnimated) return <div className={className}>{characterSVG}</div>

  return (
    <motion.div
      className={`tama-body ${className}`}
      animate={
        mood === 'sleeping'
          ? { y: [0, 3, 0] }
          : mood === 'happy' || mood === 'love'
          ? { y: [0, -8, 0], rotate: [-2, 2, -2] }
          : { y: [0, -4, 0] }
      }
      transition={{
        duration: mood === 'sleeping' ? 3 : 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {characterSVG}
    </motion.div>
  )
}

export function TamaStatusBar({ value, color, label }: { value: number; color: string; label: string }) {
  const getStatusIcon = (label: string) => {
    switch (label) {
      case 'Hungry': return '🍜'
      case 'Happy': return '😊'
      case 'Energy': return '⚡'
      case 'Clean': return '🛁'
      default: return '❤️'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-base">{getStatusIcon(label)}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs font-bold text-gray-500">{label}</span>
          <span className="text-xs font-bold" style={{ color }}>{value}%</span>
        </div>
        <div className="status-bar">
          <motion.div
            className="status-fill"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}
