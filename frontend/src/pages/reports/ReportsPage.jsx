import React, { useState, useMemo } from 'react'
import { useDeliveryReport, useExportDeliveryCSV, useExportDeliveryPDF } from '../../hooks/useReports'
import ExportButton from '../../components/shared/ExportButton'

const T = {
  bg: '#F0F4F8', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', green: '#00A884', greenLight: '#E6F7F2', blue: '#2563EB', teal: '#0D9488', red: '#DC2626'
}

function Avatar({ name, size = 30 }) {
  const cols = ['#00A884', '#2563EB', '#7C3AED', '#D97706', '#0D9488']
  let h = 0
  for (const c of name) h = (h << 5) - h + c.charCodeAt(0)
  const bg = cols[Math.abs(h) % cols.length]
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{initials}</div>
}

function MsgBadge({ status }) {
  const cfg = { read: { label: 'Read', bg: '#DCFCE7', color: '#166534' }, delivered: { label: 'Delivered', bg: '#EFF6FF', color: '#1E40AF' }, sent: { label: 'Sent', bg: '#F1F5F9', color: '#475569' }, failed: { label: 'Failed', bg: '#FEE2E2', color: '#7F1D1D' } }
  const c = cfg[status] || cfg.sent
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 20, background: c.bg, color: c.color, fontWeight: 700 }}>{c.label}</span>
}

export default function ReportsPage() {
  const [campaignFilter, setCampaignFilter] = useState('All campaigns')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('date')
  const [sortDir, setSortDir] = useState('desc')

  const { data, isLoading } = useDeliveryReport({ campaign: campaignFilter !== 'All campaigns' ? campaignFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined, q: search, from: dateFrom, to: dateTo })
  const exportCSV = useExportDeliveryCSV()
  const exportPDF = useExportDeliveryPDF()

  const records = Array.isArray(data) ? data : (data && (data.records || data.items || data.data)) || []
  const campaigns = useMemo(() => ['All campaigns', ...Array.from(new Set(records.map(r => r.campaign).filter(Boolean)))], [records])

  const totals = {
    sent: records.length,
    delivered: records.filter(r => ['delivered', 'read'].includes(r.status)).length,
    read: records.filter(r => r.status === 'read').length,
    failed: records.filter(r => r.status === 'failed').length,
  }

  const handleExport = async (type) => {
    if (type === 'csv') await exportCSV.mutateAsync({ campaign: campaignFilter })
    else await exportPDF.mutateAsync({ campaign: campaignFilter })
  }

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    const ms = !search || (r.name || '').toLowerCase().includes(q) || (r.phone || '').includes(q) || (r.campaign || '').toLowerCase().includes(q)
    const cs = campaignFilter === 'All campaigns' || r.campaign === campaignFilter
    const ss = statusFilter === 'all' || r.status === statusFilter
    // date filters could be applied if API doesn't support them
    return ms && cs && ss
  })

  const PER_PAGE = 12
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ flex: 1 }}>
        <div style={{ height: 56, background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Delivery Report</div>
            <div style={{ fontSize: 11, color: T.muted }}>Message-level delivery status</div>
          </div>
          <ExportButton onExportCSV={() => handleExport('csv')} onExportPDF={() => handleExport('pdf')} isExporting={exportCSV.isLoading || exportPDF.isLoading} />
        </div>

        <div style={{ padding: 16 }}>
          {/* Summary pills */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {[{ key: 'all', label: 'Total', val: totals.sent }, { key: 'read', label: 'Read', val: totals.read }, { key: 'delivered', label: 'Delivered', val: totals.delivered }, { key: 'failed', label: 'Failed', val: totals.failed }].map(s => (
              <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1) }} style={{ padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${statusFilter === s.key ? T.green : T.border}`, background: statusFilter === s.key ? `${T.green}14` : T.card }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.val}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{s.label}</div>
              </button>
            ))}
            <div style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 9, background: T.greenLight, border: '1px solid #6EE7B7' }}>
              <div style={{ fontSize: 11, color: T.green }}>Delivery rate</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700 }}>{totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, phone or campaign…" style={{ border: 'none', outline: 'none', width: '100%' }} />
            </div>
            <select value={campaignFilter} onChange={e => { setCampaignFilter(e.target.value); setPage(1) }} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card }}>
              {campaigns.map(c => <option key={c}>{c}</option>)}
            </select>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card }} />
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card }} />
            {(search || campaignFilter !== 'All campaigns' || dateFrom || dateTo || statusFilter !== 'all') && (
              <button onClick={() => { setSearch(''); setCampaignFilter('All campaigns'); setDateFrom(''); setDateTo(''); setStatusFilter('all'); setPage(1) }} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card }}>Clear</button>
            )}
          </div>

          {/* Table */}
          <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Contact</th>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Campaign</th>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Sent at</th>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Delivered</th>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Read</th>
                  <th style={{ padding: 12, fontSize: 11, color: T.muted, textTransform: 'uppercase' }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(r => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Avatar name={r.name} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{r.phone}</div>
                      </div>
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{r.campaign}</div>
                      <div style={{ fontSize: 12, color: T.muted }}>{r.template}</div>
                    </td>
                    <td style={{ padding: 12 }}><MsgBadge status={r.status} /></td>
                    <td style={{ padding: 12 }}>{r.sentAt}</td>
                    <td style={{ padding: 12 }}>{r.deliveredAt ? r.deliveredAt.split('·').pop().trim() : '—'}</td>
                    <td style={{ padding: 12 }}>{r.readAt ? r.readAt.split('·').pop().trim() : '—'}</td>
                    <td style={{ padding: 12 }}>{r.error ? <span style={{ color: T.red }}>{r.error}</span> : '—'}</td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.muted }}>No messages match your filters</td></tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ padding: 12, borderTop: `1px solid ${T.border}`, background: T.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: T.muted }}>Showing <strong style={{ color: T.text }}>{Math.min((page-1)*PER_PAGE + 1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)}</strong> of <strong style={{ color: T.text }}>{filtered.length}</strong> messages</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ width: 34, height: 34 }}>‹</button>
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let n = i + 1
                  if (totalPages > 5) {
                    if (page <= 3) n = i + 1
                    else if (page >= totalPages - 2) n = totalPages - 4 + i
                    else n = page - 2 + i
                  }
                  return <button key={n} onClick={() => setPage(n)} style={{ width: 34, height: 34, background: n === page ? T.green : T.card, color: n === page ? '#fff' : T.muted }}>{n}</button>
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={{ width: 34, height: 34 }}>›</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
