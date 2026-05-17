import React from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiSend,
  FiBarChart2,
  FiClipboard,
  FiToggleRight,
  FiSettings,
  FiUserCheck,
  FiPlus,
  FiLogOut,
  FiSliders,
} from 'react-icons/fi'
import useAuthStore from '../../store/authStore'
import { hasPermission } from '../../utils/permissions'

export default function Sidebar({ widthClass = 'w-64' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const role = user?.role || 'guest'

  const menu = [
    { key: 'dashboard', label: 'Dashboard', to: '/dashboard', Icon: FiHome },
    { key: 'contacts', label: 'Contacts', to: '/contacts', Icon: FiUsers },
    { key: 'templates', label: 'Templates', to: '/templates', Icon: FiFileText },
    { key: 'campaigns', label: 'Campaigns', to: '/campaigns', Icon: FiSend },
    { key: 'analytics', label: 'Analytics', to: '/analytics', Icon: FiBarChart2 },
    { key: 'reports', label: 'Reports', to: '/reports/delivery', Icon: FiClipboard },
    { key: 'opt', label: 'Opt-In/Out', to: '/reports/opt-in-out', Icon: FiToggleRight },
    { key: 'settings', label: 'Settings', to: '/settings', Icon: FiSettings },
    { key: 'super-admin', label: 'Platform Admin', to: '/super-admin', Icon: FiSliders },
    { key: 'system-health', label: 'System Health', to: '/platform-admin/system-health', Icon: FiClipboard },
  ]

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <aside className={`flex flex-col ${widthClass} h-screen bg-[#1e293b] text-white`}>
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-700">
        <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
          <span className="text-xl font-bold">WA</span>
        </div>
        <div>
          <div className="font-semibold">WhatsApp Platform</div>
          <div className="text-xs text-slate-300">Messaging Console</div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        {menu.map((m) => {
          // Dynamic role rules matrix
          const roleRules = {
            super_admin: ['dashboard', 'contacts', 'templates', 'campaigns', 'analytics', 'reports', 'opt', 'settings', 'super-admin', 'system-health'],
            owner: ['dashboard', 'contacts', 'templates', 'campaigns', 'analytics', 'reports', 'opt', 'settings'],
            admin: ['dashboard', 'contacts', 'templates', 'campaigns', 'analytics', 'reports', 'opt', 'settings'],
            manager: ['dashboard', 'contacts', 'templates', 'campaigns', 'analytics', 'reports', 'opt'],
            agent: ['dashboard', 'contacts', 'campaigns'],
            viewer: ['dashboard', 'analytics'],
          }
          const allowedKeys = roleRules[role] || ['dashboard']
          if (!allowedKeys.includes(m.key)) return null

          const Active = isActive(m.to)
          return (
            <div key={m.key} className="mb-1">
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate(m.to)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(m.to); } }}
                className={`w-full text-left flex items-center gap-3 px-4 py-2 rounded-md mx-2 hover:bg-slate-700 ${
                  Active ? 'bg-slate-700 font-medium' : 'text-slate-200'
                }`}
              >
                <m.Icon className="w-5 h-5" />
                <span className="flex-1">{m.label}</span>

                {m.key === 'campaigns' && hasPermission(role, 'manager') ? (
                  <button type="button" onClick={(ev) => { ev.stopPropagation(); navigate('/campaigns/new') }} className="ml-2 text-slate-300 hover:text-white">
                    <FiPlus className="w-4 h-4" />
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}

        {['super_admin', 'owner', 'admin'].includes(role) && (
          <div className="mt-4">
            <Link
              to="/settings/users"
              className={`flex items-center gap-3 px-4 py-2 rounded-md mx-2 hover:bg-slate-700 ${
                isActive('/settings/users') ? 'bg-slate-700 font-medium' : 'text-slate-200'
              }`}
            >
              <FiUserCheck className="w-5 h-5" />
              <span>Users</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{user?.name || 'Unknown'}</div>
            <div className="text-xs text-slate-300 capitalize">{role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded hover:bg-slate-700 text-slate-200"
            title="Logout"
          >
            <FiLogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}

