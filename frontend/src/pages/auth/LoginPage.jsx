import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')

  async function onSubmit(formData) {
    setLoading(true)
    try {
      const res = await authAPI.login(formData)
      const payload = res?.data || res
      const body = payload.data || payload

      if (body?.twoFactorRequired) {
        setTwoFactorRequired(true)
        toast.success('Two-factor authentication required')
        return
      }

      const user = body?.user || body?.profile || body
      const token = body?.accessToken || body?.token || body?.access_token
      if (!token) throw new Error('No token returned')

      setAuth(user, token)
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function submit2FA(e) {
    e.preventDefault()
    if (twoFactorToken.length !== 6) {
      toast.error('Enter a 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.verify2fa({ code: twoFactorToken })
      const payload = res?.data || res
      const body = payload.data || payload
      const user = body?.user || body
      const token = body?.accessToken || body?.token || body?.access_token
      if (!token) throw new Error('No token returned')
      setAuth(user, token)
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '2FA verification failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[420px] bg-white shadow-md rounded-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">WA</div>
          <h1 className="mt-4 text-xl font-semibold">Sign in to WhatsApp Platform</h1>
        </div>

        {!twoFactorRequired && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-1 focus:ring-blue-600"
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className="block w-full rounded-md border-gray-200 shadow-sm pr-10 focus:ring-1 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-label="Toggle password"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register('remember')} className="h-4 w-4" />
                Remember me
              </label>
              <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 rounded-md bg-[#1D4ED8] text-white flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        {twoFactorRequired && (
          <form onSubmit={submit2FA} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Enter 6-digit code</label>
              <input
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                inputMode="numeric"
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm pr-10 focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setTwoFactorRequired(false)}
                className="text-sm text-slate-600 hover:underline"
              >
                Back
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-md bg-[#1D4ED8] text-white"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
