import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { MdHome, MdMenuBook, MdMap, MdFavorite, MdCalendarMonth } from 'react-icons/md'

const navItems = [
  { icon: MdHome, label: 'Home', path: '/' },
  { icon: MdMenuBook, label: 'Journal', path: '/journal' },
  { icon: MdMap, label: 'Food Map', path: '/map' },
  { icon: MdCalendarMonth, label: 'Dates', path: '/dates' },
  { icon: MdFavorite, label: 'Profile', path: '/profile' },
]

export function BottomNav() {
  const router = useRouter()
  const currentPath = router.pathname

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t-2 border-pink-100 z-50">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex justify-around items-center">
          {navItems.map(({ icon: Icon, label, path }) => {
            const isActive = currentPath === path

            return (
              <button
                key={path}
                onClick={() => router.push(path)}
                className={`nav-item ${isActive ? 'active' : 'text-gray-400 hover:text-pink-300'}`}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-pink-50 rounded-xl -m-1"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                    />
                  )}
                  <Icon
                    size={24}
                    className={`relative z-10 ${isActive ? 'text-bubblegum' : ''}`}
                  />
                </motion.div>
                <span className={isActive ? 'text-bubblegum' : ''}>{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
