import { redirect } from 'next/navigation'

/** Dev-only entry: cookie must be set in a Route Handler. */
export default async function DevLoginPage() {
  if (process.env.ALLOW_DEV_LOGIN !== '1') {
    redirect('/login?error=dev_login_disabled')
  }
  redirect('/api/auth/dev-gate')
}
