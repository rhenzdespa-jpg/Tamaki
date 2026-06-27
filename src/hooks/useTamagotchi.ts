import { useState, useEffect, useCallback } from 'react'
import { supabase, TamagotchiState } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import toast from 'react-hot-toast'

const DECAY_INTERVAL = 30 * 60 * 1000 // 30 minutes
const DECAY_AMOUNT = 5

export function useTamagotchi() {
  const { user } = useAuth()
  const [state, setState] = useState<TamagotchiState | null>(null)
  const [loading, setLoading] = useState(true)
  const [floatingHearts, setFloatingHearts] = useState<string[]>([])

  const fetchState = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('tamagotchi_state')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code === 'PGRST116') {
      // Create initial state
      const { data: newState } = await supabase
        .from('tamagotchi_state')
        .insert({ user_id: user.id })
        .select()
        .single()
      setState(newState as TamagotchiState)
    } else if (data) {
      // Apply time-based decay
      const lastUpdated = new Date(data.updated_at).getTime()
      const now = Date.now()
      const intervals = Math.floor((now - lastUpdated) / DECAY_INTERVAL)

      if (intervals > 0) {
        const decay = intervals * DECAY_AMOUNT
        const updated = {
          hunger: Math.max(0, data.hunger - decay),
          happiness: Math.max(0, data.happiness - decay),
          energy: Math.max(0, data.energy - decay * 0.5),
          cleanliness: Math.max(0, data.cleanliness - decay * 0.3),
          updated_at: new Date().toISOString(),
        }
        await supabase.from('tamagotchi_state').update(updated).eq('user_id', user.id)
        setState({ ...data, ...updated } as TamagotchiState)
      } else {
        setState(data as TamagotchiState)
      }
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  const triggerHearts = () => {
    const id = Date.now().toString()
    setFloatingHearts(prev => [...prev, id])
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => h !== id)), 1500)
  }

  const updateState = async (updates: Partial<TamagotchiState>) => {
    if (!user || !state) return

    const newState = { ...state, ...updates, updated_at: new Date().toISOString() }

    // Check level up
    if (updates.experience) {
      const xpNeeded = state.level * 100
      if (newState.experience >= xpNeeded) {
        newState.level = state.level + 1
        newState.experience = newState.experience - xpNeeded
        toast('🎉 Level Up! Your Tama is growing!', { icon: '⭐' })
      }
    }

    setState(newState as TamagotchiState)

    await supabase
      .from('tamagotchi_state')
      .update(updates)
      .eq('user_id', user.id)
  }

  const feed = async () => {
    if (!state) return
    triggerHearts()
    toast('Yum yum! 🍜', { icon: '🍜' })
    await updateState({
      hunger: Math.min(100, state.hunger + 25),
      happiness: Math.min(100, state.happiness + 5),
      experience: (state.experience || 0) + 10,
      last_fed: new Date().toISOString(),
    })
  }

  const play = async () => {
    if (!state) return
    triggerHearts()
    toast('Weeee! So fun! 🎮', { icon: '🎮' })
    await updateState({
      happiness: Math.min(100, state.happiness + 20),
      energy: Math.max(0, state.energy - 10),
      hunger: Math.max(0, state.hunger - 5),
      experience: (state.experience || 0) + 15,
      last_played: new Date().toISOString(),
    })
  }

  const clean = async () => {
    if (!state) return
    triggerHearts()
    toast('So fresh! ✨', { icon: '🛁' })
    await updateState({
      cleanliness: 100,
      happiness: Math.min(100, state.happiness + 10),
      experience: (state.experience || 0) + 8,
      last_cleaned: new Date().toISOString(),
    })
  }

  const sleep = async () => {
    if (!state) return
    toast('Sweet dreams! 💤', { icon: '😴' })
    await updateState({
      energy: Math.min(100, state.energy + 30),
      hunger: Math.max(0, state.hunger - 10),
      experience: (state.experience || 0) + 5,
      last_slept: new Date().toISOString(),
    })
  }

  const getMood = (): string => {
    if (!state) return 'happy'
    const avg = (state.hunger + state.happiness + state.energy + state.cleanliness) / 4
    if (avg > 70) return 'happy'
    if (avg > 50) return 'normal'
    if (avg > 30) return 'sad'
    return 'tired'
  }

  const getMoodMessage = (): string => {
    const mood = getMood()
    const messages = {
      happy: ['I love you! 💕', 'Today is so good!', 'Let\'s go on a date!', '20 pesos adventure!'],
      normal: ['I\'m okay~', 'Feed me please 🍜', 'Give me some love!'],
      sad: ['I miss you... 😢', 'Please take care of me...', 'I need some food 😭'],
      tired: ['So tired...',  'Need rest...', 'Feed me first...'],
    }
    const list = messages[mood as keyof typeof messages] || messages.happy
    return list[Math.floor(Math.random() * list.length)]
  }

  return {
    state,
    loading,
    floatingHearts,
    getMood,
    getMoodMessage,
    feed,
    play,
    clean,
    sleep,
    refetch: fetchState,
  }
}
