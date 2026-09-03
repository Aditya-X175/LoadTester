import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Clock, Wrench, User, ChevronRight, Trash2, Edit2, AlertTriangle, CheckCircle, XCircle, Loader2, Minus } from 'lucide-react'

const STATUS_CONFIG = {
  pass:     { class: 'badge-pass',     icon: CheckCircle,    label: 'Pass' },
  fail:     { class: 'badge-fail',     icon: XCircle,        label: 'Fail' },
  degraded: { class: 'badge-degraded', icon: AlertTriangle,  label: 'Degraded' },
  running:  { class: 'badge-running',  icon: Loader2,        label: 'Running' },
  pending:  { class: 'badge-pending',  icon: Minus,          label: 'Pending' },
}

const ENV_CONFIG = {
  prod:    { class: 'env-prod',    label: 'PROD' },
  staging: { class: 'env-staging', label: 'STAGING' },
  dev:     { class: 'env-dev',     label: 'DEV' },
}

export default function SessionCard({ session, onDelete }) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending
  const env = ENV_CONFIG[session.environment] || { class: 'badge-pending', label: session.environment }
  const StatusIcon = status.icon

  const handleDelete = (e) => {
    e.stopPropagation()
    onDelete(session.id)
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    navigate(`/sessions/${session.id}/edit`)
  }

  return (
    <div
      className="glass-card-hover p-5 cursor-pointer animate-slide-up"
      onClick={() => navigate(`/sessions/${session.id}`)}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate mb-1">{session.name}</h3>
          <p className="text-xs text-slate-500 truncate">{session.targetSystem}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={status.class}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className={env.class}>{env.label}</span>
        <span className="tool-badge">{session.testTool}</span>
        {session.breakingPointVU && (
          <span className="badge bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Breaking: {session.breakingPointVU} VUs
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <User className="w-3 h-3" />
          {session.testerName}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-700/50">
        <div className="flex items-center gap-2">
          <button
            className="btn-ghost btn btn-icon btn-sm"
            onClick={handleEdit}
            title="Edit session"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            className="btn-danger btn btn-icon btn-sm"
            onClick={handleDelete}
            title="Delete session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-600" />
      </div>
    </div>
  )
}
