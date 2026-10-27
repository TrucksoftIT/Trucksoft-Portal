import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { createSession, setZohoGate } from '@/lib/auth'

/** Dev-only: skip Zoho, gate as it@trucksoft.com.ng, then go to pick-user. */
export default async function DevLoginPage() {
  if (process.env.ALLOW_DEV_LOGIN !== '1') {
    redirect('/login?error=dev_login_disabled')
  }
  await setZohoGate('it@trucksoft.com.ng')
  const admin = await prisma.user.findFirst({ where: { isAdmin: true, disabledAt: null } })
  if (admin) {
    // Leave on pick-user so PIN still required
  }
  redirect('/login/pick-user')
}

// silence unused — createSession reserved if we add one-click later
void createSession
