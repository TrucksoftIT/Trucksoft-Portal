'use client'

import { useMemo, useState } from 'react'
import { AppIcon } from '@/components/app-icon'

export type LauncherApp = {
  id: string
  name: string
  url: string
  description: string | null
  logo: string | null
  signIn: string
  external: boolean
  comingSoon: boolean
  /** Only heads see this tile in this department. */
  headOnly: boolean
}

export type LauncherSection = { dept: string; label: string; apps: LauncherApp[] }

const SIGN_IN_HINT: Record<string, string> = {
  ERP_TOKEN: 'Uses your ERP login',
  SSO: 'Uses your Zoho login',
  OWN_LOGIN: 'Has its own login',
  VAULT: 'Login kept in Saved logins',
  NONE: '',
}

function matches(app: LauncherApp, query: string): boolean {
  return `${app.name} ${app.description ?? ''}`.toLowerCase().includes(query)
}

export function AppLauncher({ sections }: { sections: LauncherSection[] }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const shown = useMemo(
    () => sections.map((s) => ({ ...s, apps: query ? s.apps.filter((a) => matches(a, query)) : s.apps })),
    [sections, query],
  )
  const total = shown.reduce((n, s) => n + s.apps.length, 0)

  return (
    <>
      <div className="mb-12 max-w-md">
        <label htmlFor="app-search" className="sr-only">
          Search apps
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-muted"
          >
            <path d="M8.5 3a5.5 5.5 0 0 1 4.38 8.82l3.65 3.65a.75.75 0 1 1-1.06 1.06l-3.65-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          </svg>
          <input
            id="app-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps, like fuel, forms or Zoho"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-paper py-3 pl-10 pr-4 text-[15px] placeholder:text-muted/70 focus:border-brand focus:outline-none"
          />
        </div>
      </div>

      {query && total === 0 ? (
        <p className="text-muted">
          No app matches “{q.trim()}”. Try the app’s name, like ERP, Forms or Zoho.
        </p>
      ) : null}

      <div className="space-y-16">
        {shown.map((s) => {
          if (query && s.apps.length === 0) return null
          const internal = s.apps.filter((a) => !a.external)
          const external = s.apps.filter((a) => a.external)
          return (
            <section key={s.dept} aria-labelledby={`dept-${s.dept}`}>
              <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <h2 id={`dept-${s.dept}`} className="text-3xl font-semibold tracking-tight stretch-wide sm:text-4xl">
                  {s.label}
                </h2>
                <p className="shrink-0 text-sm text-muted">
                  {s.apps.length} {s.apps.length === 1 ? 'app' : 'apps'}
                </p>
              </div>
              {s.apps.length === 0 ? (
                <p className="text-muted">
                  Nothing has been added for {s.label} yet. Ask IT to add the tools your team uses.
                </p>
              ) : (
                <div className="space-y-8">
                  <TileGroup title="TruckSoft apps" apps={internal} />
                  <TileGroup title="Other tools" apps={external} />
                </div>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}

function TileGroup({ title, apps }: { title: string; apps: LauncherApp[] }) {
  if (apps.length === 0) return null
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-muted">{title}</h3>
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <li key={app.id}>
            <Tile app={app} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tile({ app }: { app: LauncherApp }) {
  const newTab = !app.url.startsWith('/')
  const status = app.comingSoon ? 'Coming soon' : SIGN_IN_HINT[app.signIn] ?? ''
  const body = (
    <>
      <AppIcon name={app.name} logo={app.logo} dimmed={app.comingSoon} />
      <span className="min-w-0 pt-0.5">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold leading-tight">
          {app.name}
          {app.headOnly ? (
            <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-medium text-muted">
              Heads only
            </span>
          ) : null}
        </span>
        {app.description ? (
          <span className="mt-1 block text-sm leading-snug text-muted">{app.description}</span>
        ) : null}
        {status ? (
          <span className={`mt-1 block text-xs ${app.comingSoon ? 'font-medium text-ink/70' : 'text-muted/80'}`}>
            {status}
          </span>
        ) : null}
      </span>
    </>
  )

  if (app.comingSoon) {
    return (
      <div aria-disabled="true" className="flex gap-4 rounded-2xl p-3">
        {body}
      </div>
    )
  }
  return (
    <a
      href={app.url}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      className="flex gap-4 rounded-2xl p-3 transition-colors hover:bg-paper"
    >
      {body}
      {newTab ? <span className="sr-only">(opens in a new tab)</span> : null}
    </a>
  )
}
