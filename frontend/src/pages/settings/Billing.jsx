import React, { useState, useEffect } from 'react'
import { subscriptionAPI } from '../../services/api'
import { toast } from 'react-hot-toast'

const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  text: '#0F172A',
  green: '#00A884',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  lightGreen: '#E6F4EA',
  lightBlue: '#E8F0FE',
  lightPurple: '#F3E8FF',
}

const PLAN_CARDS = [
  {
    key: 'free',
    name: 'Free Starter',
    price: '$0',
    color: T.green,
    bg: T.lightGreen,
    features: [
      '500 Contacts maximum',
      '2 Campaigns per month',
      '1 Team member',
      '5 WhatsApp Templates',
      '1,000 Messages per month',
    ]
  },
  {
    key: 'starter',
    name: 'Pro Starter',
    price: '$49/mo',
    color: T.blue,
    bg: T.lightBlue,
    features: [
      '2,500 Contacts maximum',
      '10 Campaigns per month',
      '3 Team members',
      '15 WhatsApp Templates',
      '10,000 Messages per month',
    ]
  },
  {
    key: 'growth',
    name: 'Business Growth',
    price: '$149/mo',
    color: T.purple,
    bg: T.lightPurple,
    features: [
      '10,000 Contacts maximum',
      '50 Campaigns per month',
      '10 Team members',
      '50 WhatsApp Templates',
      '50,000 Messages per month',
    ]
  },
  {
    key: 'enterprise',
    name: 'Enterprise Scale',
    price: 'Custom',
    color: '#D97706',
    bg: '#FEF3C7',
    features: [
      '100,000 Contacts maximum',
      'Unlimited Campaigns',
      'Unlimited Team members',
      'Unlimited Templates',
      '1,000,000 Messages/mo',
    ]
  }
]

export default function Billing() {
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(null)

  const fetchSubscription = async () => {
    try {
      const res = await subscriptionAPI.get()
      if (res.data?.success) {
        setSub(res.data.data.subscription)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  const handleUpgrade = async (plan) => {
    if (plan === 'free') return
    setUpgrading(plan)
    try {
      const res = await subscriptionAPI.upgrade(plan)
      if (res.data?.success) {
        setSub(res.data.data.subscription)
        toast.success(`Successfully upgraded to ${plan.toUpperCase()}!`)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to upgrade subscription')
    } finally {
      setUpgrading(null)
    }
  }

  if (loading) {
    return <div style={{ fontSize: 13, color: T.muted }}>Loading subscription details...</div>
  }

  const renderProgressBar = (current = 0, max = 1, label, color) => {
    const safeCurrent = Number(current) || 0
    const safeMax = Math.max(1, Number(max) || 1)
    const percentage = Math.min(100, Math.round((safeCurrent / safeMax) * 100))
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
          <span style={{ fontWeight: 600, color: T.text }}>{label}</span>
          <span style={{ color: T.muted }}>{safeCurrent} / {safeMax} ({percentage}%)</span>
        </div>
        <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${percentage}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current Plan Overview */}
      {sub && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Subscription</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginTop: 4, textTransform: 'capitalize' }}>
                {sub.plan} Plan
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                Status: <span style={{ color: sub.status === 'active' ? T.green : 'red', fontWeight: 600 }}>{(sub.status || '').toUpperCase()}</span>
                {sub.expiryDate && !isNaN(new Date(sub.expiryDate).getTime()) && ` · Renews on ${new Date(sub.expiryDate).toLocaleDateString()}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#E2E8F0', color: T.text, padding: '4px 8px', borderRadius: 12, textTransform: 'uppercase' }}>
                {sub.billingCycle}
              </span>
            </div>
          </div>

          <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', display: 'grid', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Usage Limits</div>
              {renderProgressBar(sub.currentContacts, sub.maxContacts, 'Contacts Limit', T.green)}
              {renderProgressBar(sub.currentCampaignsThisMonth, sub.maxCampaignsPerMonth, 'Campaigns limit (this month)', T.blue)}
              {renderProgressBar(sub.currentUsers, sub.maxUsers, 'Team Members', T.purple)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Message Volume</div>
              {renderProgressBar(sub.currentMessagesThisMonth, sub.maxMessagesPerMonth, 'Sent Messages (this month)', T.blue)}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Compare & Upgrade Plans</div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>Choose the model that fits your enterprise requirements. Upgrade instantly.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {PLAN_CARDS.map((p) => {
            const isCurrent = sub?.plan === p.key
            return (
              <div key={p.key} style={{ background: T.card, border: `2.5px solid ${isCurrent ? p.color : T.border}`, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {isCurrent && (
                  <span style={{ position: 'absolute', top: -12, right: 12, background: p.color, color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 10, textTransform: 'uppercase' }}>
                    Current Plan
                  </span>
                )}
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: p.color, margin: '8px 0' }}>{p.price}</div>
                
                <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: p.color, fontWeight: 'bold' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent || upgrading !== null || p.key === 'free'}
                  onClick={() => handleUpgrade(p.key)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: isCurrent ? `1.5px solid ${p.color}` : 'none',
                    background: isCurrent ? 'transparent' : p.color,
                    color: isCurrent ? p.color : '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: isCurrent || p.key === 'free' ? 'default' : 'pointer',
                    opacity: upgrading !== null && upgrading !== p.key ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {isCurrent ? 'Active Plan' : upgrading === p.key ? 'Upgrading...' : p.key === 'free' ? 'Unavailable' : 'Upgrade Plan'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
