import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { format } from 'date-fns'
import { FileText, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit', page],
    queryFn: () => adminService.getAuditLogs({ page, limit: 50 }).then(r => r.data),
    keepPreviousData: true
  })

  const actionColor = (action) => {
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('BAN')) return 'badge-red'
    if (action.includes('CREATE') || action.includes('REGISTER') || action.includes('GENERATE')) return 'badge-green'
    if (action.includes('UPDATE') || action.includes('ROTATE')) return 'badge-yellow'
    return 'badge-blue'
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">All admin and user actions on the platform</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="th">User</th>
              <th className="th">Action</th>
              <th className="th hidden md:table-cell">IP Address</th>
              <th className="th hidden sm:table-cell">Status</th>
              <th className="th hidden lg:table-cell">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={5} className="td"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">No audit logs yet</p>
                </td>
              </tr>
            ) : data?.data?.map(log => (
              <tr key={log._id} className="table-row">
                <td className="td">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{log.user?.name || 'System'}</p>
                    <p className="text-xs text-zinc-400">{log.user?.email || '–'}</p>
                  </div>
                </td>
                <td className="td">
                  <span className={`badge font-mono text-xs ${actionColor(log.action)}`}>{log.action}</span>
                </td>
                <td className="td hidden md:table-cell text-xs text-zinc-400 font-mono">{log.ipAddress || '–'}</td>
                <td className="td hidden sm:table-cell">
                  {log.status === 'success'
                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                    : <XCircle className="w-4 h-4 text-red-500" />}
                </td>
                <td className="td hidden lg:table-cell text-xs text-zinc-400">
                  {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">{data.total} total logs</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={data.count < 50} className="btn-secondary text-xs py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
