import HeroSection from '../components/HeroSection'
import EverythingYouNeed from '../components/EverythingYouNeed'
import FAQ from '../components/FAQ'

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Authentication */}
      <section id="hero">
        <HeroSection />
      </section>

      {/* Everything You Need Section */}
      <section>
        <EverythingYouNeed />
      </section>

      {/* FAQ Section */}
      <section id="faq">
        <FAQ />
      </section>
    </div>
  )
}

export default HomePage

