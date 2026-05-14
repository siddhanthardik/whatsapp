import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiBell, FiMenu, FiChevronDown, FiUser, FiLock, FiLogOut } from 'react-icons/fi'
import useAuthStore from '../../store/authStore'

export default function Topbar({ title, onToggleSidebar }) {
  const navigate = useNavigate()
  const { user, clearAuth, unreadNotifications } = useAuthStore()
  const orgName = user?.organization?.name || user?.orgName || 'Organization'
  const unread = unreadNotifications || 0

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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md md:hidden text-slate-600 hover:bg-slate-100"
          aria-label="Toggle sidebar"
        >
          <FiMenu className="w-6 h-6" />
        </button>

        <div className="flex flex-col">
          <div className="text-lg font-semibold text-slate-800">{title}</div>
          <div className="text-xs text-slate-500">{orgName}</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button className="relative p-2 rounded-md text-slate-600 hover:bg-slate-50">
          <FiBell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-medium">
              {initials}
            </div>
            <FiChevronDown className="text-slate-600" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-40">
              <button
                onClick={() => { setOpen(false); navigate('/settings/profile') }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
              >
                <FiUser /> <span>Profile</span>
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/change-password') }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
              >
                <FiLock /> <span>Change Password</span>
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-red-600"
              >
                <FiLogOut /> <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

