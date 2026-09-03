import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { sessionsApi, metricsApi } from '../api/index'
import SummaryCards from '../components/SummaryCards'
import DegradationBadge from '../components/DegradationBadge'
import MetricsTable from '../components/MetricsTable'
import ThroughputChart from '../components/charts/ThroughputChart'
import LatencyChart from '../components/charts/LatencyChart'
import ErrorRateChart from '../components/charts/ErrorRateChart'
import { ArrowLeft, Edit2, Trash2, Plus, Flag, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const BLANK_METRIC = {
  concurrentUsers: '', requestsPerSecond: '', avgLatency: '',
  p95Latency: '', p99Latency: '', errorRate: '',
  cpuUtilization: '', memoryUtilization: '',
  isDegradationPoint: false, notes: '',
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMetric, setNewMetric] = useState(BLANK_METRIC)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('charts')

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessionData, metricsData, summaryData] = await Promise.all([
        sessionsApi.getById(id),
        metricsApi.getBySession(id),
        sessionsApi.getSummary(id),
      ])
      setSession(sessionData.data)
      setMetrics(metricsData.data || [])
      setSummary(summaryData.data)
    } catch {
      toast.error('Failed to load session')
      navigate('/sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this session and ALL its metrics? This cannot be undone.')) return
    try {
      await sessionsApi.delete(id)
      toast.success('Session deleted')
      navigate('/sessions')
    } catch { toast.error('Failed to delete') }
  }

  const handleAddMetric = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...newMetric,
        concurrentUsers: Number(newMetric.concurrentUsers),
        requestsPerSecond: Number(newMetric.requestsPerSecond),
        avgLatency: Number(newMetric.avgLatency),
        p95Latency: Number(newMetric.p95Latency),
        p99Latency: Number(newMetric.p99Latency),
        errorRate: Number(newMetric.errorRate),
        cpuUtilization: newMetric.cpuUtilization ? Number(newMetric.cpuUtilization) : null,
        memoryUtilization: newMetric.memoryUtilization ? Number(newMetric.memoryUtilization) : null,
      }
      await metricsApi.add(id, payload)
      toast.success('Metric data point added')
      setNewMetric(BLANK_METRIC)
      setShowAddForm(false)
      loadData()
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add metric')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMetric = async (metricId) => {
    if (!confirm('Delete this data point?')) return
    try {
      await metricsApi.delete(id, metricId)
      toast.success('Data point deleted')
      loadData()
    } catch { toast.error('Failed to delete') }
  }

  const setField = (key, value) => setNewMetric(m => ({ ...m, [key]: value }))

  if (loading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><div className="spinner" /></div>
  }

  if (!session) return null

  const STATUS_BADGE = { pass: 'badge-pass', fail: 'badge-fail', degraded: 'badge-degraded', running: 'badge-running', pending: 'badge-pending' }

  return (
    <div className="animate-fade-in max-w-screen-2xl">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <Link to="/sessions" className="btn-ghost btn btn-sm mb-3 -ml-2">
          <ArrowLeft className="w-4 h-4" /> All Sessions
        </Link>

        <div className="page-header mb-0">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-slate-100">{session.name}</h1>
              <span className={STATUS_BADGE[session.status]}>{session.status}</span>
              <span className={`env-${session.environment}`}>{session.environment.toUpperCase()}</span>
              <span className="tool-badge">{session.testTool}</span>
            </div>
            <p className="text-sm text-slate-500">{session.targetSystem} · {session.testerName} · {format(new Date(session.createdAt), 'PPP')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn btn-sm" onClick={loadData}>
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <Link to={`/sessions/${id}/edit`} className="btn-secondary btn btn-sm">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </Link>
            <button className="btn-danger btn btn-sm" onClick={handleDelete}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="glass-card px-4 py-3 mb-5 text-sm text-slate-400 border-l-2 border-brand-500/40">
          {session.notes}
        </div>
      )}

      {/* Degradation alert */}
      {summary && <div className="mb-5"><DegradationBadge summary={summary} /></div>}

      {/* Summary cards */}
      {summary && <div className="mb-6"><SummaryCards summary={summary} /></div>}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-surface-700">
        {['charts', 'data'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-all capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-brand-400 border-brand-400'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab === 'charts' ? '📈 Charts' : '🔢 Raw Data'}
          </button>
        ))}
        <div className="ml-auto">
          <button
            className="btn-primary btn btn-sm"
            onClick={() => setShowAddForm(f => !f)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Data Point
          </button>
        </div>
      </div>

      {/* Add metric form */}
      {showAddForm && (
        <div className="glass-card p-5 mb-6 animate-slide-up border-brand-500/30">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-400" /> Add Metric Data Point
          </h3>
          <form onSubmit={handleAddMetric} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              ['concurrentUsers', 'VUs *', 'number', true],
              ['requestsPerSecond', 'RPS *', 'number', true],
              ['avgLatency', 'Avg Latency ms *', 'number', true],
              ['p95Latency', 'p95 Latency ms *', 'number', true],
              ['p99Latency', 'p99 Latency ms *', 'number', true],
              ['errorRate', 'Error Rate % *', 'number', true],
              ['cpuUtilization', 'CPU %', 'number', false],
              ['memoryUtilization', 'Memory %', 'number', false],
            ].map(([key, label, type, required]) => (
              <div key={key} className="input-group">
                <label className="input-label">{label}</label>
                <input
                  type={type}
                  step="any"
                  min="0"
                  required={required}
                  className="input"
                  value={newMetric[key]}
                  onChange={e => setField(key, e.target.value)}
                />
              </div>
            ))}
            <div className="input-group">
              <label className="input-label">Notes</label>
              <input
                type="text"
                className="input"
                value={newMetric.notes}
                onChange={e => setField('notes', e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="input-group justify-end">
              <label className="input-label">Flag Degradation</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMetric.isDegradationPoint}
                  onChange={e => setField('isDegradationPoint', e.target.checked)}
                  className="accent-rose-400"
                />
                <Flag className="w-3.5 h-3.5 text-rose-400" />
              </label>
            </div>

            <div className="col-span-full flex items-center gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary btn">
                {submitting ? 'Adding...' : 'Add Data Point'}
              </button>
              <button type="button" className="btn-secondary btn" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'charts' ? (
        <div className="space-y-5">
          <ThroughputChart metrics={metrics} breakingPointVU={session.breakingPointVU} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <LatencyChart
              metrics={metrics}
              breakingPointVU={session.breakingPointVU}
              p95Threshold={session.p95LatencyThreshold}
            />
            <ErrorRateChart
              metrics={metrics}
              breakingPointVU={session.breakingPointVU}
              errorThreshold={session.errorRateThreshold}
            />
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-700 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">{metrics.length} data points</span>
            <Link to="/import" className="btn-secondary btn btn-sm">
              Import more data →
            </Link>
          </div>
          <MetricsTable metrics={metrics} session={session} onDelete={handleDeleteMetric} />
        </div>
      )}
    </div>
  )
}
