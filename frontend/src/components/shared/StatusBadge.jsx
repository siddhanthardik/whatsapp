import React from 'react'

const STATUS_MAP = {
  sent: { bg: 'bg-blue-100', text: 'text-blue-800' },
  delivered: { bg: 'bg-teal-100', text: 'text-teal-800' },
  read: { bg: 'bg-green-100', text: 'text-green-800' },
  failed: { bg: 'bg-red-100', text: 'text-red-800' },
  opted_in: { bg: 'bg-green-100', text: 'text-green-800' },
  opted_out: { bg: 'bg-red-100', text: 'text-red-800' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800' },
  paused: { bg: 'bg-orange-100', text: 'text-orange-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  scheduled: { bg: 'bg-purple-100', text: 'text-purple-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
}

function prettify(status) {
  if (!status) return ''
  return String(status)
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))
}

export default function StatusBadge({ status, size = 'md' }) {
  const key = (status || '').toLowerCase()
  const styles = STATUS_MAP[key] || { bg: 'bg-gray-100', text: 'text-gray-800' }
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`${styles.bg} ${styles.text} ${sizeClass} inline-flex items-center rounded-full font-medium`}> 
      {key === 'running' && (
        <span className="w-2 h-2 mr-2 rounded-full bg-blue-500 animate-pulse" />
      )}
      <span className="capitalize">{prettify(status)}</span>
    </span>
  )
}

