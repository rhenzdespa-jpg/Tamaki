import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { TamaCharacter, TamaStatusBar } from '@/components/TamaCharacter'
import { useTamagotchi } from '@/hooks/useTamagotchi'
import { useAuth } from '@/lib/auth'
import { supabase, Profile } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { MdRestaurant, MdSportsEsports, MdCleaningServices, MdBedtime, MdPersonAdd } from 'react-icons/md'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function HomePage() {
  const { profile, refreshProfile } = useAuth()
  const { state, loading, floatingHearts, getMood, getMoodMessage, feed, play, clean, sleep } = useTamagotchi()
  const [partner, setPartner] = useState<Profile | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [moodMessage, setMoodMessage] = useState('')

  useEffect(() => {
    setMoodMessage(getMoodMessage())
  }, [state?.happiness, state?.hunger])

  useEffect(() => {
    if (profile?.partner_id) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single()
        .then(({ data }) => {
          if (data) setPartner(data as Profile)
        })
    }
  }, [profile?.partner_id])

  const connectPartner = async () => {
    if (!inviteCode.trim()) return
    setConnecting(true)

    const { data, error } = await supabase.rpc('connect_couple', {
      invite_code: inviteCode.toUpperCase()
    })

    setConnecting(false)

    if (error || !data?.success) {
      toast.error(data?.error || 'Invalid code! Try again 😅')
    } else {
      toast.success(`Connected with ${data.partner_name}! 💕`)
      setShowInvite(false)
      setInviteCode('')
      await refreshProfile()
    }
  }

  const copyInviteCode = () => {
    if (profile?.partner_invite_code) {
      navigator.clipboard.writeText(profile.partner_invite_code)
      toast.success('Copied! Send it to your partner 💌')
    }
  }

  const mood = getMood()

  const actionButtons = [
    { icon: '🍜', label: 'Feed', action: feed, color: '#FF8A80', bgColor: '#FFE0DC' },
    { icon: '🎮', label: 'Play', action: play, color: '#82B1FF', bgColor: '#E3EEFF' },
    { icon: '🛁', label: 'Wash', action: clean, color: '#69F0AE', bgColor: '#E0FFF0' },
    { icon: '😴', label: 'Sleep', action: sleep, color: '#CE93D8', bgColor: '#F3E5F5' },
  ]

  return (
    <Layout>
      <div className="pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-sm font-semibold">Hey there,</p>
            <h2 className="font-display text-2xl text-bubblegum">{profile?.display_name?.split(' ')[0] || 'Bestie'} 💕</h2>
          </div>
          <div className="flex items-center gap-2">
            {partner ? (
              <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-pink-100">
                {partner.avatar_url ? (
                  <Image src={partner.avatar_url} alt={partner.display_name} width={24} height={24} className="rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bubblegum flex items-center justify-center text-white text-xs font-bold">
                    {partner.display_name?.[0] || '?'}
                  </div>
                )}
                <span className="text-xs font-bold text-gray-600">{partner.display_name?.split(' ')[0]}</span>
              </div>
            ) : (
              <button
                onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 bg-bubblegum text-white rounded-full px-3 py-1.5 text-xs font-bold shadow-cute"
              >
                <MdPersonAdd size={14} />
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Partner Connect Modal */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card-cute mb-4 border-2 border-pink-200"
            >
              <h3 className="font-display text-xl text-bubblegum mb-3">Connect with your Partner! 💕</h3>

              {/* My Code */}
              <div className="bg-pink-50 rounded-2xl p-3 mb-3">
                <p className="text-xs font-bold text-gray-500 mb-1">Your invite code:</p>
                <div className="flex items-center gap-2">
                  <span className="font-display text-3xl text-bubblegum tracking-widest">
                    {profile?.partner_invite_code}
                  </span>
                  <button onClick={copyInviteCode} className="text-xs bg-bubblegum text-white rounded-full px-3 py-1 font-bold">
                    Copy
                  </button>
                </div>
              </div>

              <p className="text-center text-gray-400 text-xs font-bold my-2">— or enter their code —</p>

              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. ABC123)"
                className="input-cute text-center uppercase font-display text-xl tracking-widest mb-3"
                maxLength={6}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowInvite(false)}
                  className="flex-1 bg-gray-100 text-gray-500 rounded-2xl py-3 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={connectPartner}
                  disabled={connecting || inviteCode.length !== 6}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {connecting ? '...' : 'Connect 💕'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tamagotchi Card */}
        <div className="card-cute mb-4 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -translate-x-4 -translate-y-12 opacity-50" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-lavender rounded-full -translate-x-8 translate-y-8 opacity-30" />

          {/* Level badge */}
          <div className="absolute top-4 right-4 bg-sunshine text-yellow-700 rounded-full px-3 py-1 text-xs font-display">
            Lv. {state?.level || 1} ⭐
          </div>

          {/* Character */}
          <div className="flex flex-col items-center relative z-10">
            {/* Speech bubble */}
            <AnimatePresence mode="wait">
              <motion.div
                key={moodMessage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="speech-bubble mb-2 max-w-48"
              >
                <p className="text-sm font-bold text-gray-600 text-center">{moodMessage || 'I love you! 💕'}</p>
              </motion.div>
            </AnimatePresence>

            <div className="relative">
              <TamaCharacter mood={mood} size={150} />

              {/* Floating hearts */}
              {floatingHearts.map((id) => (
                <motion.div
                  key={id}
                  className="absolute top-0 left-1/2 text-2xl pointer-events-none"
                  initial={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
                  animate={{ y: -80, opacity: 0, scale: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  💕
                </motion.div>
              ))}
            </div>

            <p className="font-display text-xl text-bubblegum mt-2">
              {profile?.tamagotchi_name || 'Tama-chan'}
            </p>
          </div>

          {/* Status Bars */}
          <div className="mt-4 space-y-2">
            <TamaStatusBar value={state?.hunger ?? 80} color="#FF8A80" label="Hungry" />
            <TamaStatusBar value={state?.happiness ?? 80} color="#FF6B9D" label="Happy" />
            <TamaStatusBar value={state?.energy ?? 80} color="#82B1FF" label="Energy" />
            <TamaStatusBar value={state?.cleanliness ?? 80} color="#69F0AE" label="Clean" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {actionButtons.map(({ icon, label, action, color, bgColor }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              onClick={action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl font-bold text-xs transition-all"
              style={{ backgroundColor: bgColor, color }}
            >
              <span className="text-2xl">{icon}</span>
              {label}
            </motion.button>
          ))}
        </div>

        {/* Budget Reminder Card */}
        <motion.div
          className="rounded-3xl p-4 text-white mb-4"
          style={{ background: 'linear-gradient(135deg, #FF6B9D, #FF8A80)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs font-bold mb-0.5">Today&apos;s Budget Reminder</p>
              <p className="font-display text-2xl">₱20 = ✨ Date Time!</p>
              <p className="text-white/70 text-xs mt-0.5">Check the Food Map for cheap eats~</p>
            </div>
            <span className="text-5xl">🍜</span>
          </div>
        </motion.div>

        {/* Quick stats if partnered */}
        {partner && (
          <div className="card-cute">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💑</span>
              <h3 className="font-display text-lg text-bubblegum">Us Together</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-pink-50 rounded-2xl p-3 text-center">
                <p className="font-display text-2xl text-bubblegum">💕</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Connected</p>
              </div>
              <div className="bg-purple-50 rounded-2xl p-3 text-center">
                <p className="font-display text-2xl text-purple-400">📓</p>
                <p className="text-xs font-bold text-gray-500 mt-1">Shared Journal</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
