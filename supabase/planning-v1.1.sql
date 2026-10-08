-- FinanceFlow v1.1: Run once in Supabase SQL Editor.
-- Existing transactions are not modified.
create table if not exists public.budgets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 category text not null,
 month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 amount numeric(12,2) not null check (amount > 0),
 created_at timestamptz not null default now(),
 unique (user_id,category,month)
);
create table if not exists public.savings_goals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (char_length(trim(name)) between 1 and 80),
 target_amount numeric(12,2) not null check (target_amount > 0),
 saved_amount numeric(12,2) not null default 0 check (saved_amount >= 0),
 created_at timestamptz not null default now()
);
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
grant usage on schema public to authenticated;
grant select,insert,update,delete on public.budgets,public.savings_goals to authenticated;
create policy "Read own budgets" on public.budgets for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own budgets" on public.budgets for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own budgets" on public.budgets for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Delete own budgets" on public.budgets for delete to authenticated using ((select auth.uid())=user_id);
create policy "Read own savings goals" on public.savings_goals for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own savings goals" on public.savings_goals for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Update own savings goals" on public.savings_goals for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Delete own savings goals" on public.savings_goals for delete to authenticated using ((select auth.uid())=user_id);
