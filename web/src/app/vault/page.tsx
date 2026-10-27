'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type Entry = {
  id: string
  title: string
  url: string | null
  usernameHint: string | null
  scope: string
  department: string | null
}

export default function VaultPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [error, setError] = useState('')
  const [reveal, setReveal] = useState<{ id: string; secret: string } | null>(null)
  const [form, setForm] = useState({
    title: '',
    url: '',
    usernameHint: '',
    secret: '',
    scope: 'PRIVATE' as 'PRIVATE' | 'DEPARTMENT',
    department: 'IT',
  })

  const load = useCallback(() => {
    fetch('/api/vault')
      .then(async (r) => {
        if (!r.ok) throw new Error('unauthorized')
        return r.json()
      })
      .then((d) => setEntries(d.entries || []))
      .catch(() => setError('Could not load vault'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function revealSecret(id: string) {
    setReveal(null)
    const res = await fetch('/api/vault', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'reveal failed')
      return
    }
    setReveal({ id, secret: data.secret })
    setTimeout(() => setReveal(null), 30_000)
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'create failed')
      return
    }
    setForm({ title: '', url: '', usernameHint: '', secret: '', scope: 'PRIVATE', department: 'IT' })
    load()
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Credential vault</h1>
        <Link href="/hub" className="text-sm text-cyan-400 hover:underline">
          ← Hub
        </Link>
      </div>
      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <form onSubmit={create} className="mb-10 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-sm font-semibold text-slate-300">Add entry</h2>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="URL"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Username hint"
          value={form.usernameHint}
          onChange={(e) => setForm({ ...form, usernameHint: e.target.value })}
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          placeholder="Secret / password"
          type="password"
          value={form.secret}
          onChange={(e) => setForm({ ...form, secret: e.target.value })}
          required
        />
        <div className="flex flex-wrap gap-3 text-sm">
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value as 'PRIVATE' | 'DEPARTMENT' })}
          >
            <option value="PRIVATE">Private</option>
            <option value="DEPARTMENT">Department shared</option>
          </select>
          {form.scope === 'DEPARTMENT' ? (
            <select
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              {['OPERATIONS', 'MAINTENANCE', 'FINANCE', 'HR', 'IT', 'TELEMATICS'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : null}
          <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950">
            Save
          </button>
        </div>
      </form>

      <ul className="space-y-3">
        {entries.map((e) => (
          <li key={e.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-slate-500">
                  {e.scope}
                  {e.department ? ` · ${e.department}` : ''}
                  {e.usernameHint ? ` · ${e.usernameHint}` : ''}
                </p>
                {e.url ? (
                  <a href={e.url} className="text-xs text-cyan-400 hover:underline" target="_blank" rel="noreferrer">
                    {e.url}
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => revealSecret(e.id)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs hover:bg-slate-800"
              >
                Reveal (30s)
              </button>
            </div>
            {reveal?.id === e.id ? (
              <p className="mt-3 break-all rounded bg-slate-950 px-3 py-2 font-mono text-sm text-amber-200">
                {reveal.secret}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  )
}
