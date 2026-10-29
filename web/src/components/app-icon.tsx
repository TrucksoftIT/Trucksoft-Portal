/* eslint-disable @next/next/no-img-element -- tiny static PNGs; next/image adds nothing here */

type Props = {
  name: string
  logo: string | null
  size?: number
  dimmed?: boolean
}

/** Up to two letters from the app name: "Zoho Books" → "ZB", "SeamlessHR" → "SH". */
function monogram(name: string): string {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase()
  const caps = name.match(/[A-Z]/g)
  return (caps && caps.length > 1 ? caps.slice(0, 2).join('') : name.slice(0, 2)).toUpperCase()
}

/**
 * App icon chip. Coloured chariot marks sit on paper; the white mark (vendor
 * platforms on TruckSoft hosts) sits on ink; no logo means third-party SaaS,
 * shown as a monogram so the TruckSoft mark isn't lent to another company.
 */
export function AppIcon({ name, logo, size = 56, dimmed = false }: Props) {
  const onInk = logo?.endsWith('-white.png')
  const base = 'flex shrink-0 items-center justify-center rounded-[22%]'
  const tone = dimmed ? 'opacity-50 grayscale' : ''

  if (!logo) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: size * 0.32 }}
        className={`${base} ${tone} border border-line bg-paper font-semibold text-muted stretch-semi`}
      >
        {monogram(name)}
      </span>
    )
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`${base} ${tone} ${onInk ? 'bg-ink' : 'border border-line bg-paper'}`}
    >
      <img src={logo} alt="" width={size * 0.7} height={size * 0.7} />
    </span>
  )
}
