import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { AlertOctagon } from 'lucide-react'

const CustomTooltip = ({ active, payload, label, threshold }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs">
      <p className="text-slate-400 mb-2 font-semibold">{label} VUs</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className={`font-mono ${(p.value || 0) > threshold ? 'text-rose-400' : 'text-slate-100'}`}>
            {p.value?.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ErrorRateChart({ metrics, breakingPointVU, errorThreshold = 5 }) {
  const data = (metrics || []).map(m => ({
    vu: m.concurrentUsers,
    errorRate: m.errorRate,
    isDegraded: m.errorRate > errorThreshold,
  }))

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title">
        <AlertOctagon className="w-4 h-4 text-rose-400" />
        Error Rate (%) vs Concurrent Users
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="vu"
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Concurrent Users', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 11 }}
            height={40}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            label={{ value: 'Error Rate %', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip threshold={errorThreshold} />} />
          <Legend wrapperStyle={{ paddingTop: 12 }} />
          {breakingPointVU && (
            <ReferenceLine x={breakingPointVU} stroke="#f43f5e" strokeDasharray="6 3" />
          )}
          <ReferenceLine
            y={errorThreshold}
            stroke="#f59e0b"
            strokeDasharray="5 3"
            label={{ value: `Threshold: ${errorThreshold}%`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
          />
          <Bar dataKey="errorRate" name="Error Rate" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isDegraded ? '#f43f5e' : '#22d3ee'}
                fillOpacity={entry.isDegraded ? 0.8 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
