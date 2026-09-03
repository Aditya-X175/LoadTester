import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-slate-400 mb-2 font-semibold">{label} Concurrent Users</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-mono text-slate-100">{p.value?.toFixed(1)} RPS</span>
        </div>
      ))}
    </div>
  )
}

// Colors for multi-session comparison
const SESSION_COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f59e0b', '#f43f5e']

export default function ThroughputChart({ metrics, breakingPointVU, sessions }) {
  // Support both single-session (metrics array) and multi-session comparison (sessions array)
  let data = []
  let lines = []

  if (sessions && sessions.length > 0) {
    // Comparison mode: build unified VU axis from all sessions
    const allVUs = [...new Set(
      sessions.flatMap(s => (s.metrics || []).map(m => m.concurrentUsers))
    )].sort((a, b) => a - b)

    data = allVUs.map(vu => {
      const point = { vu }
      sessions.forEach(s => {
        const match = (s.metrics || []).find(m => m.concurrentUsers === vu)
        point[s.name] = match ? match.requestsPerSecond : null
      })
      return point
    })

    lines = sessions.map((s, i) => ({
      key: s.name,
      color: SESSION_COLORS[i % SESSION_COLORS.length],
      name: s.name,
    }))
  } else {
    data = (metrics || []).map(m => ({ vu: m.concurrentUsers, rps: m.requestsPerSecond }))
    lines = [{ key: 'rps', color: '#22d3ee', name: 'Throughput (RPS)' }]
  }

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">
        <TrendingUp className="w-4 h-4 text-brand-400" />
        Throughput (RPS) vs Concurrent Users
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
            label={{ value: 'RPS', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12 }} />
          {breakingPointVU && (
            <ReferenceLine x={breakingPointVU} stroke="#f43f5e" label={{ value: `Break: ${breakingPointVU} VU`, fill: '#f43f5e', fontSize: 10 }} />
          )}
          {lines.map(l => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={2}
              dot={{ fill: l.color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              name={l.name}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
