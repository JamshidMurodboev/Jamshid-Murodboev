import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { collection, query, where, limit, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScholarshipCard, { type Scholarship } from '../components/ScholarshipCard'
import { ArrowRight, Award, Users, Clock, Star, CheckCircle, Send } from 'lucide-react'

const stats = [
  { icon: Award, value: '5', label: 'Fully-Funded Winners', color: 'text-amber-500' },
  { icon: Users, value: '100+', label: 'University Admissions', color: 'text-blue-500' },
  { icon: Clock, value: '7+', label: 'Years Experience', color: 'text-green-500' },
]

const services = [
  {
    title: 'Scholarship Guidance',
    description:
      'Full end-to-end support for fully-funded scholarship applications — from selecting the right program to crafting a standout motivation letter.',
    features: ['Türkiye Bursları (YTB)', 'Chevening', 'DAAD', 'Chinese Government Scholarship'],
    color: 'from-amber-50 to-amber-100',
    border: 'border-amber-200',
  },
  {
    title: 'University Admissions',
    description:
      'Helping students get accepted into reputable universities in Turkey and beyond, even without scholarship — affordable, quality education.',
    features: ['Turkish universities', 'Document preparation', 'Application tracking', 'Visa guidance'],
    color: 'from-blue-50 to-blue-100',
    border: 'border-blue-200',
  },
]

const testimonials = [
  {
    name: 'Aziz Karimov',
    program: 'Türkiye Bursları 2023',
    text: 'Thanks to Jamshid\'s guidance, I won a full scholarship to Istanbul Technical University. His step-by-step support made the whole process so clear and manageable.',
    stars: 5,
  },
  {
    name: 'Nilufar Rashidova',
    program: 'Ankara University – Engineering',
    text: 'I got accepted into my dream university in Turkey. Jamshid helped me prepare every document perfectly and responded to all my questions at any hour.',
    stars: 5,
  },
  {
    name: 'Bobur Yusupov',
    program: 'Türkiye Bursları 2024',
    text: 'I had applied twice before without success. With Jamshid\'s mentorship I finally won the Türkiye Bursları scholarship. His personal experience is invaluable.',
    stars: 5,
  },
]

export default function HomePage() {
  const [featured, setFeatured] = useState<Scholarship[]>([])

  useEffect(() => {
    const fetch = async () => {
      try {
        const q = query(
          collection(db, 'scholarships'),
          where('active', '==', true),
          orderBy('createdAt', 'desc'),
          limit(3),
        )
        const snap = await getDocs(q)
        setFeatured(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scholarship)))
      } catch {
        // silently ignore — Firestore might not be configured yet
      }
    }
    fetch()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-amber-500/20 text-amber-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-amber-500/30">
              🏆 Türkiye Bursları Scholar
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Win Your{' '}
              <span className="text-amber-400">Dream Scholarship</span>{' '}
              Abroad
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              I'm Jamshid — a Türkiye Bursları winner who now helps Uzbek students secure fully-funded
              scholarships and university places worldwide. Your journey starts here.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/scholarships" className="btn-primary">
                Browse Scholarships
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="https://t.me/jamshidmurodboev"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-white"
              >
                <Send className="h-5 w-5" />
                Contact on Telegram
              </a>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative">
              <div className="w-72 h-72 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 opacity-20 blur-3xl absolute inset-0 m-auto" />
              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
                <div className="text-6xl mb-4">🎓</div>
                <p className="text-amber-400 font-bold text-xl">Türkiye Bursları</p>
                <p className="text-slate-400 text-sm mt-1">Fully-Funded Scholarship</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <div key={s.label} className="bg-slate-700/50 rounded-xl p-3">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16 px-4 border-b border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <s.icon className={`h-10 w-10 mb-3 ${s.color}`} />
              <p className="text-4xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <div className="w-64 h-64 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-8xl">👨‍🎓</span>
            </div>
          </div>
          <div>
            <h2 className="section-title">About Jamshid</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              I'm Jamshid Murodboev — an Uzbek student who won the prestigious{' '}
              <strong>Türkiye Bursları (YTB)</strong> fully-funded scholarship and studied in Turkey. After
              experiencing the transformative power of international education firsthand, I dedicated myself to
              helping other Uzbek students achieve the same.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              Over the past 7+ years, I've guided <strong>5 students</strong> to full-ride scholarships and
              helped <strong>100+ students</strong> gain admission to reputable universities in Turkey and
              beyond. Now I'm expanding globally — helping students apply to opportunities across Europe, Asia,
              and North America.
            </p>
            <div className="flex gap-4">
              <Link to="/contact" className="btn-primary">
                Work With Me
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">How I Can Help</h2>
            <p className="section-subtitle mx-auto">
              Personalized guidance at every step of your study abroad journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((s) => (
              <div key={s.title} className={`rounded-2xl bg-gradient-to-br ${s.color} border ${s.border} p-8`}>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{s.description}</p>
                <ul className="space-y-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Scholarships */}
      {featured.length > 0 && (
        <section className="py-20 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="section-title">Featured Scholarships</h2>
              <p className="section-subtitle mx-auto">
                Explore top opportunities — updated regularly
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {featured.map((s) => <ScholarshipCard key={s.id} scholarship={s} />)}
            </div>
            <div className="text-center">
              <Link to="/scholarships" className="btn-primary">
                View All Scholarships
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Student Success Stories</h2>
            <p className="section-subtitle mx-auto">
              Real results from students I've worked with
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                  <p className="text-xs text-amber-600">{t.program}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-slate-300 mb-8 text-lg">
            Reach out on Telegram today. Let's find the perfect scholarship or university for you.
          </p>
          <a
            href="https://t.me/jamshidmurodboev"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg px-8 py-4"
          >
            <Send className="h-5 w-5" />
            Message on Telegram
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
