import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCampaign } from '../../hooks/useCampaigns'
import { CampaignDetail } from './CampaignsModule.jsx'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: campaignResp } = useCampaign(id)
  const campaign = campaignResp || {}

  return (
    <div style={{ fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <CampaignDetail campaign={campaign} onBack={() => navigate('/campaigns')} />
    </div>
  )
}

