import React, { useState, useEffect, useRef, useCallback } from "react";
import api, { templatesAPI, campaignsAPI } from "../../services/api";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  bg:         "#F0F4F8",
  sidebar:    "#0C1628",
  card:       "#FFFFFF",
  green:      "#00A884",
  greenLight: "#E6F7F2",
  greenDark:  "#007A61",
  blue:       "#2563EB",
  blueLight:  "#EFF6FF",
  amber:      "#D97706",
  amberLight: "#FFFBEB",
  red:        "#DC2626",
  redLight:   "#FFF1F2",
  purple:     "#7C3AED",
  purpleLight:"#F5F3FF",
  teal:       "#0D9488",
  tealLight:  "#F0FDFA",
  text:       "#0F172A",
  muted:      "#64748B",
  subtle:     "#94A3B8",
  border:     "#E2E8F0",
  borderMid:  "#CBD5E1",
  font:       "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  mono:       "'DM Mono','SF Mono',monospace",
};

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const CAMPAIGNS = [
  { id:1,  name:"Diwali Promo 2024",       status:"running",   template:"Festival Promo — Diwali",    total:10000, sent:8234,  delivered:7960, read:5940,  failed:274, startedAt:"Mar 20",  scheduledAt:null,  sendRate:60, category:"MARKETING" },
  { id:2,  name:"October Newsletter",      status:"completed", template:"Weekly Newsletter",          total:5000,  sent:5000,  delivered:4905, read:3201,  failed:95,  startedAt:"Mar 18",  scheduledAt:null,  sendRate:60, category:"MARKETING" },
  { id:3,  name:"Cart Abandonment Flow",   status:"running",   template:"Cart Recovery",              total:3500,  sent:1247,  delivered:1198, read:728,   failed:49,  startedAt:"Mar 22",  scheduledAt:null,  sendRate:30, category:"MARKETING" },
  { id:4,  name:"New Product Launch",      status:"scheduled", template:"Product Launch",             total:7500,  sent:0,     delivered:0,    read:0,     failed:0,   startedAt:null,      scheduledAt:"Mar 24, 10:00 AM", sendRate:60, category:"MARKETING" },
  { id:5,  name:"Customer Survey Q1",      status:"paused",    template:"Weekly Newsletter",          total:6000,  sent:2100,  delivered:2048, read:924,   failed:52,  startedAt:"Mar 19",  scheduledAt:null,  sendRate:20, category:"MARKETING" },
  { id:6,  name:"OTP Blast — March",       status:"completed", template:"OTP Verification",           total:1200,  sent:1200,  delivered:1194, read:1095,  failed:6,   startedAt:"Mar 15",  scheduledAt:null,  sendRate:60, category:"AUTHENTICATION" },
  { id:7,  name:"Payment Reminder Batch",  status:"failed",    template:"Payment Reminder",           total:800,   sent:312,   delivered:290,  read:134,   failed:312, startedAt:"Mar 14",  scheduledAt:null,  sendRate:40, category:"UTILITY" },
  { id:8,  name:"Flash Sale — Weekend",    status:"draft",     template:"Festival Promo — Diwali",    total:0,     sent:0,     delivered:0,    read:0,     failed:0,   startedAt:null,      scheduledAt:null,  sendRate:60, category:"MARKETING" },
];

// Templates and contact-list mocks removed — data now driven by hooks (`useTemplates`, `useContacts`).

const CONTACT_FIELDS = ["Name","Phone","Email","City","Tag","Custom Field 1","Custom Field 2"];

const MSG_LOG = [
  { id:1,  contact:"Priya Sharma",    phone:"+91 98765 43210", status:"read",      sent:"10:30 AM", delivered:"10:31 AM", read:"11:14 AM", error:null },
  { id:2,  contact:"Rahul Verma",     phone:"+91 87654 32109", status:"delivered", sent:"10:30 AM", delivered:"10:31 AM", read:null,       error:null },
  { id:3,  contact:"Karan Malhotra",  phone:"+91 65432 10987", status:"read",      sent:"10:31 AM", delivered:"10:31 AM", read:"10:45 AM", error:null },
  { id:4,  contact:"Sneha Patel",     phone:"+91 54321 09876", status:"read",      sent:"10:31 AM", delivered:"10:32 AM", read:"11:02 AM", error:null },
  { id:5,  contact:"Deepika Reddy",   phone:"+91 32109 87654", status:"failed",    sent:"10:32 AM", delivered:null,       read:null,       error:"Contact opted out" },
  { id:6,  contact:"Vikram Joshi",    phone:"+91 21098 76543", status:"delivered", sent:"10:32 AM", delivered:"10:33 AM", read:null,       error:null },
  { id:7,  contact:"Pooja Singh",     phone:"+91 88765 43210", status:"read",      sent:"10:33 AM", delivered:"10:33 AM", read:"10:52 AM", error:null },
  { id:8,  contact:"Arjun Nair",      phone:"+91 43210 98765", status:"sent",      sent:"10:33 AM", delivered:null,       read:null,       error:null },
];

/* ─────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────── */
const CAMP_STATUS = {
  running:   { label:"Running",   bg:"#DCFCE7", color:"#166534", dot:"#22C55E", live:true  },
  completed: { label:"Completed", bg:"#EFF6FF", color:"#1E40AF", dot:"#3B82F6", live:false },
  scheduled: { label:"Scheduled", bg:"#F5F3FF", color:"#5B21B6", dot:"#8B5CF6", live:false },
  paused:    { label:"Paused",    bg:"#FEF3C7", color:"#78350F", dot:"#F59E0B", live:false },
  failed:    { label:"Failed",    bg:"#FEE2E2", color:"#7F1D1D", dot:"#EF4444", live:false },
  draft:     { label:"Draft",     bg:"#F1F5F9", color:"#475569", dot:"#94A3B8", live:false },
};

const MSG_STATUS = {
  read:      { label:"Read",      bg:"#DCFCE7", color:"#166534" },
  delivered: { label:"Delivered", bg:"#EFF6FF", color:"#1E40AF" },
  sent:      { label:"Sent",      bg:"#F1F5F9", color:"#475569" },
  failed:    { label:"Failed",    bg:"#FEE2E2", color:"#7F1D1D" },
};

const CAT_COLOR = {
  MARKETING:      "#D97706",
  UTILITY:        "#2563EB",
  AUTHENTICATION: "#7C3AED",
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

function StatusBadge({ status, size = "md" }) {
  const c = CAMP_STATUS[status] || CAMP_STATUS.draft;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding: size==="sm" ? "2px 7px" : "3px 10px",
      borderRadius:20, background:c.bg, color:c.color,
      fontSize: size==="sm" ? 10 : 11, fontWeight:700, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot, flexShrink:0,
        ...(c.live ? { animation:"pulse 1.5s infinite" } : {}) }} />
      {c.label}
    </span>
  );
}

function MsgBadge({ status }) {
  const c = MSG_STATUS[status] || MSG_STATUS.sent;
  return (
    <span style={{ padding:"2px 7px", borderRadius:20,
      background:c.bg, color:c.color, fontSize:10, fontWeight:600, whiteSpace:"nowrap" }}>
      {c.label}
    </span>
  );
}

function ProgressBar({ sent, total, status, showLabel=false }) {
  const p = pct(sent, total);
  const color = status==="running" ? T.green : status==="paused" ? T.amber
    : status==="failed" ? T.red : T.blue;
  return (
    <div>
      {showLabel && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
          <span style={{ fontSize:11, color:T.muted }}>
            <span style={{ fontFamily:T.mono, color:T.text, fontWeight:700 }}>
              {sent.toLocaleString()}
            </span>
            <span style={{ color:T.subtle }}> / {total.toLocaleString()}</span>
          </span>
          <span style={{ fontFamily:T.mono, fontSize:11, fontWeight:700, color }}>{p}%</span>
        </div>
      )}
      <div style={{ height:5, background:T.border, borderRadius:99, overflow:"hidden" }}>
        <div style={{ width:`${p}%`, height:"100%", borderRadius:99,
          background: status==="running"
            ? `linear-gradient(90deg, ${T.green}, #34D399)` : color,
          transition:"width .6s ease",
          ...(status==="running" ? { animation:"shimmer 2s infinite" } : {}) }} />
      </div>
    </div>
  );
}

function MetricPill({ label, value, color, sub }) {
  return (
    <div style={{ flex:1, background:T.card, borderRadius:10, padding:"14px 16px",
      border:`1px solid ${T.border}`, borderTop:`3px solid ${color}` }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:"uppercase",
        letterSpacing:"0.06em", marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:T.mono, fontSize:24, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.subtle, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED LAYOUT COMPONENTS
───────────────────────────────────────────── */
const NAV = ["Dashboard","Contacts","Templates","Campaigns","Analytics","Reports","Opt-In / Out"];

function Sidebar() {
  return (
    <div style={{ width:200, flexShrink:0, background:T.sidebar, display:"flex",
      flexDirection:"column", height:"100vh", position:"sticky", top:0,
      borderRight:"1px solid #1A2744" }}>
      <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid #1A2744",
        display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:8, background:T.green,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L0 24l6.35-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.002-1.368l-.36-.213-3.71.883.939-3.61-.236-.371A9.79 9.79 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#F8FAFC" }}>WA Platform</div>
          <div style={{ fontSize:9, color:"#475569" }}>Enterprise</div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
        {NAV.map(label => {
          const active = label === "Campaigns";
          return (
            <div key={label} style={{ padding:"8px 10px", borderRadius:7, marginBottom:2,
              fontSize:12, fontWeight:active?600:400,
              color: active?"#fff":"#94A3B8",
              background: active ? T.green : "transparent", cursor:"pointer" }}>
              {label}
              {label === "Campaigns" && (
                <span style={{ marginLeft:8, fontSize:9, background:T.red, color:"#fff",
                  borderRadius:10, padding:"1px 5px", fontWeight:700 }}>4</span>
              )}
            </div>
          );
        })}
      </nav>
      <div style={{ padding:"12px 14px", borderTop:"1px solid #1A2744",
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:T.green,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:10, fontWeight:700, color:"#fff" }}>PA</div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:"#E2E8F0" }}>Piyush Admin</div>
          <div style={{ fontSize:9, color:"#475569" }}>Super Admin</div>
        </div>
      </div>
    </div>
  );
}

function Topbar({ title, subtitle, actions }) {
  return (
    <div style={{ height:56, background:T.card, borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"center", padding:"0 20px", gap:12,
      position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize:10, color:T.subtle }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

function ConfirmModal({ open, onClose, onConfirm, title, msg, label="Confirm", danger=false }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:T.card, borderRadius:14, width:400, padding:"24px",
          boxShadow:"0 24px 64px rgba(0,0,0,.25)" }}>
        <div style={{ width:44, height:44, borderRadius:12,
          background: danger ? T.redLight : T.amberLight,
          display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
            stroke={danger ? T.red : T.amber} strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13, color:T.muted, marginBottom:22, lineHeight:1.6 }}>{msg}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:8,
            border:`1px solid ${T.border}`, background:T.card,
            fontSize:13, color:T.text, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:"8px 16px", borderRadius:8,
            border:"none", background: danger ? T.red : T.amber,
            color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>{label}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1 — CAMPAIGNS LIST
───────────────────────────────────────────── */
function CampaignsList({ onNew, onView }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [hoverRow, setHoverRow]         = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Simulated live tick for running campaigns
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(iv);
  }, []);

  // Fake progress increment on tick
  const getLiveSent = useCallback((c) => {
    if (c.status !== "running") return c.sent;
    return Math.min(c.total, c.sent + tick * 12);
  }, [tick]);

  const counts = {
    all:       CAMPAIGNS.length,
    running:   CAMPAIGNS.filter(c => c.status === "running").length,
    scheduled: CAMPAIGNS.filter(c => c.status === "scheduled").length,
    paused:    CAMPAIGNS.filter(c => c.status === "paused").length,
    completed: CAMPAIGNS.filter(c => c.status === "completed").length,
  };

  const filtered = CAMPAIGNS.filter(c => {
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const ss = statusFilter === "all" || c.status === statusFilter;
    return ms && ss;
  });

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>
      <Topbar
        title="Campaigns"
        subtitle={`${counts.all} campaigns · ${counts.running} running · ${counts.scheduled} scheduled`}
        actions={
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onNew}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:8, border:"none",
                background:T.green, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Campaign
            </button>
          </div>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

        {/* STAT PILLS */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {[
            { key:"all",       label:"All",       val:counts.all,       color:T.blue  },
            { key:"running",   label:"Running",   val:counts.running,   color:T.green },
            { key:"scheduled", label:"Scheduled", val:counts.scheduled, color:T.purple},
            { key:"paused",    label:"Paused",    val:counts.paused,    color:T.amber },
            { key:"completed", label:"Completed", val:counts.completed, color:T.muted },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)} style={{
              display:"flex", alignItems:"center", gap:7, padding:"7px 13px",
              borderRadius:9, cursor:"pointer", transition:"all .15s",
              border:`1.5px solid ${statusFilter===s.key ? s.color : T.border}`,
              background: statusFilter===s.key ? `${s.color}14` : T.card }}>
              <span style={{ fontFamily:T.mono, fontSize:18, fontWeight:700,
                color: statusFilter===s.key ? s.color : T.text }}>{s.val}</span>
              <span style={{ fontSize:11,
                color: statusFilter===s.key ? s.color : T.muted }}>{s.label}</span>
            </button>
          ))}

          {/* Live indicator */}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6,
            fontSize:11, color:T.muted }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:T.green,
              animation:"pulse 1.5s infinite", display:"inline-block" }} />
            Live · updates every 5s
          </div>
        </div>

        {/* SEARCH */}
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:8,
            background:T.card, borderRadius:8, padding:"7px 12px",
            border:`1px solid ${T.border}` }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke={T.subtle} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search campaigns…"
              aria-label="Search campaigns"
              style={{ border:"none", background:"transparent", outline:"none",
                fontSize:13, color:T.text, width:"100%", fontFamily:T.font }} />
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background:T.card, borderRadius:12,
          border:`1px solid ${T.border}`, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:T.bg }}>
                {["Campaign","Status","Progress","Delivery","Open rate","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10,
                    fontWeight:700, color:T.muted, letterSpacing:"0.06em",
                    textTransform:"uppercase", borderBottom:`1px solid ${T.border}`,
                    whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const liveSent = getLiveSent(c);
                const delivery = pct(c.delivered, liveSent);
                const openRate = pct(c.read, liveSent);
                return (
                  <tr key={c.id}
                    onMouseEnter={() => setHoverRow(c.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    onClick={() => onView(c)}
                    style={{ background: hoverRow===c.id ? T.bg : T.card,
                      borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none",
                      cursor:"pointer", transition:"background .1s" }}>

                    {/* Name */}
                    <td style={{ padding:"13px 14px" }}>
                      <div style={{ fontWeight:600, color:T.text, fontSize:13 }}>{c.name}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3 }}>
                        <span style={{ fontSize:10, color:T.subtle }}>{c.template}</span>
                        <span style={{ width:3, height:3, borderRadius:"50%",
                          background: CAT_COLOR[c.category] || T.muted, flexShrink:0 }} />
                        <span style={{ fontSize:9, fontWeight:600,
                          color: CAT_COLOR[c.category] || T.muted }}>{c.category}</span>
                      </div>
                      {c.scheduledAt && (
                        <div style={{ fontSize:10, color:T.purple, marginTop:2 }}>
                          ⏰ Scheduled: {c.scheduledAt}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding:"13px 14px" }}>
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Progress */}
                    <td style={{ padding:"13px 14px", minWidth:160 }}>
                      {c.status === "scheduled" || c.status === "draft" ? (
                        <span style={{ fontSize:11, color:T.subtle }}>
                          {c.total > 0 ? `${c.total.toLocaleString()} contacts` : "—"}
                        </span>
                      ) : (
                        <ProgressBar sent={liveSent} total={c.total} status={c.status} showLabel />
                      )}
                    </td>

                    {/* Delivery */}
                    <td style={{ padding:"13px 14px" }}>
                      {c.status === "scheduled" || c.status === "draft" ? (
                        <span style={{ color:T.subtle }}>—</span>
                      ) : (
                        <span style={{ fontFamily:T.mono, fontWeight:700,
                          color: delivery>95 ? "#16A34A" : delivery>85 ? T.amber : T.red }}>
                          {delivery}%
                        </span>
                      )}
                    </td>

                    {/* Open rate */}
                    <td style={{ padding:"13px 14px" }}>
                      {c.status === "scheduled" || c.status === "draft" ? (
                        <span style={{ color:T.subtle }}>—</span>
                      ) : (
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontFamily:T.mono, fontWeight:700, color:T.text }}>
                            {openRate}%
                          </span>
                          <div style={{ width:44, height:4, background:T.border,
                            borderRadius:99, overflow:"hidden" }}>
                            <div style={{ width:`${openRate}%`, height:"100%",
                              background:T.purple, borderRadius:99 }} />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding:"13px 14px" }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display:"flex", gap:4 }}>
                        {/* View */}
                        <button onClick={() => onView(c)}
                          style={{ padding:"4px 10px", borderRadius:6,
                            border:`1px solid ${T.border}`, background:T.card,
                            fontSize:11, color:T.muted, cursor:"pointer" }}>
                          View
                        </button>

                        {/* Pause / Resume */}
                        {c.status === "running" && (
                          <button onClick={() => {}}
                            style={{ padding:"4px 10px", borderRadius:6,
                              border:`1px solid ${T.amber}30`, background:T.amberLight,
                              fontSize:11, color:T.amber, fontWeight:600, cursor:"pointer" }}>
                            ⏸ Pause
                          </button>
                        )}
                        {c.status === "paused" && (
                          <button onClick={() => {}}
                            style={{ padding:"4px 10px", borderRadius:6,
                              border:`1px solid ${T.green}30`, background:T.greenLight,
                              fontSize:11, color:T.greenDark, fontWeight:600, cursor:"pointer" }}>
                            ▶ Resume
                          </button>
                        )}

                        {/* Cancel */}
                        {(c.status === "running" || c.status === "paused" || c.status === "scheduled") && (
                          <button onClick={() => setConfirmCancel(c)}
                            style={{ width:28, height:28, borderRadius:6,
                              border:`1px solid ${T.border}`, background:T.card,
                              cursor:"pointer", display:"flex", alignItems:"center",
                              justifyContent:"center", color:T.red, fontSize:13 }}>×</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding:"48px", textAlign:"center", color:T.subtle, fontSize:13 }}>
              No campaigns match your filter
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!confirmCancel} onClose={() => setConfirmCancel(null)}
        onConfirm={() => setConfirmCancel(null)}
        title={`Cancel "${confirmCancel?.name}"?`}
        msg="All unsent messages will be discarded. This action cannot be undone."
        label="Cancel Campaign" danger />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2 — CAMPAIGN WIZARD (4 steps)
───────────────────────────────────────────── */
const WIZARD_STEPS = [
  { num:1, label:"Details",    sub:"Name & template"    },
  { num:2, label:"Audience",   sub:"Choose contacts"    },
  { num:3, label:"Personalise",sub:"Map variables"      },
  { num:4, label:"Review",     sub:"Schedule & launch"  },
];

function CampaignWizard({ onBack, onLaunch }) {
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState({
    name:         "",
    description:  "",
    templateId:   null,
    contactLists: [],
    sendRate:     60,
    varMap:       {},
    scheduleNow:  true,
    scheduleDate: "",
    scheduleTime: "",
  });
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState('');

  const [contactLists, setContactLists] = useState([]);
  const [loadingContactLists, setLoadingContactLists] = useState(false);
  const [contactListsError, setContactListsError] = useState('');

  const [contactFields, setContactFields] = useState(CONTACT_FIELDS);
  const [loadingContactFields, setLoadingContactFields] = useState(false);
  const [contactFieldsError, setContactFieldsError] = useState('');

  const [launchError, setLaunchError] = useState('');

  // templates, contact lists, and contact fields are fetched as the user moves through steps

  // contact lists are returned from the API as groups: { id, name, count, optIn }

  const selectedTemplate = templates.find(t => (t.id && t.id === form.templateId) || (t._id && t._id === form.templateId) || (t.id && String(t.id) === String(form.templateId)) || (t._id && String(t._id) === String(form.templateId)));
  const selectedLists    = contactLists.filter(l => form.contactLists.includes(l.id));
  const totalContacts    = selectedLists.reduce((s, l) => s + (l.optIn || 0), 0);

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.templateId;
    if (step === 2) return form.contactLists.length > 0;
    if (step === 3) return true;
    return true;
  };

  const handleLaunch = async () => {
    setLaunchError('');
    setLaunching(true);
    try {
      const payload = {
        name: form.name,
        templateId: selectedTemplate ? (selectedTemplate._id || selectedTemplate.id || selectedTemplate) : null,
        contactListIds: selectedLists.map(l => l.id),
        sendRate: form.sendRate,
        varMap: form.varMap || {},
        scheduleNow: !!form.scheduleNow,
        scheduleDate: form.scheduleDate || '',
        scheduleTime: form.scheduleTime || '',
      };

      const resp = await campaignsAPI.create(payload);
      const status = resp && resp.status;
      const data = resp && resp.data;
      const created = (data && data.data && data.data.campaign) || (data && data.campaign) || data;

      setLaunching(false);
      if (status === 201 || (data && data.success)) {
        setLaunched(true);
        if (onLaunch && typeof onLaunch === 'function') onLaunch(created);
      } else {
        setLaunchError((data && data.message) || 'Failed to create campaign');
      }
    } catch (err) {
      setLaunching(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to create campaign';
      setLaunchError(msg);
    }
  };

  // Fetch templates when user reaches Step 1
  useEffect(() => {
    let mounted = true;
    if (step !== 1) return undefined;
    setTemplatesError('');
    setLoadingTemplates(true);
    templatesAPI.list({ status: 'approved' })
      .then(res => {
        if (!mounted) return;
        const templatesArr = (res && res.data && res.data.data && res.data.data.templates) || (res && res.data && res.data.templates) || [];
        setTemplates(Array.isArray(templatesArr) ? templatesArr : []);
      })
      .catch(err => {
        console.error('templates fetch error', err);
        setTemplates([]);
        setTemplatesError('Failed to load templates. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoadingTemplates(false);
      });
    return () => { mounted = false };
  }, [step]);

  // If exactly one approved template exists, auto-select it for convenience
  useEffect(() => {
    if (step === 1 && !loadingTemplates && Array.isArray(templates) && templates.length === 1 && !form.templateId) {
      const t = templates[0];
      const templateId = t.id || t._id || 0;
      setForm(f => ({ ...f, templateId: templateId, varMap: {} }));
    }
  }, [step, loadingTemplates, templates, form.templateId]);

  // Fetch contact lists when user reaches Step 2
  useEffect(() => {
    let mounted = true;
    if (step !== 2) return undefined;
    setContactListsError('');
    setLoadingContactLists(true);
    api.get('/contacts/lists')
      .then(res => {
        if (!mounted) return;
        const groups = (res && res.data && res.data.data && res.data.data.groups) || (res && res.data && res.data.groups) || [];
        setContactLists(Array.isArray(groups) ? groups : []);
      })
      .catch(err => {
        console.error('contact lists error', err);
        setContactLists([]);
        setContactListsError('Failed to load contact lists. Please try again.');
      })
      .finally(() => { if (mounted) setLoadingContactLists(false); });
    return () => { mounted = false };
  }, [step]);

  // Fetch contact fields when user reaches Step 3
  useEffect(() => {
    let mounted = true;
    if (step !== 3) return undefined;
    setContactFieldsError('');
    setLoadingContactFields(true);
    api.get('/contacts/fields')
      .then(res => {
        if (!mounted) return;
        const fields = (res && res.data && res.data.data && res.data.data.fields) || (res && res.data && res.data.fields) || [];
        setContactFields(Array.isArray(fields) && fields.length ? fields : CONTACT_FIELDS);
      })
      .catch(err => {
        console.error('contact fields error', err);
        setContactFields(CONTACT_FIELDS);
        setContactFieldsError('Failed to load contact fields.');
      })
      .finally(() => { if (mounted) setLoadingContactFields(false); });
    return () => { mounted = false };
  }, [step]);

  const toggleList = (id) => {
    setForm(f => ({
      ...f,
      contactLists: f.contactLists.includes(id)
        ? f.contactLists.filter(x => x !== id)
        : [...f.contactLists, id]
    }));
  };

  // ── Success screen
  if (launched) {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:T.greenLight,
          display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"
            stroke={T.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontSize:22, fontWeight:700, color:T.text, marginBottom:8 }}>
          Campaign launched! 🚀
        </div>
        <div style={{ fontSize:14, color:T.muted, textAlign:"center", marginBottom:32,
          maxWidth:400, lineHeight:1.6 }}>
          <strong style={{ color:T.text }}>{form.name}</strong> is now running.{" "}
          {totalContacts.toLocaleString()} contacts are being messaged at{" "}
          {form.sendRate} messages/minute.
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onBack}
            style={{ padding:"10px 20px", borderRadius:9, border:`1px solid ${T.border}`,
              background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>
            Back to campaigns
          </button>
          <button onClick={onLaunch}
            style={{ padding:"10px 20px", borderRadius:9, border:"none",
              background:T.green, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            View live stats →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden", background: '#F0F4F8' }}>
      <Topbar
        title="New Campaign"
        subtitle="4 steps to launch"
        actions={
          <button onClick={onBack}
            style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, fontSize:14, color:T.text, cursor:"pointer" }}>
            Cancel
          </button>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"32px 24px", width:"100%" }}>

        {/* STEP INDICATOR */}
        <div style={{ display:"flex", alignItems:"flex-start", marginBottom:40, maxWidth:640, margin:'0 auto 40px' }}>
          {WIZARD_STEPS.map((s, i) => {
            const done   = s.num < step;
            const active = s.num === step;
            return (
              <React.Fragment key={s.num}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, zIndex:2, width: 80 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:600,
                    flexShrink:0, border: active || done ? '2px solid #10B981' : `2px solid ${T.borderMid}`,
                    background: '#fff',
                    color: active || done ? '#10B981' : T.subtle,
                    transition:"all .3s" }}>
                    {s.num}
                  </div>
                  <div style={{ textAlign:"center", whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize:14, fontWeight: 700, color: active ? T.text : T.muted }}>{s.label}</div>
                    <div style={{ fontSize:12, color:T.subtle }}>{s.sub}</div>
                  </div>
                </div>
                {i < WIZARD_STEPS.length-1 && (
                  <div style={{ flex:1, height:2, marginTop:20, margin: '20px 8px 0',
                    background: done ? '#10B981' : T.border,
                    transition:"background .3s", zIndex:1 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: DETAILS ── */}
        {step === 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth: 640, margin: '0 auto' }}>
            
            {/* Campaign Name Card */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:16 }}>
                Campaign name
              </div>
              <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Holi Sale 2025"
                  aria-label="Campaign name"
                  style={{ width:"100%", padding:"14px 16px", borderRadius:8,
                    border:`1px solid ${T.border}`, fontSize:15, color:T.text,
                    fontFamily:T.font, outline:"none", boxSizing: 'border-box' }} />
            </div>

            {/* Select Template Card */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px", marginBottom: 16 }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:4 }}>
                Select template
              </div>
              <div style={{ fontSize:14, color:T.subtle, marginBottom:20 }}>
                Only approved templates shown
              </div>
              
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {loadingTemplates ? (
                  <div style={{ padding:24, textAlign:'center' }}>Loading templates…</div>
                ) : templatesError ? (
                  <div style={{ padding:24, textAlign:'center', color:T.red }}>{templatesError}</div>
                ) : Array.isArray(templates) && templates.length === 0 ? (
                  <div style={{ padding:24, textAlign:'center', color:T.subtle }}>
                    No approved templates found. <br />
                    <button onClick={() => window.location.href = '/templates/new'}
                      style={{ marginTop:12, padding:'8px 12px', borderRadius:8, border:`1px solid ${T.border}`, background:T.card, cursor:'pointer' }}>Create template</button>
                  </div>
                ) : (
                  templates.map((t, idx) => {
                    const templateId = t.id || t._id || idx;
                    const sel = String(form.templateId) === String(templateId);
                    const catColor = CAT_COLOR[t.category] || T.muted;
                    return (
                      <div key={templateId} role="button" tabIndex={0}
                        onClick={() => setForm(f => ({ ...f, templateId: templateId, varMap: {} }))}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setForm(f => ({ ...f, templateId: templateId, varMap: {} })); }}
                        style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px",
                          borderRadius:10, border: sel ? `1.5px solid #10B981` : `1px solid ${T.border}`,
                          background: '#fff', cursor:"pointer",
                          transition:"all .15s" }}>

                        <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0,
                          border:`2px solid ${sel ? '#10B981' : T.borderMid}`,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {sel && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />}
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:15, fontWeight:700, color: T.text }}>{t.name || t.title}</div>
                          <div style={{ display:"flex", gap:6, marginTop:4, alignItems: 'center' }}>
                            <span style={{ fontSize:12, fontWeight:600, color:catColor }}>
                              {t.category || 'MARKETING'}
                            </span>
                            <span style={{ color:T.subtle, fontSize: 13 }}>·</span>
                            <span style={{ fontSize:12, color:catColor }}>
                              {(t.variables || []).length} vars
                            </span>
                          </div>
                        </div>

                        <span style={{ fontSize:11, fontWeight:700, padding:"6px 14px",
                          borderRadius:20, background:'#D1FAE5', color:'#065F46', letterSpacing: '0.05em' }}>
                          APPROVED
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Step 1 Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingBottom: 40 }}>
              <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: 8, background: '#fff', border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500, color: T.text, cursor: 'pointer' }}>Cancel</button>
              <div style={{ fontSize: 14, color: T.subtle }}>Step 1 of 4</div>
              <button 
                onClick={() => setStep(2)} 
                disabled={!canNext()} 
                style={{ padding: '12px 24px', borderRadius: 8, background: canNext() ? '#3B82F6' : '#E2E8F0', color: canNext() ? '#fff' : '#94A3B8', border: 'none', fontSize: 14, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: AUDIENCE ── */}
        {step === 2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
              padding:"20px" }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>
                Select contact lists
              </div>
              <div style={{ fontSize:11, color:T.subtle, marginBottom:16 }}>
                Only opted-in contacts will receive messages
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {loadingContactLists ? (
                  <div style={{ padding:24, textAlign:'center' }}>Loading lists…</div>
                ) : contactListsError ? (
                  <div style={{ padding:24, textAlign:'center', color:T.red }}>{contactListsError}</div>
                ) : (
                  contactLists.map(list => {
                    const sel = form.contactLists.includes(list.id);
                    const optPct = list.count > 0 ? Math.round((list.optIn / list.count) * 100) : 0;
                    return (
                      <div key={list.id} role="button" tabIndex={0}
                        onClick={() => toggleList(list.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleList(list.id); }}
                        aria-pressed={sel}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                          borderRadius:10, border:`2px solid ${sel ? T.green : T.border}`,
                          background: sel ? T.greenLight : T.card, cursor:"pointer",
                          transition:"all .15s" }}>
                        <div style={{ width:20, height:20, borderRadius:4, flexShrink:0,
                          border:`2px solid ${sel ? T.green : T.border}`,
                          background: sel ? T.green : T.card, display:"flex",
                          alignItems:"center", justifyContent:"center" }}>
                          {sel && <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600,
                            color: sel ? T.greenDark : T.text }}>{list.name}</div>
                          <div style={{ fontSize:11, color:T.subtle }}>
                            {list.optIn.toLocaleString()} opted-in
                            <span style={{ color:T.border }}> · </span>
                            {list.count.toLocaleString()} total
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:T.mono, fontSize:13, fontWeight:700,
                            color: sel ? T.greenDark : T.muted }}>
                            {optPct}%
                          </div>
                          <div style={{ fontSize:9, color:T.subtle }}>opt-in rate</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Summary + send rate */}
            {form.contactLists.length > 0 && (
              <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
                padding:"20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:T.text }}>
                      Send rate
                    </div>
                    <div style={{ fontSize:11, color:T.subtle }}>
                      WhatsApp limits prevent sending too fast
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700,
                      color:T.green }}>{form.sendRate}</div>
                    <div style={{ fontSize:10, color:T.subtle }}>msgs / min</div>
                  </div>
                </div>

                <input type="range" min="1" max="60" value={form.sendRate}
                  onChange={e => setForm(f => ({ ...f, sendRate: Number(e.target.value) }))}
                  aria-label="Send rate messages per minute"
                  style={{ width:"100%", accentColor:T.green, marginBottom:10 }} />

                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:10, color:T.subtle }}>
                  <span>1 msg/min (safe)</span>
                  <span>60 msg/min (max)</span>
                </div>

                <div style={{ marginTop:16, padding:"12px 14px", background:T.bg,
                  borderRadius:9, border:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:12, marginBottom:6 }}>
                    <span style={{ color:T.muted }}>Total recipients</span>
                    <span style={{ fontFamily:T.mono, fontWeight:700, color:T.text }}>
                      {totalContacts.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:12, marginBottom:6 }}>
                    <span style={{ color:T.muted }}>Estimated time</span>
                    <span style={{ fontFamily:T.mono, fontWeight:700, color:T.text }}>
                      ~{Math.ceil(totalContacts / form.sendRate)} min
                    </span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                    <span style={{ color:T.muted }}>Lists selected</span>
                    <span style={{ fontWeight:600, color:T.text }}>
                      {form.contactLists.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: PERSONALISE ── */}
        {step === 3 && (
          <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
            padding:"20px" }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:4 }}>
              Map template variables
            </div>
            <div style={{ fontSize:11, color:T.subtle, marginBottom:18 }}>
              Match each variable in <strong>{selectedTemplate?.name}</strong> to a contact
              field — or enter a fixed value
            </div>

            {(!selectedTemplate || (selectedTemplate?.variables || []).length === 0) && (
              <div style={{ padding:"24px", textAlign:"center", color:T.subtle, fontSize:13 }}>
                This template has no variables — no mapping needed ✓
              </div>
            )}

            {(selectedTemplate?.variables || []).map((v, i) => (
              <div key={v} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"12px 14px", background:T.bg, borderRadius:9,
                border:`1px solid ${T.border}`, marginBottom:8 }}>
                <span style={{ padding:"3px 9px", borderRadius:20, fontSize:11,
                  fontFamily:T.mono, background:T.purpleLight, color:T.purple,
                  border:`1px solid #C4B5FD`, flexShrink:0 }}>
                  {`{{${i+1}}}`}
                </span>
                <div style={{ fontSize:11, color:T.subtle, flexShrink:0 }}>maps to</div>
                <select value={form.varMap[v] || ""}
                  onChange={e => setForm(f => ({ ...f, varMap: { ...f.varMap, [v]: e.target.value } }))}
                  style={{ flex:1, padding:"7px 10px", borderRadius:7,
                    border:`1px solid ${T.border}`, fontSize:12, color:T.text,
                    background:T.card, fontFamily:T.font, outline:"none", cursor:"pointer" }}>
                  <option value="">— Select a field —</option>
                  <optgroup label="Contact fields">
                    {(contactFields || CONTACT_FIELDS).map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ fontSize:11, color:T.subtle, flexShrink:0 }}>or</div>
                <input
                  placeholder="Fixed text"
                  value={typeof form.varMap[v] === "string" && !CONTACT_FIELDS.includes(form.varMap[v])
                    ? form.varMap[v] : ""}
                  onChange={e => setForm(f => ({ ...f, varMap: { ...f.varMap, [v]: e.target.value } }))}
                  style={{ width:120, padding:"7px 10px", borderRadius:7,
                    border:`1px solid ${T.border}`, fontSize:12, color:T.text,
                    fontFamily:T.font, outline:"none", flexShrink:0 }} />
              </div>
            ))}

            <div style={{ marginTop:16, padding:"12px 14px", background:T.greenLight,
              borderRadius:9, border:`1px solid #6EE7B7`, fontSize:12, color:T.greenDark }}>
              💡 Variables left unmapped will show the placeholder (e.g. <code>{"{{1}}"}</code>)
              in the message. Map all variables for best results.
            </div>
          </div>
        )}

        {/* ── STEP 4: REVIEW & SCHEDULE ── */}
        {step === 4 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* Summary card */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
              overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`,
                background:T.bg }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Campaign summary</div>
              </div>
              <div style={{ padding:"16px 18px" }}>
                {[
                  ["Campaign name", form.name],
                  ["Template",      selectedTemplate?.name || "—"],
                  ["Category",      selectedTemplate?.category || "—"],
                  ["Lists",         `${form.contactLists.length} list${form.contactLists.length!==1?"s":""}` ],
                  ["Recipients",    `${totalContacts.toLocaleString()} opted-in contacts`],
                  ["Send rate",     `${form.sendRate} messages / minute`],
                  ["Est. duration", `~${Math.ceil(totalContacts/form.sendRate)} minutes`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between",
                    padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:12, color:T.muted }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule toggle */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
              padding:"18px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>
                When to send?
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { key:true,  label:"Send now",         sub:"Start sending immediately after launch" },
                  { key:false, label:"Schedule for later", sub:"Pick a specific date and time"        },
                ].map(opt => (
                  <div key={String(opt.key)}
                    onClick={() => setForm(f => ({ ...f, scheduleNow: opt.key }))}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                      borderRadius:10, border:`2px solid ${form.scheduleNow===opt.key ? T.green : T.border}`,
                      background: form.scheduleNow===opt.key ? T.greenLight : T.card,
                      cursor:"pointer", transition:"all .15s" }}>
                    <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                      border:`2px solid ${form.scheduleNow===opt.key ? T.green : T.border}`,
                      background: form.scheduleNow===opt.key ? T.green : T.card,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {form.scheduleNow === opt.key && (
                        <div style={{ width:8, height:8, borderRadius:"50%",
                          background:"#fff" }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600,
                        color: form.scheduleNow===opt.key ? T.greenDark : T.text }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize:11, color:T.subtle }}>{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {!form.scheduleNow && (
                <div style={{ display:"flex", gap:10, marginTop:14 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600,
                      color:T.muted, marginBottom:4 }}>Date</label>
                    <input type="date" value={form.scheduleDate}
                      onChange={e => setForm(f => ({ ...f, scheduleDate: e.target.value }))}
                      style={{ width:"100%", padding:"8px 11px", borderRadius:8,
                        border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font,
                        outline:"none" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:600,
                      color:T.muted, marginBottom:4 }}>Time</label>
                    <input type="time" value={form.scheduleTime}
                      onChange={e => setForm(f => ({ ...f, scheduleTime: e.target.value }))}
                      style={{ width:"100%", padding:"8px 11px", borderRadius:8,
                        border:`1px solid ${T.border}`, fontSize:12, fontFamily:T.font,
                        outline:"none" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Warning */}
            <div style={{ padding:"12px 14px", background:"#FFFBEB", borderRadius:9,
              border:`1px solid #FCD34D`, fontSize:12, color:T.amber, lineHeight:1.6 }}>
              ⚠️ Once launched, messages start sending immediately. Ensure your contact list
              is correct and all variables are properly mapped before launching.
            </div>
          </div>
        )}

        {/* WIZARD NAVIGATION */}
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginTop:22 }}>
          <button onClick={() => step > 1 ? setStep(s => s-1) : onBack()}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
              borderRadius:8, border:`1px solid ${T.border}`, background:T.card,
              fontSize:13, color:T.text, cursor:"pointer" }}>
            ← {step > 1 ? "Back" : "Cancel"}
          </button>

          <div style={{ fontSize:11, color:T.subtle }}>Step {step} of 4</div>

          {step < 4 ? (
            <button onClick={() => setStep(s => s+1)} disabled={!canNext()}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px",
                borderRadius:8, border:"none",
                background: canNext() ? T.green : T.border,
                color: canNext() ? "#fff" : T.subtle,
                fontSize:13, fontWeight:600,
                cursor: canNext() ? "pointer" : "not-allowed" }}>
              Continue →
            </button>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
              {launchError && (
                <div style={{ color:T.red, marginBottom:4 }}>{launchError}</div>
              )}
              <button onClick={handleLaunch} disabled={launching}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px",
                borderRadius:8, border:"none", background: launching ? T.border : T.green,
                color:"#fff", fontSize:13, fontWeight:700, cursor: launching?"wait":"pointer" }}>
              {launching ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    style={{ animation:"spin .8s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Launching…
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {form.scheduleNow ? "Launch Campaign 🚀" : "Schedule Campaign"}
                </>
              )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3 — CAMPAIGN DETAIL (live stats)
───────────────────────────────────────────── */
function CampaignDetail({ campaign: initialCampaign, onBack }) {
  const [campaign, setCampaign] = useState({ ...initialCampaign });
  const [msgTab, setMsgTab]     = useState("all");
  const [confirmPause,  setConfirmPause]  = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [tick, setTick]         = useState(0);

  const isRunning = campaign.status === "running";

  // Simulate live stat updates
  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => {
      setTick(t => t + 1);
      setCampaign(c => {
        if (c.sent >= c.total) return c;
        const newSent      = Math.min(c.total,      c.sent      + Math.floor(Math.random()*8+4));
        const newDelivered = Math.min(newSent,       c.delivered + Math.floor(Math.random()*7+3));
        const newRead      = Math.min(newDelivered,  c.read      + Math.floor(Math.random()*4+1));
        return { ...c, sent:newSent, delivered:newDelivered, read:newRead };
      });
    }, 3000);
    return () => clearInterval(iv);
  }, [isRunning]);

  const delivery = pct(campaign.delivered, campaign.sent);
  const openRate = pct(campaign.read,      campaign.sent);
  const failRate = pct(campaign.failed,    campaign.sent);
  const progress = pct(campaign.sent,      campaign.total);

  const filteredLog = MSG_LOG.filter(m =>
    msgTab === "all" || m.status === msgTab
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>
      <Topbar
        title={campaign.name}
        subtitle={`${campaign.template} · ${campaign.total.toLocaleString()} contacts`}
        actions={
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <button onClick={onBack}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px",
                borderRadius:8, border:`1px solid ${T.border}`, background:T.card,
                fontSize:12, color:T.text, cursor:"pointer" }}>
              ← All campaigns
            </button>

            <StatusBadge status={campaign.status} />

            {isRunning && (
              <button onClick={() => setConfirmPause(true)}
                style={{ padding:"7px 13px", borderRadius:8,
                  border:`1px solid ${T.amber}30`, background:T.amberLight,
                  fontSize:12, color:T.amber, fontWeight:600, cursor:"pointer" }}>
                ⏸ Pause
              </button>
            )}
            {campaign.status === "paused" && (
              <button onClick={() => setCampaign(c => ({ ...c, status:"running" }))}
                style={{ padding:"7px 13px", borderRadius:8,
                  border:`1px solid ${T.green}30`, background:T.greenLight,
                  fontSize:12, color:T.greenDark, fontWeight:600, cursor:"pointer" }}>
                ▶ Resume
              </button>
            )}
            {(isRunning || campaign.status === "paused") && (
              <button onClick={() => setConfirmCancel(true)}
                style={{ padding:"7px 13px", borderRadius:8,
                  border:`1px solid ${T.red}30`, background:T.redLight,
                  fontSize:12, color:T.red, fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            )}
          </div>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

        {/* LIVE BADGE */}
        {isRunning && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14,
            padding:"8px 14px", background:T.greenLight, borderRadius:9,
            border:`1px solid #6EE7B7`, fontSize:12, color:T.greenDark }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:T.green,
              animation:"pulse 1.5s infinite", flexShrink:0 }} />
            <strong>Live campaign</strong> — statistics update every 3 seconds ·
            Queue: {(campaign.total - campaign.sent).toLocaleString()} messages remaining
          </div>
        )}

        {/* METRIC CARDS */}
        <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
          <MetricPill label="Messages sent"   value={campaign.sent.toLocaleString()}
            color={T.blue}   sub={`of ${campaign.total.toLocaleString()} total`} />
          <MetricPill label="Delivered"        value={campaign.delivered.toLocaleString()}
            color={T.teal}   sub={`${delivery}% delivery rate`} />
          <MetricPill label="Read / opened"    value={campaign.read.toLocaleString()}
            color={T.green}  sub={`${openRate}% open rate`} />
          <MetricPill label="Failed"           value={campaign.failed.toLocaleString()}
            color={failRate > 5 ? T.red : T.muted} sub={`${failRate}% failure rate`} />
        </div>

        {/* OVERALL PROGRESS */}
        <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
          padding:"18px 20px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Overall progress</div>
            <div style={{ display:"flex", gap:16 }}>
              {[
                { label:"Sent",      val:campaign.sent,      color:T.blue   },
                { label:"Delivered", val:campaign.delivered, color:T.teal   },
                { label:"Read",      val:campaign.read,      color:T.green  },
                { label:"Failed",    val:campaign.failed,    color:T.red    },
              ].map(s => (
                <div key={s.label} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:T.mono, fontSize:15, fontWeight:700,
                    color:s.color }}>
                    {s.val > 0 ? `${pct(s.val, campaign.total)}%` : "0%"}
                  </div>
                  <div style={{ fontSize:9, color:T.subtle }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stacked progress bar */}
          <div style={{ height:10, background:T.border, borderRadius:99,
            overflow:"hidden", display:"flex" }}>
            <div style={{ width:`${pct(campaign.read, campaign.total)}%`, height:"100%",
              background:T.green, transition:"width .5s" }} />
            <div style={{ width:`${pct(campaign.delivered - campaign.read, campaign.total)}%`,
              height:"100%", background:T.teal, transition:"width .5s" }} />
            <div style={{ width:`${pct(campaign.sent - campaign.delivered - campaign.failed, campaign.total)}%`,
              height:"100%", background:T.blue, transition:"width .5s" }} />
            <div style={{ width:`${pct(campaign.failed, campaign.total)}%`, height:"100%",
              background:T.red, transition:"width .5s" }} />
          </div>

          <div style={{ display:"flex", gap:14, marginTop:10, flexWrap:"wrap" }}>
            {[
              { color:T.green, label:"Read" },
              { color:T.teal,  label:"Delivered (not read)" },
              { color:T.blue,  label:"Sent (pending delivery)" },
              { color:T.red,   label:"Failed" },
            ].map(l => (
              <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5,
                fontSize:10, color:T.subtle }}>
                <div style={{ width:10, height:10, borderRadius:2, background:l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* BREAKDOWN + CAMPAIGN INFO */}
        <div style={{ display:"flex", gap:14, marginBottom:16 }}>
          {/* Funnel */}
          <div style={{ flex:1, background:T.card, borderRadius:12,
            border:`1px solid ${T.border}`, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>
              Delivery funnel
            </div>
            {[
              { label:"Total contacts", val:campaign.total,     color:T.subtle, bar:100       },
              { label:"Sent",           val:campaign.sent,      color:T.blue,   bar:pct(campaign.sent,campaign.total) },
              { label:"Delivered",      val:campaign.delivered, color:T.teal,   bar:pct(campaign.delivered,campaign.total) },
              { label:"Read",           val:campaign.read,      color:T.green,  bar:pct(campaign.read,campaign.total) },
            ].map(row => (
              <div key={row.label} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  marginBottom:4 }}>
                  <span style={{ fontSize:11, color:T.muted }}>{row.label}</span>
                  <span style={{ fontFamily:T.mono, fontSize:12, fontWeight:700,
                    color: row.color }}>
                    {row.val.toLocaleString()}
                  </span>
                </div>
                <div style={{ height:5, background:T.border, borderRadius:99, overflow:"hidden" }}>
                  <div style={{ width:`${row.bar}%`, height:"100%",
                    background:row.color, borderRadius:99, transition:"width .6s" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Campaign info */}
          <div style={{ width:240, flexShrink:0, background:T.card, borderRadius:12,
            border:`1px solid ${T.border}`, padding:"18px 20px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:14 }}>
              Campaign info
            </div>
            {[
              ["Template",    campaign.template],
              ["Category",    campaign.category],
              ["Send rate",   `${campaign.sendRate} msg/min`],
              ["Started",     campaign.startedAt || "—"],
              ["Status",      <StatusBadge key="s" status={campaign.status} size="sm" />],
            ].map(([label, val]) => (
              <div key={label} style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", padding:"7px 0",
                borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.muted }}>{label}</span>
                <span style={{ fontSize:11, fontWeight:600, color:T.text }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MESSAGE LOG */}
        <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
          overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background:T.bg }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Message log</div>
              <div style={{ fontSize:10, color:T.subtle }}>
                Individual delivery status · {isRunning ? "auto-refreshing" : "final"}
              </div>
            </div>
            {/* Tab filter */}
            <div style={{ display:"flex", background:T.card, borderRadius:8, padding:3,
              border:`1px solid ${T.border}`, gap:0 }}>
              {["all","read","delivered","sent","failed"].map(tab => (
                <button key={tab} onClick={() => setMsgTab(tab)}
                  style={{ padding:"4px 10px", borderRadius:6, border:"none",
                    cursor:"pointer", fontSize:11, fontWeight: msgTab===tab?700:400,
                    background: msgTab===tab ? T.green : "transparent",
                    color: msgTab===tab ? "#fff" : T.muted,
                    textTransform:"capitalize" }}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:T.bg }}>
                {["Contact","Phone","Status","Sent","Delivered","Read","Error"].map(h => (
                  <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:9,
                    fontWeight:700, color:T.muted, letterSpacing:"0.06em",
                    textTransform:"uppercase", borderBottom:`1px solid ${T.border}`,
                    whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLog.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < filteredLog.length-1
                  ? `1px solid ${T.border}` : "none" }}>
                  <td style={{ padding:"11px 14px", fontWeight:600, color:T.text }}>
                    {m.contact}
                  </td>
                  <td style={{ padding:"11px 14px", fontFamily:T.mono,
                    fontSize:11, color:T.muted }}>{m.phone}</td>
                  <td style={{ padding:"11px 14px" }}>
                    <MsgBadge status={m.status} />
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:11, color:T.muted }}>
                    {m.sent}
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:11, color:T.muted }}>
                    {m.delivered || <span style={{ color:T.border }}>—</span>}
                  </td>
                  <td style={{ padding:"11px 14px", fontSize:11, color:T.muted }}>
                    {m.read || <span style={{ color:T.border }}>—</span>}
                  </td>
                  <td style={{ padding:"11px 14px" }}>
                    {m.error ? (
                      <span style={{ fontSize:10, color:T.red,
                        background:T.redLight, padding:"2px 7px", borderRadius:20 }}>
                        {m.error}
                      </span>
                    ) : <span style={{ color:T.border }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLog.length === 0 && (
            <div style={{ padding:"32px", textAlign:"center", color:T.subtle, fontSize:12 }}>
              No messages with status "{msgTab}"
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmPause} onClose={() => setConfirmPause(false)}
        onConfirm={() => { setCampaign(c => ({ ...c, status:"paused" })); setConfirmPause(false); }}
        title="Pause campaign?"
        msg="The campaign will stop sending immediately. All remaining messages stay in the queue and can be resumed later."
        label="Pause Campaign" />

      <ConfirmModal
        open={confirmCancel} onClose={() => setConfirmCancel(false)}
        onConfirm={() => { setCampaign(c => ({ ...c, status:"failed" })); setConfirmCancel(false); }}
        title="Cancel campaign?"
        msg="All unsent messages will be permanently discarded. This cannot be undone."
        label="Cancel Campaign" danger />
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT — SCREEN ROUTER
───────────────────────────────────────────── */
export default function CampaignsModule() {
  const [view, setView]       = useState("list"); // list | wizard | detail
  const [selected, setSelected] = useState(null);

  const handleView = (c) => { setSelected(c); setView("detail"); };
  const handleNew  = ()  => setView("wizard");
  const handleBack = ()  => { setSelected(null); setView("list"); };
  const handleLaunch = (newCampaign) => {
    if (newCampaign) {
      setSelected(newCampaign);
    } else {
      setSelected(CAMPAIGNS.find(c => c.status === "running") || CAMPAIGNS[0]);
    }
    setView("detail");
  };

  return (
    <div style={{ fontFamily:T.font, display:"flex", minHeight:"100vh", background:T.bg }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
        input:focus, select:focus, textarea:focus {
          outline:none; box-shadow:0 0 0 3px ${T.green}22;
          border-color:${T.green} !important;
        }
      `}</style>

      <Sidebar />

      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column",
        overflow:"hidden" }}>
        {view === "list"   && <CampaignsList onNew={handleNew} onView={handleView} />}
        {view === "wizard" && <CampaignWizard onBack={handleBack} onLaunch={handleLaunch} />}
        {view === "detail" && selected &&
          <CampaignDetail campaign={selected} onBack={handleBack} />}
      </div>
    </div>
  );
}

// Export individual pieces so new routed pages can reuse exact UI
export { CampaignWizard, CampaignDetail, CampaignsList }
