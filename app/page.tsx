import { HeroSection } from "@/components/hero-section"
import { WorkSection } from "@/components/work-section"
import { ColophonSection } from "@/components/colophon-section"
import { HomeSideNav } from "@/components/home-side-nav"

export default function Page() {
  return (
    <main className="relative min-h-screen">
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
