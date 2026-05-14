import React from 'react'

export default function MetricCard({
  title,
  value,
  subtitle = null,
  icon = null,
  trend = null,
  isLoading = false,
}) {
  return (
    <div className="relative bg-white border border-gray-100 rounded-lg p-4">
      <div className="absolute top-3 right-3">
        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>

      <div className="text-sm text-gray-500">{title}</div>

      <div className="mt-2 flex items-baseline space-x-3">
        {isLoading ? (
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        )}

        {!isLoading && trend && (
          <div className={`flex items-center text-sm font-medium ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend.direction === 'up' ? (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h3V4a1 1 0 112 0v5h3a1 1 0 011 1v1a1 1 0 11-2 0v-1h-2v1a1 1 0 11-2 0v-1H6v1a1 1 0 11-2 0v-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M15 10a1 1 0 00-1-1h-3V4a1 1 0 10-2 0v5H6a1 1 0 00-1 1v1a1 1 0 102 0v-1h2v1a1 1 0 102 0v-1h2v1a1 1 0 102 0v-1z" clipRule="evenodd" />
              </svg>
            )}
            <span className="ml-1">{trend.value}</span>
          </div>
        )}
      </div>

      {!isLoading && subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}

      {isLoading && <div className="mt-3 h-3 w-20 bg-gray-200 rounded animate-pulse" />}
    </div>
  )
}

