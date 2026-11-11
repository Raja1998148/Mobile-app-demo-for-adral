# Bazaar - Buy & Sell Marketplace for India

An OLX-style buy and sell marketplace app built with Expo (React Native, TypeScript) and Expo Router, powered by Supabase for authentication, database, storage, and real-time chat.

## Features

- **Browse Ads** - Grid layout with search and category filters
- **Post Ads** - Sell items with photos, pricing, and category selection
- **Real-time Chat** - Message sellers directly about listings
- **Favorites** - Save ads you're interested in
- **User Profiles** - Manage your account and listings
- **Indian Market** - INR pricing, Indian cities, localized experience

## Tech Stack

- **Framework**: Expo SDK 52 (React Native)
- **Navigation**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime)
- **Primary Color**: #2F6BFF
- **Font**: Inter (system fallback)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL in `supabase-schema.sql` in the Supabase SQL Editor
3. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Add sample data

After signing up your first user, update the `YOUR-USER-UUID` placeholder in `supabase-schema.sql` with your user's UUID and re-run the INSERT statements.

### 4. Run the app

```bash
npm start
```

Scan the QR code with **Expo Go** on your Android/iOS phone, or press `w` for web preview.

## Project Structure

```
app/
  (auth)/          # Login & Signup screens
  (tabs)/          # Bottom tab navigation
    index.tsx      # Home - Browse ads
    chats.tsx      # Chat conversations
    sell.tsx       # Post a new ad
    my-ads.tsx     # Your listings
    account.tsx    # Profile & settings
  ad/[id].tsx      # Ad detail screen
  chat/[id].tsx    # Chat detail screen
components/        # Reusable UI components
lib/               # Supabase client, types, constants, auth context
supabase-schema.sql # Database tables, RLS policies, sample data
```

## Opening on Phone

1. Install **Expo Go** from Play Store / App Store
2. Run `npm start`
3. Scan the QR code shown in terminal
