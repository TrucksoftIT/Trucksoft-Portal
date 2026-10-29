/* eslint-disable @next/next/no-img-element -- static brand mark */
import Link from 'next/link'

/** Chariot mark + product name, linking home. */
export function Brand({ href = '/hub' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg">
      <img src="/logos/chariot-blue.png" alt="" width={30} height={30} />
      <span className="text-lg font-semibold tracking-tight stretch-semi">TruckSoft Portal</span>
    </Link>
  )
}
