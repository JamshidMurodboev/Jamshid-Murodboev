import { useEffect, useState, useMemo } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import UniversityCard, { type University } from '../components/UniversityCard'
import { Search, Filter } from 'lucide-react'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-slate-200 rounded w-full mb-2" />
      <div className="h-4 bg-slate-200 rounded w-5/6 mb-4" />
      <div className="h-10 bg-slate-200 rounded" />
    </div>
  )
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(
          collection(db, 'universities'),
          where('active', '==', true),
          orderBy('createdAt', 'desc'),
        )
        const snap = await getDocs(q)
        setUniversities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as University)))
      } catch {
        // Firestore might not be configured
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const countries = useMemo(
    () => Array.from(new Set(universities.map((u) => u.country))).sort(),
    [universities],
  )

  const filtered = useMemo(() => {
    let list = universities
    if (countryFilter) list = list.filter((u) => u.country === countryFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.country.toLowerCase().includes(q) ||
          u.city.toLowerCase().includes(q),
      )
    }
    return list
  }, [universities, search, countryFilter])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Universities Directory</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Discover reputable universities with tuition-based programs — quality education at accessible costs.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search universities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="admin-input w-auto"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {(search || countryFilter) && (
            <button
              onClick={() => { setSearch(''); setCountryFilter('') }}
              className="text-sm text-amber-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Content */}
      <main className="flex-1 bg-slate-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-slate-400 text-lg">No universities found.</p>
              <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-6">{filtered.length} universit{filtered.length !== 1 ? 'ies' : 'y'} found</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((u) => <UniversityCard key={u.id} university={u} />)}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
