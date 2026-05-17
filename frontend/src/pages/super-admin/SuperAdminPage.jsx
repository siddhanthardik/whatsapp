import React, { useState, useEffect } from 'react'
import { superAdminAPI } from '../../services/api'

const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',
  emerald: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  rose: '#EF4444',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  font: 'Inter, system-ui, -apple-system, sans-serif'
}

const roleBadgeColor = {
  super_admin: { bg: 'rgba(139, 92, 246, 0.08)', text: '#8B5CF6', border: 'rgba(139, 92, 246, 0.2)' },
  owner: { bg: 'rgba(16, 185, 129, 0.08)', text: '#10B981', border: 'rgba(16, 185, 129, 0.2)' },
  admin: { bg: 'rgba(59, 130, 246, 0.08)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' },
  manager: { bg: 'rgba(245, 158, 11, 0.08)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
  agent: { bg: 'rgba(99, 102, 241, 0.08)', text: '#6366F1', border: 'rgba(99, 102, 241, 0.2)' },
  viewer: { bg: 'rgba(100, 116, 139, 0.08)', text: '#64748B', border: 'rgba(100, 116, 139, 0.2)' }
}

const planBadgeColor = {
  free: { bg: '#F1F5F9', text: '#475569' },
  starter: { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563EB' },
  growth: { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' },
  enterprise: { bg: 'rgba(139, 92, 246, 0.1)', text: '#7C3AED' }
}

export default function SuperAdminPage() {
  const [telemetry, setTelemetry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTelemetry = async () => {
    try {
      setLoading(true)
      const res = await superAdminAPI.telemetry()
      if (res.data?.success) {
        setTelemetry(res.data.data)
      } else {
        setError(res.data?.message || 'Failed to fetch platform telemetry.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to fetch platform telemetry. Ensure you have Super Admin privileges.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTelemetry()
  }, [])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh', fontFamily:T.font }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:40, height:40, border:`3px solid ${T.border}`, borderTop:`3px solid ${T.purple}`, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
          <span style={{ fontSize:14, color:T.muted }}>Loading platform analytics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding:24, fontFamily:T.font, maxWidth:600, margin:'40px auto', textAlign:'center', background:'#fff', border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
        <h3 style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:8 }}>Access Restrictions</h3>
        <p style={{ fontSize:14, color:T.muted, marginBottom:20 }}>{error}</p>
        <button onClick={fetchTelemetry} style={{ padding:'8px 16px', background:T.purple, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600 }}>Retry Access Check</button>
      </div>
    )
  }

  const { totals = {}, organizations = [], planBreakdown = {}, systemHealth = {} } = telemetry || {}

  return (
    <div style={{ fontFamily:T.font, padding:24, background:T.bg, minHeight:'100vh', display:'flex', flexDirection:'column', gap:24 }}>
      
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:24 }}>⚡</span>
            <h1 style={{ fontSize:24, fontWeight:800, color:T.text, margin:0 }}>Platform Administration</h1>
          </div>
          <p style={{ fontSize:14, color:T.muted, margin:'4px 0 0' }}>Central system metrics, server logs, client subscriptions and databases</p>
        </div>
        <button onClick={fetchTelemetry} style={{ padding:'8px 14px', background:'#fff', border:`1.5px solid ${T.border}`, borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'background 0.2s' }}>
          🔄 Refresh Telemetry
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
        {[
          { title: 'Total Registered Organizations', value: totals.organizations ?? 0, icon: '🏢', color: T.blue },
          { title: 'Global User Accounts', value: totals.users ?? 0, icon: '👥', color: T.purple },
          { title: 'Broadcast Campaigns Sent', value: totals.campaigns ?? 0, icon: '📣', color: T.emerald },
          { title: 'System-Wide Outbound Messages', value: totals.messagesSent?.toLocaleString() ?? 0, icon: '💬', color: T.amber }
        ].map((c) => (
          <div key={c.title} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20, display:'flex', alignItems:'center', gap:16, boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ width:48, height:48, borderRadius:10, background:`${c.color}10`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color:c.color }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:T.muted, textTransform:'uppercase', letterSpacing:'0.04em' }}>{c.title}</div>
              <div style={{ fontSize:22, fontWeight:800, color:T.text, marginTop:4 }}>{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Multi-Layout */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr', gap:20, alignItems:'start' }}>
        
        {/* Organizations registry list */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:16 }}>Registered Client Organizations</div>
          
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', textAlign:'left' }}>
              <thead>
                <tr style={{ borderBottom:`2px solid ${T.border}`, fontSize:12, color:T.muted }}>
                  <th style={{ padding:'10px 8px' }}>Organization Name</th>
                  <th style={{ padding:'10px 8px' }}>Owner</th>
                  <th style={{ padding:'10px 8px' }}>Plan</th>
                  <th style={{ padding:'10px 8px' }}>Active Users</th>
                  <th style={{ padding:'10px 8px' }}>Storage Quotas</th>
                  <th style={{ padding:'10px 8px' }}>Telemetry</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => {
                  const contactsPct = Math.min(100, Math.round((org.contactsUsed / org.contactsLimit) * 100))
                  const messagesPct = Math.min(100, Math.round((org.messagesUsed / org.messagesLimit) * 100))
                  const planStyle = planBadgeColor[org.plan] || planBadgeColor.free

                  return (
                    <tr key={org._id} style={{ borderBottom:`1px solid ${T.border}`, fontSize:13, color:T.text }}>
                      <td style={{ padding:'12px 8px', fontWeight:600 }}>{org.name}</td>
                      <td style={{ padding:'12px 8px' }}>
                        <div>{org.ownerName}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{org.email}</div>
                      </td>
                      <td style={{ padding:'12px 8px' }}>
                        <span style={{ px:8, py:3, fontSize:11, fontWeight:700, textTransform:'uppercase', background:planStyle.bg, color:planStyle.text, borderRadius:4, padding:'2px 6px' }}>
                          {org.plan}
                        </span>
                      </td>
                      <td style={{ padding:'12px 8px', fontWeight:700, fontFamily:T.mono }}>{org.userCount}</td>
                      <td style={{ padding:'12px 8px', width:180 }}>
                        {/* Contacts Storage */}
                        <div style={{ marginBottom:6 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted }}>
                            <span>Contacts</span>
                            <span>{org.contactsUsed}/{org.contactsLimit}</span>
                          </div>
                          <div style={{ height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginTop:2 }}>
                            <div style={{ width:`${contactsPct}%`, height:'100%', background:contactsPct >= 90 ? T.rose : contactsPct >= 70 ? T.amber : T.emerald }} />
                          </div>
                        </div>

                        {/* Outbound Volume */}
                        <div>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:T.muted }}>
                            <span>Volume</span>
                            <span>{org.messagesUsed.toLocaleString()}/{org.messagesLimit.toLocaleString()}</span>
                          </div>
                          <div style={{ height:4, background:'#F1F5F9', borderRadius:99, overflow:'hidden', marginTop:2 }}>
                            <div style={{ width:`${messagesPct}%`, height:'100%', background:messagesPct >= 90 ? T.rose : messagesPct >= 70 ? T.amber : T.blue }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 8px', fontSize:11, color:T.muted }}>
                        <span>Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar telemetry and health details */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          
          {/* Plan Breakdown */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16 }}>Client Plan Distribution</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label: 'Free Tier', count: planBreakdown.free ?? 0, color: '#475569' },
                { label: 'Starter Tier', count: planBreakdown.starter ?? 0, color: T.blue },
                { label: 'Growth Tier', count: planBreakdown.growth ?? 0, color: T.emerald },
                { label: 'Enterprise Tier', count: planBreakdown.enterprise ?? 0, color: T.purple }
              ].map((p) => (
                <div key={p.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px dashed ${T.border}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:p.color }} />
                    <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{p.label}</span>
                  </div>
                  <span style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.muted }}>{p.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16 }}>System Health & Telemetry</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              
              <div>
                <div style={{ fontSize:11, color:T.muted }}>Database Engine</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:systemHealth.database === 'connected' ? T.emerald : T.rose }} />
                  <span style={{ fontSize:13, fontWeight:700, textTransform:'capitalize' }}>{systemHealth.database ?? 'disconnected'}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize:11, color:T.muted }}>API Gateways</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:T.emerald }} />
                  <span style={{ fontSize:13, fontWeight:700 }}>Online & Accepting API Requests</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize:11, color:T.muted }}>Node.js Platform Uptime</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:T.mono, color:T.text, marginTop:2 }}>
                  {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m {systemHealth.uptime % 60}s
                </div>
              </div>

              <div>
                <div style={{ fontSize:11, color:T.muted }}>Memory Heap Used</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:T.mono, color:T.text, marginTop:2 }}>
                  {Math.round((systemHealth.memoryUsage ?? 0) / 1024 / 1024)} MB
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  )
}
