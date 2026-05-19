import { Link, useLocation } from 'react-router-dom'
import { BookOpen, LayoutDashboard, Shield, LogOut, User } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export function Navbar() {
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const navLinks = [
    { to: '/', label: 'Notebooks', icon: BookOpen },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin', label: 'Admin', icon: Shield },
  ]

  return (
    <nav className="h-14 border-b border-surface-800 bg-surface-950/90 backdrop-blur-xl flex items-center justify-between px-6 z-50 sticky top-0">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/50">
          <BookOpen size={16} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight gradient-text">MAES</span>
        <span className="text-xs text-surface-500 hidden sm:block">Multi-Agent Edu System</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`btn-ghost text-xs gap-1.5 ${location.pathname === to ? 'text-primary-400 bg-primary-900/30' : ''}`}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>

      {/* User menu */}
      <div className="flex items-center gap-2">
        <div className="btn-icon">
          <User size={16} />
        </div>
        <button onClick={handleLogout} className="btn-icon text-surface-400 hover:text-red-400">
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}
