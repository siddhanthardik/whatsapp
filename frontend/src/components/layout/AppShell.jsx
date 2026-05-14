import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function getTitleFromPath(pathname) {
  const map = {
    '/dashboard': 'Dashboard',
    '/contacts': 'Contacts',
    '/contacts/import': 'Import Contacts',
    '/templates': 'Templates',
    '/templates/new': 'Template Builder',
    '/campaigns': 'Campaigns',
    '/campaigns/new': 'New Campaign',
    '/analytics': 'Analytics',
    '/reports/delivery': 'Reports',
    '/reports/opt-in-out': 'Opt-In/Out',
    '/settings': 'Settings',
    '/settings/users': 'Users',
  }
  if (map[pathname]) return map[pathname]
  // Try to match base path
  const base = '/' + pathname.split('/').filter(Boolean)[0]
  return map[base] || 'App'
}

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef(null)
  const location = useLocation()

  const title = getTitleFromPath(location.pathname)

  useEffect(() => {
    // close mobile sidebar on route change
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClick(e) {
      if (!sidebarRef.current) return
      if (!sidebarRef.current.contains(e.target)) setSidebarOpen(false)
    }
    if (sidebarOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar (fixed) */}
      <div className="hidden md:block fixed top-0 left-0 bottom-0 z-20">
        <Sidebar widthClass="w-60" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile sidebar (slide in) */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 bottom-0 left-0 z-40 md:hidden transform transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '240px' }}
      >
        <Sidebar widthClass="w-60" />
      </div>

      {/* Main area - offset for desktop sidebar */}
      <div className="md:ml-60 flex flex-col min-h-screen">
        <Topbar title={title} onToggleSidebar={() => setSidebarOpen((s) => !s)} />

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

