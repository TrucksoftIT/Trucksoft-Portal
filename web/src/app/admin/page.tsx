'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type UserRow = {
  id: string
  username: string
  displayName: string
  departments: string[]
  allowedZohoEmails: string[]
  isAdmin: boolean
  disabledAt: string | null
}

const DEPTS = ['OPERATIONS', 'MAINTENANCE', 'FINANCE', 'HR', 'IT', 'TELEMATICS']

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    pin: '',
    departments: ['IT'] as string[],
    allowedZohoEmails: '',
    isAdmin: false,
  })

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
    setForm({
      username: '',
      displayName: '',
      pin: '',
      departments: ['IT'],
      allowedZohoEmails: '',
      isAdmin: false,
    })
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
        <Link href="/hub" className="text-sm text-cyan-400 hover:underline">
          ← Hub
        </Link>
      </div>
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <form onSubmit={create} className="mb-10 space-y-3 rounded-2xl border border-slate-800 p-4">
        <h2 className="text-sm font-semibold text-slate-300">Create user</h2>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Display name"
          value={form.displayName}
          onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Initial PIN"
          type="password"
          value={form.pin}
          onChange={(e) => setForm({ ...form, pin: e.target.value })}
          required
          minLength={4}
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
                form.departments.includes(d) ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={form.isAdmin}
            onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })}
          />
          Portal admin
        </label>
        <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Create
        </button>
      </form>

      <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">
                {u.username}{' '}
                <span className="text-slate-500">({u.displayName})</span>
                {u.isAdmin ? <span className="ml-2 text-xs text-amber-400">admin</span> : null}
                {u.disabledAt ? <span className="ml-2 text-xs text-red-400">disabled</span> : null}
              </p>
              <p className="text-xs text-slate-500">
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
