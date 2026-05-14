import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  LoginPage,
  ForgotPasswordPage,
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

import ProtectedRoute from './components/ProtectedRoute'

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

      <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
      <Route path="/contacts/import" element={<ProtectedRoute><ImportPage /></ProtectedRoute>} />
      <Route path="/contacts/:id" element={<ProtectedRoute><ContactDetailPage /></ProtectedRoute>} />

      <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
      <Route path="/templates/builder" element={<ProtectedRoute><TemplateBuilderPage /></ProtectedRoute>} />
      <Route path="/templates/builder/:id" element={<ProtectedRoute><TemplateBuilderPage /></ProtectedRoute>} />

      <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/campaigns/new" element={<ProtectedRoute><CampaignWizardPage /></ProtectedRoute>} />
      <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignDetailPage /></ProtectedRoute>} />

      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/reports/opt" element={<ProtectedRoute><OptInOutPage /></ProtectedRoute>} />

      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/settings/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />

      <Route path="*" element={<div>Not Found</div>} />
    </Routes>
  )
}
