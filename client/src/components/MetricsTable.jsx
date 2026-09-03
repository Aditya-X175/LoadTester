import { AlertTriangle, Flag, Trash2 } from 'lucide-react'

function classForRow(metric, session) {
  const errThreshold = session?.errorRateThreshold ?? 5
  const p95Threshold = session?.p95LatencyThreshold ?? 2000
  if (metric.isDegradationPoint || metric.errorRate > 20 || metric.p95Latency > p95Threshold * 1.5) {
    return 'metric-row-fail'
  }
  if (metric.errorRate > errThreshold || metric.p95Latency > p95Threshold) {
    return 'metric-row-degraded'
  }
  return ''
}

function fmtMs(v) { return v != null ? `${v}ms` : '—' }
function fmtPct(v) { return v != null ? `${v}%` : '—' }
function fmtRps(v) { return v != null ? `${v} rps` : '—' }

export default function MetricsTable({ metrics, session, onDelete }) {
  if (!metrics || metrics.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">No metric data points recorded yet.</p>
      </div>
    )
  }

  const errThreshold = session?.errorRateThreshold ?? 5
  const p95Threshold = session?.p95LatencyThreshold ?? 2000

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-700">
      <table className="metric-table">
        <thead>
          <tr className="bg-surface-800/50">
            <th>VUs</th>
            <th>RPS</th>
            <th>Avg</th>
            <th>p95</th>
            <th>p99</th>
            <th>Error %</th>
            <th>CPU</th>
            <th>Mem</th>
            <th>Flags</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {metrics.map(metric => {
            const rowClass = classForRow(metric, session)
            const isAboveErrThreshold = metric.errorRate > errThreshold
            const isAboveP95Threshold = metric.p95Latency > p95Threshold
            return (
              <tr key={metric.id} className={rowClass}>
                <td className="font-semibold text-slate-200">{metric.concurrentUsers}</td>
                <td className="text-brand-400">{fmtRps(metric.requestsPerSecond)}</td>
                <td>{fmtMs(metric.avgLatency)}</td>
                <td className={isAboveP95Threshold ? 'text-amber-400 font-semibold' : ''}>
                  {fmtMs(metric.p95Latency)}
                  {isAboveP95Threshold && <AlertTriangle className="inline w-3 h-3 ml-1 text-amber-400" />}
                </td>
                <td>{fmtMs(metric.p99Latency)}</td>
                <td className={isAboveErrThreshold ? 'text-rose-400 font-bold' : ''}>
                  {fmtPct(metric.errorRate)}
                </td>
                <td className="text-slate-400">{metric.cpuUtilization != null ? `${metric.cpuUtilization}%` : '—'}</td>
                <td className="text-slate-400">{metric.memoryUtilization != null ? `${metric.memoryUtilization}%` : '—'}</td>
                <td>
                  {metric.isDegradationPoint && (
                    <span title="Manually flagged degradation point">
                      <Flag className="w-3.5 h-3.5 text-rose-400 inline" />
                    </span>
                  )}
                </td>
                <td className="text-slate-500 max-w-[120px] truncate">{metric.notes || '—'}</td>
                <td>
                  {onDelete && (
                    <button
                      className="btn-ghost btn btn-icon btn-sm opacity-0 group-hover:opacity-100"
                      onClick={() => onDelete(metric.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
