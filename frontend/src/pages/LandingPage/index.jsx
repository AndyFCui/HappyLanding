/**
 * [INPUT]: 无（组合所有 Landing Sections）
 * [OUTPUT]: 完整落地页内容（不含 Header/Footer）
 * [POS]: Pages - Landing Page
 * [PROTOCOL]: 变更时更新此头部，然后检查 pages/LandingPage/CLAUDE.md
 */
import { Hero } from '@/components/landing/Hero'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorks } from '@/components/landing/HowItWorks'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <FeaturesSection id="features" />
      <HowItWorks />
    </>
  )
}