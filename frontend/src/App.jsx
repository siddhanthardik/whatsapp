import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import AppShell from './components/layout/AppShell'

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  DashboardPage,
  ContactsPage,
  ContactDetailPage,
  ImportPage,
  TemplatesPage,
  TemplateBuilderPage,
  CampaignsPage,
  CampaignWizardPage,
  CampaignDetailPage,
  AnalyticsPage,
  ReportsPage,
  OptInOutPage,
  SettingsPage,
  UsersPage,
} from './pages'

const queryClient = new QueryClient()

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppLayout() {
  // Wraps protected pages with AppShell and renders nested routes via Outlet
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/contacts/import" element={<ImportPage />} />
            <Route path="/contacts/:id" element={<ContactDetailPage />} />

            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<TemplateBuilderPage />} />
            <Route path="/templates/:id/edit" element={<TemplateBuilderPage />} />

            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/campaigns/new" element={<CampaignWizardPage />} />
            <Route path="/campaigns/:id" element={<CampaignDetailPage />} />

            <Route path="/analytics" element={<AnalyticsPage />} />

            <Route path="/reports/delivery" element={<ReportsPage />} />
            <Route path="/reports/opt-in-out" element={<OptInOutPage />} />

            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/users" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
