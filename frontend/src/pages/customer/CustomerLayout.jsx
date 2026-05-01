import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import {
  Zap, LayoutDashboard, Code2, Key, BarChart3, Receipt,
  Terminal, Webhook, Settings, LogOut, ChevronRight, Bell, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/apis', icon: Code2, label: 'My APIs' },
  { to: '/dashboard/keys', icon: Key, label: 'API Keys' },
  { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/dashboard/usage', icon: Terminal, label: 'Usage Logs' },
  { to: '/dashboard/billing', icon: Receipt, label: 'Billing' },
  { to: '/dashboard/playground', icon: Terminal, label: 'Playground' },
  { to: '/dashboard/webhooks', icon: Webhook, label: 'Webhooks' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function CustomerLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try { await authService.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Signed out')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-100 dark:border-zinc-800">
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-brand-500/30 flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-white">MeterFlow</div>
          <div className="text-xs text-zinc-400">API Billing</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Plan badge */}
      <div className="px-3 py-2">
        <div className="card-sm bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wide">{user?.plan || 'free'} plan</div>
              <div className="text-xs text-brand-600/70 dark:text-brand-400/70 mt-0.5">
                {user?.plan === 'free' ? '1K req/mo' : user?.plan === 'pro' ? '100K req/mo' : 'Unlimited'}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-400" />
          </div>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 p-3">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">{user?.name}</div>
            <div className="text-xs text-zinc-400 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sign out">
            <LogOut className="w-4 h-4 text-zinc-400 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-surface-900 border-r border-zinc-100 dark:border-zinc-800 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-surface-900 h-full">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-surface-900 border-b border-zinc-100 dark:border-zinc-800">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-brand flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">MeterFlow</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
