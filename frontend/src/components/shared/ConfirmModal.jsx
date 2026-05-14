import React, { useEffect } from 'react'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  isLoading = false,
}) {
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') onClose && onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isDanger = confirmVariant === 'danger'

  const ConfirmButton = (
    <button
      onClick={onConfirm}
      disabled={isLoading}
      className={`ml-2 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDanger
          ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 focus:ring-red-500'
          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 focus:ring-blue-500'
      }`}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      <span>{confirmLabel}</span>
    </button>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-labelledby="confirm-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onClose && onClose()} />

      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {isDanger ? (
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" />
                  </svg>
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              {title && <h3 id="confirm-modal-title" className="text-lg font-medium text-gray-900">{title}</h3>}
              {message && <p className="mt-2 text-sm text-gray-500">{message}</p>}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onClose && onClose()}
              className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
            >
              Cancel
            </button>

            {ConfirmButton}
          </div>
        </div>
      </div>
    </div>
  )
}

