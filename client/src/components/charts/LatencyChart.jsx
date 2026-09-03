import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { Clock } from 'lucide-react'

const SESSION_COLORS = [
  { avg: '#22d3ee', p95: '#818cf8', p99: '#f59e0b' },
  { avg: '#34d399', p95: '#a78bfa', p99: '#fb923c' },
  { avg: '#f472b6', p95: '#60a5fa', p99: '#facc15' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-slate-400 mb-2 font-semibold">{label} VUs</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-mono text-slate-100">{p.value?.toFixed(0)} ms</span>
        </div>
      ))}
    </div>
  )
}

export default function LatencyChart({ metrics, breakingPointVU, sessions, p95Threshold }) {
  let data = []
  let lines = []

  if (sessions && sessions.length > 0) {
    const allVUs = [...new Set(
      sessions.flatMap(s => (s.metrics || []).map(m => m.concurrentUsers))
    )].sort((a, b) => a - b)

    data = allVUs.map(vu => {
      const point = { vu }
      sessions.forEach((s, si) => {
        const match = (s.metrics || []).find(m => m.concurrentUsers === vu)
        if (match) {
          point[`${s.name}_avg`] = match.avgLatency
          point[`${s.name}_p95`] = match.p95Latency
        }
      })
      return point
    })

    sessions.forEach((s, si) => {
      const c = SESSION_COLORS[si % SESSION_COLORS.length]
      lines.push(
        { key: `${s.name}_avg`, color: c.avg, name: `${s.name} Avg`, dash: '' },
        { key: `${s.name}_p95`, color: c.p95, name: `${s.name} p95`, dash: '5 3' },
      )
    })
  } else {
    data = (metrics || []).map(m => ({
      vu: m.concurrentUsers,
      avg: m.avgLatency,
      p95: m.p95Latency,
      p99: m.p99Latency,
    }))
    lines = [
      { key: 'avg', color: '#22d3ee', name: 'Avg Latency', dash: '' },
      { key: 'p95', color: '#818cf8', name: 'p95 Latency', dash: '5 3' },
      { key: 'p99', color: '#f59e0b', name: 'p99 Latency', dash: '2 2' },
    ]
  }

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">
        <Clock className="w-4 h-4 text-indigo-400" />
        Response Latency (ms) vs Concurrent Users
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="vu"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Concurrent Users', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 11 }}
            height={40}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12 }} />
          {breakingPointVU && (
            <ReferenceLine x={breakingPointVU} stroke="#f43f5e" strokeDasharray="6 3" label={{ value: `Break`, fill: '#f43f5e', fontSize: 10 }} />
          )}
          {p95Threshold && (
            <ReferenceLine y={p95Threshold} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `p95 limit: ${p95Threshold}ms`, fill: '#f59e0b', fontSize: 10, position: 'right' }} />
          )}
          {lines.map(l => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              strokeDasharray={l.dash}
              dot={{ fill: l.color, r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              name={l.name}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
