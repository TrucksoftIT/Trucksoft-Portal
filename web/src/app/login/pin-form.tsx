'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const input =
  'mt-1.5 w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] focus:border-brand focus:outline-none'

/** Username + PIN sign-in (PIN-only mode, before Zoho OAuth is configured). */
export function PinForm() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'Sign-in didn’t finish. Try again.')
      return
    }
    router.push('/hub')
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        Username
        <input
          className={input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </label>
      <label className="block text-sm font-medium">
        PIN
        <input
          className={input}
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoComplete="current-password"
          minLength={4}
          required
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
