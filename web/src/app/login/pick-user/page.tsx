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
        <p className="mt-2 text-sm text-muted">
          Company gate: <span className="text-brand">{zohoEmail || '…'}</span>
        </p>
      </div>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <form onSubmit={submit} className="flex flex-col gap-4">
        {users.length > 0 ? (
          <label className="text-sm">
            <span className="text-muted">Username</span>
            <select
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2"
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
            <span className="text-muted">Username</span>
            <input
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
        )}
        <label className="text-sm">
          <span className="text-muted">PIN</span>
          <input
            type="password"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2"
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
          className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-50"
        >
          {loading ? 'Unlocking…' : 'Unlock portal'}
        </button>
      </form>
    </main>
  )
}
