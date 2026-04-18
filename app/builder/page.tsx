import Link from "next/link"
import { CipherStackSection } from "@/components/cipher-stack-section"
import { ThemeToggle } from "@/components/theme-toggle"

export default function BuilderPage() {
  return (
    <main className="relative min-h-screen">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between gap-4 px-4 md:px-8">
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent"
          >
            ← Home
          </Link>
          <span className="font-[var(--font-bebas)] text-xl tracking-tight text-foreground md:text-2xl">
            CIPHERSTACK · BUILDER
          </span>
          <div className="flex shrink-0 items-center justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="relative z-10">
        <CipherStackSection />
      </div>
    </main>
  )
}
