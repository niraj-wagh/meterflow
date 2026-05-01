import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '../../services'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { format } from 'date-fns'
import { Activity, AlertCircle, Clock, TrendingUp } from 'lucide-react'

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-zinc-700">
      <p className="text-zinc-400 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span></p>)}
    </div>
  )
}

const periods = [{ label: '24h', value: '24h' }, { label: '7 days', value: '7d' }, { label: '30 days', value: '30d' }]

export default function Analytics() {
  const [period, setPeriod] = useState('7d')

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview', period],
    queryFn: () => analyticsService.getOverview({ period }).then(r => r.data.data)
  })
  const { data: requestsData, isLoading: reqLoading } = useQuery({
    queryKey: ['analytics-requests', period],
    queryFn: () => analyticsService.getRequests({ period }).then(r => r.data.data)
  })
  const { data: topApis } = useQuery({
    queryKey: ['analytics-top-apis'],
    queryFn: () => analyticsService.getTopApis().then(r => r.data.data)
  })
  const { data: latencyData } = useQuery({
    queryKey: ['analytics-latency'],
    queryFn: () => analyticsService.getLatency().then(r => r.data.data)
  })

  const fmtLabel = (v) => {
    if (!v) return ''
    try { return format(new Date(v), period === '24h' ? 'HH:mm' : 'MMM d') } catch { return v }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Detailed performance metrics</p>
        </div>
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 gap-1">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${period === p.value ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: overview?.totalRequests?.toLocaleString() ?? '0', icon: Activity, color: 'text-brand-500' },
          { label: 'Error Rate', value: `${overview?.errorRate ?? 0}%`, icon: AlertCircle, color: parseFloat(overview?.errorRate) > 5 ? 'text-red-500' : 'text-emerald-500' },
          { label: 'Avg Latency', value: `${overview?.avgLatency ?? 0}ms`, icon: Clock, color: 'text-amber-500' },
          { label: 'Active APIs', value: overview?.activeApis ?? '0', icon: TrendingUp, color: 'text-brand-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="stat-label">{label}</span>
            </div>
            <p className="stat-value">{value}</p>
          </div>
        ))}
      </div>

      {/* Requests chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5">Request volume</h3>
        {reqLoading ? <div className="h-56 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={requestsData || []}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="_id" tickFormatter={fmtLabel} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tooltip_ />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#6366f1" strokeWidth={2} fill="url(#g1)" dot={false} />
              <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={2} fill="url(#g2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top APIs */}
        <div className="card">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5">Top APIs by requests</h3>
          {topApis?.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topApis || []} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<Tooltip_ />} />
                <Bar dataKey="requests" name="Requests" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Latency */}
        <div className="card">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5">Latency percentiles (7d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={latencyData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="_id" tickFormatter={fmtLabel} tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip content={<Tooltip_ />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="p50[0]" name="p50" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p95[0]" name="p95" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p99[0]" name="p99" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
