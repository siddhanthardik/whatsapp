import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { startOfflineSync } from './utils/offlineSync'
import ErrorBoundary, { setupGlobalErrorCapture } from './components/shared/ErrorBoundary'

const qc = new QueryClient()

// Setup global error and unhandled rejection listeners
setupGlobalErrorCapture()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// start offline sync with query client
startOfflineSync(qc)
