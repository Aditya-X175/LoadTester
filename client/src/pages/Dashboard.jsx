import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionsApi, metricsApi } from '../api/index'
import SummaryCards from '../components/SummaryCards'
import ThroughputChart from '../components/charts/ThroughputChart'
import LatencyChart from '../components/charts/LatencyChart'
import ErrorRateChart from '../components/charts/ErrorRateChart'
import { Activity, Plus, RefreshCw, Cpu, Wifi } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLOR = {
  pass: 'text-emerald-400',
  fail: 'text-rose-400',
  degraded: 'text-amber-400',
  running: 'text-brand-400',
  pending: 'text-slate-400',
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [featuredSession, setFeaturedSession] = useState(null)
  const [featuredMetrics, setFeaturedMetrics] = useState([])
  const [summary, setSummary] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [sessData, healthData] = await Promise.all([
        sessionsApi.getAll(),
        fetch('/api/health').then(r => r.json()).catch(() => null),
      ])
      setSessions(sessData.data || [])
      setHealth(healthData)

      // Feature the most recent non-pending session for charts
      const featured = (sessData.data || []).find(s => s.status !== 'pending') || (sessData.data || [])[0]
      if (featured) {
        setFeaturedSession(featured)
        const [metricsData, summaryData] = await Promise.all([
          metricsApi.getBySession(featured.id),
          sessionsApi.getSummary(featured.id),
        ])
        setFeaturedMetrics(metricsData.data || [])
        setSummary(summaryData.data)
      }
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const statusCounts = sessions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="spinner" />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-screen-2xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Activity className="w-6 h-6 text-brand-400" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">System Scalability Load Test Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary btn" onClick={load}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link to="/sessions/new" className="btn-primary btn">
            <Plus className="w-4 h-4" />
            New Session
          </Link>
        </div>
      </div>

      {/* Overview stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card glass-card">
          <span className="text-3xl font-bold text-slate-100">{sessions.length}</span>
          <span className="text-xs text-slate-500 uppercase tracking-wide">Total Sessions</span>
        </div>
        {['pass', 'fail', 'degraded'].map(st => (
          <div key={st} className="stat-card glass-card">
            <span className={`text-3xl font-bold ${STATUS_COLOR[st]}`}>{statusCounts[st] || 0}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">{st}</span>
          </div>
        ))}
      </div>

      {/* API Health */}
      {health && (
        <div className="flex items-center gap-3 mb-6 px-4 py-3 glass-card rounded-2xl text-xs text-slate-400">
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>API <span className="text-emerald-400 font-semibold">{health.status}</span></span>
          <span className="text-surface-600">·</span>
          <span>Uptime: <span className="font-mono text-slate-300">{Math.floor((health.uptime || 0) / 60)}m {Math.floor((health.uptime || 0) % 60)}s</span></span>
          <span className="text-surface-600">·</span>
          <span>{sessions.length} sessions in store</span>
        </div>
      )}

      {/* Featured session charts */}
      {featuredSession ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="section-title mb-0">
              Featured: <span className="text-slate-300 normal-case tracking-normal">{featuredSession.name}</span>
            </p>
            <Link to={`/sessions/${featuredSession.id}`} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View full detail →
            </Link>
          </div>

          {summary && <SummaryCards summary={summary} />}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
            <ThroughputChart metrics={featuredMetrics} breakingPointVU={featuredSession.breakingPointVU} />
            <LatencyChart
              metrics={featuredMetrics}
              breakingPointVU={featuredSession.breakingPointVU}
              p95Threshold={featuredSession.p95LatencyThreshold}
            />
          </div>
          <div className="mt-5">
            <ErrorRateChart
              metrics={featuredMetrics}
              breakingPointVU={featuredSession.breakingPointVU}
              errorThreshold={featuredSession.errorRateThreshold}
            />
          </div>
        </>
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-24 gap-4 mt-8">
          <Activity className="w-12 h-12 text-surface-600" />
          <p className="text-slate-400 text-sm">No test sessions yet.</p>
          <Link to="/sessions/new" className="btn-primary btn">
            <Plus className="w-4 h-4" /> Create your first session
          </Link>
        </div>
      )}

      {/* Recent sessions list */}
      {sessions.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <p className="section-title mb-0">Recent Sessions</p>
            <Link to="/sessions" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="metric-table w-full">
              <thead>
                <tr className="bg-surface-800/50">
                  <th>Session</th>
                  <th>Target</th>
                  <th>Env</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Breaking VU</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 8).map(s => (
                  <tr key={s.id} className="cursor-pointer hover:bg-surface-700/30" onClick={() => window.location.href = `/sessions/${s.id}`}>
                    <td className="text-slate-200 font-medium">{s.name}</td>
                    <td className="text-slate-400">{s.targetSystem}</td>
                    <td><span className={`env-${s.environment}`}>{s.environment.toUpperCase()}</span></td>
                    <td><span className="tool-badge">{s.testTool}</span></td>
                    <td><span className={`badge-${s.status}`}>{s.status}</span></td>
                    <td className="font-mono text-rose-400">{s.breakingPointVU || '—'}</td>
                    <td className="text-slate-500">{formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
