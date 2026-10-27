import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_APPS } from '../src/lib/catalog-seed'

const prisma = new PrismaClient()

async function main() {
  for (const app of DEFAULT_APPS) {
    const existing = await prisma.appCatalog.findFirst({ where: { name: app.name } })
    if (existing) {
      await prisma.appCatalog.update({ where: { id: existing.id }, data: app })
    } else {
      await prisma.appCatalog.create({ data: app })
    }
  }

  const adminUser = 'portal.admin'
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUser } })
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUser,
        displayName: 'Portal Admin',
        pinHash: await bcrypt.hash('change-me-now', 12),
        departments: ['IT'],
        allowedZohoEmails: [],
        isAdmin: true,
      },
    })
    console.log('Created portal.admin — set PIN via admin UI; default PIN change-me-now')
  }

  // Demo shared-mailbox binding example (disabled by default — enable by setting emails)
  console.log(`Seeded ${DEFAULT_APPS.length} catalog apps`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
