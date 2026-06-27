import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export type Profile = {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  partner_id: string | null
  partner_invite_code: string
  tamagotchi_name: string
  tamagotchi_mood: string
  created_at: string
  updated_at: string
}

export type CoupleConnection = {
  id: string
  user1_id: string
  user2_id: string
  connected_at: string
}

export type JournalEntry = {
  id: string
  author_id: string
  couple_id: string | null
  title: string
  content: string
  mood: string
  image_url: string | null
  is_private: boolean
  created_at: string
  updated_at: string
  author?: Profile
}

export type DatePlan = {
  id: string
  creator_id: string
  couple_id: string | null
  title: string
  description: string | null
  date_time: string
  location_name: string | null
  location_address: string | null
  location_lat: number | null
  location_lng: number | null
  budget: number
  status: 'planned' | 'confirmed' | 'done' | 'cancelled'
  color: string
  created_at: string
  updated_at: string
}

export type TamagotchiState = {
  id: string
  user_id: string
  hunger: number
  happiness: number
  energy: number
  cleanliness: number
  level: number
  experience: number
  last_fed: string
  last_played: string
  last_cleaned: string
  last_slept: string
  updated_at: string
}

export type SavedPlace = {
  id: string
  saved_by: string
  couple_id: string | null
  place_id: string
  place_name: string
  place_address: string | null
  place_lat: number | null
  place_lng: number | null
  avg_price: number | null
  notes: string | null
  visited: boolean
  created_at: string
}
