-- Run this SQL once in Supabase Dashboard > SQL Editor.
create table if not exists public.transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 1 and 120),
 category text not null,
 amount numeric(12,2) not null check (amount > 0),
 type text not null check (type in ('income','expense')),
 date date not null,
 created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on public.transactions (user_id,date desc);
alter table public.transactions enable row level security;
create policy "Users can read their own transactions" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add their own transactions" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own transactions" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own transactions" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);
