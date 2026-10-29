import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'node:crypto'
import { DEFAULT_APPS, DEMO_PERSONAS } from '../src/lib/catalog-seed'

const prisma = new PrismaClient()

// Fields a catalog entry may omit; reset them on update so removing e.g.
// comingSoon from the seed actually takes effect on an existing row.
const APP_DEFAULTS = {
  description: null,
  icon: null,
  logo: null,
  headOnlyIn: [],
  itOnly: false,
  external: false,
  comingSoon: false,
  sortOrder: 0,
  active: true,
}

async function main() {
  for (const app of DEFAULT_APPS) {
    const data = { ...APP_DEFAULTS, ...app }
    const existing = await prisma.appCatalog.findFirst({ where: { name: app.name } })
    if (existing) {
      await prisma.appCatalog.update({ where: { id: existing.id }, data })
    } else {
      await prisma.appCatalog.create({ data })
    }
  }
  const retired = await prisma.appCatalog.updateMany({
    where: { name: { notIn: DEFAULT_APPS.map((a) => a.name) }, active: true },
    data: { active: false },
  })

  // Demo personas: no usable PIN (random hash), only reachable via /api/auth/demo.
  for (const p of DEMO_PERSONAS) {
    await prisma.user.upsert({
      where: { username: p.username },
      update: { displayName: p.displayName, departments: p.departments, level: p.level, isDemo: true, isAdmin: false },
      create: {
        ...p,
        pinHash: await bcrypt.hash(randomBytes(24).toString('hex'), 12),
        allowedZohoEmails: [],
        isDemo: true,
        isAdmin: false,
      },
    })
  }

  // In production the admin PIN must come from the host (.env PORTAL_ADMIN_PIN):
  // a default PIN written in this repo would let anyone in once PIN-only
  // sign-in is on. Locally the old default is kept for convenience.
  const adminUser = 'portal.admin'
  const adminPin =
    process.env.PORTAL_ADMIN_PIN || (process.env.NODE_ENV === 'production' ? '' : 'change-me-now')
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUser } })
  if (!existingAdmin && !adminPin) {
    console.log('Skipped portal.admin: set PORTAL_ADMIN_PIN on the host to create it')
  } else if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUser,
        displayName: 'Portal Admin',
        pinHash: await bcrypt.hash(adminPin, 12),
        departments: ['IT'],
        allowedZohoEmails: [],
        isAdmin: true,
      },
    })
    console.log(`Created ${adminUser} (PIN from ${process.env.PORTAL_ADMIN_PIN ? 'PORTAL_ADMIN_PIN' : 'local default'})`)
  }

  console.log(
    `Seeded ${DEFAULT_APPS.length} catalog apps (${retired.count} retired), ${DEMO_PERSONAS.length} demo personas`,
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
