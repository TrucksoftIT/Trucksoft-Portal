import type { Department, Prisma } from '@prisma/client'

type SeedApp = Prisma.AppCatalogCreateManyInput

const ALL: Department[] = ['OPERATIONS', 'MAINTENANCE', 'FINANCE', 'HR', 'IT', 'TELEMATICS']

/**
 * Portal app catalog — mirrors docs/APP_CATALOG.md (trucksoft-platform repo).
 *
 * Fields:
 *  - departments: which department sections show the tile.
 *  - headOnlyIn:  departments where only heads (and admins) see it.
 *  - itOnly:      only the IT department (or admins) see it.
 *  - signIn:      ERP_TOKEN (ERP login) | SSO (Zoho) | OWN_LOGIN (the app's own
 *                 login) | VAULT | NONE — shown on the tile as a hint.
 *  - external:    third-party / vendor tool, grouped under "Other tools".
 *  - comingSoon:  not hosted yet — rendered disabled, never a dead link.
 *  - logo:        TruckSoft apps use a chariot-mark colour (one per product;
 *                 ERP modules share the ERP blue). TruckSoft-branded vendor
 *                 platforms use the white mark. Pure third-party SaaS gets
 *                 no logo (monogram) so the TruckSoft mark isn't lent out.
 *
 * Seeding upserts by name and deactivates rows no longer listed here.
 */
export const DEFAULT_APPS: SeedApp[] = [
  // ── TruckSoft apps (Operations first) ─────────────────────────────────────
  {
    name: 'Operations ERP',
    url: 'https://erp.trucksoft.com.ng/',
    description: 'Trips, fuel, drivers, trucks and daily operations records',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['OPERATIONS', 'IT'],
    sortOrder: 10,
  },
  {
    name: 'Driver App',
    url: 'https://driver.trucksoft.com.ng/',
    description: 'Drivers stamp trip steps, fuel, loading and deliveries',
    logo: '/logos/chariot-green.png',
    signIn: 'ERP_TOKEN',
    departments: ['OPERATIONS', 'IT'],
    sortOrder: 20,
  },
  {
    name: 'Driver Learning',
    url: 'https://learn.trucksoft.com.ng/',
    description: 'Driver training courses and progress',
    logo: '/logos/chariot-yellow.png',
    signIn: 'OWN_LOGIN',
    departments: ['OPERATIONS', 'HR', 'IT'],
    comingSoon: true, // host TBD in APP_CATALOG.md
    sortOrder: 30,
  },
  {
    name: 'AxleTIQ',
    url: 'https://axletiq.trucksoft.com.ng/',
    description: 'Maintenance requests, work orders and fleet health',
    logo: '/logos/chariot-orange.png',
    signIn: 'OWN_LOGIN',
    departments: ['OPERATIONS', 'MAINTENANCE', 'IT'],
    sortOrder: 40,
  },
  {
    name: 'Forms',
    url: 'https://forms.trucksoft.com.ng/',
    description: 'Checklists, requests and reports',
    logo: '/logos/chariot-purple.png',
    signIn: 'OWN_LOGIN',
    departments: ['OPERATIONS', 'HR', 'IT'],
    sortOrder: 50,
  },
  {
    name: 'ProjectHub',
    url: 'https://trucksoft-projecthub-topaz.vercel.app/', // moves to projecthub.trucksoft.com.ng
    description: 'Projects, tasks and stand-ups',
    logo: '/logos/chariot-red.png',
    signIn: 'OWN_LOGIN',
    departments: ['OPERATIONS', 'IT'],
    sortOrder: 60,
  },
  {
    name: 'AgentDesk',
    url: 'https://agentdesk.trucksoft.com.ng/',
    description: 'AI assistant for operations questions and tasks',
    logo: '/logos/chariot-black.png',
    signIn: 'ERP_TOKEN',
    departments: ['OPERATIONS', 'IT'],
    comingSoon: true, // host TBD
    sortOrder: 70,
  },
  {
    name: 'Integrations',
    url: 'https://erp.trucksoft.com.ng/integrations',
    description: 'Connected systems and their sync status',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['OPERATIONS', 'IT'],
    headOnlyIn: ['OPERATIONS'],
    sortOrder: 80,
  },
  {
    name: 'AI Insights',
    url: 'https://erp.trucksoft.com.ng/ai-insights',
    description: 'Ask questions about fleet and trip data',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['OPERATIONS', 'IT'],
    headOnlyIn: ['OPERATIONS'],
    sortOrder: 90,
  },
  {
    name: 'API Health',
    url: 'https://api.trucksoft.com.ng/api/v1/health/ready',
    description: 'Is the TruckSoft API up and connected to its database',
    logo: '/logos/chariot-black.png',
    signIn: 'NONE',
    departments: ['OPERATIONS', 'IT'],
    itOnly: true,
    sortOrder: 95,
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  {
    name: 'ERP Maintenance',
    url: 'https://erp.trucksoft.com.ng/maintenance',
    description: 'Maintenance jobs, tyres and tools',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['MAINTENANCE', 'IT'],
    sortOrder: 210,
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    name: 'ERP Finance',
    url: 'https://erp.trucksoft.com.ng/finance',
    description: 'Finance requests, invoices and cashflow',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['FINANCE', 'IT'],
    sortOrder: 310,
  },
  {
    name: 'Budget',
    url: 'https://erp.trucksoft.com.ng/budget',
    description: 'Department budgets synced with Zoho Books',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['FINANCE', 'IT'],
    comingSoon: true, // ERP /budget page not shipped yet
    sortOrder: 320,
  },
  {
    name: 'PayFlow',
    url: 'https://payflow.trucksoft.com.ng/',
    description: 'Supplier payments and approvals',
    logo: '/logos/chariot-green.png',
    signIn: 'OWN_LOGIN',
    departments: ['FINANCE', 'IT'],
    sortOrder: 330,
  },

  // ── HR ────────────────────────────────────────────────────────────────────
  {
    name: 'Recruitment',
    url: 'https://recruitment.trucksoft.com.ng/',
    description: 'Candidate assessments and hiring',
    logo: '/logos/chariot-red.png',
    signIn: 'OWN_LOGIN',
    departments: ['HR', 'IT'],
    sortOrder: 410,
  },

  // ── IT ────────────────────────────────────────────────────────────────────
  {
    name: 'Portal Admin',
    url: '/admin',
    description: 'Staff accounts, departments and access levels',
    logo: '/logos/chariot-black.png',
    signIn: 'NONE',
    departments: ['IT'],
    sortOrder: 510,
  },
  {
    name: 'Support Tickets',
    url: 'https://support.trucksoft.com.ng/',
    description: 'Report IT and telematics problems and follow the fix',
    logo: '/logos/chariot-black.png',
    signIn: 'OWN_LOGIN',
    departments: ALL,
    comingSoon: true, // IT/Telematics support app, being built
    sortOrder: 75,
  },
  {
    name: 'Ideas',
    url: 'https://erp.trucksoft.com.ng/ideas',
    description: 'Suggest and vote on improvements',
    logo: '/logos/chariot-blue.png',
    signIn: 'ERP_TOKEN',
    departments: ['IT'],
    sortOrder: 530,
  },

  // ── Vendor platforms on TruckSoft hosts ────────────────────────────────────
  {
    name: 'Telematics',
    url: 'https://telematics.trucksoft.com.ng/',
    description: 'Live vehicle tracking, routes and trip history',
    logo: '/logos/chariot-white.png',
    signIn: 'OWN_LOGIN',
    departments: ['OPERATIONS', 'TELEMATICS', 'IT'],
    external: true,
    sortOrder: 610,
  },
  {
    name: 'CMSv6',
    url: 'https://cms.trucksoft.com.ng/',
    description: 'Dashcam video, alarms and driver monitoring',
    logo: '/logos/chariot-white.png',
    signIn: 'OWN_LOGIN',
    departments: ['OPERATIONS', 'TELEMATICS', 'IT'],
    external: true,
    sortOrder: 620,
  },
  {
    name: 'MDVR Video',
    url: 'https://mdvr.trucksoft.com.ng/',
    description: 'Live and recorded dashcam playback',
    logo: '/logos/chariot-white.png',
    signIn: 'OWN_LOGIN',
    departments: ['TELEMATICS', 'IT'],
    external: true,
    sortOrder: 630,
  },
  {
    name: 'Telematics Inventory',
    url: 'https://inventory.trucksoft.com.ng/',
    description: 'Tracker devices and SIM cards',
    logo: '/logos/chariot-white.png',
    signIn: 'NONE',
    departments: ['TELEMATICS', 'IT'],
    comingSoon: true, // host TBD
    sortOrder: 640,
  },

  // ── Third-party SaaS ──────────────────────────────────────────────────────
  {
    name: 'Zoho Workplace',
    url: 'https://workplace.zoho.com/',
    description: 'Company mail, calendar and documents',
    signIn: 'SSO',
    departments: ALL,
    external: true,
    sortOrder: 710,
  },
  {
    name: 'SeamlessHR',
    url: 'https://trucksoftlimited.seamlesshrms.com/',
    description: 'Leave, payslips and HR requests',
    signIn: 'OWN_LOGIN',
    departments: ALL,
    external: true,
    sortOrder: 720,
  },
  {
    name: 'Zoho Books',
    url: 'https://books.zoho.com/',
    description: 'Invoices, bills and company accounts',
    signIn: 'SSO',
    departments: ['OPERATIONS', 'FINANCE', 'IT'],
    headOnlyIn: ['OPERATIONS'],
    external: true,
    sortOrder: 730,
  },
]

/** Demo personas for the one-click demo sign-in (DEMO_LOGIN=1). */
export const DEMO_PERSONAS = [
  {
    username: 'demo.ops.staff',
    displayName: 'Operations staff (demo)',
    departments: ['OPERATIONS'] as Department[],
    level: 'STAFF' as const,
  },
  {
    username: 'demo.ops.head',
    displayName: 'Head of Operations (demo)',
    departments: ['OPERATIONS'] as Department[],
    level: 'HEAD' as const,
  },
]
