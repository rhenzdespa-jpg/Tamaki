import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase, Profile, SavedPlace } from '@/lib/supabase'
import { TamaCharacter } from '@/components/TamaCharacter'
import { useTamagotchi } from '@/hooks/useTamagotchi'
import { motion } from 'framer-motion'
import { MdEdit, MdPets, MdFavorite, MdBookmark, MdLogout } from 'react-icons/md'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ProfilePage() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { state, getMood } = useTamagotchi()
  const [partner, setPartner] = useState<Profile | null>(null)
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([])
  const [editingTamaName, setEditingTamaName] = useState(false)
  const [tamaName, setTamaName] = useState(profile?.tamagotchi_name || 'Tama-chan')
  const [stats, setStats] = useState({ journalCount: 0, dateCount: 0 })

  useEffect(() => {
    setTamaName(profile?.tamagotchi_name || 'Tama-chan')

    if (profile?.partner_id) {
      supabase.from('profiles').select('*').eq('id', profile.partner_id).single()
        .then(({ data }) => { if (data) setPartner(data as Profile) })
    }

    if (profile?.id) {
      // Fetch saved places
      supabase.from('saved_places').select('*').eq('saved_by', profile.id).limit(3)
        .then(({ data }) => { if (data) setSavedPlaces(data as SavedPlace[]) })

      // Fetch stats
      Promise.all([
        supabase.from('journal_entries').select('id', { count: 'exact' }).eq('author_id', profile.id),
        supabase.from('date_plans').select('id', { count: 'exact' }).eq('creator_id', profile.id),
      ]).then(([journalRes, dateRes]) => {
        setStats({ journalCount: journalRes.count || 0, dateCount: dateRes.count || 0 })
      })
    }
  }, [profile])

  const saveTamaName = async () => {
    if (!profile || !tamaName.trim()) return
    await supabase.from('profiles').update({ tamagotchi_name: tamaName }).eq('id', profile.id)
    await refreshProfile()
    setEditingTamaName(false)
    toast.success('Tama name updated! 🐾')
  }

  const copyInviteCode = () => {
    if (profile?.partner_invite_code) {
      navigator.clipboard.writeText(profile.partner_invite_code)
      toast.success('Invite code copied! 💌')
    }
  }

  const mood = getMood()

  return (
    <Layout title="My Profile 💕">
      <div className="pb-4 space-y-4">
        {/* User info card */}
        <div className="card-cute">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={64}
                height={64}
                className="rounded-full border-4 border-pink-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-bubblegum flex items-center justify-center text-white text-2xl font-bold border-4 border-pink-100">
                {profile?.display_name?.[0] || '?'}
              </div>
            )}
            <div>
              <h2 className="font-display text-xl text-gray-700">{profile?.display_name}</h2>
              <p className="text-gray-400 text-sm font-medium">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${partner ? 'bg-green-400' : 'bg-gray-300'}`} />
                <span className="text-xs font-bold text-gray-400">
                  {partner ? `💕 ${partner.display_name?.split(' ')[0]}` : 'Solo mode'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { icon: '📓', label: 'Entries', value: stats.journalCount },
              { icon: '💑', label: 'Dates', value: stats.dateCount },
              { icon: '⭐', label: 'Tama Lv.', value: state?.level || 1 },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-pink-50 rounded-2xl p-3 text-center">
                <p className="text-xl mb-0.5">{icon}</p>
                <p className="font-display text-lg text-bubblegum">{value}</p>
                <p className="text-xs font-bold text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tamagotchi Card */}
        <div className="card-cute">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🐾</span>
            <h3 className="font-display text-lg text-bubblegum">My Tamagotchi</h3>
          </div>

          <div className="flex items-center gap-4">
            <TamaCharacter mood={mood} size={80} />
            <div className="flex-1">
              {editingTamaName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tamaName}
                    onChange={e => setTamaName(e.target.value)}
                    className="input-cute text-sm py-2 flex-1"
                    maxLength={20}
                    autoFocus
                  />
                  <button onClick={saveTamaName} className="btn-primary text-sm px-3 py-2">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-display text-xl text-gray-700">{tamaName}</p>
                  <button onClick={() => setEditingTamaName(true)}>
                    <MdEdit size={16} className="text-gray-400" />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-400 font-medium">Level {state?.level || 1} Tama</p>
              <p className="text-xs text-gray-300 font-semibold mt-0.5">
                XP: {state?.experience || 0} / {(state?.level || 1) * 100}
              </p>
            </div>
          </div>
        </div>

        {/* Partner card */}
        {partner ? (
          <div className="card-cute bg-gradient-to-br from-pink-50 to-lavender/20">
            <div className="flex items-center gap-2 mb-3">
              <MdFavorite className="text-bubblegum" size={20} />
              <h3 className="font-display text-lg text-bubblegum">My Partner</h3>
            </div>
            <div className="flex items-center gap-3">
              {partner.avatar_url ? (
                <Image src={partner.avatar_url} alt={partner.display_name} width={48} height={48} className="rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-lavender flex items-center justify-center text-purple-600 font-bold text-lg">
                  {partner.display_name?.[0]}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-700">{partner.display_name}</p>
                <p className="text-xs text-gray-400">{partner.email}</p>
              </div>
              <span className="ml-auto text-2xl animate-heartbeat">💕</span>
            </div>
          </div>
        ) : (
          <div className="card-cute border-2 border-dashed border-pink-200">
            <div className="text-center">
              <div className="text-4xl mb-2">💌</div>
              <h3 className="font-display text-lg text-bubblegum mb-1">Invite Your Partner!</h3>
              <p className="text-gray-400 text-sm mb-3">Share your code to connect</p>
              <div className="bg-pink-50 rounded-2xl p-3 mb-3">
                <p className="font-display text-3xl text-bubblegum tracking-widest">{profile?.partner_invite_code}</p>
              </div>
              <button onClick={copyInviteCode} className="btn-soft text-sm px-4 py-2">
                Copy Code 💌
              </button>
            </div>
          </div>
        )}

        {/* Saved Places */}
        {savedPlaces.length > 0 && (
          <div className="card-cute">
            <div className="flex items-center gap-2 mb-3">
              <MdBookmark className="text-bubblegum" size={20} />
              <h3 className="font-display text-lg text-bubblegum">Saved Food Spots</h3>
            </div>
            <div className="space-y-2">
              {savedPlaces.map(place => (
                <div key={place.id} className="flex items-center gap-3 bg-pink-50 rounded-2xl p-3">
                  <span className="text-xl">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-700 text-sm truncate">{place.place_name}</p>
                    <p className="text-gray-400 text-xs truncate">{place.place_address}</p>
                  </div>
                  {place.avg_price && (
                    <span className="text-xs font-bold text-green-500">₱{place.avg_price}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign out */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            signOut()
            toast('See you soon! 💕')
          }}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-400 rounded-2xl py-3 font-bold border-2 border-red-100 hover:border-red-200 transition-all"
        >
          <MdLogout size={20} />
          Sign Out
        </motion.button>
      </div>
    </Layout>
  )
}
