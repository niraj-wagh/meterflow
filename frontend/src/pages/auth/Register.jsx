import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services'
import toast from 'react-hot-toast'
import { Zap } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authService.register(form)
      setAuth(data.user, data.accessToken, data.refreshToken)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-violet-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-brand mb-4 shadow-lg shadow-brand-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Get started free</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">1,000 free requests per month</p>
        </div>

        <div className="card shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full name</label>
                <input className="input" type="text" placeholder="name" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="label">Company</label>
                <input className="input" type="text" placeholder="company name" value={form.company} onChange={set('company')} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mt-4">
            Have an account? <Link to="/login" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
