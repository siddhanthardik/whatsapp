import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiMenu, FiChevronDown, FiUser, FiLock, FiLogOut } from 'react-icons/fi'
import useAuthStore from '../../store/authStore'

const ROLE_THEME = {
  super_admin: { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  owner: { label: 'Owner', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
  admin: { label: 'Admin', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
  manager: { label: 'Manager', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  agent: { label: 'Agent', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
  viewer: { label: 'Viewer', bg: 'bg-slate-100 text-slate-800 border-slate-200' },
  guest: { label: 'Guest', bg: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export default function Topbar({ title, onToggleSidebar }) {
  const navigate = useNavigate()
  const { user, clearAuth, unreadNotifications } = useAuthStore()
  const orgName = user?.organization?.name || user?.orgName || 'Organization'
  const unread = unreadNotifications || 0
  const role = user?.role || 'guest'
  const roleInfo = ROLE_THEME[role] || ROLE_THEME.guest
  const plan = user?.subscription?.plan || 'free'

  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function handleSignOut() {
    clearAuth()
    navigate('/login')
  }

  const initials = (user?.name || 'U').split(' ').map((s) => s[0]).slice(0,2).join('')

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md md:hidden text-slate-600 hover:bg-slate-100"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        <div className="flex flex-col">
          <div className="text-lg font-semibold text-slate-800 leading-tight">{title}</div>
          <div className="text-xs text-slate-400 font-medium">{orgName}</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Billing Plan Badge */}
        <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize select-none ${
          role === 'super_admin'
            ? 'bg-purple-50 text-purple-800 border-purple-200'
            : plan === 'enterprise'
            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {role === 'super_admin' ? 'Platform Admin' : `${plan} Plan`}
        </span>

        {/* Notifications Button */}
        <button className="relative p-2 rounded-md text-slate-600 hover:bg-slate-50 transition-all">
          <FiBell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-block w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200" />

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all text-left"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-sm select-none uppercase">
              {initials}
            </div>
            <div className="hidden md:flex flex-col leading-none">
              <span className="text-sm font-semibold text-slate-800">{user?.name || 'Unknown User'}</span>
              <span className={`inline-block self-start mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
            <FiChevronDown className="text-slate-500 w-4 h-4" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 text-slate-500 text-xs border-b border-slate-100 mb-1">
                Signed in as <strong className="text-slate-800 block truncate">{user?.email || '—'}</strong>
              </div>
              <button
                onClick={() => { setOpen(false); navigate('/settings/profile') }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-sm text-slate-700 rounded-lg transition-all"
              >
                <FiUser className="w-4 h-4 text-slate-500" /> <span>Profile Settings</span>
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/settings/profile') }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-sm text-slate-700 rounded-lg transition-all"
              >
                <FiLock className="w-4 h-4 text-slate-500" /> <span>Change Password</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2.5 text-sm text-red-600 rounded-lg transition-all"
              >
                <FiLogOut className="w-4 h-4" /> <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

