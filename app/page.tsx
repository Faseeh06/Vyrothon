import { HeroSection } from "@/components/hero-section"
import { WorkSection } from "@/components/work-section"
import { ColophonSection } from "@/components/colophon-section"
import { HomeSideNav } from "@/components/home-side-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Page() {
  return (
    <main className="relative min-h-screen">
      <div className="fixed right-4 top-4 z-50 md:hidden">
        <ThemeToggle />
      </div>
      <HomeSideNav />
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10">
        <HeroSection />
        <WorkSection />
        <ColophonSection />
      </div>
    </main>
  )
}
