import React from 'react'

const SortIcon = ({ direction }) => (
  <span className="inline-flex flex-col ml-2">
    <svg className={`w-3 h-3 ${direction === 'asc' ? 'text-gray-800' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
    </svg>
    <svg className={`w-3 h-3 -mt-0.5 ${direction === 'desc' ? 'text-gray-800' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M14.77 12.79a.75.75 0 01-1.06-.02L10 9.06l-3.71 3.71a.75.75 0 11-1.06-1.06l4.24-4.24a.75.75 0 011.06 0l4.24 4.24c.29.3.29.78.02 1.06z" />
    </svg>
  </span>
)

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  pagination = null,
  onSort = null,
  emptyMessage = 'No results found',
}) {
  const [sort, setSort] = React.useState({ key: null, direction: null })

  const handleSort = (col) => {
    if (!col.sortable) return
    let next = { key: col.key, direction: 'asc' }
    if (sort.key === col.key) {
      if (sort.direction === 'asc') next.direction = 'desc'
      else if (sort.direction === 'desc') next = { key: null, direction: null }
    }
    setSort(next)
    if (onSort) onSort({ key: next.key, direction: next.direction })
  }

  const page = pagination?.page ?? 1
  const limit = pagination?.limit ?? 10
  const total = pagination?.total ?? data.length
  const onPageChange = pagination?.onPageChange

  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="w-full flex flex-col">
      <div className="overflow-x-auto w-full border border-gray-100 rounded-lg">
        <table className="min-w-full w-full table-auto divide-y divide-gray-200">
          <thead className="bg-white sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${col.sortable ? 'cursor-pointer select-none' : ''}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center">
                    <span>{col.header}</span>
                    {col.sortable && <SortIcon direction={sort.key === col.key ? sort.direction : null} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading && (
              // show 5 skeleton rows while loading
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((c, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 px-6">
                  <div className="flex flex-col items-center justify-center text-center text-gray-500">
                    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7M9 7V5a3 3 0 116 0v2" />
                    </svg>
                    <div className="text-sm font-medium">{emptyMessage}</div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && data.length > 0 &&
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700" style={col.width ? { width: col.width } : undefined}>
                      {col.render ? col.render(row) : (row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div>
            {total > 0 ? (
              <span>
                Showing {start}-{end} of {total} results
              </span>
            ) : (
              <span>Showing 0-0 of 0 results</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => onPageChange && onPageChange(page + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 rounded-md border border-gray-200 bg-white text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

