import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { sessionsApi } from '../api/index'
import SessionCard from '../components/SessionCard'
import { Plus, Search, SlidersHorizontal, FlaskConical } from 'lucide-react'
import toast from 'react-hot-toast'

const ENVIRONMENTS = ['', 'dev', 'staging', 'prod']
const STATUSES = ['', 'pending', 'running', 'pass', 'fail', 'degraded']

export default function Sessions() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ environment: '', status: '', search: '', dateFrom: '', dateTo: '' })

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
      const data = await sessionsApi.getAll(params)
      setSessions(data.data || [])
    } catch {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [filters])

  const handleDelete = async (id) => {
    if (!confirm('Delete this session and all its metric data? This cannot be undone.')) return
    try {
      await sessionsApi.delete(id)
      toast.success('Session deleted')
      fetchSessions()
    } catch {
      toast.error('Failed to delete session')
    }
  }

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }))

  return (
    <div className="animate-fade-in max-w-screen-2xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <FlaskConical className="w-6 h-6 text-brand-400" />
            Test Sessions
          </h1>
          <p className="text-sm text-slate-500 mt-1">{sessions.length} sessions found</p>
        </div>
        <Link to="/sessions/new" className="btn-primary btn">
          <Plus className="w-4 h-4" />
          New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sessions..."
            className="input pl-8 py-2 text-xs"
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
          />
        </div>

        {/* Environment filter */}
        <select
          className="select w-36 py-2 text-xs"
          value={filters.environment}
          onChange={e => setFilter('environment', e.target.value)}
        >
          <option value="">All Envs</option>
          {ENVIRONMENTS.filter(Boolean).map(e => (
            <option key={e} value={e}>{e.toUpperCase()}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="select w-36 py-2 text-xs"
          value={filters.status}
          onChange={e => setFilter('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          className="input w-40 py-2 text-xs"
          value={filters.dateFrom}
          onChange={e => setFilter('dateFrom', e.target.value)}
          title="From date"
        />
        <input
          type="date"
          className="input w-40 py-2 text-xs"
          value={filters.dateTo}
          onChange={e => setFilter('dateTo', e.target.value)}
          title="To date"
        />

        {/* Clear */}
        {Object.values(filters).some(Boolean) && (
          <button
            className="btn-ghost btn btn-sm text-xs"
            onClick={() => setFilters({ environment: '', status: '', search: '', dateFrom: '', dateTo: '' })}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="spinner" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 gap-4">
          <FlaskConical className="w-12 h-12 text-surface-600" />
          <p className="text-slate-400 text-sm">No sessions match your filters.</p>
          <Link to="/sessions/new" className="btn-primary btn">
            <Plus className="w-4 h-4" /> Create Session
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
