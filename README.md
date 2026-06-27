# 💕 Tamakita — *Mahal kita, pero 20 lang pera ko*

> A cute Tamagotchi-themed couple app for budget dates in the Philippines!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🐾 Tamagotchi Pet | Feed, play, wash, and put your virtual pet to sleep! Stats decay over time. |
| 💑 Couple Connect | Link with your partner via a 6-character invite code |
| 📓 Shared Journal | Write memories together with moods, privacy toggle, and timestamps |
| 🗺️ Cheap Food Map | Google Maps showing carinderias, lugaw spots, street food near you |
| 📅 Date Planner | Plan, confirm, and remember your budget dates together |
| 🔐 Google OAuth | Sign in with Google, no password needed |
| ☁️ Supabase Backend | Persistent data — nothing is lost when you close the app |

---

## 🚀 Deployment Guide

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Go to **SQL Editor** and paste the entire contents of `supabase-schema.sql`
3. Click **Run** — this creates all tables, RLS policies, and triggers
4. Go to **Authentication > Providers > Google**:
   - Enable Google provider
   - Add your Google OAuth credentials (see step 3)
   - Add your Vercel URL to allowed redirect URLs: `https://your-app.vercel.app/auth/callback`
5. Copy your **Project URL** and **anon public key** from Project Settings > API

### 2. Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable **Google+ API** and **Google Maps JavaScript API** and **Places API**
4. Create OAuth 2.0 credentials:
   - Authorized origins: `https://your-app.vercel.app`, `http://localhost:3000`
   - Redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
5. Create a Maps API key (restrict to your domain for production)

### 3. Local Development

```bash
# Clone or extract the project
cd tamakita

# Install dependencies
npm install

# Create .env.local from template
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your-maps-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
# Run development server
npm run dev
# Open http://localhost:3000
```

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then add env variables:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Redeploy with env vars
vercel --prod
```

Or use Vercel Dashboard:
1. Import your GitHub repo at [vercel.com/new](https://vercel.com/new)
2. Add all three environment variables
3. Deploy!

---

## 📁 Project Structure

```
tamakita/
├── src/
│   ├── pages/
│   │   ├── _app.tsx          # App wrapper with providers
│   │   ├── _document.tsx     # HTML head (fonts, meta)
│   │   ├── index.tsx         # Home - Tamagotchi
│   │   ├── journal.tsx       # Couple journal
│   │   ├── map.tsx           # Food map (Google Maps)
│   │   ├── dates.tsx         # Date planner
│   │   ├── profile.tsx       # User profile
│   │   ├── login.tsx         # Login page
│   │   └── auth/callback.tsx # OAuth callback
│   ├── components/
│   │   ├── Layout.tsx        # Auth-guarded layout + nav
│   │   ├── BottomNav.tsx     # Bottom navigation
│   │   └── TamaCharacter.tsx # SVG Tamagotchi character
│   ├── hooks/
│   │   └── useTamagotchi.ts  # Tama state + actions
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client + types
│   │   └── auth.tsx          # Auth context
│   └── styles/
│       └── globals.css       # Tailwind + custom styles
├── supabase-schema.sql       # Run this in Supabase!
├── vercel.json               # Vercel config
└── .env.local.example        # Copy to .env.local
```

---

## 💡 How it Works

### Couple Connection
1. Each user gets a unique 6-character invite code
2. Share your code with your partner
3. They enter it in the Home screen → you're connected!
4. All journal entries and date plans are now shared

### Tamagotchi Mechanics
- Stats decay every 30 minutes (hunger/happiness drop by 5%)
- Feed (+25 hunger), Play (+20 happiness), Wash (+100 cleanliness), Sleep (+30 energy)
- Gain XP with each action, level up your Tama!
- Mood changes based on average stats

### Data Persistence
- All data stored in Supabase PostgreSQL
- Row-Level Security ensures only you and your partner can see your data
- App auto-loads your saved state every time you open it

---

## 🎨 Design Notes

Inspired by Tamagotchi Smart app aesthetics:
- **Colors**: Bubblegum pink, cotton candy, lavender, sunshine yellow
- **Fonts**: Fredoka One (display), Nunito (body)
- **Animations**: Framer Motion for bouncing, floating, wiggling
- **Style**: Rounded corners, soft shadows, pastel palette

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| Google sign-in not working | Check Supabase Auth redirect URL matches your domain |
| Map not loading | Check Google Maps API key has "Maps JavaScript API" and "Places API" enabled |
| Can't connect partner | Make sure both accounts exist (both must have signed in at least once) |
| Data not persisting | Check Supabase URL/key in .env.local |

---

Made with 💕 for Filipino budget couples!
*"Kahit 20 pesos lang, basta lagi kang kasama ko."*
