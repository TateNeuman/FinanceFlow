-- Run once in Supabase SQL Editor for FinanceFlow 2.4 recurring schedules.
create table if not exists public.recurring_rules (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(trim(title)) between 1 and 120),
 amount numeric(12,2) not null check (amount > 0),
 category text not null,
 type text not null check (type in ('income','expense')),
 frequency text not null check (frequency in ('weekly','monthly')),
 next_date date not null,
 last_posted_date date,
 created_at timestamptz not null default now()
);
create index if not exists recurring_rules_user_date_idx on public.recurring_rules(user_id,next_date);
alter table public.recurring_rules enable row level security;
grant select,insert,update,delete on public.recurring_rules to authenticated;
drop policy if exists "Recurring select own" on public.recurring_rules;
drop policy if exists "Recurring insert own" on public.recurring_rules;
drop policy if exists "Recurring update own" on public.recurring_rules;
drop policy if exists "Recurring delete own" on public.recurring_rules;
create policy "Recurring select own" on public.recurring_rules for select to authenticated using ((select auth.uid())=user_id);
create policy "Recurring insert own" on public.recurring_rules for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Recurring update own" on public.recurring_rules for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Recurring delete own" on public.recurring_rules for delete to authenticated using ((select auth.uid())=user_id);

notify pgrst, 'reload schema';
