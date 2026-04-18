import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Builder · CipherStack",
  description: "Compose cipher nodes, encrypt and decrypt, and inspect intermediate outputs.",
}

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return children
}
