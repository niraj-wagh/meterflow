import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import { Zap, Eye, EyeOff, ShieldCheck, Code2, ArrowRight, Loader2, Lock } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(null)
  const [showPass, setShowPass] = useState(false)

  const doLogin = async (email, password) => {
    const { data } = await authService.login({ email, password })
    setAuth(data.user, data.accessToken, data.refreshToken)
    toast.success(`Welcome, ${data.user.name}!`)
    navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await doLogin(form.email, form.password) }
    catch (err) { toast.error(err.response?.data?.message || 'Invalid credentials') }
    finally { setLoading(false) }
  }

  const handleDemo = async (role) => {
    const creds = role === 'admin'
      ? { email: 'admin@meterflow.dev', password: 'admin123' }
      : { email: 'dev@example.com', password: 'password123' }
    setDemoLoading(role)
    setForm(creds)
    try { await doLogin(creds.email, creds.password) }
    catch (err) {
      if (err.response?.status === 401)
        toast.error('Run: cd backend && node scripts/seed.js', { duration: 7000 })
      else
        toast.error(err.response?.data?.message || 'Server error — is backend running?')
    }
    finally { setDemoLoading(null) }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel – branding ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] gradient-brand flex-col justify-between p-12 relative overflow-hidden">
        {/* background circles */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute bottom-10 -right-16 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-lg font-semibold">MeterFlow</span>
        </div>

        {/* Main copy */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Meter, bill &<br />scale your APIs
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-8">
            Usage-based billing, real-time analytics, and a gateway that tracks every request — all in one platform.
          </p>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: '⚡', text: 'API Gateway with rate limiting' },
              { icon: '📊', text: 'Real-time usage analytics' },
              { icon: '💰', text: 'Automated billing engine' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                  {icon}
                </div>
                <span className="text-white/80 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-white/40 text-xs">
            © 2026 MeterFlow · Built with MERN Stack
          </p>
        </div>
      </div>

      {/* ── Right panel – login form ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-brand mb-3 shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-zinc-900">MeterFlow</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-zinc-900">Welcome back</h2>
            <p className="text-sm text-zinc-500 mt-1">Sign in to your account to continue</p>
          </div>

          {/* ── Demo accounts ─────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Try a demo account</span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  role: 'admin',
                  label: 'Admin',
                  sub: 'Full platform access',
                  Icon: ShieldCheck,
                  pill: 'Admin',
                  pillColor: 'bg-red-50 text-red-600',
                  iconBg: 'bg-red-50',
                  iconColor: 'text-red-500',
                  hoverBorder: 'hover:border-red-200 hover:bg-red-50/30',
                },
                {
                  role: 'dev',
                  label: 'Developer',
                  sub: 'APIs & billing demo',
                  Icon: Code2,
                  pill: 'Pro Plan',
                  pillColor: 'bg-brand-50 text-brand-600',
                  iconBg: 'bg-brand-50',
                  iconColor: 'text-brand-500',
                  hoverBorder: 'hover:border-brand-200 hover:bg-brand-50/30',
                },
              ].map(({ role, label, sub, Icon, pill, pillColor, iconBg, iconColor, hoverBorder }) => (
                <button
                  key={role}
                  onClick={() => handleDemo(role)}
                  disabled={!!demoLoading}
                  className={`relative flex flex-col gap-2.5 p-3.5 border border-zinc-200 rounded-xl transition-all text-left ${hoverBorder} disabled:opacity-50 disabled:cursor-not-allowed group`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
                      {demoLoading === role
                        ? <Loader2 className={`w-4 h-4 ${iconColor} animate-spin`} />
                        : <Icon className={`w-4 h-4 ${iconColor}`} />}
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${pillColor}`}>
                      {pill}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800">{label}</p>
                    <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{sub}</p>
                  </div>
                  <ArrowRight className="absolute bottom-3 right-3 w-3 h-3 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs text-zinc-400 px-1">or continue with email</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* ── Login form ─────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                className="input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                autoComplete="email" required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Password</label>
              </div>
              <div className="relative">
                <input
                  className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password" required
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm font-semibold"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : <><Lock className="w-4 h-4" /> Sign in</>}
            </button>
          </form>

          <p className="text-sm text-center text-zinc-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>

          {/* Security note */}
          <p className="text-center text-[11px] text-zinc-300 mt-6">
            🔒 Demo data is read-only · No real charges
          </p>
        </div>
      </div>

    </div>
  )
}