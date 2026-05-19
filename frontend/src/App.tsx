import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { Navbar } from './components/shared/Navbar'
import { LoginPage } from './pages/LoginPage'
import { NotebookList } from './pages/NotebookList'
import { NotebookView } from './pages/NotebookView'
import { TeacherDashboard } from './pages/TeacherDashboard'
import { AdminPanel } from './pages/AdminPanel'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(!!data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, sess) => {
      setSession(!!sess)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Loading state
  if (session === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={
          session
            ? <ProtectedLayout><NotebookList /></ProtectedLayout>
            : <Navigate to="/login" replace />
        } />
        <Route path="/notebook/:id" element={
          session
            ? <NotebookView />
            : <Navigate to="/login" replace />
        } />
        <Route path="/dashboard" element={
          session
            ? <ProtectedLayout><TeacherDashboard /></ProtectedLayout>
            : <Navigate to="/login" replace />
        } />
        <Route path="/admin" element={
          session
            ? <ProtectedLayout><AdminPanel /></ProtectedLayout>
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
