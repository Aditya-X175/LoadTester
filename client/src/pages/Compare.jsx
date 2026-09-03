import { useEffect, useState } from 'react'
import { sessionsApi, metricsApi } from '../api/index'
import ThroughputChart from '../components/charts/ThroughputChart'
import LatencyChart from '../components/charts/LatencyChart'
import { GitCompare, Plus, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const SESSION_COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f59e0b', '#f43f5e']

export default function Compare() {
  const [allSessions, setAllSessions] = useState([])
  const [selected, setSelected] = useState([]) // [{session, metrics}]
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  useEffect(() => {
    sessionsApi.getAll()
      .then(d => setAllSessions(d.data || []))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [])

  const toggleSession = async (session) => {
    const alreadySelected = selected.find(s => s.session.id === session.id)

    if (alreadySelected) {
      setSelected(prev => prev.filter(s => s.session.id !== session.id))
      return
    }

    if (selected.length >= 5) {
      toast.error('Maximum 5 sessions can be compared at once')
      return
    }

    setLoadingMetrics(true)
    try {
      const data = await metricsApi.getBySession(session.id)
      setSelected(prev => [...prev, { session, metrics: data.data || [] }])
    } catch {
      toast.error('Failed to load metrics for session')
    } finally {
      setLoadingMetrics(false)
    }
  }

  const isSelected = (id) => selected.some(s => s.session.id === id)

  // Build sessions-with-metrics format for charts
  const chartSessions = selected.map((s, i) => ({
    name: s.session.name,
    color: SESSION_COLORS[i],
    metrics: s.metrics,
  }))

  return (
    <div className="animate-fade-in max-w-screen-2xl">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <GitCompare className="w-6 h-6 text-brand-400" />
            Session Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overlay 2–5 test sessions on the same charts for before/after analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: session picker */}
        <div className="xl:col-span-1">
          <div className="glass-card p-4 sticky top-6">
            <p className="section-title mb-4">Select Sessions</p>
            <p className="text-xs text-slate-500 mb-3">
              {selected.length} / 5 selected
            </p>

            {loading ? (
              <div className="flex justify-center py-8"><div className="spinner" /></div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {allSessions.map((session, i) => {
                  const sel = isSelected(session.id)
                  const selIdx = selected.findIndex(s => s.session.id === session.id)
                  return (
                    <button
                      key={session.id}
                      onClick={() => toggleSession(session)}
                      className={`w-full text-left px-3 py-3 rounded-xl border text-xs transition-all
                        ${sel
                          ? 'border-opacity-80 bg-opacity-15'
                          : 'border-surface-600 bg-surface-700/20 hover:border-brand-500/30 text-slate-300'}`}
                      style={sel ? {
                        borderColor: SESSION_COLORS[selIdx],
                        backgroundColor: `${SESSION_COLORS[selIdx]}15`,
                        color: SESSION_COLORS[selIdx],
                      } : {}}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold truncate">{session.name}</span>
                        {sel && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`env-${session.environment}`}>{session.environment.toUpperCase()}</span>
                        <span className="tool-badge">{session.testTool}</span>
                      </div>
                      <p className="text-slate-500 mt-1 truncate text-[10px]">{session.targetSystem}</p>
                    </button>
                  )
                })}
              </div>
            )}

            {loadingMetrics && (
              <div className="flex items-center gap-2 mt-3 text-xs text-brand-400">
                <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
                Loading metrics...
              </div>
            )}
          </div>
        </div>

        {/* Right: charts */}
        <div className="xl:col-span-3 space-y-5">
          {/* Legend */}
          {selected.length > 0 && (
            <div className="glass-card p-4">
              <p className="section-title mb-3">Comparison Legend</p>
              <div className="flex flex-wrap gap-3">
                {selected.map((s, i) => (
                  <div
                    key={s.session.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
                    style={{ borderColor: `${SESSION_COLORS[i]}40`, background: `${SESSION_COLORS[i]}10` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ background: SESSION_COLORS[i] }} />
                    <span style={{ color: SESSION_COLORS[i] }} className="font-medium truncate max-w-[180px]">
                      {s.session.name}
                    </span>
                    <span className={`env-${s.session.environment}`}>{s.session.environment.toUpperCase()}</span>
                    <button
                      onClick={() => toggleSession(s.session)}
                      className="ml-1 text-slate-500 hover:text-slate-200 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-32 gap-4">
              <GitCompare className="w-12 h-12 text-surface-600" />
              <p className="text-slate-400 text-sm">Select 2 or more sessions from the left panel</p>
              <p className="text-xs text-slate-600">Charts will appear here for overlay comparison</p>
            </div>
          ) : (
            <>
              {selected.length === 1 && (
                <div className="degradation-banner">
                  <Plus className="w-4 h-4" />
                  Select at least one more session to compare. Charts show single session data for now.
                </div>
              )}

              <ThroughputChart sessions={chartSessions} />
              <LatencyChart sessions={chartSessions} />

              {/* Summary comparison table */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-3 border-b border-surface-700">
                  <p className="text-sm font-semibold text-slate-300">Session Comparison Summary</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="metric-table w-full">
                    <thead>
                      <tr className="bg-surface-800/50">
                        <th>Session</th>
                        <th>Env</th>
                        <th>Tool</th>
                        <th>Data Points</th>
                        <th>Breaking VU</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.map((s, i) => (
                        <tr key={s.session.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: SESSION_COLORS[i] }} />
                              <span className="text-slate-200 font-medium text-xs">{s.session.name}</span>
                            </div>
                          </td>
                          <td><span className={`env-${s.session.environment}`}>{s.session.environment.toUpperCase()}</span></td>
                          <td><span className="tool-badge">{s.session.testTool}</span></td>
                          <td className="font-mono">{s.metrics.length}</td>
                          <td className="font-mono text-rose-400">{s.session.breakingPointVU || '—'}</td>
                          <td><span className={`badge-${s.session.status}`}>{s.session.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
