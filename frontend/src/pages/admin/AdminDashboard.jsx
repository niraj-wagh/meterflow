import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, Activity, Key, AlertCircle, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="card">
    <div className="flex items-start justify-between">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-1">{value ?? '–'}</p>
        {sub && <p className="stat-sub mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-zinc-700">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span></p>)}
    </div>
  )
}

const PLAN_COLORS = { free: '#a1a1aa', pro: '#6366f1', enterprise: '#10b981' }

export default function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => adminService.getStats().then(r => r.data.data), refetchInterval: 30000 })
  const { data: usage } = useQuery({ queryKey: ['admin-usage'], queryFn: () => adminService.getPlatformUsage().then(r => r.data.data) })

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Platform-wide metrics & health</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="dot-online" /> Live data
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats?.totalUsers?.toLocaleString()} icon={Users} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
        <StatCard label="Requests today" value={stats?.requestsToday?.toLocaleString()} sub={`${stats?.errorRateToday}% error rate`} icon={Activity} color="bg-brand-50 dark:bg-brand-900/20 text-brand-600" />
        <StatCard label="Active API keys" value={stats?.activeKeys?.toLocaleString()} icon={Key} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
        <StatCard label="Monthly revenue" value={`₹${stats?.monthlyRevenue}`} icon={DollarSign} color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Platform usage chart */}
        <div className="card xl:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5">Platform requests (30 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={usage || []}>
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false}
                tickFormatter={v => { try { return format(new Date(v), 'MMM d') } catch { return v } }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#6366f1" strokeWidth={2} fill="url(#adminGrad)" dot={false} />
              <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="card">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">User plans</h3>
          {stats?.planDistribution?.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={stats.planDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    dataKey="count" nameKey="_id" paddingAngle={3}>
                    {stats.planDistribution.map((d, i) => (
                      <Cell key={i} fill={PLAN_COLORS[d._id] || '#a1a1aa'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {stats.planDistribution.map(d => (
                  <div key={d._id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAN_COLORS[d._id] || '#a1a1aa' }} />
                      <span className="text-zinc-600 dark:text-zinc-400 capitalize">{d._id}</span>
                    </div>
                    <span className="font-semibold text-zinc-900 dark:text-white">{d.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Health indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Avg Latency (today)', value: `${stats?.avgLatency ?? 0}ms`, icon: Clock, ok: (stats?.avgLatency ?? 0) < 500 },
          { label: 'Error rate (today)', value: `${stats?.errorRateToday ?? 0}%`, icon: AlertCircle, ok: parseFloat(stats?.errorRateToday ?? 0) < 5 },
          { label: 'Total APIs registered', value: stats?.totalApis?.toLocaleString() ?? '0', icon: TrendingUp, ok: true },
        ].map(({ label, value, icon: Icon, ok }) => (
          <div key={label} className="card-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <Icon className={`w-4 h-4 ${ok ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
              <p className="text-base font-semibold text-zinc-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
