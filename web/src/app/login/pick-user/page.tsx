'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Candidate = { username: string; displayName: string; departments: string[] }

export default function PickUserPage() {
  const router = useRouter()
  const [zohoEmail, setZohoEmail] = useState('')
  const [users, setUsers] = useState<Candidate[]>([])
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/candidates')
      .then(async (r) => {
        if (!r.ok) throw new Error('Zoho gate expired — start again')
        return r.json()
      })
      .then((d) => {
        setZohoEmail(d.zohoEmail)
        setUsers(d.users || [])
        if (d.users?.[0]) setUsername(d.users[0].username)
      })
      .catch((e) => setError(e.message))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || 'Login failed')
      return
    }
    router.push('/hub')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Choose your username</h1>
        <p className="mt-2 text-sm text-slate-400">
          Company gate: <span className="text-cyan-300">{zohoEmail || '…'}</span>
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <form onSubmit={submit} className="flex flex-col gap-4">
        {users.length > 0 ? (
          <label className="text-sm">
            <span className="text-slate-400">Username</span>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.username} value={u.username}>
                  {u.username} — {u.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="text-sm">
            <span className="text-slate-400">Username</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
        )}
        <label className="text-sm">
          <span className="text-slate-400">PIN</span>
          <input
            type="password"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="current-password"
            required
            minLength={4}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? 'Unlocking…' : 'Unlock portal'}
        </button>
      </form>
    </main>
  )
}
