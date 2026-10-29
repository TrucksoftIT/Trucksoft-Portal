/**
 * Bulk staff-account seeding from Google Form responses.
 *
 * Run (from web/):
 *   DATABASE_URL="postgresql://portal:portal@127.0.0.1:5545/trucksoft_portal?schema=public" \
 *     npx tsx prisma/seed-from-form.ts prisma/form-responses.json
 *
 * Input JSON = array of form rows. Field mapping (Google Form -> Portal schema):
 *   fullName         -> User.displayName
 *   preferredUsername-> User.username            (lower-cased, trimmed; unique)
 *   zohoEmail        -> User.allowedZohoEmails[] (Layer-A binding + candidate list)
 *   primaryDept      -> User.departments[0]      (free text normalised to Department enum)
 *   otherDepts[]     -> User.departments[1..]    (same normalisation)
 *   tempPin          -> bcrypt(12) -> User.pinHash  (random 6-digit if omitted)
 *   isAdmin          -> User.isAdmin             (default false)
 *   isHead / jobTitle-> User.level               (HEAD if isHead, or jobTitle says "Head"/"HOD"; else STAFF)
 *   personalEmail    -> NOT a schema column; recorded in an AuditLog meta row only (see GAP note)
 *   appAccessGrid    -> NOT representable today; tile visibility is department-based.
 *                       (see GAP note at bottom — needs a UserAppGrant table to honour per-app levels)
 *
 * Idempotent: upserts by username. Re-running updates departments/emails/admin but
 * only resets the PIN when a tempPin is supplied (so you don't clobber a PIN the
 * user already changed). Temp PINs are printed to stdout ONLY — never written to git.
 */
import { PrismaClient, type Department } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'node:fs'

const prisma = new PrismaClient()

const DEPT_ALIASES: Record<string, Department> = {
  operations: 'OPERATIONS', ops: 'OPERATIONS',
  maintenance: 'MAINTENANCE', workshop: 'MAINTENANCE',
  finance: 'FINANCE', accounts: 'FINANCE', accounting: 'FINANCE',
  hr: 'HR', 'human resources': 'HR', people: 'HR',
  it: 'IT', ict: 'IT', 'information technology': 'IT',
  telematics: 'TELEMATICS', tracking: 'TELEMATICS',
}

function toDept(raw: string): Department {
  const key = (raw || '').trim().toLowerCase()
  const d = DEPT_ALIASES[key]
  if (!d) throw new Error(`Unknown department "${raw}" — add it to DEPT_ALIASES`)
  return d
}

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6 digits
}

type FormRow = {
  fullName: string
  preferredUsername: string
  zohoEmail: string
  personalEmail?: string
  primaryDept: string
  otherDepts?: string[]
  tempPin?: string
  isAdmin?: boolean
  isHead?: boolean
  jobTitle?: string
  appAccessGrid?: Record<string, string> // documented, NOT persisted yet (GAP)
}

function toLevel(r: FormRow): 'STAFF' | 'HEAD' {
  return r.isHead || /\b(head|hod)\b/i.test(r.jobTitle || '') ? 'HEAD' : 'STAFF'
}

async function main() {
  const file = process.argv[2]
  if (!file) throw new Error('Usage: tsx prisma/seed-from-form.ts <responses.json>')
  const rows: FormRow[] = JSON.parse(readFileSync(file, 'utf8'))

  for (const r of rows) {
    const username = (r.preferredUsername || '').trim().toLowerCase()
    if (!username || !r.fullName || !r.zohoEmail || !r.primaryDept) {
      console.warn(`SKIP (missing required field): ${JSON.stringify(r)}`)
      continue
    }
    if (!r.zohoEmail.trim().toLowerCase().endsWith('@trucksoft.com.ng')) {
      console.warn(`SKIP (non-company Zoho email): ${username} <${r.zohoEmail}>`)
      continue
    }

    const departments = Array.from(
      new Set([toDept(r.primaryDept), ...(r.otherDepts || []).map(toDept)]),
    )
    const allowedZohoEmails = [r.zohoEmail.trim().toLowerCase()]
    const tempPin = (r.tempPin || '').trim() || randomPin()
    const generated = !(r.tempPin && r.tempPin.trim())
    const pinHash = await bcrypt.hash(tempPin, 12)

    const level = toLevel(r)
    const existing = await prisma.user.findUnique({ where: { username } })
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        displayName: r.fullName,
        departments,
        level,
        allowedZohoEmails,
        isAdmin: Boolean(r.isAdmin),
        disabledAt: null,
        // only reset PIN if operator explicitly supplied one in the row
        ...(r.tempPin && r.tempPin.trim() ? { pinHash } : {}),
      },
      create: {
        username,
        displayName: r.fullName,
        pinHash,
        departments,
        level,
        allowedZohoEmails,
        isAdmin: Boolean(r.isAdmin),
      },
    })

    await prisma.auditLog.create({
      data: {
        username,
        action: existing ? 'form_seed_update' : 'form_seed_create',
        userId: user.id,
        meta: {
          zohoEmail: allowedZohoEmails[0],
          personalEmail: r.personalEmail || null, // only place personalEmail lands today
          departments,
          appAccessGridRequested: r.appAccessGrid || null, // captured for audit; NOT enforced (GAP)
        },
      },
    })

    const pinNote =
      existing && !(r.tempPin && r.tempPin.trim())
        ? 'PIN unchanged (existing user, no tempPin given)'
        : `TEMP PIN = ${tempPin}${generated ? ' (generated)' : ''}`
    console.log(
      `${existing ? 'UPDATED' : 'CREATED'} ${username} [${departments.join(',')}] level=${level} admin=${user.isAdmin}  ${pinNote}`,
    )
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

/*
 * GAP — per-app access grid is not representable in the current schema.
 * AppCatalog tiles are shown purely by Department overlap (hub/page.tsx).
 * To honour a per-app access-level grid (e.g. view / edit / admin per app),
 * add a join model, e.g.:
 *
 *   model UserAppGrant {
 *     id      String @id @default(cuid())
 *     userId  String
 *     appId   String
 *     level   String            // VIEW | EDIT | ADMIN
 *     user    User       @relation(fields: [userId], references: [id])
 *     app     AppCatalog @relation(fields: [appId], references: [id])
 *     @@unique([userId, appId])
 *   }
 *
 * and filter tiles by grant in hub/page.tsx. Until then, appAccessGrid from the
 * form is only captured in AuditLog.meta for later back-fill.
 */
