import React from 'react'
import { CampaignWizard } from './CampaignsModule.jsx'

export default function CampaignWizardPage() {
  const handleBack = () => window.history.back()
  const handleLaunch = () => {
    // navigate to campaigns list after launch — CampaignsModule handles state when used standalone
    window.location.href = '/campaigns'
  }

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <CampaignWizard onBack={handleBack} onLaunch={handleLaunch} />
    </div>
  )
}

