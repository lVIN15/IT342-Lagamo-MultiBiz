import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { GoogleLogin } from '@react-oauth/google'

const API_BASE = 'http://localhost:8080'

// ── Eye / EyeOff toggle icons ─────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 0 1 2.563-4.27M6.22 6.22A9.963 9.963 0 0 1 12 5c4.478 0 8.268 2.943 9.542 7a9.971 9.971 0 0 1-4.293 5.411M3 3l18 18" />
    </svg>
  )
}

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', password: '', confirmPassword: '',
  })
  const [showPwd, setShowPwd]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [loading, setLoading]         = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_BASE}/api/auth/register`, {
        firstname: form.firstname,
        lastname:  form.lastname,
        email:     form.email,
        password:  form.password,
      })
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Registration failed. Please try again.'
      setError(msg)
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
      setSuccess(`Account synced! Redirecting…`)
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.response?.data?.error?.message ?? 'Google signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Google signup was unsuccessful.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
         style={{ backgroundColor: '#e8e5df' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
               style={{ backgroundColor: '#1a3350' }}>
            {/* 2×2 grid icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white"/>
              <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white"/>
              <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white"/>
            </svg>
          </div>
          <span className="text-lg font-semibold" style={{ color: '#1a3350' }}>Multi-Biz</span>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">
          Create your account
        </h1>
        <p className="text-sm text-center text-gray-400 mb-7">
          Start tracking your business revenue today
        </p>

        {/* ── Error / Success banners ── */}
        {error   && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

        <form onSubmit={handleSubmit} noValidate>

          {/* First / Last Name row */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text" name="firstname" required
                placeholder="Jane"
                value={form.firstname} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#1a3350' }}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text" name="lastname" required
                placeholder="Doe"
                value={form.lastname} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" name="email" required
              placeholder="jane@company.com"
              value={form.email} onChange={handleChange}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'} name="password" required
                placeholder="••••••••"
                value={form.password} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
              />
              <button type="button" tabIndex={-1}
                      onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showPwd} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'} name="confirmPassword" required
                placeholder="••••••••"
                value={form.confirmPassword} onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:border-transparent transition"
              />
              <button type="button" tabIndex={-1}
                      onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-opacity disabled:opacity-60 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#1a3350' }}>
            {loading ? 'Creating account…' : 'Register Account'}
          </button>
        </form>

        {/* ── OR divider ── */}
        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">OR</span>
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
            text="signup_with"
          />
        </div>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold underline" style={{ color: '#1a3350' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
