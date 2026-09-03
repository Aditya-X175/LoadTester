import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionsApi } from '../api/index'
import { importApi } from '../api/index'
import { Upload, FileText, FileJson, CheckCircle, AlertCircle, ArrowRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'

const SAMPLE_CSV = `concurrentUsers,requestsPerSecond,avgLatency,p95Latency,p99Latency,errorRate,cpuUtilization,memoryUtilization
50,80,45,120,180,0.1,15,25
100,155,55,140,210,0.2,28,32
200,290,68,175,260,0.3,45,40
300,380,85,220,340,0.5,57,48
400,420,115,310,490,1.2,66,55
500,430,185,520,890,3.8,74,63
600,395,420,1200,2100,9.5,83,72
700,310,980,2800,4500,22.1,91,80`

const SAMPLE_JSON = `[
  {"concurrentUsers":100,"requestsPerSecond":155,"avgLatency":55,"p95Latency":140,"p99Latency":210,"errorRate":0.2},
  {"concurrentUsers":300,"requestsPerSecond":380,"avgLatency":85,"p95Latency":220,"p99Latency":340,"errorRate":0.5},
  {"concurrentUsers":500,"requestsPerSecond":430,"avgLatency":185,"p95Latency":520,"p99Latency":890,"errorRate":3.8}
]`

export default function Import() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1=select session, 2=upload file
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [loadingSessions, setLoadingSessions] = useState(false)

  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const data = await sessionsApi.getAll()
      setSessions(data.data || [])
      setStep(1)
    } catch { toast.error('Failed to load sessions') }
    finally { setLoadingSessions(false) }
  }

  useState(() => { loadSessions() }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleImport = async () => {
    if (!selectedSession || !file) return toast.error('Select a session and file first')
    setImporting(true)
    try {
      const result = await importApi.importFile(selectedSession.id, file)
      setResult(result)
      toast.success(`Imported ${result.count} data points!`)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const fileExt = file?.name?.split('.').pop()?.toLowerCase()

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Upload className="w-6 h-6 text-brand-400" />
            Import Test Data
          </h1>
          <p className="text-sm text-slate-500 mt-1">Bulk import metrics from JMeter, k6, Locust, or Gatling exports</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-3 mb-8">
        {['Select Session', 'Upload File', 'Done'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-brand-500 text-white' : 'bg-surface-700 text-slate-500'}`}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium ${step === i + 1 ? 'text-slate-200' : 'text-slate-500'}`}>{label}</span>
            {i < 2 && <ArrowRight className="w-3 h-3 text-slate-600" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select session */}
      {!result && (
        <>
          <div className="glass-card p-5 mb-5">
            <p className="section-title mb-4">1. Select Target Session</p>
            {loadingSessions ? (
              <div className="flex justify-center py-6"><div className="spinner" /></div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-500">No sessions found. <a href="/sessions/new" className="text-brand-400">Create one first.</a></p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setSelectedSession(s); setStep(2) }}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all
                      ${selectedSession?.id === s.id
                        ? 'border-brand-500/50 bg-brand-500/10 text-brand-300'
                        : 'border-surface-600 bg-surface-700/30 hover:border-brand-500/30 text-slate-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`env-${s.environment}`}>{s.environment.toUpperCase()}</span>
                        <span className="tool-badge">{s.testTool}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{s.targetSystem}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: File upload */}
          <div className={`glass-card p-5 mb-5 transition-opacity ${!selectedSession ? 'opacity-40 pointer-events-none' : ''}`}>
            <p className="section-title mb-4">2. Upload File</p>

            <div
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer
                ${dragOver ? 'border-brand-400 bg-brand-500/10' : 'border-surface-600 hover:border-brand-500/50'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input').click()}
            >
              {file ? (
                <>
                  {fileExt === 'json' ? <FileJson className="w-10 h-10 text-brand-400" /> : <FileText className="w-10 h-10 text-brand-400" />}
                  <p className="text-sm font-medium text-slate-200">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-600" />
                  <p className="text-sm text-slate-400">Drop a <strong>CSV</strong> or <strong>JSON</strong> file here</p>
                  <p className="text-xs text-slate-600">or click to browse</p>
                </>
              )}
              <input
                id="file-input"
                type="file"
                accept=".csv,.json"
                className="hidden"
                onChange={e => setFile(e.target.files[0])}
              />
            </div>

            <button
              className="btn-primary btn w-full mt-4 justify-center"
              onClick={handleImport}
              disabled={importing || !file || !selectedSession}
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </>
      )}

      {/* Success result */}
      {result && (
        <div className="glass-card p-8 flex flex-col items-center gap-4 animate-slide-up border-emerald-500/30">
          <CheckCircle className="w-16 h-16 text-emerald-400" />
          <h2 className="text-xl font-bold text-slate-100">Import Successful!</h2>
          <p className="text-sm text-slate-400 text-center">
            <span className="text-emerald-400 font-bold">{result.count}</span> metric data points imported into session.
          </p>
          <div className="flex gap-3 mt-2">
            <button className="btn-primary btn" onClick={() => navigate(`/sessions/${result.sessionId}`)}>
              View Session →
            </button>
            <button className="btn-secondary btn" onClick={() => { setResult(null); setFile(null) }}>
              Import More
            </button>
          </div>
        </div>
      )}

      {/* Format guide */}
      <div className="glass-card p-5 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-brand-400" />
          <p className="text-sm font-semibold text-slate-300">Supported Formats & Field Mapping</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">CSV Example</p>
            <pre className="bg-surface-900 rounded-xl p-3 text-[10px] font-mono text-slate-400 overflow-x-auto">
              {SAMPLE_CSV}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">JSON Example</p>
            <pre className="bg-surface-900 rounded-xl p-3 text-[10px] font-mono text-slate-400 overflow-x-auto">
              {SAMPLE_JSON}
            </pre>
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-500 space-y-1">
          <p>• CSV headers must include the column names above (case-insensitive). Extra columns are ignored.</p>
          <p>• JMeter exports: rename columns <span className="font-mono text-slate-400">Throughput→requestsPerSecond</span>, <span className="font-mono text-slate-400">Average→avgLatency</span></p>
          <p>• k6 exports: rename <span className="font-mono text-slate-400">vus→concurrentUsers</span>, <span className="font-mono text-slate-400">http_req_duration_p(95)→p95Latency</span></p>
        </div>
      </div>
    </div>
  )
}
