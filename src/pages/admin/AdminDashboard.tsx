import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import AdminLayout from '../../components/admin/AdminLayout'
import { Link } from 'react-router-dom'
import { Award, Building2, CheckCircle, ArrowRight } from 'lucide-react'

interface Stats {
  totalScholarships: number
  activeScholarships: number
  totalUniversities: number
  activeUniversities: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalScholarships: 0,
    activeScholarships: 0,
    totalUniversities: 0,
    activeUniversities: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [sAll, sActive, uAll, uActive] = await Promise.all([
          getDocs(collection(db, 'scholarships')),
          getDocs(query(collection(db, 'scholarships'), where('active', '==', true))),
          getDocs(collection(db, 'universities')),
          getDocs(query(collection(db, 'universities'), where('active', '==', true))),
        ])
        setStats({
          totalScholarships: sAll.size,
          activeScholarships: sActive.size,
          totalUniversities: uAll.size,
          activeUniversities: uActive.size,
        })
      } catch {
        // Firestore not configured yet
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    {
      label: 'Total Scholarships',
      value: stats.totalScholarships,
      sub: `${stats.activeScholarships} active`,
      icon: Award,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      link: '/admin/scholarships',
    },
    {
      label: 'Total Universities',
      value: stats.totalUniversities,
      sub: `${stats.activeUniversities} active`,
      icon: Building2,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      link: '/admin/universities',
    },
    {
      label: 'Active Scholarships',
      value: stats.activeScholarships,
      sub: 'Visible to users',
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600 border-green-200',
      link: '/admin/scholarships',
    },
    {
      label: 'Active Universities',
      value: stats.activeUniversities,
      sub: 'Visible to users',
      icon: CheckCircle,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      link: '/admin/universities',
    },
  ]

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-8">
        <p className="text-slate-500">Welcome back! Here's an overview of your content.</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse border border-slate-200">
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className={`bg-white rounded-xl p-6 border ${card.color.split(' ')[2]} hover:shadow-md transition-shadow flex flex-col`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${card.color.split(' ').slice(0, 2).join(' ')}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm font-medium text-slate-700 mt-1">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/admin/scholarships"
          className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-amber-500" />
            <div>
              <p className="font-semibold text-slate-900">Manage Scholarships</p>
              <p className="text-sm text-slate-500">Add, edit or remove scholarships</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-500 transition-colors" />
        </Link>
        <Link
          to="/admin/universities"
          className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-500" />
            <div>
              <p className="font-semibold text-slate-900">Manage Universities</p>
              <p className="text-sm text-slate-500">Add, edit or remove universities</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>
    </AdminLayout>
  )
}
