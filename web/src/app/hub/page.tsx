import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession, type Session } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEPARTMENT_LABELS, sectionsFor } from '@/lib/visibility'
import { Brand } from '@/components/brand'
import { AppLauncher, type LauncherSection } from './app-launcher'

function joinNames(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** "Head of Operations", "Operations staff", "Portal admin". */
function roleLine(s: Session): string {
  if (s.isAdmin) return 'Portal admin'
  const depts = joinNames(s.departments.map((d) => DEPARTMENT_LABELS[d]))
  return s.level === 'HEAD' ? `Head of ${depts}` : `${depts} staff`
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Africa/Lagos' }).format(new Date()),
  )
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default async function HubPage() {
  const s = await getSession()
  if (!s) redirect('/login')

  const apps = await prisma.appCatalog.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  })
  const sections: LauncherSection[] = sectionsFor(apps, s).map(({ dept, apps: list }) => ({
    dept,
    label: DEPARTMENT_LABELS[dept],
    apps: list.map((a) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      description: a.description,
      logo: a.logo,
      signIn: a.signIn,
      external: a.external,
      comingSoon: a.comingSoon,
      headOnly: a.headOnlyIn.includes(dept),
    })),
  }))
  const ready = new Set(sections.flatMap((x) => x.apps.filter((a) => !a.comingSoon).map((a) => a.id))).size
  const role = roleLine(s)
  const firstName = s.displayName.split(/\s+/)[0]

  return (
    <div className="min-h-screen">
      {s.demo ? (
        <div className="bg-plate text-ink">
          <p className="mx-auto max-w-6xl px-4 py-2.5 text-sm sm:px-6">
            <span className="font-semibold">Demo access.</span> You’re seeing what {role} see. Each app still asks
            for its own login when you open it.{' '}
            <a href="/api/auth/logout" className="font-semibold underline underline-offset-2">
              Try another view
            </a>
          </p>
        </div>
      ) : null}

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-6 sm:px-6">
        <Brand />
        <nav aria-label="Account" className="flex items-center gap-1 text-sm">
          {!s.demo ? (
            <Link href="/vault" className="rounded-lg px-3 py-2 text-muted hover:bg-paper hover:text-ink">
              Saved logins
            </Link>
          ) : null}
          {s.isAdmin ? (
            <Link href="/admin" className="rounded-lg px-3 py-2 text-muted hover:bg-paper hover:text-ink">
              Admin
            </Link>
          ) : null}
          <a href="/api/auth/logout" className="rounded-lg px-3 py-2 text-muted hover:bg-paper hover:text-ink">
            Sign out
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="pb-8 pt-12">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {s.demo ? `${role} view` : `${greeting()}, ${firstName}.`}
          </h1>
          <p className="mt-2 text-muted">
            {s.demo ? 'A sample account' : `Signed in as ${role}`}. {ready} {ready === 1 ? 'app is' : 'apps are'} ready to
            open.
          </p>
        </section>
        <AppLauncher sections={sections} />
      </main>
    </div>
  )
}
