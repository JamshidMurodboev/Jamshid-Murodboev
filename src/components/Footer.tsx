import { Link } from 'react-router-dom'
import { GraduationCap, Send } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <GraduationCap className="h-7 w-7 text-amber-500" />
              JM Consulting
            </Link>
            <p className="text-sm leading-relaxed">
              Helping Uzbek students win fully-funded scholarships and gain admission to top universities worldwide.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Home', to: '/' },
                { label: 'Scholarships', to: '/scholarships' },
                { label: 'Universities', to: '/universities' },
                { label: 'Contact', to: '/contact' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-amber-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Get In Touch</h3>
            <a
              href="https://t.me/jamshidmurodboev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <Send className="h-4 w-4" />
              Message on Telegram
            </a>
            <p className="mt-4 text-sm">
              Available for consultations Monday – Saturday, 9 AM – 9 PM (UZT)
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© {new Date().getFullYear()} JM Consulting. All rights reserved.</p>
          <p>
            Built with ❤️ for Uzbek students worldwide
          </p>
        </div>
      </div>
    </footer>
  )
}
