# FinanceFlow 💸

A modern, responsive personal finance dashboard built with React, TypeScript, Tailwind CSS, Recharts, and optional Supabase authentication + PostgreSQL.

## Features
- Overview with balance, income, and expense cards
- Six-month cash flow and spending-by-category charts
- Add, edit, delete, search, and filter transactions
- Filter by month and export transactions to CSV
- Responsive dark UI
- **Demo mode:** works without credentials; saves data in browser localStorage
- **Cloud mode:** email/password authentication and per-user transaction storage in Supabase with Row Level Security

## Run locally

Install [Node.js LTS](https://nodejs.org/) (Node 20.19+ or 22.12+ recommended).

```bash
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

**No Supabase setup is required to explore the app.** By default it runs in demo mode with sample transactions. Demo changes are stored in your browser only. Demo values are fictional.

## Connect Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **SQL Editor** and execute `supabase/schema.sql` once. This creates the `transactions` table and per-user RLS policies.
3. In **Project Settings > API** (or **Connect** in newer dashboards), copy the project URL and **publishable / anon** key. **Never use the service_role/secret key in the frontend.**
4. Copy `.env.example` to `.env` and set:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
   ```

5. Restart `npm run dev`. Sign up and sign in. Depending on your Auth settings, you may need to confirm your email first.
6. When deploying, configure your Supabase Auth site URL and redirect allow list for your deployment URL.

**Important:** Enabling cloud mode does not automatically import local demo transactions. Cloud mode starts with an empty account. Never commit `.env`.

## Production build

```bash
npm run build
npm run preview
```

Deploy `dist/` to Vercel or Netlify. Set the same `VITE_` environment variables in your deployment provider if using Supabase. Because this is a client-side single-page app, configure your host to serve `index.html` for application routes if adding routes later.

## Project structure

```text
financeflow/
├── src/
│   ├── lib/
│   │   ├── data.ts         # Types, categories, demo transactions
│   │   └── supabase.ts     # Optional Supabase client
│   ├── App.tsx             # Dashboard, charts, forms, navigation
│   ├── main.tsx
│   └── style.css
├── supabase/schema.sql     # SQL schema and RLS policies
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Next features
- Budgets and spending limits
- Recurring transactions
- CSV import
- Automated tests
- Accessibility and keyboard navigation improvements

## Disclaimer
FinanceFlow is a portfolio project, not a financial institution or financial advice service. Avoid entering sensitive financial information in demo mode on shared computers.

## Version 1.1 — Budgets and Savings Goals

New navigation: **Budgets** and **Savings Goals**. Budgets track expense transactions by category and month. Savings goals let you set targets and record progress (not bank transfers).

### Upgrade from 1.0

1. Back up your existing project folder. Extract this ZIP into a **new folder**.
2. Copy your existing `.env` into the new project's root folder beside `package.json`. Never upload `.env` to GitHub.
3. In Supabase **SQL Editor**, run `supabase/planning-v1.1.sql` **once**. It creates only the new planning tables and RLS policies; it does not change your transactions.
4. Run `npm install` then `npm run dev` in the new folder.
5. Sign in, create a budget and savings goal, then refresh to verify persistence.

If you run the planning SQL more than once, `CREATE POLICY` will report that the policy already exists. Run the script only once.

Demo mode saves budgets and goals in browser localStorage. Cloud mode saves them per signed-in user in Supabase. Savings contributions update the goal's tracked balance and do not create a transaction or transfer money.


## Dashboard 2.0

The Overview page now includes a monthly snapshot (income, expenses, savings rate), month-over-month comparisons, live Supabase budget and savings-goal summaries, and spending insights. The original dashboard, transaction management, and planning pages remain intact. No additional SQL migration is required beyond `supabase/planning-v1.1.sql`.

To upgrade, extract into a new directory, copy your existing `.env` (do not publish it), run `npm install` then `npm run dev`.


## Dashboard layout update

The monthly snapshot, budget and savings summaries, and spending insights appear first on the Overview page. The original balance cards, cash-flow charts, and recent transactions remain below. The UI uses the label **Financial overview** instead of a version number.

For a sample-data demonstration, run the app without Supabase credentials in a separate local copy. Never replace a connected user’s transactions with demo data.


## Version 2.3
- Compact chart time-range control, improved chart tooltip and donut total.
- Responsive transaction search and type filter.
- Category-level budget alerts at 80% and 100% of limits.
- Existing Supabase tables and configuration remain unchanged.

## FinanceFlow 2.4
- Recurring bill and income schedule with due/overdue indicators and **manual** recording of occurrences. Does not automatically move money or charge cards.
- Monthly income/expense comparison, CSV import preview and confirmation, and savings projections.
- CSV import supports the FinanceFlow export headers and up to 500 rows per file. Imports append transactions; duplicate prevention is not automatic.
- **Cloud setup:** Run `supabase/recurring-v2.4.sql` once in the Supabase SQL Editor before using recurring schedules. Existing transaction/budget/goal tables remain unchanged.
- Savings projections read existing `savings_goals` records; use a positive monthly contribution to estimate months remaining.

## Recurring Bills setup

In your Supabase project SQL Editor, run `supabase/recurring-v2.4.sql` once. This creates the `public.recurring_rules` table using the field names required by the application (`title`, `next_date`, and `last_posted_date`) and enables user-scoped RLS policies. Refresh FinanceFlow after running it. The application never initiates a bank payment; recording an occurrence manually creates a transaction.
