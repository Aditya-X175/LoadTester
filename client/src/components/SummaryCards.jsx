import { AlertTriangle, Zap } from 'lucide-react'

export default function SummaryCards({ summary }) {
  if (!summary) return null

  const cards = [
    {
      label: 'Max Stable VUs',
      value: summary.maxStableUsers ?? '—',
      unit: 'users',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      glow: '',
      icon: '👥',
    },
    {
      label: 'Peak Throughput',
      value: summary.peakThroughput ?? '—',
      unit: 'RPS',
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
      glow: 'shadow-glow-cyan',
      icon: '⚡',
    },
    {
      label: 'Breaking Point',
      value: summary.breakingPointVU ?? '—',
      unit: 'VUs',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      glow: 'shadow-glow-red',
      icon: '💥',
    },
    {
      label: 'Avg Degradation Latency',
      value: summary.avgDegradationLatency ?? '—',
      unit: 'ms',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      glow: '',
      icon: '⏱️',
    },
    {
      label: 'Avg Error Rate',
      value: summary.avgErrorRate != null ? `${summary.avgErrorRate}%` : '—',
      unit: '',
      color: summary.avgErrorRate > 5 ? 'text-rose-400' : 'text-slate-300',
      bg: summary.avgErrorRate > 5 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-surface-700/50 border-surface-600/30',
      glow: '',
      icon: '🎯',
    },
    {
      label: 'Data Points',
      value: summary.totalDataPoints ?? 0,
      unit: 'samples',
      color: 'text-slate-300',
      bg: 'bg-surface-700/50 border-surface-600/30',
      glow: '',
      icon: '📊',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(({ label, value, unit, color, bg, glow, icon }) => (
        <div
          key={label}
          className={`stat-card border rounded-2xl ${bg} ${glow}`}
        >
          <span className="text-lg mb-1">{icon}</span>
          <span className={`text-2xl font-bold font-mono ${color}`}>
            {value}
          </span>
          {unit && <span className="text-xs text-slate-500">{unit}</span>}
          <span className="text-xs text-slate-400 mt-1 leading-tight">{label}</span>
        </div>
      ))}
    </div>
  )
}
