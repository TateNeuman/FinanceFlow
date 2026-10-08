# FinanceFlow Final — release notes

## Required cloud setup
1. Keep your existing Supabase project and data. Do **not** rerun destructive schema setup.
2. Run `supabase/final-hardening.sql` once in Supabase SQL Editor. It adds the atomic savings contribution RPC.
3. Keep the previously installed recurring occurrence RPC (`supabase/duplicate-protection-v2.4.sql`).
4. Configure `.env` from `.env.example`, then run `npm install` and `npm run dev`. Never put your service-role key in frontend variables.

## Build status
A production build could not be run in the packaging environment because npm registry DNS access was unavailable. Run `npm install` followed by `npm run build` locally before deployment.

## Changes
- CSV import checks duplicates inside the file and against refreshed existing cloud records before inserting; refuses the entire batch on a match. This is a conservative heuristic and **not** a concurrency-proof database constraint.
- Cloud savings contributions use an atomic database increment rather than read-modify-write in the browser.
- Savings goal edits detect changed saved balances rather than silently overwriting contributions.
- Transaction writes require a signed-in user in cloud mode.
- Recurring payment workflow remains unchanged. Weekly and month-end date calculations are preserved.

## Manual smoke tests
- Import a CSV, then import it again: second attempt should be rejected.
- Add funds to a cloud savings goal after running the SQL migration. Check refreshed balance.
- Post a recurring payment and check both the transaction and next due date.
- Test 2026-01-31 monthly due date advances to 2026-02-28, then 2026-03-28 (existing clamped-date policy).
- Sign out and verify cloud changes require authentication.

Note: Duplicate protection for CSV imports is best-effort. Concurrent imports from separate clients can still race; the app does not impose a global unique constraint because identical legitimate transactions are possible.
