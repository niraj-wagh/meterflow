import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Globe, Activity, Key, ChevronRight, X } from 'lucide-react'

const CATEGORIES = ['weather', 'finance', 'data', 'ai', 'payment', 'social', 'other']

const ApiModal = ({ api, onClose, onSave }) => {
  const [form, setForm] = useState(api || {
    name: '', description: '', baseUrl: '', category: 'other', version: 'v1',
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000, requestsPerDay: 10000 },
    pricing: { model: 'per_request', freeRequests: 1000, pricePerRequest: 0.005, currency: 'INR' }
  })
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-lg animate-in">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">{api ? 'Edit API' : 'Create API'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="label">API Name *</label><input className="input" value={form.name} onChange={set('name')} placeholder="My Weather API" /></div>
          <div><label className="label">Base URL *</label><input className="input" value={form.baseUrl} onChange={set('baseUrl')} placeholder="https://api.example.com" /></div>
          <div><label className="label">Description</label><textarea className="input resize-none h-20" value={form.description} onChange={set('description')} placeholder="What does this API do?" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <select className="select" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Version</label><input className="input" value={form.version} onChange={set('version')} placeholder="v1" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Req/min</label><input className="input" type="number" value={form.rateLimit?.requestsPerMinute} onChange={e => setForm(p => ({ ...p, rateLimit: { ...p.rateLimit, requestsPerMinute: +e.target.value } }))} /></div>
            <div><label className="label">Req/hour</label><input className="input" type="number" value={form.rateLimit?.requestsPerHour} onChange={e => setForm(p => ({ ...p, rateLimit: { ...p.rateLimit, requestsPerHour: +e.target.value } }))} /></div>
            <div><label className="label">Req/day</label><input className="input" type="number" value={form.rateLimit?.requestsPerDay} onChange={e => setForm(p => ({ ...p, rateLimit: { ...p.rateLimit, requestsPerDay: +e.target.value } }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Free requests</label><input className="input" type="number" value={form.pricing?.freeRequests} onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, freeRequests: +e.target.value } }))} /></div>
            <div><label className="label">Price/request (₹)</label><input className="input" type="number" step="0.001" value={form.pricing?.pricePerRequest} onChange={e => setForm(p => ({ ...p, pricing: { ...p.pricing, pricePerRequest: +e.target.value } }))} /></div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary flex-1 justify-center">
            {api ? 'Save changes' : 'Create API'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyApis() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | { api }
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: () => apiService.getAll().then(r => r.data.data)
  })

  const createMutation = useMutation({
    mutationFn: apiService.create,
    onSuccess: () => { qc.invalidateQueries(['apis']); setModal(null); toast.success('API created!') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiService.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['apis']); setModal(null); toast.success('API updated!') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed')
  })

  const deleteMutation = useMutation({
    mutationFn: apiService.delete,
    onSuccess: () => { qc.invalidateQueries(['apis']); setDeleteId(null); toast.success('API deleted') }
  })

  const handleSave = (form) => {
    if (modal?.api) updateMutation.mutate({ id: modal.api._id, data: form })
    else createMutation.mutate(form)
  }

  const statusBadge = (s) => {
    if (s === 'active') return <span className="badge-green badge">Active</span>
    if (s === 'inactive') return <span className="badge-gray badge">Inactive</span>
    return <span className="badge-yellow badge">Deprecated</span>
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">My APIs</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage and configure your APIs</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus className="w-4 h-4" /> Create API
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-zinc-100 dark:bg-zinc-800" />)}</div>
      ) : data?.length === 0 ? (
        <div className="card text-center py-16">
          <Globe className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">No APIs yet</p>
          <p className="text-sm text-zinc-400 mt-1 mb-4">Create your first API to start metering usage</p>
          <button onClick={() => setModal('create')} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create your first API
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.map(api => (
            <div key={api._id} className="card hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{api.name}</p>
                    <p className="text-xs text-zinc-400">{api.version}</p>
                  </div>
                </div>
                {statusBadge(api.status)}
              </div>

              <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{api.description || 'No description'}</p>

              <div className="inline-code text-xs px-2 py-1 block truncate mb-3">{api.baseUrl}</div>

              <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{api.totalRequests?.toLocaleString() ?? 0} reqs</span>
                <span className="flex items-center gap-1"><Key className="w-3 h-3" />{api.rateLimit?.requestsPerMinute}/min</span>
                <span className="badge-blue badge">{api.category}</span>
              </div>

              <div className="flex gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <button onClick={() => setModal({ api })} className="btn-ghost flex-1 justify-center text-xs">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => setDeleteId(api._id)} className="btn-ghost flex-1 justify-center text-xs text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === 'create' || modal?.api) && (
        <ApiModal api={modal?.api} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">Delete API?</h3>
            <p className="text-sm text-zinc-500 mb-6">This will revoke all associated keys. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} className="btn-danger flex-1 justify-center">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
