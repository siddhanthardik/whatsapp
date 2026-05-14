import React, { useEffect, useState } from 'react'
import { usersAPI } from '../../services/api'
import ConfirmModal from '../../components/shared/ConfirmModal'

const T = {
  bg: '#F0F4F8',
  card: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#64748B',
  text: '#0F172A',
  green: '#00A884',
}

function Avatar({ name, size = 34 }) {
  const cols = ['#00A884', '#2563EB', '#7C3AED', '#D97706', '#0D9488', '#DB2777', '#EA580C', '#0891B2']
  let h = 0
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0)
  const bg = cols[Math.abs(h) % cols.length]
  const ini = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 700, color: '#fff' }}>{ini}</div>
}

export default function UsersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleF, setRoleF] = useState('all')
  const [invOpen, setInvOpen] = useState(false)
  const [invForm, setInvForm] = useState({ name: '', email: '', role: 'campaign_manager' })
  const [confirmRem, setConfirmRem] = useState(null)
  const [toast, setToast] = useState(null)

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await usersAPI.list()
      setMembers(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMembers() }, [])

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleInvite = async () => {
    if (!invForm.name || !invForm.email) return showToast('Name and email required')
    try {
      await usersAPI.create(invForm)
      setInvOpen(false)
      setInvForm({ name: '', email: '', role: 'campaign_manager' })
      fetchMembers()
      showToast('Invitation sent')
    } catch (e) { showToast('Failed to invite') }
  }

  const handleRemove = async (m) => {
    try {
      await usersAPI.delete(m._id || m.id)
      setConfirmRem(null)
      fetchMembers()
      showToast(m.name + ' removed')
    } catch (e) { showToast('Remove failed') }
  }

  const handleToggle = async (m) => {
    try {
      const id = m._id || m.id
      await usersAPI.update(id, { status: m.status === 'active' ? 'inactive' : 'active' })
      fetchMembers()
      showToast('Status updated')
    } catch (e) { showToast('Update failed') }
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (!search || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) && (roleF === 'all' || m.role === roleF)
  })

  const ROLE_CFG = {
    super_admin: { label: 'Super Admin', bg: '#FEF3C7', color: '#92400E' },
    org_admin: { label: 'Org Admin', bg: '#EFF6FF', color: '#1D4ED8' },
    campaign_manager: { label: 'Campaign Manager', bg: '#ECFDF5', color: '#065F46' },
    analyst: { label: 'Analyst', bg: '#F5F3FF', color: '#5B21B6' },
    support_agent: { label: 'Support Agent', bg: '#FFF7ED', color: '#9A3412' },
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
      <div style={{ height: 54, background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>Team Management</div>
          <div style={{ fontSize: 10, color: T.muted }}>{members.length} members · Acme Corp</div>
        </div>
        <button onClick={() => setInvOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Invite member</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
          <button onClick={() => setRoleF('all')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${roleF === 'all' ? '#2563EB' : T.border}`, background: roleF === 'all' ? '#EFF6FF' : T.card }}>
            <span style={{ fontSize: 11, color: roleF === 'all' ? '#2563EB' : T.muted }}>All</span>
          </button>
          {Object.entries(ROLE_CFG).map(([r, c]) => (
            <button key={r} onClick={() => setRoleF(r)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${roleF === r ? c.color : T.border}`, background: roleF === r ? c.bg : T.card }}>
              <span style={{ fontSize: 11, color: roleF === r ? c.color : T.muted }}>{c.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.card, borderRadius: 8, padding: '7px 11px', border: `1px solid ${T.border}`, marginBottom: 12, maxWidth: 480 }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: T.text, width: '100%' }} />
        </div>

        <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '12px 14px' }}>User</th>
                <th style={{ padding: '12px 14px' }}>Role</th>
                <th style={{ padding: '12px 14px' }}>Last login</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} style={{ padding: 18 }}>Loading…</td></tr>}
              {!loading && filtered.map(m => (
                <tr key={m._id || m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={m.name} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{m.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 20, background: (ROLE_CFG[m.role]?.bg) || '#fff', color: (ROLE_CFG[m.role]?.color) || T.muted, fontWeight: 700, fontSize: 11 }}>{(ROLE_CFG[m.role]?.label) || m.role}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: T.muted }}>{m.lastLogin || 'Never'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => handleToggle(m)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: m.status === 'active' ? T.green : '#F8FAFC', color: m.status === 'active' ? '#fff' : T.muted, cursor: 'pointer' }}>{m.status === 'active' ? 'Active' : 'Inactive'}</button>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setConfirmRem(m)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #F1F5F9', background: '#fff', cursor: 'pointer' }}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, background: T.bg, fontSize: 12, fontWeight: 700, color: T.text }}>Role permissions reference</div>
          <div style={{ overflowX: 'auto', padding: 12 }}>
            <div style={{ minWidth: 640, fontSize: 13, color: T.muted }}>Permissions table not implemented — refer to server ACL.</div>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {invOpen && (
        <div onClick={() => setInvOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 14, width: 430, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>Invite team member</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>They'll receive an email to set their password and activate their account.</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Full name</label>
              <input value={invForm.name} onChange={e => setInvForm(f => ({ ...f, name: e.target.value }))} placeholder="Priya Sharma" style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 6 }}>Email address</label>
              <input value={invForm.email} onChange={e => setInvForm(f => ({ ...f, email: e.target.value }))} placeholder="priya@acmecorp.in" style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
              <button onClick={() => setInvOpen(false)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleInvite} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', cursor: 'pointer' }}>Send invite</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmRem} onClose={() => setConfirmRem(null)} onConfirm={() => handleRemove(confirmRem)} title={`Remove ${confirmRem?.name}?`} message="This person will immediately lose platform access. Their data will remain." confirmLabel="Remove member" confirmVariant="danger" />

      {toast && <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', background: '#0F172A', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.3)', color: '#fff', fontSize: 12 }}>{toast}</div>}
    </div>
  )
}
