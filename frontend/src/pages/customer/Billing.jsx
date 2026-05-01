import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { billingService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Receipt, CheckCircle, Zap, Crown } from 'lucide-react'

const plans = [
  { id: 'free', name: 'Free', price: 0, requests: '1,000/mo', features: ['3 APIs', '5 keys/API', 'Basic analytics'], color: 'zinc' },
  { id: 'pro', name: 'Pro', price: 499, requests: '100,000/mo', features: ['20 APIs', '50 keys/API', 'Advanced analytics', 'Webhooks', 'Priority support'], color: 'brand', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: null, requests: 'Unlimited', features: ['Unlimited APIs', 'Unlimited keys', 'Custom SLA', 'Dedicated support', 'Multi-tenant'], color: 'violet' },
]

export default function Billing() {
  const { user, updateUser } = useAuthStore()
  const qc = useQueryClient()

  const { data: current } = useQuery({ queryKey: ['billing-current'], queryFn: () => billingService.getCurrent().then(r => r.data.data) })
  const { data: history } = useQuery({ queryKey: ['billing-history'], queryFn: () => billingService.getHistory().then(r => r.data.data) })

  const upgradeMutation = useMutation({
    mutationFn: billingService.upgradePlan,
    onSuccess: (res) => {
      updateUser(res.data.user)
      qc.invalidateQueries(['billing-current'])
      toast.success(`Upgraded to ${res.data.user.plan} plan!`)
    }
  })

  const freeLimit = user?.planLimits?.requestsPerMonth || 1000
  const usedPct = current ? Math.min(100, Math.round((current.totalRequests / freeLimit) * 100)) : 0

  const statusBadge = (s) => {
    if (s === 'paid') return <span className="badge-green">Paid</span>
    if (s === 'pending') return <span className="badge-yellow">Pending</span>
    if (s === 'failed') return <span className="badge-red">Failed</span>
    return <span className="badge-gray">{s}</span>
  }

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Billing</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Manage your plan and view invoices</p>
      </div>

      {/* Current usage */}
      <div className="card">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Current billing period</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Total requests', value: (current?.totalRequests ?? 0).toLocaleString() },
            { label: 'Free requests', value: (current?.freeRequests ?? 0).toLocaleString() },
            { label: 'Billable requests', value: (current?.billableRequests ?? 0).toLocaleString() },
            { label: 'Amount due', value: `₹${current?.amount?.toFixed(2) ?? '0.00'}`, highlight: true },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
              <p className="stat-label">{label}</p>
              <p className={`text-lg font-semibold mt-1 ${highlight ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-900 dark:text-white'}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Usage against free tier</span>
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">{usedPct}%</span>
        </div>
        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${usedPct > 80 ? 'bg-red-500' : usedPct > 60 ? 'bg-amber-500' : 'gradient-brand'}`}
            style={{ width: `${usedPct}%` }} />
        </div>
      </div>

      {/* Plans */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id}
              className={`card relative flex flex-col ${plan.popular ? 'border-brand-300 dark:border-brand-700 shadow-lg shadow-brand-100 dark:shadow-none' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-purple badge text-xs px-3 py-1 shadow-md"><Crown className="w-3 h-3 mr-1" /> Most popular</span>
                </div>
              )}
              <div className="mb-4">
                <p className="font-semibold text-zinc-900 dark:text-white text-base">{plan.name}</p>
                <div className="mt-1">
                  {plan.price === null ? (
                    <span className="text-xl font-bold text-zinc-900 dark:text-white">Custom</span>
                  ) : plan.price === 0 ? (
                    <span className="text-xl font-bold text-zinc-900 dark:text-white">Free</span>
                  ) : (
                    <span className="text-xl font-bold text-zinc-900 dark:text-white">₹{plan.price}<span className="text-sm font-normal text-zinc-400">/mo</span></span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{plan.requests}</p>
              </div>
              <ul className="space-y-1.5 flex-1 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {user?.plan === plan.id ? (
                <div className="btn-secondary justify-center opacity-60 cursor-default text-xs py-2">Current plan</div>
              ) : plan.price === null ? (
                <button className="btn-secondary justify-center text-xs py-2">Contact sales</button>
              ) : (
                <button onClick={() => upgradeMutation.mutate(plan.id)}
                  disabled={upgradeMutation.isLoading}
                  className={`${plan.popular ? 'btn-primary' : 'btn-secondary'} justify-center text-xs py-2`}>
                  {plan.id === 'free' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invoice history */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Invoice history</h3>
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="th">Period</th>
                <th className="th">Requests</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th">Date</th>
              </tr>
            </thead>
            <tbody>
              {history?.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-sm text-zinc-400">No invoices yet</td></tr>
              ) : history?.map(bill => (
                <tr key={bill._id} className="table-row">
                  <td className="td text-xs">{format(new Date(bill.period.start), 'MMM yyyy')}</td>
                  <td className="td text-xs">{bill.totalRequests?.toLocaleString()}</td>
                  <td className="td font-medium">₹{bill.amount?.toFixed(2)}</td>
                  <td className="td">{statusBadge(bill.status)}</td>
                  <td className="td text-xs text-zinc-400">{format(new Date(bill.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
