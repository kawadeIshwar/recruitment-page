import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    question: 'Is this ATS made only for recruitment consultancies?',
    answer: 'Yes. This alabty module is purpose-built exclusively for recruitment firms, not internal HR teams. It covers clients, requisitions, candidates, recruiters, and closures end to end.'
  },
  {
    question: 'Can I manage the entire recruitment process on one platform?',
    answer: 'Yes. You can manage everything from new applications, sourcing, screening, interviews, submissions, task tracking, to final closures through a single dashboard that supports informed decision-making.'
  },
  {
    question: 'How does AI auto-telephonic screening help recruiters?',
    answer: 'The system automatically calls candidates, asks screening questions, records responses, and updates candidate status, saving hours of manual calling. It uses human-like voice interactions, supports multiple languages, enables intelligent decision-making, and can automatically call back when requested by candidates.'
  },
  {
    question: 'Does the platform support interview scheduling?',
    answer: 'Yes. Interview scheduling is integrated with platforms such as Microsoft Teams, Google Meet, and calendars to seamlessly coordinate between candidates, recruiters, and clients.'
  },
  {
    question: 'Can I upload my resume database, and reuse resumes for future roles?',
    answer: 'Yes. You can securely upload your existing resume database. The system supports bulk uploads of up to 1,000 resumes at a time and allows multiple batch uploads simultaneously. All resumes are stored in your local talent pool with keyword search, 20+ filters, and duplication control, enabling easy attachment to requisitions.'
  },
  {
    question: 'Will candidates receive automatic updates?',
    answer: 'Yes. Candidates receive automated email notifications whenever their application stage changes. All communications can be sent using your brand name and official email ID.'
  },
  {
    question: 'Can I generate client-ready resumes from the ATS?',
    answer: 'Yes. The platform instantly generates ATS-friendly, branded, and masked resumes for faster and more professional client submissions.'
  },
  {
    question: 'How can I track recruiter performance and productivity?',
    answer: 'The system tracks recruiter activity in real time, including time spent, tasks completed, number of resumes submitted, and client shortlisting ratios.'
  },
  {
    question: 'Is task management available for recruitment teams?',
    answer: 'Yes. Tasks can be created, assigned, tracked, closed, and reopened, with the option to link them to specific candidates or requisitions.'
  },
  {
    question: 'How many user accounts do I get after purchasing the product?',
    answer: 'You receive one Super Admin account, from which you can create Admin and Recruiter accounts. Currently, the system supports up to 20 recruiter accounts.'
  },
  {
    question: 'Does alabty support mass mailing to candidates?',
    answer: 'Yes. You can send bulk emails to candidates for hiring drives and communications directly from your official email ID.'
  },
  {
    question: 'Are job boards integrated with the ATS?',
    answer: 'Yes. You can post jobs and manage applications from integrated job boards within a single platform.'
  },
  {
    question: 'Can resumes be customized as per client requirements?',
    answer: 'Yes. Resume branding and submission formats can be customized to match individual client preferences.'
  },
  {
    question: 'Does the platform offer role-based access?',
    answer: 'Yes. Role-based access is available for Owners, Admins, and Recruiters with defined permissions.'
  },
  {
    question: 'Can recruiter time and effort be tracked?',
    answer: 'Yes. Built-in time tracking and performance analytics provide clear insights into recruiter productivity and efficiency.'
  }
]

const FAQ = () => {
  const [openRow, setOpenRow] = useState(null) // track row so both columns in row open together
  const sectionRef = useRef(null)
  const isInView = true

  const toggleFAQ = (index) => {
    const row = Math.floor(index / 2)
    setOpenRow(openRow === row ? null : row)
  }

  return (
    <section ref={sectionRef} className="relative py-16 bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
        
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Find answers to common questions about our platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, index) => {
            const row = Math.floor(index / 2)
            const isOpen = openRow === row
            return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={`bg-white border-2 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group ${
                isOpen ? 'border-gray-200' : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none transition-colors duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 group-hover:bg-gradient-to-r group-hover:from-blue-50/30 group-hover:to-purple-50/30"
                aria-expanded={isOpen}
              >
                <span className="text-lg font-semibold text-gray-900 pr-8 group-hover:text-primary transition-colors">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3, type: "spring" }}
                  className={`flex-shrink-0 p-2 rounded-full ${
                    isOpen 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary'
                  } transition-colors duration-200`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 text-gray-700 leading-relaxed border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/50">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )})}
        </div>
      </div>
    </section>
  )
}

export default FAQ

