import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const sp = await searchParams
  const err = sp.error
  const allowDev = process.env.ALLOW_DEV_LOGIN === '1'

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">TruckSoft</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Staff Portal</h1>
        <p className="mt-3 text-sm text-slate-400">
          Sign in with a <span className="text-slate-200">@trucksoft.com.ng</span> Zoho account
          (shared mailboxes are fine). Then unlock with your personal username and PIN.
        </p>
      </div>
      {err ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      ) : null}
      <a
        href="/api/auth/zoho/start"
        className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
      >
        Continue with Zoho
      </a>
      {allowDev ? (
        <Link href="/login/dev" className="text-center text-sm text-slate-500 underline">
          Dev login (no Zoho)
        </Link>
      ) : null}
      <p className="text-xs text-slate-600">
        Legacy static Launchpad remains under <code className="text-slate-500">/Launchpad</code> in
        the repo until cutover.
      </p>
    </main>
  )
}
