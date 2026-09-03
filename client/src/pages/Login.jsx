import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Lock, Mail, User, ArrowRight, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()

  // Determine mode: 'login' or 'register'
  const [isRegister, setIsRegister] = useState(() => {
    return location.pathname === '/register' || location.state?.register === true
  })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isRegister) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match')
          setLoading(false)
          return
        }
        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters')
          setLoading(false)
          return
        }
        const data = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.confirmPassword
        )
        toast.success(data.message || 'Account created successfully!')
        navigate('/dashboard')
      } else {
        const data = await login(formData.email, formData.password)
        toast.success(data.message || 'Logged in successfully!')
        navigate(location.state?.from || '/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        'Authentication failed. Please check your inputs.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill demo for quick review if user wants
  const handleFillDemo = () => {
    setIsRegister(true)
    setFormData({
      name: 'Alex Tester',
      email: `tester_${Math.floor(Math.random() * 1000)}@loadportal.io`,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    })
    toast('Pre-filled sample new user registration details!', { icon: '✨' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-surface-900">
      {/* Background glow accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Column: Branding & Feature Highlights */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shadow-glow-cyan">
              <Activity className="w-6 h-6 text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">Load Test Logger</h2>
              <p className="text-xs uppercase tracking-widest text-brand-400 font-mono font-semibold">Scalability Portal</p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-100 leading-tight">
              {isRegister ? 'Empower your stress & scale testing' : 'Welcome back, Performance Engineer'}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Track concurrent user limits, throughput boundaries, and automated degradation point identification across all environments.
            </p>
          </div>

          {/* Quick value props */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Real-time VU & Latency degradation curves</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <span>Support for k6, JMeter, Locust & Gatling imports</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>Isolated session logs and multi-session comparisons</span>
            </div>
          </div>

          {/* Demo Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleFillDemo}
              className="btn btn-secondary btn-sm flex items-center gap-2 border-surface-600/70 hover:border-brand-500/40 text-slate-300 hover:text-brand-300 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Auto-fill sample new user registration
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Card (Login / Register) */}
        <div className="lg:col-span-7">
          <div className="glass-card p-6 sm:p-8 border border-surface-600/60 shadow-2xl relative">
            {/* Header Tabs */}
            <div className="flex items-center p-1 bg-surface-900/70 rounded-xl border border-surface-700/60 mb-6">
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  !isRegister
                    ? 'bg-brand-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  isRegister
                    ? 'bg-brand-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register New User
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-100">
                {isRegister ? 'Create Your Tester Account' : 'Sign in to your Portal'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isRegister
                  ? 'Enter your details below to begin logging and analyzing load test sessions.'
                  : 'Enter your credentials to access your dashboards and test runs.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="input-group animate-fade-in">
                  <label className="input-label">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Connor"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input pl-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="tester@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input pl-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="input-label mb-0">Password</label>
                  {!isRegister && (
                    <span className="text-[11px] text-brand-400 hover:underline cursor-pointer" onClick={() => toast('Please contact your administrator to reset credentials.')}>
                      Forgot password?
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input pl-10 pr-10 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 font-mono"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="input-group animate-fade-in">
                  <label className="input-label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repeat your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input pl-10 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn w-full justify-center py-2.5 mt-4 text-sm font-semibold tracking-wide shadow-glow-cyan transition-transform active:scale-98"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{isRegister ? 'Complete Registration' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-surface-700/60 text-center">
              <p className="text-xs text-slate-400">
                {isRegister ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegister(false)}
                      className="text-brand-400 font-semibold hover:underline"
                    >
                      Sign in here
                    </button>
                  </>
                ) : (
                  <>
                    New engineer or tester?{' '}
                    <button
                      type="button"
                      onClick={() => setIsRegister(true)}
                      className="text-brand-400 font-semibold hover:underline"
                    >
                      Register new user account
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
