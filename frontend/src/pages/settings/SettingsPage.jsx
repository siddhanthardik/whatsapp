import React, { useState, useEffect } from 'react'
import ConfirmModal from '../../components/shared/ConfirmModal'
import { organizationsAPI } from '../../services/api'
import Billing from './Billing'

const T = {
  bg: '#F0F4F8',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  text: '#0F172A',
  green: '#00A884',
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', gap: 20, padding: '16px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  )
}

function Inp({ value, onChange, placeholder, type = 'text', mono = false, readOnly = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12, color: T.text, outline: 'none', background: readOnly ? T.bg : T.card }}
    />
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState('org')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    orgName: '',
    waNumber: '',
    timezone: '',
    website: '',
    webhookUrl: '',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpFrom: 'Acme Corp <noreply@acmecorp.in>',
    smtpPass: '',
    twoFA: true,
  })

  const up = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true) }

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const payload = {
        name: form.orgName,
        website: form.website,
        timezone: form.timezone,
        webhookUrl: form.webhookUrl,
        phoneId: form.phoneId,
        smtpHost: form.smtpHost,
        smtpPort: form.smtpPort,
        smtpUser: form.smtpUser,
        smtpPass: form.smtpPass,
        smtpFrom: form.smtpFrom,
      }
      const res = await organizationsAPI.patchMe(payload)
      setSaving(false)
      setDirty(false)
      setToast('Settings saved')
      setTimeout(() => setToast(null), 3000)
      return res
    } catch (err) {
      console.error('Save settings failed', err)
      setSaving(false)
      const msg = err?.response?.data?.message || err?.message || 'Failed to save settings'
      setErrorMessage(msg)
      return null
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await organizationsAPI.getMe()
        if (!mounted) return
        if (res && res.data && res.data.success && res.data.data && res.data.data.organization) {
          const org = res.data.data.organization
          setForm(f => ({
            ...f,
            orgName: org.name || '',
            website: org.website || '',
            timezone: org.timezone || '',
            webhookUrl: org.webhookUrl || '',
            phoneId: org.phoneId || '',
            smtpHost: org.smtpHost || '',
            smtpPort: org.smtpPort || '587',
            smtpUser: org.smtpUser || '',
            smtpPass: org.smtpPass || '',
            smtpFrom: org.smtpFrom || 'Acme Corp <noreply@acmecorp.in>',
          }))
        }
      } catch (e) {
        console.error('Failed to load organization:', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ width: 190, flexShrink: 0, background: T.card, borderRight: `1px solid ${T.border}`, padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px 8px' }}>Settings</div>
        {[
          { key: 'org', label: 'Organisation', icon: '🏢' },
          { key: 'api', label: 'API & Webhooks', icon: '🔌' },
          { key: 'smtp', label: 'Email (SMTP)', icon: '📧' },
          { key: 'notif', label: 'Notifications', icon: '🔔' },
          { key: 'security', label: 'Security', icon: '🔐' },
          { key: 'billing', label: 'Plan & Billing', icon: '💳' },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setDirty(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: 12, fontWeight: tab === t.key ? 600 : 400, background: tab === t.key ? '#ECFDF5' : 'transparent', color: tab === t.key ? '#065F46' : T.muted, transition: 'all .15s' }}>
            <span style={{ fontSize: 13 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 54, background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 22px', gap: 10, position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{tab === 'org' ? 'Organisation' : tab === 'api' ? 'API & Webhooks' : tab === 'smtp' ? 'Email (SMTP)' : tab === 'security' ? 'Security' : tab === 'billing' ? 'Plan & Billing' : 'Notifications'}</div>
            <div style={{ fontSize: 10, color: T.muted }}>Settings · Acme Corp · Pro Plan</div>
          </div>
          {dirty && <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>● Unsaved changes</div>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {errorMessage && (
            <div style={{ marginBottom: 12, padding: 10, background: '#FFE8E8', border: '1px solid #F5C2C2', color: '#9B1C1C', borderRadius: 8 }}>{errorMessage}</div>
          )}
          {tab === 'org' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Organisation profile</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Your business details across the platform</div>
              <Field label="Organisation name" hint="Displayed across the platform">
                <Inp value={form.orgName} onChange={e => up('orgName', e.target.value)} placeholder="Acme Corp" />
              </Field>

              <Field label="Business website" hint="Optional — shown in WhatsApp profile">
                <Inp value={form.website} onChange={e => up('website', e.target.value)} placeholder="https://yourwebsite.com" />
              </Field>

              <Field label="Timezone" hint="All campaign schedules use this timezone">
                <Inp value={form.timezone} onChange={e => up('timezone', e.target.value)} placeholder="Asia/Kolkata" />
              </Field>
            </div>
          )}

          {tab === 'api' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>WhatsApp Cloud API</div>
              <div style={{ padding: '9px 13px', background: '#EFF6FF', borderRadius: 9, border: '1px solid #BFDBFE', fontSize: 11, color: '#1E40AF', marginBottom: 8 }}>ℹ Get credentials from developers.facebook.com → Your App → WhatsApp → API Setup</div>
              <Field label="Phone Number ID" hint="Numeric ID of your WA Business phone">
                <Inp value={form.phoneId || ''} onChange={e => up('phoneId', e.target.value)} placeholder="1234567890123456" mono />
              </Field>
              <Field label="Webhook URL" hint="Meta calls this for delivery receipts">
                <Inp value={form.webhookUrl} onChange={e => up('webhookUrl', e.target.value)} placeholder="https://yourapi.com/webhook" mono />
              </Field>
              <div style={{ marginTop: 8, padding: '14px 16px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <button onClick={() => { setToast('API connection tested (simulated)'); setTimeout(() => setToast(null), 2000) }} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', cursor: 'pointer' }}>Test API</button>
              </div>
            </div>
          )}

          {tab === 'smtp' && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>SMTP email settings</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Used for password resets, 2FA codes, and notifications</div>
              <Field label="SMTP host">
                <Inp value={form.smtpHost} onChange={e => up('smtpHost', e.target.value)} placeholder="smtp.host.com" mono />
              </Field>
              <Field label="Port & TLS">
                <Inp value={form.smtpPort} onChange={e => up('smtpPort', e.target.value)} placeholder="587" />
              </Field>
              <Field label="Username">
                <Inp value={form.smtpUser} onChange={e => up('smtpUser', e.target.value)} placeholder="user@example.com" mono />
              </Field>
              <Field label="Password">
                <Inp type="password" value={form.smtpPass} onChange={e => up('smtpPass', e.target.value)} placeholder="••••••••" />
              </Field>
              <div style={{ marginTop: 8, padding: '14px 16px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <button onClick={() => { setToast('Test email sent (simulated)'); setTimeout(() => setToast(null), 2000) }} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', cursor: 'pointer' }}>Send test email</button>
              </div>
            </div>
          )}

          {/* placeholder tabs for notif/security/billing */}
          {tab === 'notif' && <div style={{ fontSize: 12, color: T.muted }}>Notification preferences (not connected)</div>}
          {tab === 'security' && <div style={{ fontSize: 12, color: T.muted }}>Security settings (not connected)</div>}
          {tab === 'billing' && <Billing />}
        </div>

        {dirty && (
          <div style={{ background: '#0F172A', padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #1E293B', flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>You have unsaved changes</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setForm(prev => prev); setDirty(false) }} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, fontSize: 12, color: T.text, cursor: 'pointer' }}>Discard</button>
              <button onClick={handleSave} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal isOpen={false} />
      {toast && <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: '#0F172A', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.3)', color: '#fff', fontSize: 12, fontWeight: 500 }}>{toast}</div>}
    </div>
  )
}
