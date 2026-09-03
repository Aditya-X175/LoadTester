import { AlertTriangle, Zap, CheckCircle } from 'lucide-react'

export default function DegradationBadge({ summary }) {
  if (!summary || !summary.thresholds) return null

  const { breakingPointVU, avgErrorRate, degradationPoints, thresholds } = summary

  if (avgErrorRate > thresholds.errorRate && breakingPointVU) {
    const severity = avgErrorRate > 20 ? 'failure' : 'degraded'
    if (severity === 'failure') {
      return (
        <div className="failure-banner">
          <Zap className="w-4 h-4 shrink-0" />
          <span>
            System failure detected at <strong>{breakingPointVU} VUs</strong> —
            Error rate averaged {avgErrorRate}% (threshold: {thresholds.errorRate}%)
          </span>
        </div>
      )
    }
    return (
      <div className="degradation-banner">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Degradation detected at <strong>{breakingPointVU} VUs</strong> —
          {degradationPoints?.length || 0} data points exceeded thresholds
          (error &gt; {thresholds.errorRate}% or p95 &gt; {thresholds.p95Latency}ms)
        </span>
      </div>
    )
  }

  if (degradationPoints && degradationPoints.length > 0) {
    return (
      <div className="degradation-banner">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Latency threshold exceeded at {degradationPoints[0]?.vu} VUs
          (p95 &gt; {thresholds.p95Latency}ms)
        </span>
      </div>
    )
  }

  return (
    <div className="success-banner">
      <CheckCircle className="w-4 h-4 shrink-0" />
      <span>System stable — no degradation detected within tested VU range</span>
    </div>
  )
}
