import path from "node:path"
import { fileURLToPath } from "node:url"

/** Directory containing this config and `package.json` (fixes Turbopack inferring `./app` as the root on some setups). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** Suppresses stale-data warnings from `baseline-browser-mapping` when resolved from node_modules. */
process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA = "true"
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "true"

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
