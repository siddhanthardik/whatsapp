import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useCampaigns } from '../../hooks/useCampaigns'

const T = {
  bg: '#F8FAFC', card: '#FFFFFF', green: '#00A884', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8', mono: "'DM Mono','SF Mono',monospace",
}

function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0 }

function StatusBadge({ status, size = 'md' }) {
  const map = {
    running: { label: 'Running', bg: '#DCFCE7', color: '#16A34A' },
    completed: { label: 'Completed', bg: '#EFF6FF', color: '#2563EB' },
    scheduled: { label: 'Scheduled', bg: '#F3E8FF', color: '#7E22CE' },
    paused: { label: 'Paused', bg: '#FEF3C7', color: '#D97706' },
    failed: { label: 'Failed', bg: '#FEE2E2', color: '#DC2626' },
    draft: { label: 'Draft', bg: '#F1F5F9', color: '#475569' }
  }
  const c = map[status] || map.draft
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: c.bg, color: c.color, fontSize: 12, fontWeight: 700 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color }} />
      {c.label}
    </span>
  )
}

function Topbar({ title, subtitle, actions }) {
  return (
    <div style={{ height: 64, background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: T.subtle, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  )
}

export default function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [tick, setTick] = useState(0)

  const { data: campaignsResp } = useCampaigns({ limit: 200 })
  const campaigns = Array.isArray(campaignsResp?.campaigns) ? campaignsResp.campaigns : Array.isArray(campaignsResp) ? campaignsResp : []

  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 4000); return () => clearInterval(iv) }, [])

  const getLiveSent = useCallback((c) => { if (c.status !== 'running') return c.sent ?? 0; return Math.min(c.total ?? 0, (c.sent ?? 0) + tick * 10) }, [tick])

  const counts = { all: campaigns.length, running: campaigns.filter(c => c.status === 'running').length, scheduled: campaigns.filter(c => c.status === 'scheduled').length, paused: campaigns.filter(c => c.status === 'paused').length, completed: campaigns.filter(c => c.status === 'completed').length }

  const filtered = campaigns.filter(c => {
    const ms = !search || (c.name || '').toLowerCase().includes(search.toLowerCase())
    const ss = statusFilter === 'all' || c.status === statusFilter
    return ms && ss
  })

  const getDeliveryColor = (p) => {
    if (p >= 95) return '#10B981';
    if (p >= 90) return '#D97706';
    return '#DC2626';
  }

  const getProgressColor = (status) => {
    const map = { running: '#10B981', completed: '#3B82F6', paused: '#F59E0B', failed: '#EF4444' }
    return map[status] || '#94A3B8'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.bg }}>
      <Topbar
        title="Campaigns"
        subtitle={`${counts.all} campaigns · ${counts.running} running · ${counts.scheduled} scheduled`}
        actions={
          <Link to="/campaigns/new" style={{ textDecoration: 'none' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: T.green, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              New Campaign
            </button>
          </Link>
        }
      />

      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ key: 'all', label: 'All', val: counts.all }, { key: 'running', label: 'Running', val: counts.running }, { key: 'scheduled', label: 'Scheduled', val: counts.scheduled }, { key: 'paused', label: 'Paused', val: counts.paused }, { key: 'completed', label: 'Completed', val: counts.completed }].map(s => {
              const isSel = statusFilter === s.key
              return (
                <button key={s.key} onClick={() => setStatusFilter(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, border: `1px solid ${isSel ? '#3B82F6' : T.border}`, background: isSel ? '#EFF6FF' : '#fff', cursor: 'pointer', transition: 'all 0.15s ease' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: isSel ? '#3B82F6' : '#0F172A' }}>{s.val}</span>
                  <span style={{ fontSize: 14, color: isSel ? '#3B82F6' : '#64748B', fontWeight: 500 }}>{s.label}</span>
                </button>
              )
            })}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: T.muted, fontSize: 13 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            Live · updates every 4s
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 8, background: '#fff' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…" style={{ border: 'none', outline: 'none', width: '100%', fontSize: 15, color: T.text, background: 'transparent' }} />
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: `1px solid ${T.border}` }}>
                {['Campaign','Status','Progress','Delivery','Open rate'].map(h => (
                  <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const s = c.stats || {}
                const totalTarget = s.totalContacts || c.total || 0
                const sent = s.sent || 0
                const delivered = s.delivered || 0
                const read = s.read || 0
                const failed = s.failed || 0

                const deliveryPct = pct(delivered, sent)
                const openRatePct = pct(read, sent)
                const progressPct = Math.min(100, pct(sent, totalTarget || 1))
                const progColor = getProgressColor(c.status)
                const isScheduled = c.status === 'scheduled'
                const isDraft = c.status === 'draft'

                return (
                  <tr key={c.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${T.border}` }}>
                    <td style={{ padding: '20px 24px', width: '30%' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0F172A', marginBottom: 4 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: '#94A3B8' }}>
                        {isScheduled ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8B5CF6' }}>
                            <span style={{ color: '#94A3B8' }}>{c.template}</span>
                            <br/>⏰ {new Date(c.scheduledAt || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          c.template
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', width: '15%' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '20px 24px', width: '25%' }}>
                      {isDraft ? (
                        <div style={{ color: '#94A3B8', fontSize: 14 }}>—</div>
                      ) : isScheduled ? (
                        <div style={{ color: '#64748B', fontSize: 14 }}>{Number(totalTarget).toLocaleString()} contacts</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 13 }}>
                            <div>
                              <span style={{ fontWeight: 700, color: '#0F172A' }}>{Number(sent).toLocaleString()}</span>
                              <span style={{ color: '#94A3B8' }}> / {Number(totalTarget).toLocaleString()}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: progColor }}>{progressPct}%</span>
                          </div>
                          <div style={{ height: 4, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${progressPct}%`, height: '100%', background: progColor, borderRadius: 4 }} />
                          </div>
                          {failed > 0 && (
                            <button 
                              onClick={async (e) => { 
                                e.preventDefault(); 
                                e.stopPropagation();
                                try {
                                  await fetch(`/api/campaigns/${c.id}/retry`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }});
                                  // The polling will pick up the changes
                                } catch (err) {}
                              }}
                              style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                            >
                              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="1 4 1 10 7 10"></polyline>
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                              </svg>
                              Retry {failed} failed
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px', width: '15%' }}>
                      {isDraft || isScheduled ? (
                        <div style={{ color: '#94A3B8' }}>—</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: getDeliveryColor(deliveryPct) }}>{deliveryPct}%</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{delivered.toLocaleString()} / {sent.toLocaleString()}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '20px 24px', width: '15%' }}>
                      {isDraft || isScheduled ? (
                        <div style={{ color: '#94A3B8' }}>—</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{openRatePct}%</span>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>{read.toLocaleString()} / {sent.toLocaleString()}</span>
                          </div>
                          <div style={{ width: 14, height: 4, background: '#E2E8F0', borderRadius: 2 }}>
                            <div style={{ width: `${openRatePct}%`, height: '100%', background: '#8B5CF6', borderRadius: 2 }} />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>No campaigns matched your filters.</div>}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
      `}</style>
    </div>
  )
}

