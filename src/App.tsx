import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import ScholarshipsPage from './pages/ScholarshipsPage'
import UniversitiesPage from './pages/UniversitiesPage'
import ContactPage from './pages/ContactPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminScholarships from './pages/admin/AdminScholarships'
import AdminUniversities from './pages/admin/AdminUniversities'

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

function AdminLoginRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    )
  }
  if (user) return <Navigate to="/admin" replace />
  return children
}

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '8px', background: '#1e293b', color: '#fff' },
          success: { iconTheme: { primary: '#f59e0b', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scholarships" element={<ScholarshipsPage />} />
        <Route path="/universities" element={<UniversitiesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/admin/login"
          element={<AdminLoginRoute><AdminLoginPage /></AdminLoginRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/scholarships"
          element={<ProtectedRoute><AdminScholarships /></ProtectedRoute>}
        />
        <Route
          path="/admin/universities"
          element={<ProtectedRoute><AdminUniversities /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
