import type { Department, Prisma } from '@prisma/client'

type SeedApp = Prisma.AppCatalogCreateManyInput

/** Default tiles aligned with docs/APP_CATALOG.md */
export const DEFAULT_APPS: SeedApp[] = [
  { name: 'ERP Admin', url: 'https://erp.trucksoft.com.ng/', departments: ['OPERATIONS', 'FINANCE', 'MAINTENANCE', 'IT', 'HR'] as Department[], sortOrder: 10, description: 'Central operations dashboard' },
  { name: 'Driver App', url: 'https://driver.trucksoft.com.ng/', departments: ['OPERATIONS', 'IT'] as Department[], sortOrder: 20, description: 'Driver PWA' },
  { name: 'AxleTIQ', url: 'https://axletiq.trucksoft.com.ng/', departments: ['MAINTENANCE', 'IT'] as Department[], sortOrder: 30, description: 'Fleet maintenance & work orders' },
  { name: 'PayFlow', url: 'https://payflow.trucksoft.com.ng/', departments: ['FINANCE', 'IT'] as Department[], sortOrder: 40, description: 'Supplier payments' },
  { name: 'Forms', url: 'https://forms.trucksoft.com.ng/', departments: ['HR', 'IT', 'OPERATIONS'] as Department[], sortOrder: 50, description: 'Internal & external forms' },
  { name: 'Recruitment', url: 'https://recruitment.trucksoft.com.ng/', departments: ['HR', 'IT'] as Department[], sortOrder: 60, description: 'Assessment platform' },
  { name: 'CMSv6 Telematics', url: 'https://cms.trucksoft.com.ng/', departments: ['TELEMATICS', 'IT', 'OPERATIONS'] as Department[], sortOrder: 70, description: 'Vehicle telematics', external: true },
  { name: 'MDVR Video', url: 'https://mdvr.trucksoft.com.ng/', departments: ['TELEMATICS', 'IT'] as Department[], sortOrder: 80, description: 'Live / playback video', external: true },
  { name: 'ProjectHub', url: 'https://projecthub.trucksoft.com.ng/', departments: ['IT'] as Department[], sortOrder: 90, description: 'Planning & stand-ups' },
  { name: 'API Health', url: 'https://api.trucksoft.com.ng/api/v1/health/ready', departments: ['IT'] as Department[], sortOrder: 100, description: 'ERP API readiness' },
]
