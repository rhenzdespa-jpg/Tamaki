import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase, JournalEntry, Profile } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { MdAdd, MdDelete, MdLock, MdLockOpen, MdClose } from 'react-icons/md'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import Image from 'next/image'

const MOODS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '💕', label: 'Love', value: 'love' },
  { emoji: '😂', label: 'Funny', value: 'funny' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '😤', label: 'Grumpy', value: 'grumpy' },
  { emoji: '🥰', label: 'Grateful', value: 'grateful' },
]

type NewEntry = {
  title: string
  content: string
  mood: string
  is_private: boolean
}

export default function JournalPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<(JournalEntry & { author?: Profile })[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [form, setForm] = useState<NewEntry>({
    title: '',
    content: '',
    mood: 'happy',
    is_private: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchCoupleId = useCallback(async () => {
    if (!profile?.id) return null
    const { data } = await supabase
      .from('couple_connections')
      .select('id')
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
      .single()
    if (data) {
      setCoupleId(data.id)
      return data.id
    }
    return null
  }, [profile?.id])

  const fetchEntries = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    const cId = coupleId || (await fetchCoupleId())

    let query = supabase
      .from('journal_entries')
      .select('*, author:profiles!author_id(id, display_name, avatar_url)')
      .order('created_at', { ascending: false })

    if (cId) {
      query = query.eq('couple_id', cId)
    } else {
      query = query.eq('author_id', profile.id)
    }

    const { data, error } = await query

    if (!error && data) {
      setEntries(data as (JournalEntry & { author?: Profile })[])
    }
    setLoading(false)
  }, [profile?.id, coupleId, fetchCoupleId])

  useEffect(() => {
    if (profile) {
      fetchCoupleId().then(() => fetchEntries())
    }
  }, [profile, fetchCoupleId, fetchEntries])

  const submitEntry = async () => {
    if (!form.title.trim() || !form.content.trim() || !profile) return
    setSubmitting(true)

    const { error } = await supabase.from('journal_entries').insert({
      author_id: profile.id,
      couple_id: coupleId,
      title: form.title,
      content: form.content,
      mood: form.mood,
      is_private: form.is_private,
    })

    setSubmitting(false)

    if (error) {
      toast.error('Could not save. Try again!')
    } else {
      toast.success('Entry saved! 💕')
      setShowForm(false)
      setForm({ title: '', content: '', mood: 'happy', is_private: false })
      fetchEntries()
    }
  }

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id)
    if (!error) {
      toast.success('Entry deleted')
      setSelectedEntry(null)
      fetchEntries()
    }
  }

  const getMoodEmoji = (mood: string) => MOODS.find(m => m.value === mood)?.emoji || '😊'

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      happy: '#FFE082',
      love: '#FFB3CC',
      funny: '#B3E5FC',
      sad: '#CFD8DC',
      grumpy: '#FFCCBC',
      grateful: '#C8F0D5',
    }
    return colors[mood] || '#FFE082'
  }

  return (
    <Layout title="Our Journal 📓">
      <div className="pb-4">
        {/* Partner status */}
        {!profile?.partner_id && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-3 mb-4 flex items-center gap-2">
            <span>💡</span>
            <p className="text-xs font-bold text-yellow-700">Connect with your partner to share entries!</p>
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 rounded-3xl skeleton" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-3 animate-float">📓</div>
            <h3 className="font-display text-xl text-bubblegum mb-1">No entries yet!</h3>
            <p className="text-gray-400 text-sm">Write your first memory together~</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedEntry(entry)}
                className="card-float cursor-pointer"
                style={{ borderLeft: `4px solid ${getMoodColor(entry.mood)}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                      <h3 className="font-display text-base text-gray-700 truncate">{entry.title}</h3>
                      {entry.is_private && <MdLock size={14} className="text-gray-400 flex-shrink-0" />}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2 font-medium">{entry.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {entry.author?.avatar_url ? (
                        <Image src={entry.author.avatar_url} alt="" width={18} height={18} className="rounded-full" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-bubblegum" />
                      )}
                      <span className="text-xs text-gray-400 font-semibold">
                        {entry.author?.display_name?.split(' ')[0] || 'You'} •{' '}
                        {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* FAB */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-bubblegum text-white rounded-full shadow-bubble flex items-center justify-center z-40"
        >
          <MdAdd size={28} />
        </motion.button>

        {/* New Entry Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end"
              onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="w-full max-w-md mx-auto bg-white rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-bubblegum">New Entry ✍️</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400">
                    <MdClose size={24} />
                  </button>
                </div>

                {/* Mood selector */}
                <p className="text-xs font-bold text-gray-500 mb-2">How are you feeling?</p>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {MOODS.map(({ emoji, label, value }) => (
                    <button
                      key={value}
                      onClick={() => setForm(f => ({ ...f, mood: value }))}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all ${
                        form.mood === value
                          ? 'border-bubblegum bg-pink-50 text-bubblegum'
                          : 'border-gray-100 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Give this memory a title ✨"
                  className="input-cute mb-3"
                />

                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write about this moment... What happened? How did you feel? 💕"
                  className="input-cute mb-3 min-h-32 resize-none"
                  rows={5}
                />

                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setForm(f => ({ ...f, is_private: !f.is_private }))}
                      className={`w-10 h-6 rounded-full transition-colors ${form.is_private ? 'bg-bubblegum' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${form.is_private ? 'translate-x-4' : ''}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-600">Private entry</span>
                    {form.is_private ? <MdLock size={16} className="text-bubblegum" /> : <MdLockOpen size={16} className="text-gray-400" />}
                  </label>
                </div>

                <button
                  onClick={submitEntry}
                  disabled={submitting || !form.title || !form.content}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Memory 💕'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entry Detail Modal */}
        <AnimatePresence>
          {selectedEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setSelectedEntry(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-sm bg-white rounded-3xl p-6 max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMoodEmoji(selectedEntry.mood)}</span>
                    <h2 className="font-display text-lg text-gray-700">{selectedEntry.title}</h2>
                  </div>
                  <button onClick={() => setSelectedEntry(null)} className="text-gray-400">
                    <MdClose size={20} />
                  </button>
                </div>

                <p className="text-gray-600 font-medium leading-relaxed mb-4 whitespace-pre-wrap">{selectedEntry.content}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-semibold">
                    {new Date(selectedEntry.created_at).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric',
                    })}
                  </span>

                  {selectedEntry.author_id === profile?.id && (
                    <button
                      onClick={() => deleteEntry(selectedEntry.id)}
                      className="text-red-400 flex items-center gap-1 text-xs font-bold"
                    >
                      <MdDelete size={16} />
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
