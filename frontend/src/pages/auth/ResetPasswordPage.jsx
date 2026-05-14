import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../../services/api'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  async function onSubmit(data) {
    if (!token) return toast.error('Missing reset token')
    setLoading(true)
    try {
      await authAPI.resetPassword(token, data.password)
      toast.success('Password reset successful')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Reset failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const pwd = watch('password', '')

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[420px] bg-white shadow-md rounded-md p-8">
        <h2 className="text-lg font-semibold mb-4">Reset password</h2>

        {!token ? (
          <div>
            <p className="text-sm text-red-600">Reset token missing or invalid.</p>
            <div className="mt-4">
              <Link to="/forgot-password" className="text-sm text-slate-600 hover:underline">Request a new reset link</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">New password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-1 focus:ring-blue-600"
              />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                type="password"
                {...register('confirm', { required: 'Confirm your password', validate: (v) => v === pwd || 'Passwords do not match' })}
                className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:ring-1 focus:ring-blue-600"
              />
              {errors.confirm && <p className="text-sm text-red-600 mt-1">{errors.confirm.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Link to="/login" className="text-sm text-slate-600 hover:underline">Back to login</Link>
              <button type="submit" className="py-2 px-4 rounded-md bg-[#1D4ED8] text-white" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

