import type { AccessLevel, AppCatalog, Department } from '@prisma/client'

export type Viewer = {
  departments: Department[]
  level: AccessLevel
  isAdmin: boolean
}

export const DEPARTMENTS: Department[] = ['OPERATIONS', 'MAINTENANCE', 'FINANCE', 'HR', 'IT', 'TELEMATICS']

export const DEPARTMENT_LABELS: Record<Department, string> = {
  OPERATIONS: 'Operations',
  MAINTENANCE: 'Maintenance',
  FINANCE: 'Finance',
  HR: 'HR',
  IT: 'IT',
  TELEMATICS: 'Telematics',
}

/**
 * Whether a tile shows in a department's section for this viewer.
 *  - the app must be active and listed for that department;
 *  - IT-only tiles need the IT department;
 *  - head-only tiles (for that department) need level HEAD.
 * Portal admins see everything.
 */
export function canSeeIn(app: AppCatalog, dept: Department, viewer: Viewer): boolean {
  if (!app.active || !app.departments.includes(dept)) return false
  if (viewer.isAdmin) return true
  if (app.itOnly && !viewer.departments.includes('IT')) return false
  if (app.headOnlyIn.includes(dept) && viewer.level !== 'HEAD') return false
  return true
}

/** Department sections in display order: a viewer's own departments, or all of them for admins. */
export function sectionsFor(apps: AppCatalog[], viewer: Viewer) {
  const depts = viewer.isAdmin ? DEPARTMENTS : DEPARTMENTS.filter((d) => viewer.departments.includes(d))
  return depts.map((dept) => ({ dept, apps: apps.filter((a) => canSeeIn(a, dept, viewer)) }))
}

/** Distinct apps a viewer can open anywhere (a tile listed in two sections counts once). */
export function countVisible(apps: AppCatalog[], viewer: Viewer): number {
  const ids = new Set<string>()
  for (const { apps: list } of sectionsFor(apps, viewer)) for (const a of list) ids.add(a.id)
  return ids.size
}
