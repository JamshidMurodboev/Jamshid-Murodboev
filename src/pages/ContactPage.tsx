import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Send, Search, MessageCircle, FileText, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Browse Opportunities',
    description: 'Explore our scholarships and universities directory to find programs that match your goals and academic background.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Send,
    title: 'Contact on Telegram',
    description: 'Reach out to Jamshid directly on Telegram. Share your academic background and aspirations.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: MessageCircle,
    title: 'Get Personalized Guidance',
    description: 'Receive a tailored strategy — which scholarships to apply for, how to write your motivation letter, and what documents to prepare.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: FileText,
    title: 'Submit Your Application',
    description: 'Apply with confidence. Jamshid reviews every document and provides feedback before submission.',
    color: 'bg-purple-100 text-purple-600',
  },
]

const faqs = [
  {
    q: 'Who can benefit from your consulting services?',
    a: 'Primarily Uzbek students who want to study abroad — whether seeking fully-funded scholarships or affordable tuition-based universities, especially in Turkey and beyond.',
  },
  {
    q: 'Do I need a high GPA to apply for scholarships?',
    a: 'A strong GPA helps, but many scholarships weigh motivation letters, extracurricular activities, and leadership experience heavily. We work with students across a range of academic backgrounds.',
  },
  {
    q: 'How long does the application process take?',
    a: 'It varies by scholarship. Türkiye Bursları, for example, opens applications in January–February. We recommend starting preparation 3–6 months before the deadline.',
  },
  {
    q: 'Is the consultation service free?',
    a: 'Initial guidance and information is free. For full end-to-end application support (document review, motivation letter coaching, interview prep), please reach out on Telegram to discuss details.',
  },
]

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Start Your Journey Today</h1>
          <p className="text-slate-300 text-lg mb-10">
            The fastest way to reach Jamshid is via Telegram. Get a response within hours.
          </p>
          <a
            href="https://t.me/jamshidmurodboev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl px-10 py-5 rounded-2xl shadow-2xl transition-colors duration-200"
          >
            <Send className="h-6 w-6" />
            Open Telegram Chat
          </a>
          <p className="text-slate-400 text-sm mt-4">@jamshidmurodboev · Responds within a few hours</p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">A simple, clear process from first contact to acceptance letter</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, idx) => (
              <div key={step.title} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.color}`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-amber-500 py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Don't Wait — Deadlines Come Fast</h2>
          <p className="text-amber-100 mb-8">
            Start preparing now. The students who reach out earliest have the best outcomes.
          </p>
          <a
            href="https://t.me/jamshidmurodboev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-amber-600 font-bold px-8 py-4 rounded-xl hover:bg-amber-50 transition-colors shadow-lg"
          >
            <Send className="h-5 w-5" />
            Contact on Telegram
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
