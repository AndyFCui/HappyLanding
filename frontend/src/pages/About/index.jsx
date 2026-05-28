/**
 * [INPUT]: 无
 * [OUTPUT]: 关于我们页面
 * [POS]: Pages - About
 * [PROTOCOL]: 变更时更新此头部，然后检查 pages/About/CLAUDE.md
 */
import { Hero } from '@/components/landing/Hero'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { HowItWorks } from '@/components/landing/HowItWorks'

export default function About() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <FeaturesSection id="features" />
      <HowItWorks />
    </>
  )
}