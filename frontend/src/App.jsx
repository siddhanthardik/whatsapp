import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'

import AppShell from './components/layout/AppShell'
import { UpgradeModal, ErrorBoundary } from './components/shared'

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
  ProfilePage,
  SuperAdminPage,
  SystemHealthPage,
} from './pages'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
      <UpgradeModal />
    </AppShell>
  )
}

export default function App() {
  const { initAuth, isAuthenticated } = useAuthStore()

  React.useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <>
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

            <Route path="/settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
            <Route path="/settings/users" element={<ErrorBoundary><UsersPage /></ErrorBoundary>} />
            <Route path="/settings/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
            <Route path="/super-admin" element={<SuperAdminPage />} />
            <Route path="/platform-admin/system-health" element={<SystemHealthPage />} />
          </Route>

          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
