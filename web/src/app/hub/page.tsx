import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

const LABELS: Record<string, string> = {
  OPERATIONS: 'Operations',
  MAINTENANCE: 'Maintenance',
  FINANCE: 'Finance',
  HR: 'HR',
  IT: 'IT',
  TELEMATICS: 'Telematics',
}

export default async function HubPage() {
  const s = await getSession()
  if (!s) redirect('/login')

  const apps = await prisma.appCatalog.findMany({
    where: {
      active: true,
      OR: [
        { departments: { hasSome: s.departments } },
        ...(s.isAdmin ? [{ departments: { isEmpty: true as const } }] : []),
      ],
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })

  const byDept = s.departments.map((d) => ({
    dept: d,
    apps: apps.filter((a) => a.departments.includes(d)),
  }))

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">TruckSoft Portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Hello, {s.username}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Gate: {s.zohoEmail} · {s.departments.map((d) => LABELS[d] || d).join(', ')}
          </p>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link href="/vault" className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-900">
            Credentials
          </Link>
          {s.isAdmin ? (
            <Link href="/admin" className="rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-900">
              Admin
            </Link>
          ) : null}
          <a href="/api/auth/logout" className="rounded-lg bg-slate-800 px-3 py-2 hover:bg-slate-700">
            Sign out
          </a>
        </nav>
      </header>

      <div className="space-y-10">
        {byDept.map(({ dept, apps: deptApps }) => (
          <section key={dept}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              {LABELS[dept] || dept}
            </h2>
            {deptApps.length === 0 ? (
              <p className="text-sm text-slate-600">No apps assigned yet.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {deptApps.map((app) => (
                  <li key={app.id}>
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-slate-100">{app.name}</span>
                        {app.external ? (
                          <span className="text-[10px] uppercase tracking-wide text-amber-400">ext</span>
                        ) : null}
                      </div>
                      {app.description ? (
                        <p className="mt-1 text-xs text-slate-500">{app.description}</p>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
