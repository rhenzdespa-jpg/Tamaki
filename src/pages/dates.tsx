import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { useAuth } from '@/lib/auth'
import { supabase, DatePlan } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { MdAdd, MdClose, MdLocationOn, MdCalendarMonth, MdAttachMoney, MdCheck, MdCancel } from 'react-icons/md'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import toast from 'react-hot-toast'

const DATE_COLORS = [
  '#FF6B9D', '#FF8A80', '#FFB74D', '#81C784',
  '#64B5F6', '#BA68C8', '#4DB6AC', '#F06292',
]

const STATUS_CONFIG = {
  planned: { label: 'Planned', color: '#64B5F6', emoji: '📅' },
  confirmed: { label: "It's a date!", color: '#81C784', emoji: '💕' },
  done: { label: 'Done!', color: '#9E9E9E', emoji: '✅' },
  cancelled: { label: 'Cancelled', color: '#FF5252', emoji: '❌' },
}

const DATE_IDEAS = [
  '🍜 Carinderia hopping sa Quiapo',
  '🌃 Night market sa Divisoria',
  '☕ Merienda date sa pinaka-murang cafe',
  '🎡 Luneta Park picnic',
  '🏪 SM/Mall strolling & window shopping',
  '🍦 Halo-halo + bonding session',
  '🎮 Computer shop date (lan games!)',
  '🌊 Beach trip (budget edition!)',
]

export default function DatesPage() {
  const { profile } = useAuth()
  const [plans, setPlans] = useState<DatePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [form, setForm] = useState({
    title: '',
    description: '',
    date_time: '',
    location_name: '',
    location_address: '',
    budget: 20,
    color: DATE_COLORS[0],
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchCoupleId = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('couple_connections')
      .select('id')
      .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
      .single()
    if (data) setCoupleId(data.id)
  }, [profile?.id])

  const fetchPlans = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)

    let query = supabase
      .from('date_plans')
      .select('*')
      .order('date_time', { ascending: true })

    if (coupleId) {
      query = query.eq('couple_id', coupleId)
    } else {
      query = query.eq('creator_id', profile.id)
    }

    const { data, error } = await query
    if (!error && data) setPlans(data as DatePlan[])
    setLoading(false)
  }, [profile?.id, coupleId])

  useEffect(() => {
    if (profile) {
      fetchCoupleId().then(fetchPlans)
    }
  }, [profile, fetchCoupleId, fetchPlans])

  const submitPlan = async () => {
    if (!form.title || !form.date_time || !profile) return
    setSubmitting(true)

    const { error } = await supabase.from('date_plans').insert({
      creator_id: profile.id,
      couple_id: coupleId,
      title: form.title,
      description: form.description || null,
      date_time: form.date_time,
      location_name: form.location_name || null,
      location_address: form.location_address || null,
      budget: form.budget,
      color: form.color,
    })

    setSubmitting(false)

    if (error) {
      toast.error('Could not save the date plan!')
    } else {
      toast.success('Date planned! 💕 So exciting!')
      setShowForm(false)
      setForm({ title: '', description: '', date_time: '', location_name: '', location_address: '', budget: 20, color: DATE_COLORS[0] })
      fetchPlans()
    }
  }

  const updateStatus = async (id: string, status: DatePlan['status']) => {
    await supabase.from('date_plans').update({ status }).eq('id', id)
    fetchPlans()
    const msg = status === 'confirmed' ? 'Date confirmed! 💕' : status === 'done' ? 'Sweet memories! ✨' : 'Cancelled 😢'
    toast(msg, { icon: STATUS_CONFIG[status].emoji })
  }

  const deletePlan = async (id: string) => {
    await supabase.from('date_plans').delete().eq('id', id)
    fetchPlans()
    toast('Date plan deleted', { icon: '🗑️' })
  }

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'TODAY! 🎉'
    if (isTomorrow(date)) return 'Tomorrow 💕'
    return format(date, 'EEE, MMM d')
  }

  const upcomingPlans = plans.filter(p => !isPast(parseISO(p.date_time)) || p.status === 'planned')
  const pastPlans = plans.filter(p => isPast(parseISO(p.date_time)) && p.status !== 'planned')

  const displayedPlans = activeTab === 'upcoming' ? upcomingPlans : pastPlans

  return (
    <Layout title="Date Planner 💑">
      <div className="pb-4">
        {/* Date Ideas Scroller */}
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-400 mb-2">💡 Budget Date Ideas:</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {DATE_IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => {
                  setForm(f => ({ ...f, title: idea.substring(2) }))
                  setShowForm(true)
                }}
                className="whitespace-nowrap bg-white text-gray-600 text-xs font-bold px-3 py-2 rounded-full border border-pink-100 hover:border-bubblegum hover:text-bubblegum transition-all shadow-sm"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-pink-50 rounded-2xl p-1 mb-4">
          {(['upcoming', 'past'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-white text-bubblegum shadow-sm' : 'text-gray-400'
              }`}
            >
              {tab === 'upcoming' ? '📅 Upcoming' : '✨ Memories'}
            </button>
          ))}
        </div>

        {/* Plans */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-3xl skeleton" />)}
          </div>
        ) : displayedPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-3 animate-float">
              {activeTab === 'upcoming' ? '📅' : '✨'}
            </div>
            <h3 className="font-display text-xl text-bubblegum mb-1">
              {activeTab === 'upcoming' ? 'No upcoming dates!' : 'No memories yet!'}
            </h3>
            <p className="text-gray-400 text-sm">
              {activeTab === 'upcoming' ? 'Plan your next ₱20 adventure~' : 'Go on dates to make memories!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedPlans.map((plan, i) => {
              const statusConfig = STATUS_CONFIG[plan.status]
              const dateIsToday = isToday(parseISO(plan.date_time))

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-soft border-2 border-transparent"
                  style={{ borderColor: dateIsToday ? plan.color : 'transparent' }}
                >
                  {/* Color header */}
                  <div className="h-2" style={{ backgroundColor: plan.color }} />

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold" style={{ color: statusConfig.color }}>
                            {statusConfig.emoji} {statusConfig.label}
                          </span>
                          {dateIsToday && (
                            <span className="bg-pink-100 text-bubblegum text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                              TODAY!
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-lg text-gray-700 truncate">{plan.title}</h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                        <MdCalendarMonth size={14} className="text-bubblegum" />
                        {getDateLabel(plan.date_time)} • {format(parseISO(plan.date_time), 'h:mm a')}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                        <MdAttachMoney size={14} className="text-green-500" />
                        Budget: ₱{plan.budget}
                      </div>
                    </div>

                    {plan.location_name && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold mb-3">
                        <MdLocationOn size={14} className="text-bubblegum flex-shrink-0" />
                        <span className="truncate">{plan.location_name}</span>
                      </div>
                    )}

                    {plan.description && (
                      <p className="text-xs text-gray-500 font-medium mb-3 line-clamp-2">{plan.description}</p>
                    )}

                    {/* Action buttons */}
                    {plan.status === 'planned' && plan.creator_id === profile?.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(plan.id, 'confirmed')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-50 text-green-600 rounded-2xl py-2 text-xs font-bold border border-green-200"
                        >
                          <MdCheck size={16} /> Confirm
                        </button>
                        <button
                          onClick={() => updateStatus(plan.id, 'cancelled')}
                          className="flex items-center justify-center gap-1.5 bg-red-50 text-red-400 rounded-2xl px-3 py-2 text-xs font-bold border border-red-100"
                        >
                          <MdCancel size={16} />
                        </button>
                      </div>
                    )}

                    {plan.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(plan.id, 'done')}
                        className="w-full flex items-center justify-center gap-1.5 bg-pink-50 text-bubblegum rounded-2xl py-2 text-xs font-bold border border-pink-100"
                      >
                        💕 Mark as Done
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
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

        {/* New Date Plan Form */}
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
                  <h2 className="font-display text-xl text-bubblegum">Plan a Date! 💕</h2>
                  <button onClick={() => setShowForm(false)} className="text-gray-400">
                    <MdClose size={24} />
                  </button>
                </div>

                {/* Color picker */}
                <p className="text-xs font-bold text-gray-500 mb-2">Pick a color:</p>
                <div className="flex gap-2 mb-4">
                  {DATE_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setForm(f => ({ ...f, color }))}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        backgroundColor: color,
                        transform: form.color === color ? 'scale(1.3)' : 'scale(1)',
                        border: form.color === color ? `3px solid ${color}` : '2px solid transparent',
                        boxShadow: form.color === color ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
                      }}
                    />
                  ))}
                </div>

                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Date title (e.g. Lugaw Date! 🍚)"
                  className="input-cute mb-3"
                />

                <input
                  type="datetime-local"
                  value={form.date_time}
                  onChange={e => setForm(f => ({ ...f, date_time: e.target.value }))}
                  className="input-cute mb-3"
                />

                <input
                  type="text"
                  value={form.location_name}
                  onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                  placeholder="Where? (e.g. Luneta Park)"
                  className="input-cute mb-3"
                />

                <div className="mb-3">
                  <p className="text-xs font-bold text-gray-500 mb-2">Budget: ₱{form.budget}</p>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={form.budget}
                    onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))}
                    className="w-full accent-bubblegum"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-semibold mt-1">
                    <span>₱0 (free!)</span>
                    <span>₱200</span>
                  </div>
                </div>

                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Any notes? What do you want to do? 🌸"
                  className="input-cute mb-4 resize-none"
                  rows={3}
                />

                <button
                  onClick={submitPlan}
                  disabled={submitting || !form.title || !form.date_time}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {submitting ? 'Planning...' : 'Plan this Date! 💕'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  )
}
