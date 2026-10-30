import { NextResponse } from 'next/server'
import { appUrl } from '@/lib/app-url'
import { setZohoGate } from '@/lib/auth'

/** Dev-only Zoho-gate bypass. Sets gate cookie then redirects to pick-user. */
export async function GET() {
  if (process.env.ALLOW_DEV_LOGIN !== '1') {
    return NextResponse.redirect(
      new URL('/login?error=dev_login_disabled', appUrl()),
    )
  }
  await setZohoGate('it@trucksoft.com.ng')
  return NextResponse.redirect(
    new URL('/login/pick-user', appUrl()),
  )
}
