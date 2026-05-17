import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiCalendar, FiShield, FiBriefcase, FiCheck } from 'react-icons/fi'
import useAuthStore from '../../store/authStore'
import { authAPI } from '../../services/api'

// Role badge helper with harmonized corporate colors
const ROLE_THEME = {
  super_admin: { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  owner: { label: 'Owner', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  admin: { label: 'Admin', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  manager: { label: 'Manager', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  agent: { label: 'Agent', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  viewer: { label: 'Viewer', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  guest: { label: 'Guest', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const role = user?.role || 'guest'
  const roleInfo = ROLE_THEME[role] || ROLE_THEME.guest
  const plan = user?.subscription?.plan || 'free'

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  })

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required')
      return
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
      }
      if (formData.password) {
        payload.password = formData.password
      }

      if (!user?._id) {
        toast.error('User session is missing or not authenticated')
        return
      }
      await authAPI.updateProfile(user._id, payload)
      toast.success('Profile details updated successfully')
      
      // Part 10: Instantly re-hydrate user session to refresh Topbar state
      await fetchMe()
      
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }))
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '—'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-sm text-slate-500">Manage your user profile details, roles, and password settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-emerald-500 to-teal-600" />
            
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center text-slate-700 text-3xl font-bold z-10 mt-6 select-none uppercase">
              {(user?.name || 'Unknown User').trim().split(/\s+/).map(s => s ? s[0] : '').slice(0, 2).join('')}
            </div>

            <div className="mt-4 z-10">
              <h2 className="text-lg font-bold text-slate-800">{user?.name || 'Unknown User'}</h2>
              <p className="text-sm text-slate-500">{user?.email || '—'}</p>
            </div>

            {/* Role colored Badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-800 border-emerald-200 capitalize">
                {plan} Plan
              </span>
            </div>

            <div className="w-full border-t border-slate-100 my-5" />

            {/* Attributes List */}
            <div className="w-full space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <FiBriefcase className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  Organization: <strong className="text-slate-800">{user?.organization?.name || 'My Organization'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <FiCalendar className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <span>
                  Member since: <strong className="text-slate-800">{joinDate}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <FiShield className="text-slate-400 w-4 h-4 flex-shrink-0" />
                <span>
                  Security Status: <strong className="text-emerald-600">Active Session</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="font-semibold text-slate-800">Edit Credentials</span>
              <span className="text-xs text-slate-400">Updates propagate instantly</span>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              
              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-slate-400 w-4 h-4" />
                    </div>
                    <input
                      id="name-input"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-slate-400 w-4 h-4" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4" />

              {/* Password Fields */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">Change Password</h3>
                <p className="text-xs text-slate-500 mb-4">Leave blank if you do not wish to update your password.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-slate-400 w-4 h-4" />
                      </div>
                      <input
                        id="password-input"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        minLength={6}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-slate-400 w-4 h-4" />
                      </div>
                      <input
                        id="confirmPassword-input"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        minLength={6}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
