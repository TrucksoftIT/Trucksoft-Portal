import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Lets a second local dev server (e.g. a preview on another port) use its own
  // build folder instead of fighting the first one over .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

export default nextConfig
