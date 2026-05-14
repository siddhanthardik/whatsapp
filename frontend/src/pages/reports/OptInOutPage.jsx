import React, { useState } from 'react'
import { useOptIns, useOptOuts, useManualOptOut, useManualOptIn } from '../../hooks/useOptInOut'
import ConfirmModal from '../../components/shared/ConfirmModal'

export default function OptInOutPage() {
  const [tab, setTab] = useState('opt-outs')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data: optIns = [], isLoading: loadingIns } = useOptIns({ q: query })
  const { data: optOuts = [], isLoading: loadingOuts } = useOptOuts({ q: query })
  const manualOut = useManualOptOut()
  const manualIn = useManualOptIn()

  const handleManualOut = (contact) => {
    setSelected(contact)
    setShowConfirm(true)
  }

  const confirmOut = async () => {
    if (!selected) return
    await manualOut.mutateAsync({ phone: selected.phone })
    setShowConfirm(false)
  }

  const confirmIn = async () => {
    if (!selected) return
    await manualIn.mutateAsync({ phone: selected.phone })
    setShowConfirm(false)
  }

  const list = tab === 'opt-outs' ? optOuts : optIns

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Opt In / Out Manager</h3>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setTab('opt-ins')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'opt-ins' ? '#E6F7F2' : '#fff' }}>Opt-ins</button>
          <button onClick={() => setTab('opt-outs')} style={{ padding: '6px 10px', borderRadius: 8, background: tab === 'opt-outs' ? '#FEE2E2' : '#fff' }}>Opt-outs</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input placeholder="Search by phone or name..." value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }} />
      </div>

      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Contact</th>
              <th style={{ padding: 12 }}>Phone</th>
              <th style={{ padding: 12 }}>Date</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(list || []).map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid #EEF2F7' }}>
                <td style={{ padding: 12 }}>{c.name || '—'}</td>
                <td style={{ padding: 12 }}>{c.phone}</td>
                <td style={{ padding: 12 }}>{new Date(c.updatedAt || c.createdAt).toLocaleString()}</td>
                <td style={{ padding: 12 }}>
                  {tab === 'opt-outs' ? (
                    <button onClick={() => { setSelected(c); setShowConfirm(true) }} style={{ padding: '6px 10px', borderRadius: 8, background: '#E6F7F2' }}>Manual opt-in</button>
                  ) : (
                    <button onClick={() => { setSelected(c); setShowConfirm(true) }} style={{ padding: '6px 10px', borderRadius: 8, background: '#FEE2E2' }}>Manual opt-out</button>
                  )}
                </td>
              </tr>
            ))}
            {(list || []).length === 0 && (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>No records</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal open={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={() => {
        if (tab === 'opt-outs') confirmIn()
        else confirmOut()
      }} title={tab === 'opt-outs' ? 'Confirm manual opt-in' : 'Confirm manual opt-out'} description={`Are you sure you want to ${tab === 'opt-outs' ? 'opt this contact in' : 'opt this contact out'}?`} />
    </div>
  )
}
