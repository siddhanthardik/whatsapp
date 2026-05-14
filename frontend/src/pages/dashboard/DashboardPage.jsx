import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'

import { useDashboardStats, useMessageTrends } from '../../hooks/useAnalytics'
import { useCampaigns } from '../../hooks/useCampaigns'
import MetricCard from '../../components/shared/MetricCard'
import DataTable from '../../components/shared/DataTable'
import StatusBadge from '../../components/shared/StatusBadge'

function fmtNumber(v) {
  if (v == null) return '—'
  return typeof v === 'number' ? new Intl.NumberFormat().format(v) : v
}

export default function DashboardPage() {
  const [period, setPeriod] = useState(30) // days: 1, 7, 30
  const { data: stats, isLoading: statsLoading } = useDashboardStats({ days: period })
  const { data: trends = [], isLoading: trendsLoading } = useMessageTrends(period)
  const { data: campaignsResp, isLoading: campaignsLoading } = useCampaigns({ limit: 5 })

  // Normalize responses
  const statsData = stats || {}
  // trends expected as array of { date, sent }
  const trendsData = Array.isArray(trends) ? trends : trends?.data || []
  // Ensure campaigns is always an array — backend responses may wrap items
  const campaigns = Array.isArray(campaignsResp)
    ? campaignsResp
    : Array.isArray(campaignsResp?.items)
    ? campaignsResp.items
    : []

  // base messages value from API
  const baseMessages = statsData.messagesToday ?? statsData.sentToday ?? statsData.totalSentToday ?? 0

  // Live simulation: when period === 1 show pulsing live dot and increment sent count every 4s
  const [tickIncs, setTickIncs] = useState(0)
  useEffect(() => {
    let iv = null
    setTickIncs(0)
    if (period === 1) {
      iv = setInterval(() => setTickIncs(t => t + Math.floor(Math.random() * 5) + 1), 4000)
    }
    return () => { if (iv) clearInterval(iv) }
  }, [period])

  // Display value for Messages today (apply tickIncs when period === 1)
  const displayedMessagesToday = period === 1 ? (Number(baseMessages) + tickIncs) : baseMessages

  const metricItems = [
    {
      title: 'Messages today',
      value: displayedMessagesToday,
      subtitle: 'vs yesterday',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      ),
      accent: 'bg-green-500',
    },
    {
      title: 'Delivery rate',
      value: statsData.deliveryRate ? `${statsData.deliveryRate}%` : statsData.delivery?.toFixed?.(1) ?? '—',
      subtitle: 'all campaigns',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      ),
      accent: 'bg-blue-500',
    },
    {
      title: 'Open rate',
      value: statsData.openRate ? `${statsData.openRate}%` : '—',
      subtitle: 'vs last week',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      ),
      accent: 'bg-purple-500',
    },
    {
      title: 'Active campaigns',
      value: statsData.activeCampaigns ?? (campaigns.length || 0),
      subtitle: statsData.activeSummary || undefined,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      ),
      accent: 'bg-amber-500',
    },
  ]


  const tableColumns = [
    { key: 'name', header: 'Campaign' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} />, sortable: true },
    { key: 'sent', header: 'Messages sent', render: (r) => fmtNumber(r.sent) },
    { key: 'delivery', header: 'Delivery rate', render: (r) => (r.delivery != null ? `${r.delivery}%` : '—') },
    { key: 'open', header: 'Open rate', render: (r) => (r.open != null ? `${r.open}%` : '—') },
    { key: 'date', header: 'Launched', render: (r) => r.date || r.launched || '—' },
    { key: 'actions', header: '', render: (r) => <Link to={`/campaigns/${r.id}`} className="text-blue-600 hover:underline">View</Link> },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="text-sm text-gray-500">Overview of activity and trends</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded px-2 py-1">
            <button onClick={() => setPeriod(1)} className={`px-3 py-1 rounded ${period===1? 'bg-slate-900 text-white' : 'text-slate-600'}`}>Today</button>
            <button onClick={() => setPeriod(7)} className={`px-3 py-1 rounded ${period===7? 'bg-slate-900 text-white' : 'text-slate-600'}`}>7 days</button>
            <button onClick={() => setPeriod(30)} className={`px-3 py-1 rounded ${period===30? 'bg-slate-900 text-white' : 'text-slate-600'}`}>30 days</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width:8, height:8, borderRadius:99, background:'#10B981', boxShadow:'0 0 6px #10B981', animation: 'pulse 1.4s infinite' }} />
              <span className="text-sm text-gray-600">Live</span>
            </div>
            <div className="text-sm text-gray-600">Sent: <strong>{statsLoading ? '—' : displayedMessagesToday.toLocaleString()}</strong></div>
          </div>
          <Link to="/campaigns/new" className="ml-3 inline-flex items-center gap-2 bg-white text-sm px-3 py-2 rounded border">
            New Campaign ↗
          </Link>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricItems.map((m, i) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={statsLoading ? null : typeof m.value === 'number' ? fmtNumber(m.value) : m.value}
            subtitle={m.subtitle}
            icon={m.icon}
            isLoading={statsLoading}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Messages sent (last {period} day{period>1?'s':''})</div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <a href="#" onClick={(e)=>{e.preventDefault(); window.location.href='/analytics'}} className="text-sm text-blue-600 hover:underline">View analytics ↗</a>
              <div className="text-sm text-gray-500">Total: {statsLoading ? '—' : fmtNumber(statsData.totalSentLast30 || statsData.sentLast30 || 0)}</div>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTrendTooltip />} />
                <Line type="monotone" dataKey="sent" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="delivered" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="read" stroke="#7C3AED" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <div className="mb-2 text-sm font-medium text-gray-700">Top campaigns by open rate</div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
            <a href="#" onClick={(e)=>{e.preventDefault(); window.location.href='/campaigns'}} className="text-sm text-blue-600 hover:underline">View all ↗</a>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaigns.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="open" fill="#7C3AED" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent campaigns table */}
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Recent campaigns</div>
          <div className="text-sm text-gray-500">Live status updates</div>
        </div>
        <DataTable columns={tableColumns} data={campaigns} isLoading={campaignsLoading} />
      </div>
    </div>
  )
}

function CustomTrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  // payload: array of { dataKey, value }
  const sent = payload.find(p => p.dataKey === 'sent')?.value
  const delivered = payload.find(p => p.dataKey === 'delivered')?.value
  const read = payload.find(p => p.dataKey === 'read')?.value
  return (
    <div style={{ background:'#0F172A', color:'#fff', padding:10, borderRadius:8, boxShadow:'0 6px 18px rgba(2,6,23,.4)' }}>
      <div style={{ fontSize:12, opacity:0.8 }}>{label}</div>
      <div style={{ marginTop:6, fontSize:13 }}><strong>Sent:</strong> {sent ?? '—'}</div>
      <div style={{ fontSize:13 }}><strong>Delivered:</strong> {delivered ?? '—'}</div>
      <div style={{ fontSize:13 }}><strong>Read:</strong> {read ?? '—'}</div>
    </div>
  )
}

