import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import { Zap, LayoutDashboard, Users, Activity, FileText, LogOut, ShieldCheck } from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/usage', icon: Activity, label: 'Platform Usage' },
  { to: '/admin/audit', icon: FileText, label: 'Audit Logs' },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout(); navigate('/login'); toast.success('Signed out')
  }

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <aside className="w-60 bg-zinc-950 text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-brand-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">MeterFlow</div>
            <div className="flex items-center gap-1 text-xs text-zinc-400"><ShieldCheck className="w-3 h-3 text-red-400" /> Admin</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="p-1.5 hover:bg-red-900/30 rounded-lg transition-colors">
              <LogOut className="w-4 h-4 text-zinc-500 hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
