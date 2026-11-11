-- Bazaar Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text not null,
  avatar_url text,
  phone text,
  city text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================
-- ADS TABLE
-- ============================================
create table public.ads (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  price numeric not null check (price >= 0),
  category text not null,
  condition text not null,
  city text not null,
  images text[] default '{}',
  created_at timestamptz default now() not null
);

alter table public.ads enable row level security;

create policy "Ads are viewable by everyone"
  on public.ads for select
  using (true);

create policy "Authenticated users can create ads"
  on public.ads for insert
  with check (auth.uid() = seller_id);

create policy "Users can update their own ads"
  on public.ads for update
  using (auth.uid() = seller_id);

create policy "Users can delete their own ads"
  on public.ads for delete
  using (auth.uid() = seller_id);

-- ============================================
-- FAVORITES TABLE
-- ============================================
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ad_id uuid references public.ads(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, ad_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ============================================
-- CHATS TABLE
-- ============================================
create table public.chats (
  id uuid default uuid_generate_v4() primary key,
  ad_id uuid references public.ads(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.chats enable row level security;

create policy "Users can view their own chats"
  on public.chats for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Users can create chats"
  on public.chats for insert
  with check (auth.uid() = buyer_id);

create policy "Users can update their own chats"
  on public.chats for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Users can view messages in their chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and (chats.buyer_id = auth.uid() or chats.seller_id = auth.uid())
    )
  );

create policy "Users can send messages in their chats"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and (chats.buyer_id = auth.uid() or chats.seller_id = auth.uid())
    )
  );

-- ============================================
-- STORAGE BUCKET
-- ============================================
insert into storage.buckets (id, name, public)
values ('ad-images', 'ad-images', true);

create policy "Anyone can view ad images"
  on storage.objects for select
  using (bucket_id = 'ad-images');

create policy "Authenticated users can upload ad images"
  on storage.objects for insert
  with check (bucket_id = 'ad-images' and auth.uid() is not null);

create policy "Users can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'ad-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- SAMPLE DATA (20 sample ads)
-- ============================================
-- Note: Replace the seller_id below with an actual user UUID from your auth.users table
-- after signing up at least one user.

-- First, create a sample user profile (replace with your actual user ID)
-- INSERT INTO public.profiles (id, email, username, phone, city)
-- VALUES ('YOUR-USER-UUID', 'demo@bazaar.in', 'DemoSeller', '9876543210', 'Mumbai');

-- Sample ads (replace YOUR-USER-UUID with actual UUID)
INSERT INTO public.ads (seller_id, title, description, price, category, condition, city, images) VALUES
  ('YOUR-USER-UUID', 'iPhone 15 Pro Max 256GB', 'Bought 3 months ago, in perfect condition. Comes with original box, charger and Apple Care+ till 2025. No scratches or dents. Natural Titanium color.', 124999, 'Mobile Phones', 'Like New', 'Mumbai', '{}'),
  ('YOUR-USER-UUID', 'Honda City 2021 ZX CVT', 'Single owner, petrol, automatic. 28,000 km driven. Full service history from Honda. Insurance valid till Dec 2024. Sunroof, leather seats, cruise control.', 1250000, 'Cars', 'Good', 'Delhi', '{}'),
  ('YOUR-USER-UUID', 'MacBook Air M2 2023', 'Midnight color, 8GB RAM, 256GB SSD. Apple Care+ valid. Only 45 battery cycles. Comes with original box and charger. Perfect for students and professionals.', 79999, 'Electronics', 'Like New', 'Bangalore', '{}'),
  ('YOUR-USER-UUID', 'IKEA BEKANT Standing Desk', 'Electric height-adjustable desk, 160x80cm. White top with black legs. Works perfectly, minor scratch on one corner. Great for WFH setup.', 18500, 'Furniture', 'Good', 'Pune', '{}'),
  ('YOUR-USER-UUID', 'Royal Enfield Classic 350', '2022 model, Reborn Blue. 12,000 km. First owner. All papers clear. Recently serviced. New tyres. Crash guard and mobile holder included.', 165000, 'Bikes', 'Good', 'Jaipur', '{}'),
  ('YOUR-USER-UUID', 'Samsung Galaxy S24 Ultra', '12GB/256GB, Titanium Gray. With S-Pen. Bought in Jan 2024. Samsung Care+ till Jan 2026. 100% battery health. All accessories included.', 94999, 'Mobile Phones', 'Like New', 'Hyderabad', '{}'),
  ('YOUR-USER-UUID', 'Wooden Bookshelf 5-Tier', 'Solid sheesham wood bookshelf, 5 shelves. Dimensions: 6ft height x 3ft width. Rich walnut finish. Perfect condition, no damage.', 12000, 'Furniture', 'Good', 'Chennai', '{}'),
  ('YOUR-USER-UUID', 'Sony WH-1000XM5 Headphones', 'Best noise-cancelling headphones. Silver color. 6 months old. 30-hour battery life. Comes with carry case, cable, and airplane adapter.', 22999, 'Electronics', 'Like New', 'Mumbai', '{}'),
  ('YOUR-USER-UUID', 'Trek Marlin 7 Mountain Bike', '2023 model, size L (29 inch wheels). RockShox fork, Shimano Deore. Perfect for trails and daily commute. Minor cosmetic scratches only.', 55000, 'Sports', 'Good', 'Pune', '{}'),
  ('YOUR-USER-UUID', 'Canon EOS R10 Mirrorless Camera', 'APS-C sensor, 24.2MP. With 18-45mm kit lens. Shutter count under 5000. Includes camera bag, extra battery, and 64GB SD card.', 62000, 'Electronics', 'Like New', 'Delhi', '{}'),
  ('YOUR-USER-UUID', '3BHK Flat for Rent - Gurgaon', 'Near HUDA City Centre metro. 1800 sqft, semi-furnished. Modular kitchen, 3 bathrooms, balcony. Gated society with pool and gym. Available immediately.', 45000, 'Property', 'Good', 'Gurgaon', '{}'),
  ('YOUR-USER-UUID', 'Nike Air Jordan 1 Retro High', 'Size UK 8 (US 9). Chicago colorway. Brand new, never worn. Comes with original box and extra laces. 100% authentic, bought from Nike store.', 16999, 'Fashion', 'New', 'Bangalore', '{}'),
  ('YOUR-USER-UUID', 'PS5 Digital Edition with 2 Controllers', 'Bought in 2023. Comes with 2 DualSense controllers, charging dock, and 5 digital games (GD of War, Spider-Man 2, etc.). Perfect working condition.', 38000, 'Electronics', 'Good', 'Noida', '{}'),
  ('YOUR-USER-UUID', 'Yamaha FZ-S V4 Motorcycle', '2023 model, 6,500 km. Racing Blue. Single owner. Bluetooth connectivity, ride reports. Insurance till 2025. Well maintained, always garage parked.', 125000, 'Bikes', 'Like New', 'Chennai', '{}'),
  ('YOUR-USER-UUID', 'Complete Harry Potter Box Set', 'Hardcover edition, all 7 books. Bloomsbury publisher. Minor wear on box, books are in excellent condition. Perfect gift for HP fans.', 3500, 'Books', 'Good', 'Kolkata', '{}'),
  ('YOUR-USER-UUID', 'LG 55" 4K OLED Smart TV', 'C2 series, 2023 model. Perfect blacks, 120Hz. WebOS. Wall mount included. 1 year warranty remaining. Remote and all cables included.', 85000, 'Electronics', 'Like New', 'Mumbai', '{}'),
  ('YOUR-USER-UUID', 'Office Chair - Herman Miller Aeron', 'Size B (medium). Fully loaded with all adjustments. PostureFit SL. Graphite frame. 2 years old, excellent condition. Original bill available.', 65000, 'Furniture', 'Good', 'Bangalore', '{}'),
  ('YOUR-USER-UUID', 'iPad Pro 12.9" M2 with Apple Pencil', '256GB WiFi, Space Gray. Includes Apple Pencil 2nd gen and Magic Keyboard. Screen protector since day 1. No scratches.', 89999, 'Electronics', 'Like New', 'Hyderabad', '{}'),
  ('YOUR-USER-UUID', 'Wedding Photography Services', 'Professional wedding photography & videography. 10+ years experience. Drone coverage included. Packages starting from basic to premium. Portfolio available on request.', 75000, 'Services', 'New', 'Jaipur', '{}'),
  ('YOUR-USER-UUID', 'Gaming PC - RTX 4070 Build', 'i5-13600K, 32GB DDR5, RTX 4070, 1TB NVMe SSD, 750W PSU, NZXT H510 case. Runs all games at ultra 1440p. Windows 11 Pro licensed.', 110000, 'Electronics', 'Like New', 'Delhi', '{}');
