import React from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const T = {
  bg: 'rgba(15, 23, 42, 0.65)',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  text: '#0F172A',
  green: '#00A884',
  blue: '#3B82F6',
  purple: '#8B5CF6',
}

export default function UpgradeModal() {
  const navigate = useNavigate()
  const { showUpgradeModal, upgradeReason, setShowUpgradeModal } = useAuthStore()

  if (!showUpgradeModal) return null

  const handleGoToBilling = () => {
    setShowUpgradeModal(false)
    navigate('/settings') // the default settings page has tabs, billing is one of them.
  }

  return (
    <div
      onClick={() => setShowUpgradeModal(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.card,
          borderRadius: 16,
          width: 440,
          padding: 24,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: `1px solid ${T.border}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          animation: 'modalSlideIn 0.3s ease-out',
        }}
      >
        {/* Animated Gradient Icon background */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF007A 0%, #7928CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 16,
            boxShadow: '0 8px 16px rgba(121, 40, 202, 0.3)',
          }}
        >
          ⚡
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>
          Limit Reached!
        </div>

        <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, marginBottom: 20, padding: '0 8px' }}>
          {upgradeReason || 'You have exhausted your current plan quotas. To continue adding resources or sending messages, please upgrade your subscription.'}
        </div>

        <div
          style={{
            width: '100%',
            background: '#F8FAFC',
            borderRadius: 12,
            padding: 14,
            border: `1px solid ${T.border}`,
            marginBottom: 20,
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Upgrading Unlocks:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: T.purple }}>✓</span> Unlimited Campaigns & Templates
            </div>
            <div style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: T.purple }}>✓</span> Up to 100,000+ Contact Management
            </div>
            <div style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: T.purple }}>✓</span> Expanded Message Volume & Team Collaboration
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button
            onClick={() => setShowUpgradeModal(false)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: `1.5px solid ${T.border}`,
              background: 'transparent',
              color: T.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGoToBilling}
            style={{
              flex: 1.5,
              padding: '10px 14px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #7928CA 0%, #3B82F6 100%)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              transition: 'transform 0.2s',
            }}
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  )
}
