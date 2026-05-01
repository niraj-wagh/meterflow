import { useQuery } from '@tanstack/react-query'
import { analyticsService, billingService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity, Zap, Key, AlertCircle, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { format } from 'date-fns'

const StatCard = ({ label, value, sub, icon: Icon, color = 'brand' }) => {
  const colorMap = {
    brand: 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value ?? '–'}</p>
          {sub && <p className="stat-sub mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function CustomerDashboard() {
  const { user } = useAuthStore()

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview({ period: '7d' }).then(r => r.data.data),
  })

  const { data: chartData } = useQuery({
    queryKey: ['analytics-requests', '7d'],
    queryFn: () => analyticsService.getRequests({ period: '7d' }).then(r => r.data.data),
  })

  const { data: billing } = useQuery({
    queryKey: ['billing-current'],
    queryFn: () => billingService.getCurrent().then(r => r.data.data),
  })

  const freeLimit = user?.planLimits?.requestsPerMonth || 1000
  const usedPct = billing ? Math.min(100, Math.round((billing.totalRequests / freeLimit) * 100)) : 0

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here's what's happening with your APIs today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Requests (7d)" value={overview?.totalRequests?.toLocaleString() ?? '0'} icon={Activity} color="brand" sub="Last 7 days" />
        <StatCard label="Error rate" value={`${overview?.errorRate ?? 0}%`} icon={AlertCircle} color={parseFloat(overview?.errorRate) > 5 ? 'red' : 'green'} sub="Last 7 days" />
        <StatCard label="Avg latency" value={`${overview?.avgLatency ?? 0}ms`} icon={Clock} color="amber" sub="Last 7 days" />
        <StatCard label="Active APIs" value={overview?.activeApis ?? 0} icon={Zap} color="brand" sub={`${overview?.activeKeys ?? 0} active keys`} />
      </div>

      {/* Chart + Billing */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Requests chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Requests over time</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Last 7 days</p>
            </div>
            <Link to="/dashboard/analytics" className="btn-ghost text-xs">
              View analytics <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData || []}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v ? format(new Date(v), 'MMM d') : ''} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#6366f1" strokeWidth={2} fill="url(#reqGrad)" dot={false} />
              <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={2} fill="url(#errGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Billing summary */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">This month</h3>
            <span className={`badge ${user?.plan === 'free' ? 'badge-gray' : user?.plan === 'pro' ? 'badge-purple' : 'badge-green'}`}>
              {user?.plan || 'free'}
            </span>
          </div>

          {/* Usage bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-500">Requests used</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{billing?.totalRequests?.toLocaleString() ?? 0} / {freeLimit.toLocaleString()}</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${usedPct > 80 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-500' : 'gradient-brand'}`}
                style={{ width: `${usedPct}%` }} />
            </div>
            <p className="text-xs text-zinc-400 mt-1">{usedPct}% of free tier used</p>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Free requests</span>
              <span className="text-zinc-700 dark:text-zinc-300">{billing?.freeRequests?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Billable requests</span>
              <span className="text-zinc-700 dark:text-zinc-300">{billing?.billableRequests?.toLocaleString() ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-2">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">Amount due</span>
              <span className="font-semibold text-zinc-900 dark:text-white">₹{billing?.amount?.toFixed(2) ?? '0.00'}</span>
            </div>
          </div>

          <Link to="/dashboard/billing" className="btn-secondary mt-4 justify-center text-xs">
            View billing details
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Create an API', desc: 'Add a new API to monetize', to: '/dashboard/apis', icon: Zap },
          { label: 'Generate API key', desc: 'Issue keys for your APIs', to: '/dashboard/keys', icon: Key },
          { label: 'Test in playground', desc: 'Try your gateway live', to: '/dashboard/playground', icon: TrendingUp },
        ].map(({ label, desc, to, icon: Icon }) => (
          <Link key={to} to={to}
            className="card hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800 transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 ml-auto group-hover:text-brand-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
