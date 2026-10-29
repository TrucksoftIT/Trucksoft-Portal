/* eslint-disable @next/next/no-img-element -- static brand marks */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { demoLoginEnabled, getSession, pinOnlyLoginEnabled, zohoConfigured } from '@/lib/auth'
import { countVisible } from '@/lib/visibility'
import { Brand } from '@/components/brand'
import { PinForm } from './pin-form'

const ERRORS: Record<string, string> = {
  demo_off: 'Demo access is switched off on this Portal.',
  demo_unknown: 'That demo view isn’t available. Pick one of the views below.',
  dev_login_disabled: 'Developer sign-in is switched off.',
}

// One mark per TruckSoft app colour, in catalog order.
const MARKS = ['blue', 'green', 'yellow', 'orange', 'purple', 'red', 'black']

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSession()) redirect('/hub')
  const { error } = await searchParams

  const demo = demoLoginEnabled()
  const pinOnly = pinOnlyLoginEnabled()
  const zoho = zohoConfigured()

  let personas: { username: string; label: string; count: number }[] = []
  if (demo) {
    const [users, apps] = await Promise.all([
      prisma.user.findMany({ where: { isDemo: true, disabledAt: null } }),
      prisma.appCatalog.findMany({ where: { active: true } }),
    ])
    personas = users
      .sort((a, b) => (a.level === b.level ? a.username.localeCompare(b.username) : a.level === 'STAFF' ? -1 : 1))
      .map((u) => ({
        username: u.username,
        label: u.displayName.replace(/\s*\(demo\)\s*$/i, ''),
        count: countVisible(apps, { departments: u.departments, level: u.level, isAdmin: false }),
      }))
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      <section className="flex flex-col justify-between gap-12 px-4 py-6 sm:px-10 lg:px-14 lg:py-12">
        <Brand href="/login" />
        <div>
          <ul aria-label="TruckSoft apps" className="flex flex-wrap gap-2.5 sm:gap-3">
            {MARKS.map((c) => (
              <li key={c}>
                <img src={`/logos/chariot-${c}.png`} alt="" width={44} height={44} className="h-9 w-9 sm:h-11 sm:w-11" />
              </li>
            ))}
          </ul>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight stretch-wide sm:text-5xl lg:text-6xl">
            Every TruckSoft app, one sign-in.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Open the ERP, the Driver App, forms, tracking and your department’s other tools, from the office or
            the yard.
          </p>
        </div>
        <p className="text-sm text-muted">Each app still checks your access when you open it.</p>
      </section>

      <section className="flex items-center border-line bg-paper px-4 py-12 sm:px-10 lg:border-l lg:px-14">
        <div className="mx-auto w-full max-w-sm">
          {error ? (
            <p role="alert" className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {ERRORS[error] ?? 'Sign-in didn’t finish. Try again.'}
            </p>
          ) : null}

          {demo && personas.length > 0 ? (
            <div>
              <h2 className="text-xl font-semibold">Try the Portal</h2>
              <p className="mt-1 text-sm text-muted">Pick a view. No password needed.</p>
              <ul className="mt-5 space-y-3">
                {personas.map((p) => (
                  <li key={p.username}>
                    <form action="/api/auth/demo" method="post">
                      <input type="hidden" name="username" value={p.username} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between gap-4 rounded-xl border border-line px-4 py-3.5 text-left transition-colors hover:border-brand hover:bg-concrete/50"
                      >
                        <span>
                          <span className="block font-semibold">{p.label}</span>
                          <span className="block text-sm text-muted">
                            Sees {p.count} {p.count === 1 ? 'app' : 'apps and tools'}
                          </span>
                        </span>
                        <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 fill-muted">
                          <path d="M7.2 4.7a.75.75 0 0 1 1.06 0l4.77 4.77a.75.75 0 0 1 0 1.06L8.26 15.3a.75.75 0 1 1-1.06-1.06L11.44 10 7.2 5.76a.75.75 0 0 1 0-1.06Z" />
                        </svg>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className={demo && personas.length > 0 ? 'mt-12 border-t border-line pt-10' : ''}>
            <h2 className="text-xl font-semibold">Sign in with your account</h2>
            {zoho ? (
              <>
                <p className="mt-1 text-sm text-muted">
                  Use your @trucksoft.com.ng Zoho mailbox, then your username and PIN.
                </p>
                <a
                  href="/api/auth/zoho/start"
                  className="mt-5 flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-deep"
                >
                  Continue with Zoho
                </a>
              </>
            ) : pinOnly ? (
              <>
                <p className="mt-1 text-sm text-muted">Use the username and PIN IT gave you.</p>
                <PinForm />
              </>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Account sign-in isn’t switched on yet.{demo ? ' Use a demo view above to look around.' : ''}
              </p>
            )}
            {process.env.ALLOW_DEV_LOGIN === '1' ? (
              <Link href="/login/dev" className="mt-6 inline-block text-sm text-muted underline">
                Developer sign-in
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
