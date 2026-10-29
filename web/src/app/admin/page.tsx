'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type UserRow = {
  id: string
  username: string
  displayName: string
  departments: string[]
  level: 'STAFF' | 'HEAD'
  allowedZohoEmails: string[]
  isAdmin: boolean
  isDemo: boolean
  disabledAt: string | null
}

const DEPTS = ['OPERATIONS', 'MAINTENANCE', 'FINANCE', 'HR', 'IT', 'TELEMATICS']

const EMPTY_FORM = {
  username: '',
  displayName: '',
  pin: '',
  departments: ['OPERATIONS'] as string[],
  level: 'STAFF' as 'STAFF' | 'HEAD',
  allowedZohoEmails: '',
  isAdmin: false,
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const load = useCallback(() => {
    fetch('/api/admin/users')
      .then(async (r) => {
        if (!r.ok) throw new Error('forbidden')
        return r.json()
      })
      .then((d) => setUsers(d.users || []))
      .catch(() => setError('Admin access required'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        allowedZohoEmails: form.allowedZohoEmails
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error || 'create failed')
      return
    }
    setForm(EMPTY_FORM)
    load()
  }

  function toggleDept(d: string) {
    setForm((f) => ({
      ...f,
      departments: f.departments.includes(d)
        ? f.departments.filter((x) => x !== d)
        : [...f.departments, d],
    }))
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Portal admin</h1>
        <Link href="/hub" className="text-sm text-brand hover:underline">
          ← Hub
        </Link>
      </div>
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}

      <form onSubmit={create} className="mb-10 space-y-3 rounded-2xl border border-line p-4">
        <h2 className="text-sm font-semibold text-ink">Create user</h2>
        <input
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          placeholder="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          placeholder="Display name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          placeholder="Initial PIN"
          type="password"
          value={form.pin}
          onChange={(e) => setForm({ ...form, pin: e.target.value })}
          required
          minLength={4}
        />
        <input
          className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          placeholder="Allowed Zoho emails (comma-separated), empty = any @trucksoft.com.ng gate"
          value={form.allowedZohoEmails}
          onChange={(e) => setForm({ ...form, allowedZohoEmails: e.target.value })}
        />
        <div className="flex flex-wrap gap-2 text-xs">
          {DEPTS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDept(d)}
              className={`rounded-full px-3 py-1 ${
                form.departments.includes(d) ? 'bg-brand text-white' : 'bg-concrete text-ink'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <fieldset className="flex flex-wrap gap-4 text-sm">
          <legend className="mb-1 text-sm font-medium">Access level</legend>
          {(['STAFF', 'HEAD'] as const).map((lvl) => (
            <label key={lvl} className="flex items-center gap-2">
              <input
                type="radio"
                name="level"
                checked={form.level === lvl}
                onChange={() => setForm({ ...form, level: lvl })}
              />
              {lvl === 'HEAD' ? 'Head of department (also sees head-only apps)' : 'Staff'}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={form.isAdmin}
            onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
          />
          Portal admin
        </label>
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
          Create
        </button>
      </form>

      <ul className="divide-y divide-line rounded-xl border border-line">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {u.username}{' '}
                <span className="text-muted">({u.displayName})</span>
                {u.level === 'HEAD' ? <span className="ml-2 text-xs text-brand">head</span> : null}
                {u.isAdmin ? <span className="ml-2 text-xs text-amber-700">admin</span> : null}
                {u.isDemo ? <span className="ml-2 text-xs text-muted">demo</span> : null}
                {u.disabledAt ? <span className="ml-2 text-xs text-red-700">disabled</span> : null}
              </p>
              <p className="text-xs text-muted">
                {u.departments.join(', ')}
                {u.allowedZohoEmails.length
                  ? ` · Zoho: ${u.allowedZohoEmails.join(', ')}`
                  : ' · any company Zoho gate'}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
