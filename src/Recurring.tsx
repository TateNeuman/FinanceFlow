import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import { categories, incomeCategories, money } from './lib/data'
import type { Transaction } from './lib/data'

type Frequency = 'weekly' | 'monthly'
type RuleType = 'income' | 'expense'
type Rule = {
  id: string
  user_id?: string
  name: string
  amount: number
  category: string
  type: RuleType
  frequency: Frequency
  next_due_date: string
  last_posted_date?: string | null
}

const storageKey = 'financeflow-recurring-v25'

function localISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function advance(date: string, frequency: Frequency) {
  const [year, month, day] = date.split('-').map(Number)
  if (frequency === 'weekly') return localISO(new Date(year, month - 1, day + 7))
  const lastDay = new Date(year, month + 1, 0).getDate()
  return localISO(new Date(year, month, Math.min(day, lastDay)))
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const value = error as { message?: unknown; details?: unknown; code?: unknown }
    const parts = [value.message, value.details, value.code].filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    )
    if (parts.length) return parts.join(' · ')
  }
  return 'An unexpected error occurred.'
}

function readLocalRules(): Rule[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]')
    return Array.isArray(parsed) ? (parsed as Rule[]) : []
  } catch {
    return []
  }
}

export default function Recurring({ user, onPost }: { user: User | null; onPost: (t: Transaction) => void }) {
  const [rules, setRules] = useState<Rule[]>(() => (supabase ? [] : readLocalRules()))
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<RuleType>('expense')
  const [category, setCategory] = useState('Bills & Utilities')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [date, setDate] = useState(localISO)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!supabase) localStorage.setItem(storageKey, JSON.stringify(rules))
  }, [rules])

  useEffect(() => {
    if (!supabase) return
    if (!user) {
      setRules([])
      return
    }
    let active = true
    setRules([])
    setError('')
    supabase
      .from('recurring_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) setError(errorMessage(fetchError))
        else setRules((data || []) as Rule[])
      })
    return () => { active = false }
  }, [user?.id])

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    const numericAmount = Number(amount)
    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || !date) {
      setError('Enter a name, a valid positive amount, and a due date.')
      return
    }
    if (supabase && !user) {
      setError('Sign in to save recurring items.')
      return
    }
    inFlight.current = true
    setBusy(true)
    setError('')
    const record = { name: title.trim(), amount: numericAmount, type, category, frequency, next_due_date: date }
    try {
      if (supabase && user) {
        const { data, error: insertError } = await supabase
          .from('recurring_rules')
          .insert({ ...record, user_id: user.id })
          .select('*')
          .single()
        if (insertError) throw insertError
        setRules((old) => [...old, data as Rule])
      } else {
        setRules((old) => [...old, { ...record, id: crypto.randomUUID() }])
      }
      setTitle('')
      setAmount('')
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function remove(rule: Rule) {
    if (inFlight.current || !window.confirm(`Delete recurring item "${rule.name}"?`)) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      if (supabase) {
        if (!user) throw new Error('Sign in to delete recurring items.')
        const { data, error: deleteError } = await supabase
          .from('recurring_rules')
          .delete()
          .eq('id', rule.id)
          .eq('user_id', user.id)
          .select('id')
        if (deleteError) throw deleteError
        if (!data?.length) throw new Error('The item was not deleted. Check database permissions.')
      }
      setRules((old) => old.filter((item) => item.id !== rule.id))
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function post(rule: Rule) {
    if (inFlight.current) return
    if (!window.confirm(`Record ${money(rule.amount)} for "${rule.name}" on ${rule.next_due_date}?`)) return
    inFlight.current = true
    setBusy(true)
    setError('')
    const occurrenceDate = rule.next_due_date
    const nextDueDate = advance(occurrenceDate, rule.frequency)
    try {
      if (supabase) {
        if (!user) throw new Error('Sign in to record recurring items.')
        // Requires the SQL function shown in the setup instructions.
        // The database performs the transaction insert and date update atomically.
        const { data, error: postError } = await supabase.rpc('post_recurring_occurrence', {
          p_rule_id: rule.id,
          p_expected_due_date: occurrenceDate,
          p_next_due_date: nextDueDate,
        })
        if (postError) throw postError
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error('Unexpected response from the recurring payment function. Refresh before retrying.')
        }
        onPost(data as Transaction)
      } else {
        const transaction = {
          id: crypto.randomUUID(),
          title: rule.name,
          amount: rule.amount,
          type: rule.type,
          category: rule.category,
          date: occurrenceDate,
        } as Transaction
        onPost(transaction)
      }
      setRules((old) => old.map((item) =>
        item.id === rule.id
          ? { ...item, next_due_date: nextDueDate, last_posted_date: occurrenceDate }
          : item,
      ))
    } catch (cause) {
      setError(`${errorMessage(cause)}. Check your transactions before retrying.`)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const upcoming = [...rules].sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  const currentDate = localISO()

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <h2 className="text-xl font-bold">Recurring bills &amp; income</h2>
        <p className="muted text-sm mt-2">
          Track upcoming payments and subscriptions. Items are recorded manually to avoid accidental or duplicate entries. No bank payments are initiated.
        </p>
        <form onSubmit={add} className="grid md:grid-cols-3 gap-3 mt-5">
          <input className="field" required placeholder="Bill or income name" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="field" required type="number" min="0.01" step="0.01" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <select className="field" value={type} onChange={(event) => {
            const nextType = event.target.value as RuleType
            setType(nextType)
            setCategory(nextType === 'income' ? 'Salary' : 'Bills & Utilities')
          }}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
            {(type === 'income' ? incomeCategories : categories).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="field" value={frequency} onChange={(event) => setFrequency(event.target.value as Frequency)}>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
          <input className="field" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
          <button className="btn-primary md:col-span-3" type="submit" disabled={busy}>{busy ? 'Please wait...' : 'Add recurring item'}</button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold mb-4">Upcoming bills &amp; reminders</h2>
        {upcoming.length === 0 ? (
          <p className="muted text-sm">No recurring items yet.</p>
        ) : upcoming.map((rule) => (
          <div key={rule.id} className="border-t border-[#263344] py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{rule.name} <span className="muted text-xs">· {rule.frequency}</span></div>
              <div className="muted text-sm">{rule.next_due_date} · {rule.category} · {money(rule.amount)} {rule.type}</div>
              <div className={`text-xs mt-1 ${rule.next_due_date <= currentDate ? 'text-amber-300' : 'muted'}`}>
                {rule.next_due_date < currentDate ? 'Overdue' : rule.next_due_date === currentDate ? 'Due today' : 'Upcoming'}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-outline text-sm" disabled={busy} onClick={() => post(rule)}>Record occurrence</button>
              <button type="button" className="btn-outline text-sm" disabled={busy} onClick={() => remove(rule)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
