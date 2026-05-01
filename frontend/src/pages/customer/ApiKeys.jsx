import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { keyService, apiService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Copy, RotateCcw, XCircle, Trash2, Eye, EyeOff, Shield, X } from 'lucide-react'
import { format } from 'date-fns'

const GenerateModal = ({ apis, onClose, onGenerate }) => {
  const [form, setForm] = useState({ apiId: '', name: '' })
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md animate-in">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Generate API Key</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-zinc-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Select API *</label>
            <select className="select" value={form.apiId} onChange={set('apiId')} required>
              <option value="">Choose an API…</option>
              {apis?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Key name *</label>
            <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Production key" />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button disabled={!form.apiId || !form.name} onClick={() => onGenerate(form)} className="btn-primary flex-1 justify-center">
            <Shield className="w-4 h-4" /> Generate key
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ApiKeys() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [revealed, setRevealed] = useState({})

  const { data: keys, isLoading } = useQuery({
    queryKey: ['keys'],
    queryFn: () => keyService.getAll().then(r => r.data.data)
  })
  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: () => apiService.getAll().then(r => r.data.data)
  })

  const generateMutation = useMutation({
    mutationFn: keyService.generate,
    onSuccess: (res) => {
      qc.invalidateQueries(['keys'])
      setShowModal(false)
      toast.success('Key generated! Copy it now — it won\'t be shown again.')
      setRevealed(p => ({ ...p, [res.data.data._id]: true }))
    }
  })

  const revokeMutation = useMutation({
    mutationFn: keyService.revoke,
    onSuccess: () => { qc.invalidateQueries(['keys']); toast.success('Key revoked') }
  })

  const rotateMutation = useMutation({
    mutationFn: keyService.rotate,
    onSuccess: (res) => {
      qc.invalidateQueries(['keys'])
      toast.success('Key rotated!')
      setRevealed(p => ({ ...p, [res.data.data._id]: true }))
    }
  })

  const copyKey = (key) => {
    navigator.clipboard.writeText(key)
    toast.success('Copied to clipboard')
  }

  const statusBadge = (s) => {
    if (s === 'active') return <span className="badge-green">Active</span>
    if (s === 'revoked') return <span className="badge-red">Revoked</span>
    return <span className="badge-yellow">Expired</span>
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">API Keys</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage access credentials for your APIs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Generate key
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th className="th">Key name</th>
              <th className="th">API</th>
              <th className="th hidden md:table-cell">Key</th>
              <th className="th hidden lg:table-cell">Requests</th>
              <th className="th hidden lg:table-cell">Last used</th>
              <th className="th">Status</th>
              <th className="th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td colSpan={7} className="td"><div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse w-full" /></td>
                </tr>
              ))
            ) : keys?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-sm text-zinc-400">No keys yet. Generate your first key.</td></tr>
            ) : keys?.map(k => (
              <tr key={k._id} className="table-row">
                <td className="td font-medium text-zinc-900 dark:text-zinc-100">{k.name}</td>
                <td className="td text-zinc-500">{k.api?.name || '—'}</td>
                <td className="td hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300 max-w-[180px] truncate block">
                      {revealed[k._id] ? k.key : k.key?.replace(/^(mf_\w{6}).*/, '$1••••••••••••••••')}
                    </code>
                    <button onClick={() => setRevealed(p => ({ ...p, [k._id]: !p[k._id] }))} className="btn-ghost p-1">
                      {revealed[k._id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copyKey(k.key)} className="btn-ghost p-1">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
                <td className="td hidden lg:table-cell text-zinc-500">{k.totalRequests?.toLocaleString() ?? 0}</td>
                <td className="td hidden lg:table-cell text-zinc-500 text-xs">
                  {k.lastUsed ? format(new Date(k.lastUsed), 'MMM d, HH:mm') : 'Never'}
                </td>
                <td className="td"><span className={`badge ${k.status === 'active' ? 'badge-green' : k.status === 'revoked' ? 'badge-red' : 'badge-yellow'}`}>{k.status}</span></td>
                <td className="td">
                  <div className="flex items-center gap-1">
                    {k.status === 'active' && <>
                      <button onClick={() => rotateMutation.mutate(k._id)} className="btn-ghost p-1.5" title="Rotate">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => revokeMutation.mutate(k._id)} className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" title="Revoke">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <GenerateModal apis={apis} onClose={() => setShowModal(false)} onGenerate={d => generateMutation.mutate(d)} />}
    </div>
  )
}
