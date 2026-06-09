import { useEffect, useState, useMemo } from 'react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScholarshipCard, { type Scholarship } from '../components/ScholarshipCard'
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

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [fundingFilter, setFundingFilter] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(
          collection(db, 'scholarships'),
          where('active', '==', true),
          orderBy('createdAt', 'desc'),
        )
        const snap = await getDocs(q)
        setScholarships(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Scholarship)))
      } catch {
        // Firestore might not be configured yet
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const countries = useMemo(
    () => Array.from(new Set(scholarships.map((s) => s.country))).sort(),
    [scholarships],
  )

  const filtered = useMemo(() => {
    let list = scholarships
    if (countryFilter) list = list.filter((s) => s.country === countryFilter)
    if (fundingFilter) list = list.filter((s) => s.fundingType === fundingFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.country.toLowerCase().includes(q) ||
          s.hostUniversity.toLowerCase().includes(q),
      )
    }
    return list
  }, [scholarships, search, countryFilter, fundingFilter])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Scholarships Directory</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Browse fully-funded and partial scholarships from around the world. Updated regularly.
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
              placeholder="Search scholarships..."
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
          <select
            value={fundingFilter}
            onChange={(e) => setFundingFilter(e.target.value)}
            className="admin-input w-auto"
          >
            <option value="">All Funding Types</option>
            <option value="fully-funded">Fully Funded</option>
            <option value="partial">Partial</option>
          </select>
          {(search || countryFilter || fundingFilter) && (
            <button
              onClick={() => { setSearch(''); setCountryFilter(''); setFundingFilter('') }}
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
              <p className="text-slate-400 text-lg">No scholarships found.</p>
              <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-6">{filtered.length} scholarship{filtered.length !== 1 ? 's' : ''} found</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((s) => <ScholarshipCard key={s.id} scholarship={s} />)}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
