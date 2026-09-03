import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FlaskConical, GitCompare, Upload,
  Activity, Zap, Shield, LogOut, User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: FlaskConical, label: 'Test Sessions' },
  { to: '/compare', icon: GitCompare, label: 'Compare' },
  { to: '/import', icon: Upload, label: 'Import Data' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface-800/95 border-r border-surface-700 backdrop-blur-md z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shadow-glow-cyan/30">
            <Activity className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">Load Test</h1>
            <p className="text-[10px] text-slate-500 leading-tight uppercase tracking-widest">Logger Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <p className="section-title px-2 text-[10px] mb-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}

        {/* Threshold monitor card */}
        <div className="mt-6 px-1">
          <div className="glass-card p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
              <Zap className="w-3 h-3 text-brand-400" />
              <span>Degradation Limit</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">Error rate</span>
              <span className="text-amber-400 font-bold">&gt; 5%</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-500">p95 latency</span>
              <span className="text-amber-400 font-bold">&gt; 2000ms</span>
            </div>
          </div>
        </div>
      </nav>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-surface-700 bg-surface-900/40">
        {user ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-xs">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name || 'Tester'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm w-full justify-center text-xs text-slate-400 hover:text-rose-400 hover:border-rose-500/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="btn btn-primary btn-sm w-full justify-center text-xs"
          >
            Sign In / Register
          </NavLink>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-600">
          <Shield className="w-3 h-3" />
          <span>v1.0.0 · JWT Secured</span>
        </div>
      </div>
    </aside>
  )
}
