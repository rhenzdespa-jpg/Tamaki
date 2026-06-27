-- ================================================
-- TAMAKITA DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USERS TABLE (extends Supabase auth.users)
-- ================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  partner_id UUID REFERENCES public.profiles(id),
  partner_invite_code TEXT UNIQUE DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)),
  tamagotchi_name TEXT DEFAULT 'Tamatchi',
  tamagotchi_mood TEXT DEFAULT 'happy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- COUPLE CONNECTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.couple_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- ================================================
-- JOURNAL ENTRIES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES public.couple_connections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT DEFAULT 'happy',
  image_url TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- DATE PLANS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.date_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES public.couple_connections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  budget DECIMAL DEFAULT 20,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'done', 'cancelled')),
  color TEXT DEFAULT '#FF6B9D',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SAVED PLACES TABLE (cheap food spots)
-- ================================================
CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  saved_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES public.couple_connections(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place_name TEXT NOT NULL,
  place_address TEXT,
  place_lat DECIMAL,
  place_lng DECIMAL,
  avg_price DECIMAL,
  notes TEXT,
  visited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- TAMAGOTCHI STATE TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.tamagotchi_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hunger INTEGER DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
  happiness INTEGER DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
  energy INTEGER DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  cleanliness INTEGER DEFAULT 80 CHECK (cleanliness >= 0 AND cleanliness <= 100),
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  last_fed TIMESTAMPTZ DEFAULT NOW(),
  last_played TIMESTAMPTZ DEFAULT NOW(),
  last_cleaned TIMESTAMPTZ DEFAULT NOW(),
  last_slept TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tamagotchi_state ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, only update their own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Couple connections: both partners can view
CREATE POLICY "Partners can view connections" ON public.couple_connections FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can create connections" ON public.couple_connections FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

-- Journal entries: author and partner can view, only author can edit
CREATE POLICY "Author and partner can view entries" ON public.journal_entries FOR SELECT
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.couple_connections cc
      WHERE cc.id = couple_id AND (cc.user1_id = auth.uid() OR cc.user2_id = auth.uid())
    )
  );
CREATE POLICY "Author can insert entries" ON public.journal_entries FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update entries" ON public.journal_entries FOR UPDATE
  USING (auth.uid() = author_id);
CREATE POLICY "Author can delete entries" ON public.journal_entries FOR DELETE
  USING (auth.uid() = author_id);

-- Date plans: both partners can view and create
CREATE POLICY "Partners can view date plans" ON public.date_plans FOR SELECT
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.couple_connections cc
      WHERE cc.id = couple_id AND (cc.user1_id = auth.uid() OR cc.user2_id = auth.uid())
    )
  );
CREATE POLICY "Partners can insert date plans" ON public.date_plans FOR INSERT
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update date plans" ON public.date_plans FOR UPDATE
  USING (auth.uid() = creator_id);
CREATE POLICY "Creator can delete date plans" ON public.date_plans FOR DELETE
  USING (auth.uid() = creator_id);

-- Saved places
CREATE POLICY "Partners can view saved places" ON public.saved_places FOR SELECT
  USING (
    auth.uid() = saved_by OR
    EXISTS (
      SELECT 1 FROM public.couple_connections cc
      WHERE cc.id = couple_id AND (cc.user1_id = auth.uid() OR cc.user2_id = auth.uid())
    )
  );
CREATE POLICY "Users can manage their saved places" ON public.saved_places FOR ALL
  USING (auth.uid() = saved_by);

-- Tamagotchi state
CREATE POLICY "User can view own tama state" ON public.tamagotchi_state FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "User can manage own tama state" ON public.tamagotchi_state FOR ALL
  USING (auth.uid() = user_id);

-- ================================================
-- TRIGGERS: Auto-create profile on signup
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.tamagotchi_state (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- FUNCTION: Connect two users as a couple
-- ================================================
CREATE OR REPLACE FUNCTION public.connect_couple(invite_code TEXT)
RETURNS JSON AS $$
DECLARE
  target_profile public.profiles%ROWTYPE;
  current_user_id UUID;
  new_connection public.couple_connections%ROWTYPE;
BEGIN
  current_user_id := auth.uid();

  -- Find the profile with the invite code
  SELECT * INTO target_profile FROM public.profiles
  WHERE partner_invite_code = UPPER(invite_code)
  AND id != current_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if already connected
  IF EXISTS (
    SELECT 1 FROM public.couple_connections
    WHERE (user1_id = current_user_id AND user2_id = target_profile.id)
    OR (user1_id = target_profile.id AND user2_id = current_user_id)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already connected!');
  END IF;

  -- Create connection
  INSERT INTO public.couple_connections (user1_id, user2_id)
  VALUES (current_user_id, target_profile.id)
  RETURNING * INTO new_connection;

  -- Update both profiles with partner_id
  UPDATE public.profiles SET partner_id = target_profile.id WHERE id = current_user_id;
  UPDATE public.profiles SET partner_id = current_user_id WHERE id = target_profile.id;

  RETURN json_build_object(
    'success', true,
    'connection_id', new_connection.id,
    'partner_name', target_profile.display_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
