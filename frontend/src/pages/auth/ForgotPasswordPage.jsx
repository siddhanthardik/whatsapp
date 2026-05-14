import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authAPI } from '../../services/api'

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(data) {
    setLoading(true)
    try {
      await authAPI.forgotPassword(data.email)
      setSent(true)
      toast.success('Check your email for a reset link')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Request failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-[420px] bg-white shadow-md rounded-md p-8">
        <h2 className="text-lg font-semibold mb-4">Forgot password</h2>

        {!sent ? (
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

            <div className="flex items-center justify-between">
              <Link to="/login" className="text-sm text-slate-600 hover:underline">Back to login</Link>
              <button type="submit" className="py-2 px-4 rounded-md bg-[#1D4ED8] text-white" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">Check your email for a reset link. The link will expire based on server settings.</p>
            <div className="flex justify-end">
              <Link to="/login" className="py-2 px-4 rounded-md bg-[#1D4ED8] text-white">Back to login</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

