import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, GraduationCap } from 'lucide-react'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Scholarships', to: '/scholarships' },
  { label: 'Universities', to: '/universities' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl hover:text-amber-400 transition-colors">
            <GraduationCap className="h-7 w-7 text-amber-500" />
            <span>JM Consulting</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://t.me/jamshidmurodboev"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 btn-primary text-sm py-2 px-5"
            >
              Get Started
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://t.me/jamshidmurodboev"
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 btn-primary text-sm text-center"
              onClick={() => setOpen(false)}
            >
              Get Started on Telegram
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
