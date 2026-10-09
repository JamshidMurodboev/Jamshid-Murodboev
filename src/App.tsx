import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import GroupPage from './pages/GroupPage'
import ProfilePage from './pages/ProfilePage'
import NotesPage from './pages/NotesPage'
import PortfolioPage from './pages/PortfolioPage'

function ProtectedRoute({ children, requireComplete = true }: { children: React.ReactElement; requireComplete?: boolean }) {
  const { user, userProfile, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>
  if (!user) return <Navigate to="/" replace />
  if (requireComplete && userProfile && !userProfile.profileComplete) return <Navigate to="/onboarding" replace />
  return children
}

function App() {
  const { user, userProfile, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: 'dark:bg-slate-800 dark:text-white' }} />
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/auth" element={user && userProfile?.profileComplete ? <Navigate to="/dashboard" replace /> : user && !userProfile?.profileComplete ? <Navigate to="/onboarding" replace /> : <AuthPage />} />
        <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/group/:groupId" element={<ProtectedRoute><GroupPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
