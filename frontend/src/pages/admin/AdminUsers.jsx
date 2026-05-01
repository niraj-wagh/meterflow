import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../../services'
import toast from 'react-hot-toast'
import { Search, UserCheck, UserX, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-users', search, plan, page],
    queryFn: () => adminService.getUsers({ search, plan, page, limit: 20 }).then(r => r.data),
    keepPreviousData: true
  })

  const toggleMutation = useMutation({
    mutationFn: adminService.toggleUserStatus,
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Status updated') }
  })

  const planBadge = (p) => {
    if (p === 'pro') return <span className="badge badge-purple">Pro</span>
    if (p === 'enterprise') return <span className="badge badge-green">Enterprise</span>
    return <span className="badge badge-gray">Free</span>
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Users</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{data?.total ?? 0} registered users</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input className="input pl-9 w-64" placeholder="Search by name or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="select w-auto" value={plan} onChange={e => { setPlan(e.target.value); setPage(1) }}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="th">User</th>
              <th className="th hidden md:table-cell">Role</th>
              <th className="th hidden sm:table-cell">Plan</th>
              <th className="th hidden lg:table-cell">Joined</th>
              <th className="th hidden lg:table-cell">Last login</th>
              <th className="th">Status</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={7} className="td"><div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" /></td>
                </tr>
              ))
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-sm text-zinc-400">No users found</td></tr>
            ) : data?.data?.map(u => (
              <tr key={u._id} className="table-row">
                <td className="td">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{u.name}</p>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="td hidden md:table-cell">
                  <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-blue'}`}>{u.role}</span>
                </td>
                <td className="td hidden sm:table-cell">{planBadge(u.plan)}</td>
                <td className="td hidden lg:table-cell text-xs text-zinc-400">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                <td className="td hidden lg:table-cell text-xs text-zinc-400">
                  {u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, HH:mm') : 'Never'}
                </td>
                <td className="td">
                  <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                    {u.isActive ? 'Active' : 'Banned'}
                  </span>
                </td>
                <td className="td">
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleMutation.mutate(u._id)}
                      className={`btn-ghost p-1.5 ${u.isActive ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                      title={u.isActive ? 'Ban user' : 'Activate user'}>
                      {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">Page {page} of {Math.ceil(data.total / 20)}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1 px-3">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={data.count < 20} className="btn-secondary text-xs py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
