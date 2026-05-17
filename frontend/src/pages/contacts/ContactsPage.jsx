import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useContacts } from '../../hooks/useContacts'
import { Avatar, Tag, StatusBadge, TAGS } from './contactsCommon'
import AddContactModal from './AddContactModal'

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', green: '#00A884', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8'
}

function Topbar({ subtitle, actions }) {
  return (
    <div style={{ height: 64, background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Contacts</div>
        {subtitle && <div style={{ fontSize: 13, color: T.subtle, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  )
}

export default function ContactsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data: contactsResp } = useContacts({ limit: 200 })
  const contacts = Array.isArray(contactsResp) ? contactsResp : Array.isArray(contactsResp?.contacts) ? contactsResp.contacts : Array.isArray(contactsResp?.items) ? contactsResp.items : []

  // also include any locally saved contacts (offline fallback)
  let localContacts = []
  try {
    localContacts = JSON.parse(localStorage.getItem('local_contacts') || '[]') || []
  } catch (e) { localContacts = [] }

  // merge local + server contacts, prefer server items when duplicate by phoneNumber/_id
  const mergedMap = new Map()
  for (const c of localContacts) {
    const key = c._id || c.id || c.phoneNumber || c.phone || JSON.stringify(c)
    mergedMap.set(key, c)
  }
  for (const c of contacts) {
    const key = c._id || c.id || c.phoneNumber || c.phone || JSON.stringify(c)
    mergedMap.set(key, c)
  }
  const mergedContacts = Array.from(mergedMap.values())

  // Ensure mock data for preview if missing
  const enhancedContacts = mergedContacts.map(c => ({
    ...c,
    status: (c.status ? c.status.toLowerCase() : (c.optInStatus || 'opted_in')),
    name: c.name || c.fullName || 'Unknown Contact',
    email: c.email || c.name?.toLowerCase().replace(' ', '.') + '@example.com',
    phone: c.phone || c.phoneNumber || '+91 98765 43210',
    tags: c.tags || []
  }))

  const counts = {
    all: enhancedContacts.length,
    opted_in: enhancedContacts.filter(c => c.status === 'opted_in').length,
    opted_out: enhancedContacts.filter(c => c.status === 'opted_out').length,
    pending: enhancedContacts.filter(c => c.status === 'pending').length
  }

  const filtered = enhancedContacts.filter(c => {
    const ms = !search || (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search)
    const ss = statusFilter === 'all' || c.status === statusFilter
    const ts = tagFilter === 'all' || (c.tags || []).includes(tagFilter)
    return ms && ss && ts
  })

  // Pagination vars
  const PER_PAGE = 8
  const totalFiltered = filtered.length
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.ceil(totalFiltered / PER_PAGE) || 1

  const [showAddModal, setShowAddModal] = useState(false)

  const handleSaved = (created) => {
    // trigger refresh globally
    window.dispatchEvent(new Event('contacts:refresh'))
    setShowAddModal(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bg }}>
      <Topbar
        subtitle={`${counts.all} total · ${counts.opted_in} opted in · ${counts.opted_out} opted out`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link to="/contacts/import">
              <button style={{ fontWeight: 700, color: '#0F172A', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 15 }}>
                Import CSV
              </button>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {localContacts.length > 0 && (
                <div style={{ fontSize: 13, color: '#0F172A', background: '#FEF3C7', padding: '6px 10px', borderRadius: 8, border: '1px solid #FDE68A' }}>
                  {localContacts.length} pending
                </div>
              )}
              <button type="button" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: T.green, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                + Add Contact
              </button>
            </div>
          </div>
        }
      />

      <AddContactModal open={showAddModal} onClose={() => setShowAddModal(false)} onSaved={handleSaved} />

      <div style={{ padding: '24px 32px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        
        {/* TABS */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {[{ key: 'all', label: 'All contacts', val: counts.all }, { key: 'opted_in', label: 'Opted in', val: counts.opted_in }, { key: 'opted_out', label: 'Opted out', val: counts.opted_out }, { key: 'pending', label: 'Pending', val: counts.pending }].map(s => {
            const isSel = statusFilter === s.key
            return (
              <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: `1px solid ${isSel ? '#3B82F6' : T.border}`, background: isSel ? '#EFF6FF' : '#fff', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: isSel ? '#3B82F6' : '#0F172A' }}>{s.val}</span>
                <span style={{ fontSize: 14, color: isSel ? '#3B82F6' : '#64748B', fontWeight: 500 }}>{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* SEARCH & FILTERS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, phone or email..." style={{ border: 'none', outline: 'none', width: '100%', fontSize: 15, color: T.text, background: 'transparent' }} />
          </div>
          <select value={tagFilter} onChange={e => { setTagFilter(e.target.value); setPage(1); }} style={{ padding: '12px 32px 12px 16px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', color: T.text, fontSize: 14, appearance: 'none', background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%2364748B' viewBox='0 0 24 24' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 16px center / 12px, #fff`, minWidth: 120 }}>
            <option value="all">Tag: All</option>
            {TAGS.map(t => <option key={t} value={t}>Tag: {t}</option>)}
          </select>
        </div>

        {/* TABLE */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: 48 }}>
                  <input type="checkbox" style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${T.subtle}`, cursor: 'pointer' }} />
                </th>
                {['Contact','Phone','Status','Tags'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, i) => (
                <tr key={c.id || i} style={{ borderBottom: i === paginated.length - 1 ? 'none' : `1px solid ${T.border}` }}>
                  <td style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <input type="checkbox" style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${T.subtle}`, cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={c.name} size={40} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 2 }}>{c.name}</div>
                        <div style={{ fontSize: 13, color: '#94A3B8' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <div style={{ fontSize: 13, color: '#64748B', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                      {c.phone.replace(/ /g, '\n')}
                    </div>
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <StatusBadge status={c.status} />
                  </td>
                  <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(c.tags || []).slice(0, 3).map(t => <Tag key={t} label={t} />)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginated.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>No contacts found.</div>}
          
          {/* PAGINATION FOOTER */}
          {filtered.length > 0 && (
            <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 24px', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, color: '#64748B' }}>
                Showing <b>{Math.min((page - 1) * PER_PAGE + 1, totalFiltered)}–{Math.min(page * PER_PAGE, totalFiltered)}</b> of <b>{totalFiltered}</b> contacts
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#CBD5E1' : T.text }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div style={{ padding: '0 4px', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 14, color: '#fff', background: '#10B981', borderRadius: 8, width: 32, justifyContent: 'center' }}>
                  {page}
                </div>
                {page < totalPages && (
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, cursor: 'pointer', color: T.text, fontSize: 14, fontWeight: 500 }}>
                    {page + 1}
                  </button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#CBD5E1' : T.text }}>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

