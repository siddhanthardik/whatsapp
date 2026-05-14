import React from 'react'

export const T = {
  bg: '#F0F4F8', sidebar: '#0C1628', card: '#FFFFFF', green: '#00A884', greenLight: '#E6F7F2',
  greenDark: '#007A61', blue: '#2563EB', blueLight: '#EFF6FF', amber: '#D97706', amberLight: '#FFFBEB',
  red: '#DC2626', redLight: '#FFF1F2', purple: '#7C3AED', purpleLight: '#F5F3FF', teal: '#0D9488',
  tealLight: '#F0FDFA', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8', border: '#E2E8F0',
  borderMid: '#CBD5E1', font: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", mono: "'DM Mono', 'SF Mono', monospace",
}

export const TAGS = ['VIP','Delhi','Mumbai','Premium','New User','Inactive','Festival','Wholesale']
export const TAG_COLORS = {
  VIP: { bg:'#FEF3C7', color:'#92400E' }, Delhi: { bg:'#EFF6FF', color:'#1D4ED8' }, Mumbai: { bg:'#F0FDF4', color:'#166534' },
  Premium: { bg:'#F5F3FF', color:'#5B21B6' }, 'New User': { bg:'#FFF7ED', color:'#9A3412' }, Inactive: { bg:'#F1F5F9', color:'#475569' },
  Festival: { bg:'#FDF2F8', color:'#9D174D' }, Wholesale: { bg:'#ECFDF5', color:'#065F46' },
}

const avatarColors = ['#00A884','#2563EB','#7C3AED','#D97706','#0D9488','#DB2777','#EA580C','#0284C7']
export function avatarColor(name){ let h=0; for(let c of name) h=(h<<5)-h+c.charCodeAt(0); return avatarColors[Math.abs(h)%avatarColors.length]; }
export function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }

export function Avatar({ name, size=34 }){
  const bg = avatarColor(name)
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:'#fff', letterSpacing:'-0.02em' }}>{initials(name)}</div>
  )
}

export function Tag({ label }){
  const cfg = TAG_COLORS[label] || { bg:T.border, color:T.muted }
  return <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:cfg.bg, color:cfg.color, whiteSpace:'nowrap' }}>{label}</span>
}

const STATUS_CFG = {
  opted_in: { label:'Opted in', bg:'#DCFCE7', color:'#166534', dot:'#22C55E' },
  opted_out:{ label:'Opted out', bg:'#FEE2E2', color:'#7F1D1D', dot:'#EF4444' },
  pending:  { label:'Pending', bg:'#FEF3C7', color:'#78350F', dot:'#F59E0B' },
}
export function StatusBadge({ status, size='md' }){
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  const pad = size==='sm' ? '2px 7px' : '3px 10px'
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:pad, borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:size==='sm'?10:11, fontWeight:600, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, flexShrink:0 }} />
      {cfg.label}
    </span>
  )
}

export function MsgBadge({ status }){
  const MAP = { read:{label:'Read',bg:'#DCFCE7',color:'#166534'}, delivered:{label:'Delivered',bg:'#EFF6FF',color:'#1E40AF'}, sent:{label:'Sent',bg:'#F1F5F9',color:'#475569'}, failed:{label:'Failed',bg:'#FEE2E2',color:'#7F1D1D'} }
  const cfg = MAP[status] || MAP.sent
  return <span style={{ padding:'2px 8px', borderRadius:20, fontSize:10, fontWeight:600, background:cfg.bg, color:cfg.color, whiteSpace:'nowrap' }}>{cfg.label}</span>
}

export const I = {
  search: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  upload: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  plus: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  optOut: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  trash: <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  back: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
}

export function Topbar({ title, subtitle, actions }){
  return (
    <div style={{ height:60, background:T.card, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', padding:'0 24px', gap:12, position:'sticky', top:0, zIndex:10, flexShrink:0 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:17, fontWeight:700, color:T.text }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:T.subtle }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  )
}

export function Sidebar({ view, setView }){
  const NAV = [ 'Dashboard','Contacts','Templates','Campaigns','Analytics','Reports','Opt-In / Out' ]
  return (
    <div style={{ width:220, flexShrink:0, background:T.sidebar, display:'flex', flexDirection:'column', height:'100vh', position:'sticky', top:0, borderRight:'1px solid #1A2744' }}>
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid #1A2744' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:T.green, display:'flex', alignItems:'center', justifyContent:'center' }}>WA</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#F8FAFC' }}>WA Platform</div>
            <div style={{ fontSize:10, color:'#475569', marginTop:1 }}>Enterprise</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
        {NAV.map(label=> (
          <div key={label} style={{ padding:'9px 10px', color: label=== 'Contacts' ? '#fff' : '#94A3B8' }}>{label}</div>
        ))}
      </nav>
    </div>
  )
}

export default null
