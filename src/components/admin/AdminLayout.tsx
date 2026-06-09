import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { LayoutDashboard, Award, Building2, LogOut, GraduationCap, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/scholarships', label: 'Scholarships', icon: Award, exact: false },
  { to: '/admin/universities', label: 'Universities', icon: Building2, exact: false },
]

interface Props {
  children: React.ReactNode
  title: string
}

export default function AdminLayout({ children, title }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/admin/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const isActive = (item: { to: string; exact: boolean }) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg">
          <GraduationCap className="h-7 w-7 text-amber-500" />
          JM Consulting
        </Link>
        <p className="text-slate-400 text-xs mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(item)
                ? 'bg-amber-500 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col fixed inset-y-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-slate-900 flex flex-col z-10">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
          <button
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
