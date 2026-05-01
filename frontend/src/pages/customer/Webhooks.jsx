import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webhookService } from '../../services'
import toast from 'react-hot-toast'
import { Plus, Trash2, Play, X, Webhook } from 'lucide-react'

const EVENTS = ['usage.limit_reached','usage.threshold','billing.invoice_created','billing.payment_failed','api.key_revoked','api.rate_limit_exceeded']

const Modal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', url: '', events: ['usage.limit_reached'] })
  const toggleEvent = (ev) => setForm(p => ({
    ...p, events: p.events.includes(ev) ? p.events.filter(e => e !== ev) : [...p.events, ev]
  }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl w-full max-w-md animate-in">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Add Webhook</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-zinc-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Billing alerts" /></div>
          <div><label className="label">Endpoint URL</label><input className="input" type="url" value={form.url} onChange={e => setForm(p=>({...p,url:e.target.value}))} placeholder="https://your-app.com/webhooks/meterflow" /></div>
          <div>
            <label className="label">Events to listen to</label>
            <div className="space-y-2">
              {EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(ev)} onChange={() => toggleEvent(ev)}
                    className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500" />
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">{ev}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => onSave(form)} disabled={!form.name||!form.url||!form.events.length} className="btn-primary flex-1 justify-center">Create webhook</button>
        </div>
      </div>
    </div>
  )
}

export default function Webhooks() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data, isLoading } = useQuery({ queryKey: ['webhooks'], queryFn: () => webhookService.getAll().then(r => r.data.data) })

  const createMutation = useMutation({
    mutationFn: webhookService.create,
    onSuccess: () => { qc.invalidateQueries(['webhooks']); setShowModal(false); toast.success('Webhook created') }
  })
  const deleteMutation = useMutation({
    mutationFn: webhookService.delete,
    onSuccess: () => { qc.invalidateQueries(['webhooks']); toast.success('Deleted') }
  })
  const testMutation = useMutation({
    mutationFn: webhookService.test,
    onSuccess: () => toast.success('Test webhook sent!'),
    onError: (e) => toast.error(e.response?.data?.message || 'Delivery failed')
  })

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Webhooks</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Get notified when events happen</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add webhook</button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(2)].map((_,i)=><div key={i} className="card h-20 animate-pulse bg-zinc-100 dark:bg-zinc-800" />)}</div>
      ) : data?.length === 0 ? (
        <div className="card text-center py-16">
          <Webhook className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No webhooks yet</p>
          <p className="text-sm text-zinc-400 mt-1 mb-4">Subscribe to events and get notified in real time</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto"><Plus className="w-4 h-4" /> Add your first webhook</button>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map(wh => (
            <div key={wh._id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{wh.name}</p>
                    <span className={`badge ${wh.isActive ? 'badge-green' : 'badge-gray'}`}>{wh.isActive ? 'Active' : 'Paused'}</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono mb-2 truncate">{wh.url}</p>
                  <div className="flex flex-wrap gap-1">
                    {wh.events?.map(ev => <span key={ev} className="badge badge-blue font-mono">{ev}</span>)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => testMutation.mutate(wh._id)} disabled={testMutation.isLoading} className="btn-secondary text-xs py-1.5">
                    <Play className="w-3 h-3" /> Test
                  </button>
                  <button onClick={() => deleteMutation.mutate(wh._id)} className="btn-ghost text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <Modal onClose={() => setShowModal(false)} onSave={d => createMutation.mutate(d)} />}
    </div>
  )
}
