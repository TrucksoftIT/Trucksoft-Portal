const accounts = () => process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com'

export function zohoAuthorizeUrl(state: string): string {
  const clientId = process.env.ZOHO_CLIENT_ID
  const redirect = process.env.ZOHO_REDIRECT_URI
  if (!clientId || !redirect) throw new Error('ZOHO_CLIENT_ID / ZOHO_REDIRECT_URI not set')
  const u = new URL(`${accounts()}/oauth/v2/auth`)
  u.searchParams.set('scope', 'AaaServer.profile.READ')
  u.searchParams.set('client_id', clientId)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('access_type', 'offline')
  u.searchParams.set('redirect_uri', redirect)
  u.searchParams.set('state', state)
  return u.toString()
}

export async function exchangeZohoCode(code: string): Promise<{ email: string; sub?: string }> {
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  const redirect = process.env.ZOHO_REDIRECT_URI
  if (!clientId || !clientSecret || !redirect) throw new Error('Zoho OAuth env incomplete')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirect,
    code,
  })
  const tokenRes = await fetch(`${accounts()}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!tokenRes.ok) throw new Error(`Zoho token exchange failed: ${tokenRes.status}`)
  const tokenJson = (await tokenRes.json()) as { access_token?: string }
  if (!tokenJson.access_token) throw new Error('Zoho token missing')

  const profileRes = await fetch(`${accounts()}/oauth/user/info`, {
    headers: { Authorization: `Zoho-oauthtoken ${tokenJson.access_token}` },
  })
  if (!profileRes.ok) throw new Error(`Zoho profile failed: ${profileRes.status}`)
  const profile = (await profileRes.json()) as { Email?: string; email?: string; ZUID?: string }
  const email = (profile.Email || profile.email || '').toLowerCase()
  if (!email) throw new Error('Zoho profile has no email')
  return { email, sub: profile.ZUID ? String(profile.ZUID) : undefined }
}
