import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { sessionsApi } from '../api/index'
import { ArrowLeft, Save, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

const TOOLS = ['JMeter', 'k6', 'Locust', 'Gatling', 'Artillery', 'Other']
const ENVS = ['dev', 'staging', 'prod']
const STATUSES = ['pending', 'running', 'pass', 'fail', 'degraded']

const BLANK = {
  name: '', targetSystem: '', environment: 'staging', testTool: 'k6',
  testerName: '', notes: '', status: 'pending',
  breakingPointVU: '', errorRateThreshold: '5', p95LatencyThreshold: '2000',
}

export default function NewSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(BLANK)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    sessionsApi.getById(id)
      .then(data => {
        const s = data.data
        setForm({
          name: s.name,
          targetSystem: s.targetSystem,
          environment: s.environment,
          testTool: s.testTool,
          testerName: s.testerName,
          notes: s.notes,
          status: s.status,
          breakingPointVU: s.breakingPointVU ?? '',
          errorRateThreshold: s.errorRateThreshold ?? 5,
          p95LatencyThreshold: s.p95LatencyThreshold ?? 2000,
        })
      })
      .catch(() => { toast.error('Session not found'); navigate('/sessions') })
      .finally(() => setLoading(false))
  }, [id])

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      ...form,
      breakingPointVU: form.breakingPointVU ? Number(form.breakingPointVU) : null,
      errorRateThreshold: Number(form.errorRateThreshold),
      p95LatencyThreshold: Number(form.p95LatencyThreshold),
    }
    try {
      if (isEdit) {
        await sessionsApi.update(id, payload)
        toast.success('Session updated!')
        navigate(`/sessions/${id}`)
      } else {
        const data = await sessionsApi.create(payload)
        toast.success('Session created!')
        navigate(`/sessions/${data.data.id}`)
      }
    } catch (err) {
      const msg = err?.response?.data?.details?.map(d => d.message).join(', ') || err?.response?.data?.error || 'Failed to save'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="spinner" /></div>
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <Link to="/sessions" className="btn-ghost btn btn-sm mb-5 -ml-2">
        <ArrowLeft className="w-4 h-4" /> All Sessions
      </Link>

      <div className="page-header mb-6">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-brand-400" />
          {isEdit ? 'Edit Session' : 'New Load Test Session'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core info */}
        <div className="glass-card p-6 space-y-4">
          <p className="section-title mb-4">Session Details</p>

          <div className="grid grid-cols-1 gap-4">
            <div className="input-group">
              <label className="input-label">Test Name *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. Checkout Service — Q3 Baseline"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Target System / Service *</label>
              <input
                type="text"
                required
                className="input"
                placeholder="e.g. checkout-api.prod.example.com"
                value={form.targetSystem}
                onChange={e => setField('targetSystem', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Environment *</label>
                <select className="select" value={form.environment} onChange={e => setField('environment', e.target.value)}>
                  {ENVS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Test Tool *</label>
                <select className="select" value={form.testTool} onChange={e => setField('testTool', e.target.value)}>
                  {TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Tester Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Your name"
                  value={form.testerName}
                  onChange={e => setField('testerName', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Status</label>
                <select className="select" value={form.status} onChange={e => setField('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Notes / Description</label>
              <textarea
                className="textarea"
                rows={3}
                placeholder="Test objectives, assumptions, infrastructure specs..."
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Thresholds */}
        <div className="glass-card p-6 space-y-4">
          <p className="section-title mb-4">⚡ Degradation Thresholds</p>
          <p className="text-xs text-slate-500 mb-4">Used to auto-highlight degradation points in charts and tables.</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="input-group">
              <label className="input-label">Breaking Point VUs</label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="e.g. 500"
                value={form.breakingPointVU}
                onChange={e => setField('breakingPointVU', e.target.value)}
              />
              <p className="text-[10px] text-slate-600 mt-1">VU count where system breaks</p>
            </div>
            <div className="input-group">
              <label className="input-label">Error Rate Threshold (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="input"
                value={form.errorRateThreshold}
                onChange={e => setField('errorRateThreshold', e.target.value)}
              />
              <p className="text-[10px] text-slate-600 mt-1">Auto-flag when exceeded</p>
            </div>
            <div className="input-group">
              <label className="input-label">p95 Latency Threshold (ms)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={form.p95LatencyThreshold}
                onChange={e => setField('p95LatencyThreshold', e.target.value)}
              />
              <p className="text-[10px] text-slate-600 mt-1">Auto-flag when exceeded</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={submitting} className="btn-primary btn">
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : (isEdit ? 'Update Session' : 'Create Session')}
          </button>
          <Link to="/sessions" className="btn-secondary btn">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
