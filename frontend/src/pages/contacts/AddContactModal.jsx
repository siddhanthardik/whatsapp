import React, { useState } from 'react'
import { contactsAPI } from '../../services/api'
import { toast } from 'react-hot-toast'

export default function AddContactModal({ open, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const TAGS = ["VIP", "Delhi", "Mumbai", "Premium", "New User", "Inactive", "Festival", "Wholesale"]

  const save = async () => {
    if (!phone || !String(phone).trim()) {
      toast.error('Phone number is required')
      return
    }
    setLoading(true)
    const payload = { phoneNumber: phone.trim(), name: name.trim() || undefined, email: email.trim() || undefined, tags }
    try {
      toast.loading('Saving contact...', { id: 'save-contact' })
      const res = await contactsAPI.create(payload)
      if (res?.data?.success) {
        toast.success('Contact added', { id: 'save-contact' })
        if (typeof onSaved === 'function') onSaved(res.data.data?.contact || res.data.data || null)
        window.dispatchEvent(new Event('contacts:refresh'))
        onClose()
      } else {
        toast.error(res?.data?.message || 'Failed to add contact', { id: 'save-contact' })
      }
    } catch (err) {
      console.error('create contact failed', err)
      // network/offline fallback: save locally
      const offline = !err?.response || err?.message === 'Network Error' || err?.code === 'ECONNABORTED'
      if (offline) {
        try {
          const localKey = 'local_contacts'
          const existing = JSON.parse(localStorage.getItem(localKey) || '[]')
          const id = `local-${Date.now()}`
          const localContact = {
            id,
            _id: id,
            name: name.trim() || undefined,
            phoneNumber: phone.trim(),
            email: email.trim() || undefined,
            organisation: org || undefined,
            tags,
            source: 'local',
            status: 'pending',
            createdAt: new Date().toISOString(),
          }
          existing.unshift(localContact)
          localStorage.setItem(localKey, JSON.stringify(existing))
          toast.success('Saved locally (offline)', { id: 'save-contact' })
          if (typeof onSaved === 'function') onSaved(localContact)
          window.dispatchEvent(new Event('contacts:refresh'))
          onClose()
        } catch (e) {
          console.error('local save failed', e)
          toast.error('Failed to save contact', { id: 'save-contact' })
        }
      } else {
        toast.error(err?.response?.data?.message || err.message || 'Failed to add contact', { id: 'save-contact' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 640, maxWidth: '95vw', borderRadius: 12, background: '#fff', padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Add new contact</div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Priya Sharma" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Phone number</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="priya@example.com" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Organisation</label>
          <input value={org} onChange={e => setOrg(e.target.value)} placeholder="Sharma Enterprises" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 12 }} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Tags</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {TAGS.map(t => (
              <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} style={{ padding: '6px 10px', borderRadius: 20, border: tags.includes(t) ? '1px solid #00A884' : '1px solid #E2E8F0', background: tags.includes(t) ? '#E6F7F2' : 'transparent', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff' }}>Cancel</button>
            <button onClick={save} disabled={loading} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#00A884', color: '#fff', fontWeight: 700 }}>{loading ? 'Saving...' : 'Save Contact'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
