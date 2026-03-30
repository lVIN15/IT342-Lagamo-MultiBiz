import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin } from '@react-oauth/google'

const API_BASE = 'http://localhost:8080'

// ── Email icon ────────────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5A2.25 2.25 0 0 1 2.25 17.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5A2.25 2.25 0 0 0 2.25 6.75m19.5 0-9.75 6.375L2.25 6.75" />
    </svg>
  )
}

// ── Lock icon ─────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.125C16.5 4.84 14.657 3 12.375 3h-.75C9.343 3 7.5 4.84 7.5 7.125V10.5m-2.25 0h13.5a2.25 2.25 0 0 1 2.25 2.25v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75v-6A2.25 2.25 0 0 1 5.25 10.5Z" />
    </svg>
  )
}

export default function Login() {
  const navigate = useNavigate()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/login`, {
        email:    form.email,
        password: form.password,
      })
      // data is the ApiResponse wrapper; actual payload is in data.data
      const payload = data.data
      localStorage.setItem('user', JSON.stringify(payload.user))
      localStorage.setItem('token',  payload.accessToken)
      // We can also store role or refresh token if needed, but App.jsx and Dashboard.jsx expect 'user' and 'token'
      localStorage.setItem('refreshToken', payload.refreshToken)
      localStorage.setItem('role',         payload.user.role)
      setSuccess(`Welcome back! Redirecting…`)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        setError('Incorrect email or password.')
      } else {
        setError(err.response?.data?.error?.message ?? 'Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/auth/google`, {
        token: credentialResponse.credential,
      })
      const payload = data.data
      localStorage.setItem('user', JSON.stringify(payload.user))
      localStorage.setItem('token',  payload.accessToken)
      localStorage.setItem('refreshToken', payload.refreshToken)
      localStorage.setItem('role',         payload.user.role)
      setSuccess(`Welcome back! Redirecting…`)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Google login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google login was unsuccessful.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
         style={{ backgroundColor: '#e8e5df' }}>

      {/* ── Card ── */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
               style={{ backgroundColor: '#1a3350' }}>
            {/* Bank / building icon */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-xl font-bold" style={{ color: '#1a3350' }}>Multi-Biz</span>
          <p className="text-sm text-gray-400 mt-0.5">Manage your finances with confidence</p>
        </div>

        {/* ── Error / Success banners ── */}
        {error   && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <MailIcon />
              </span>
              <input
                type="email" name="email" required
                placeholder="name@company.com"
                value={form.email} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <button type="button"
                      className="text-xs font-medium cursor-pointer hover:underline"
                      style={{ color: '#1a3350' }}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <LockIcon />
              </span>
              <input
                type="password" name="password" required
                placeholder="Enter your password"
                value={form.password} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-opacity disabled:opacity-60 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#1a3350' }}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        {/* OR divider */}
        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400 font-medium tracking-widest">OR CONTINUE WITH</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {/* Google OAuth Login */}
        <div className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            shape="rectangular"
            theme="outline"
            size="large"
            width="100%"
          />
        </div>

        {/* Sign up link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold" style={{ color: '#1a3350' }}>
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer links */}
      <div className="mt-6 flex gap-6 text-xs text-gray-400">
        <button type="button" className="hover:text-gray-600 transition cursor-pointer">Privacy Policy</button>
        <button type="button" className="hover:text-gray-600 transition cursor-pointer">Terms of Service</button>
        <button type="button" className="hover:text-gray-600 transition cursor-pointer">Help Center</button>
      </div>
    </div>
  )
}
