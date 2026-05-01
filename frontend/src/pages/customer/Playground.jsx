import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { keyService, apiService } from '../../services'
import toast from 'react-hot-toast'
import { Play, Copy, ChevronDown } from 'lucide-react'
import axios from 'axios'

export default function Playground() {
  const [selectedKey, setSelectedKey] = useState('')
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(null)

  const { data: keys } = useQuery({ queryKey: ['keys'], queryFn: () => keyService.getAll().then(r => r.data.data) })

  const handleSend = async () => {
    if (!selectedKey) return toast.error('Select an API key first')
    setLoading(true)
    setResponse(null)
    const t0 = Date.now()
    try {
      const key = keys?.find(k => k._id === selectedKey)
      const res = await axios({
        method,
        url: `/gateway${path}`,
        headers: { 'X-Api-Key': key?.key },
        data: method !== 'GET' && body ? JSON.parse(body) : undefined,
        validateStatus: () => true
      })
      setElapsed(Date.now() - t0)
      setResponse({ status: res.status, headers: res.headers, data: res.data })
    } catch (err) {
      setElapsed(Date.now() - t0)
      setResponse({ status: 0, error: err.message })
    } finally { setLoading(false) }
  }

  const statusColor = (s) => {
    if (s >= 500) return 'text-red-400'
    if (s >= 400) return 'text-amber-400'
    if (s >= 200) return 'text-emerald-400'
    return 'text-zinc-400'
  }

  const activeKeys = keys?.filter(k => k.status === 'active') || []

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">API Playground</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Test your APIs through the MeterFlow gateway</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Request builder */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Request</h3>

          <div>
            <label className="label">API Key</label>
            <select className="select" value={selectedKey} onChange={e => setSelectedKey(e.target.value)}>
              <option value="">Select a key…</option>
              {activeKeys.map(k => <option key={k._id} value={k._id}>{k.name} ({k.api?.name})</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <div className="w-28">
              <label className="label">Method</label>
              <select className="select" value={method} onChange={e => setMethod(e.target.value)}>
                {['GET','POST','PUT','DELETE','PATCH'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="label">Path</label>
              <input className="input font-mono" value={path} onChange={e => setPath(e.target.value)} placeholder="/endpoint" />
            </div>
          </div>

          {method !== 'GET' && (
            <div>
              <label className="label">Request body (JSON)</label>
              <textarea className="input font-mono text-xs h-32 resize-none"
                value={body} onChange={e => setBody(e.target.value)}
                placeholder={'{\n  "key": "value"\n}'} />
            </div>
          )}

          <button onClick={handleSend} disabled={loading || !selectedKey} className="btn-primary w-full justify-center">
            {loading
              ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Play className="w-4 h-4" /> Send request</>}
          </button>

          {/* Sample curl */}
          {selectedKey && (
            <div>
              <label className="label">cURL equivalent</label>
              <div className="code-block relative">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
{`curl -X ${method} \\
  http://localhost:5000/gateway${path} \\
  -H "X-Api-Key: ${keys?.find(k=>k._id===selectedKey)?.key || '<key>'}"`}
                </pre>
                <button onClick={() => { navigator.clipboard.writeText(`curl -X ${method} http://localhost:5000/gateway${path} -H "X-Api-Key: ${keys?.find(k=>k._id===selectedKey)?.key}"`); toast.success('Copied') }}
                  className="absolute top-2 right-2 p-1.5 hover:bg-zinc-700 rounded-lg">
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Response */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Response</h3>
            {elapsed !== null && response && (
              <div className="flex items-center gap-3">
                <span className={`text-sm font-mono font-semibold ${statusColor(response.status)}`}>
                  {response.status}
                </span>
                <span className="text-xs text-zinc-400">{elapsed}ms</span>
              </div>
            )}
          </div>

          {!response ? (
            <div className="flex-1 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
              <div className="text-center">
                <Play className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Send a request to see the response</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 code-block overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">
                {response.error
                  ? `Error: ${response.error}`
                  : JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
