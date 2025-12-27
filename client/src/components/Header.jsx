import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import logo from '../assets/logo.png'

const taglines = [
  "Your Complete Recruitment Engine – Automated, Accurate, Unstoppable",
  "Transforming Hiring with Automation, Speed & Precision",
  "Transform Your Hiring with Intelligent, AI-Driven Automation"
]

const notifyHero = (mode) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('hero-toggle', { detail: mode }))
  const hero = document.getElementById('hero')
  if (hero) {
    const rect = hero.getBoundingClientRect()
    // Only scroll if hero is not already in view (user has scrolled down)
    if (rect.top < -100 || rect.bottom < 0) {
      hero.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

const Header = () => {
  const [currentTagline, setCurrentTagline] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#hero" className="flex items-center">
            <img src={logo} alt="alabty Logo" className="h-10 w-auto" />
          </a>

          {/* Desktop Tagline */}
          <div className="hidden md:flex flex-1 justify-center mx-8">
            <div className="relative h-8 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentTagline}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-sm text-gray-600 text-center whitespace-nowrap"
                >
                  {taglines[currentTagline]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault()
                notifyHero('login')
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              Login
            </a>
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault()
                notifyHero('signup')
              }}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-all duration-200 hover:shadow-md"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden pb-4 border-t border-gray-100"
            >
              <div className="pt-4 space-y-3">
                <div className="px-2 py-2 text-xs text-gray-600 text-center">
                  {taglines[currentTagline]}
                </div>
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault()
                    notifyHero('login')
                    setIsMobileMenuOpen(false)
                  }}
                  className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  Login
                </a>
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault()
                    notifyHero('signup')
                    setIsMobileMenuOpen(false)
                  }}
                  className="block px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-md text-center"
                >
                  Get Started
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header

