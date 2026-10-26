-- KosPilot MVP schema draft for Supabase PostgreSQL.
-- Enable RLS after connecting this schema to Supabase Auth.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('owner', 'tenant')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text,
  payment_account text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  floor text,
  monthly_price integer not null check (monthly_price > 0),
  yearly_price integer check (yearly_price is null or yearly_price > 0),
  status text not null check (status in ('vacant', 'occupied', 'maintenance', 'inactive')),
  facilities text[] not null default '{}',
  internal_note text,
  created_at timestamptz not null default now(),
  unique (property_id, name)
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  property_id uuid not null references public.properties(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  identity_number text,
  emergency_contact text,
  move_in_date date not null,
  rent_type text not null check (rent_type in ('monthly', 'yearly')),
  status text not null check (status in ('active', 'leaving', 'left')),
  created_at timestamptz not null default now()
);

create unique index if not exists tenants_one_active_per_room
  on public.tenants(room_id)
  where status = 'active';

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  period text not null,
  bill_type text not null check (bill_type in ('monthly', 'yearly')),
  amount integer not null check (amount > 0),
  due_date date not null,
  status text not null check (
    status in ('draft', 'unpaid', 'pending_verification', 'paid', 'overdue')
  ),
  correction_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  paid_at timestamptz not null,
  amount integer not null check (amount > 0),
  method text not null,
  proof_path text,
  note text,
  verification_status text not null check (
    verification_status in ('pending', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  expense_date date not null,
  category text not null check (
    category in ('electricity', 'water', 'internet', 'maintenance', 'cleaning', 'repair', 'other')
  ),
  amount integer not null check (amount > 0),
  description text not null,
  proof_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  title text not null,
  description text not null,
  photo_path text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('new', 'in_progress', 'done', 'rejected')),
  owner_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.rooms enable row level security;
alter table public.tenants enable row level security;
alter table public.bills enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.maintenance_reports enable row level security;
alter table public.activity_logs enable row level security;
