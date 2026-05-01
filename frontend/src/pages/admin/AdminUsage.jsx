import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-zinc-700">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{p.value?.toLocaleString()}</span></p>)}
    </div>
  )
}

export function AdminUsage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-platform-usage'],
    queryFn: () => adminService.getPlatformUsage().then(r => r.data.data)
  })

  const totalReqs = data?.reduce((s, d) => s + d.requests, 0) || 0
  const totalErrors = data?.reduce((s, d) => s + d.errors, 0) || 0
  const avgLatency = data?.length ? Math.round(data.reduce((s, d) => s + (d.avgLatency || 0), 0) / data.length) : 0

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Platform Usage</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Aggregate traffic across all users (last 30 days)</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total requests', value: totalReqs.toLocaleString() },
          { label: 'Total errors', value: totalErrors.toLocaleString() },
          { label: 'Avg latency', value: `${avgLatency}ms` },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <p className="stat-label">{label}</p>
            <p className="stat-value mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-5 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-500" /> Requests & Errors
        </h3>
        {isLoading ? <div className="h-64 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" /> : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data || []}>
              <defs>
                <linearGradient id="pg1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false}
                tickFormatter={v => { try { return format(new Date(v), 'MMM d') } catch { return v } }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="requests" name="Requests" stroke="#6366f1" strokeWidth={2} fill="url(#pg1)" dot={false} />
              <Area type="monotone" dataKey="errors" name="Errors" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default AdminUsage
