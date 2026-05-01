import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usageService, apiService } from '../../services'
import { format } from 'date-fns'
import { Search, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

export default function UsageLogs() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ apiId: '', status: '' })

  const { data: apisData } = useQuery({ queryKey: ['apis'], queryFn: () => apiService.getAll().then(r => r.data.data) })

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['usage-logs', page, filters],
    queryFn: () => usageService.getLogs({ page, limit: 30, ...filters }).then(r => r.data),
    keepPreviousData: true
  })

  const statusColor = (code) => {
    if (code >= 500) return 'text-red-500'
    if (code >= 400) return 'text-amber-500'
    if (code >= 200) return 'text-emerald-500'
    return 'text-zinc-400'
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Usage Logs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Every request through your gateway</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="select w-auto" value={filters.apiId} onChange={e => setFilters(p => ({ ...p, apiId: e.target.value }))}>
          <option value="">All APIs</option>
          {apisData?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
        </select>
        <select className="select w-auto" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All status</option>
          <option value="error">Errors only</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="th">Endpoint</th>
              <th className="th">Method</th>
              <th className="th">Status</th>
              <th className="th hidden md:table-cell">Latency</th>
              <th className="th hidden lg:table-cell">API Key</th>
              <th className="th hidden lg:table-cell">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={6} className="td"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-sm text-zinc-400">No logs found</td></tr>
            ) : data?.data?.map(log => (
              <tr key={log._id} className="table-row">
                <td className="td">
                  <code className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{log.endpoint}</code>
                </td>
                <td className="td">
                  <span className={`badge ${log.method === 'GET' ? 'badge-green' : log.method === 'POST' ? 'badge-blue' : log.method === 'DELETE' ? 'badge-red' : 'badge-yellow'}`}>
                    {log.method}
                  </span>
                </td>
                <td className="td">
                  <span className={`font-mono text-xs font-semibold flex items-center gap-1 ${statusColor(log.statusCode)}`}>
                    {log.isError ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {log.statusCode}
                  </span>
                </td>
                <td className="td hidden md:table-cell">
                  <span className={`text-xs font-mono ${log.latency > 1000 ? 'text-red-500' : log.latency > 500 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {log.latency}ms
                  </span>
                </td>
                <td className="td hidden lg:table-cell text-xs text-zinc-400">{log.apiKey?.name || '—'}</td>
                <td className="td hidden lg:table-cell text-xs text-zinc-400">
                  {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.total > 30 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">{data.total} total entries</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={data.count < 30} className="btn-secondary text-xs py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
