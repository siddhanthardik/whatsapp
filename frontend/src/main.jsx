import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { startOfflineSync } from './utils/offlineSync'

const qc = new QueryClient()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>
)

// start offline sync with query client
startOfflineSync(qc)
