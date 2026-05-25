-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  avatar_url text default '',
  created_at timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('basic', 'pro', 'annual')),
  status text not null default 'pending' check (status in ('pending', 'active', 'expired')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id)
);

-- =============================================
-- PAYMENT SLIPS
-- =============================================
create table if not exists public.payment_slips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null,
  amount numeric not null,
  slip_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  note text,
  created_at timestamptz default now()
);

-- =============================================
-- TRANSACTIONS (income/expense)
-- =============================================
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  description text not null default '',
  category text default 'ทั่วไป',
  source text default 'chat' check (source in ('chat', 'upload', 'voice', 'manual')),
  receipt_url text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- =============================================
-- PRODUCTS
-- =============================================
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  sku text,
  category text default 'ทั่วไป',
  price numeric not null default 0,
  cost numeric not null default 0,
  stock_qty integer not null default 0,
  last_sold_at timestamptz,
  created_at timestamptz default now()
);

-- =============================================
-- CHAT MESSAGES
-- =============================================
create table if not exists public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  type text default 'text' check (type in ('text', 'voice', 'image')),
  attachment_url text,
  created_at timestamptz default now()
);

-- =============================================
-- SITE SETTINGS (CMS)
-- =============================================
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz default now(),
  updated_by uuid references public.profiles(id)
);

-- Default settings
insert into public.site_settings (key, value) values
  ('site_name', 'BizTrack'),
  ('bank_name', 'ธนาคารกสิกรไทย'),
  ('bank_account_number', '000-0-00000-0'),
  ('bank_account_name', 'บริษัท BizTrack จำกัด'),
  ('zakat_nisab_thb', '20000'),
  ('contact_email', 'admin@biztrack.app')
on conflict (key) do nothing;

-- =============================================
-- ZAKAT RECORDS
-- =============================================
create table if not exists public.zakat_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  year integer not null,
  total_assets numeric not null,
  nisab_value numeric not null,
  zakat_amount numeric not null,
  is_paid boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_slips enable row level security;
alter table public.transactions enable row level security;
alter table public.products enable row level security;
alter table public.chat_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.zakat_records enable row level security;

-- Profiles: users see own, admin sees all
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Subscriptions: users see own
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- Transactions: users see own
create policy "Users manage own transactions" on public.transactions for all using (auth.uid() = user_id);

-- Products: users manage own
create policy "Users manage own products" on public.products for all using (auth.uid() = user_id);

-- Chat: users manage own
create policy "Users manage own chat" on public.chat_messages for all using (auth.uid() = user_id);

-- Zakat: users manage own
create policy "Users manage own zakat" on public.zakat_records for all using (auth.uid() = user_id);

-- Payment slips: users see own, insert own
create policy "Users can view own slips" on public.payment_slips for select using (auth.uid() = user_id);
create policy "Users can insert own slips" on public.payment_slips for insert with check (auth.uid() = user_id);

-- Site settings: anyone can read
create policy "Anyone can read settings" on public.site_settings for select using (true);

-- =============================================
-- STORAGE BUCKET
-- =============================================
insert into storage.buckets (id, name, public) values ('payment-slips', 'payment-slips', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('receipt-images', 'receipt-images', true)
on conflict (id) do nothing;

create policy "Users can upload slips" on storage.objects for insert
  with check (bucket_id = 'payment-slips' AND auth.role() = 'authenticated');

create policy "Public can view slips" on storage.objects for select
  using (bucket_id = 'payment-slips');

create policy "Users can upload receipts" on storage.objects for insert
  with check (bucket_id = 'receipt-images' AND auth.role() = 'authenticated');

create policy "Public can view receipts" on storage.objects for select
  using (bucket_id = 'receipt-images');
