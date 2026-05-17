import React, { useState, useEffect, useRef, useCallback } from "react";
import api, { templatesAPI, campaignsAPI } from "../../services/api";
import useAuthStore from "../../store/authStore";

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
  const { user } = useAuthStore();
  const name = user?.name || "Piyush Admin";
  const role = user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : "Super Admin";
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "PA";

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
          fontSize:10, fontWeight:700, color:"#fff" }}>{initials}</div>
        <div>
          <div style={{ fontSize:11, fontWeight:600, color:"#E2E8F0" }}>{name}</div>
          <div style={{ fontSize:9, color:"#475569" }}>{role}</div>
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
  const { user } = useAuthStore();
  const isViewer = user?.role === 'viewer';

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch]             = useState("");
  const [hoverRow, setHoverRow]         = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const [campaigns, setCampaigns]       = useState([]);
  const [loading, setLoading]           = useState(true);

  // Realtime Polling every 10 seconds
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await campaignsAPI.list({ limit: 100 });
      if (res.data?.success) {
        setCampaigns(res.data.data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns for polling:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const iv = setInterval(fetchCampaigns, 10000);
    return () => clearInterval(iv);
  }, [fetchCampaigns]);

  // Handle Retry
  const handleRetryFailed = async (e, id) => {
    e.stopPropagation();
    try {
      await campaignsAPI.launch(id); // assuming launch handles retries or create a new endpoint, for now use launch
      // Alternatively, we could add campaignsAPI.retry(id) if the backend supports it.
      fetchCampaigns();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const counts = {
    all:       campaigns.length,
    running:   campaigns.filter(c => c.status === "running").length,
    scheduled: campaigns.filter(c => c.status === "scheduled").length,
    paused:    campaigns.filter(c => c.status === "paused").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };

  const filtered = campaigns.filter(c => {
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
            <button onClick={isViewer ? undefined : onNew}
              disabled={isViewer}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:8, border:"none",
                background: isViewer ? T.border : T.green,
                color: isViewer ? T.muted : "#fff",
                fontSize:13, fontWeight:600,
                cursor: isViewer ? "not-allowed" : "pointer" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {isViewer ? "New Campaign (Read-only)" : "New Campaign"}
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
            Live · updates every 10s
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
                // Real metrics calculation based on database schema stats
                const s = c.stats || {};
                const totalTarget = s.totalContacts || 0;
                const sent = s.sent || 0;
                const delivered = s.delivered || 0;
                const read = s.read || 0;
                const failed = s.failed || 0;

                const deliveryPct = pct(delivered, sent);
                const readPct = pct(read, sent);
                
                return (
                  <tr key={c._id || c.id}
                    onMouseEnter={() => setHoverRow(c._id || c.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    onClick={() => onView(c)}
                    style={{ background: hoverRow===(c._id || c.id) ? T.bg : T.card,
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
                          {totalTarget > 0 ? `${totalTarget.toLocaleString()} contacts` : "—"}
                        </span>
                      ) : (
                        <div>
                          <ProgressBar sent={sent} total={totalTarget} status={c.status} showLabel />
                          {failed > 0 && (
                            <div style={{ marginTop: 4, fontSize: 10, color: T.red, fontWeight: 600 }}>
                              {failed} failed
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Delivery */}
                    <td style={{ padding:"13px 14px" }}>
                      {c.status === "scheduled" || c.status === "draft" ? (
                        <span style={{ color:T.subtle }}>—</span>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column" }}>
                          <span style={{ fontFamily:T.mono, fontWeight:700,
                            color: deliveryPct>95 ? "#16A34A" : deliveryPct>85 ? T.amber : T.red }}>
                            {deliveryPct}%
                          </span>
                          <span style={{ fontSize:10, color:T.subtle }}>{delivered.toLocaleString()} / {sent.toLocaleString()}</span>
                        </div>
                      )}
                    </td>

                    {/* Open rate (actually Read Rate for WhatsApp) */}
                    <td style={{ padding:"13px 14px" }}>
                      {c.status === "scheduled" || c.status === "draft" ? (
                        <span style={{ color:T.subtle }}>—</span>
                      ) : (
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ display:"flex", flexDirection:"column" }}>
                            <span style={{ fontFamily:T.mono, fontWeight:700, color:T.text }}>
                              {readPct}%
                            </span>
                            <span style={{ fontSize:10, color:T.subtle }}>{read.toLocaleString()} / {sent.toLocaleString()}</span>
                          </div>
                          <div style={{ width:44, height:4, background:T.border,
                            borderRadius:99, overflow:"hidden" }}>
                            <div style={{ width:`${readPct}%`, height:"100%",
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
                        
                        {/* Retry Failed */}
                        {failed > 0 && (c.status === "completed" || c.status === "failed" || c.status === "running") && (
                          <button onClick={(e) => handleRetryFailed(e, c._id || c.id)}
                            disabled={isViewer}
                            style={{ padding:"4px 8px", borderRadius:6,
                              border:`1px solid ${T.amber}`, background:T.amberLight,
                              color:T.amber, fontSize:11, fontWeight:600, cursor: isViewer ? "not-allowed" : "pointer",
                              display:"flex", alignItems:"center", gap:4 }}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <polyline points="1 4 1 10 7 10"></polyline>
                              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                            </svg>
                            Retry
                          </button>
                        )}

                        {/* Pause / Resume */}
                        {c.status === "running" && (
                          <button onClick={() => {}}
                            disabled={isViewer}
                            style={{ padding:"4px 10px", borderRadius:6,
                              border:`1px solid ${isViewer ? T.border : `${T.amber}30`}`,
                              background: isViewer ? T.border : T.amberLight,
                              fontSize:11, color: isViewer ? T.muted : T.amber,
                              fontWeight:600, cursor: isViewer ? "not-allowed" : "pointer" }}>
                            ⏸ Pause
                          </button>
                        )}
                        {c.status === "paused" && (
                          <button onClick={() => {}}
                            disabled={isViewer}
                            style={{ padding:"4px 10px", borderRadius:6,
                              border:`1px solid ${isViewer ? T.border : `${T.green}30`}`,
                              background: isViewer ? T.border : T.greenLight,
                              fontSize:11, color: isViewer ? T.muted : T.greenDark,
                              fontWeight:600, cursor: isViewer ? "not-allowed" : "pointer" }}>
                            ▶ Resume
                          </button>
                        )}

                        {/* Cancel */}
                        {(c.status === "running" || c.status === "paused" || c.status === "scheduled") && (
                          <button onClick={() => setConfirmCancel(c)}
                            disabled={isViewer}
                            style={{ width:28, height:28, borderRadius:6,
                              border:`1px solid ${T.border}`, background: isViewer ? T.border : T.card,
                              cursor: isViewer ? "not-allowed" : "pointer", display:"flex", alignItems:"center",
                              justifyContent:"center", color: isViewer ? T.muted : T.red, fontSize:13 }}>×</button>
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
/* ─────────────────────────────────────────────
   SCREEN 2 — CAMPAIGN WIZARD (5 steps)
───────────────────────────────────────────── */
const WIZARD_STEPS = [
  { num:1, label:"Setup",      sub:"Name & template"    },
  { num:2, label:"Audience",   sub:"Select & exclude"   },
  { num:3, label:"Template UI",sub:"Live WA preview"    },
  { num:4, label:"Schedule",   sub:"Timezone & throttle"},
  { num:5, label:"Launch",     sub:"Review & launch"    },
];

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Asia/Singapore",
  "Asia/Dubai",
  "America/Los_Angeles",
  "Europe/Paris",
  "Australia/Sydney",
  "Africa/Johannesburg"
];

function CampaignWizard({ onBack, onLaunch }) {
  const { user } = useAuthStore();
  const isAgent = user?.role === 'agent';

  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState({
    name:         "",
    description:  "",
    templateId:   null,
    contactLists: [], // targeted lists/tags
    targetGroups: [], // targeted groups
    targetTags: [],   // targeted tags
    exclusionGroups: [],
    exclusionTags: [],
    targetContacts: [],
    exclusionContacts: [],
    selectAll:    false,
    sendRate:     30,
    varMap:       {},
    scheduleNow:  true,
    scheduleDate: "",
    scheduleTime: "",
    timezone:     "Asia/Kolkata",
    channel:      "WhatsApp",
    categoryTag:  "Marketing",
    internalNotes: ""
  });

  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched]   = useState(false);
  
  // Loading & State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState('');

  const [contactLists, setContactLists] = useState([]); // will hold tags & lists
  const [loadingContactLists, setLoadingContactLists] = useState(false);
  
  const [contactGroups, setContactGroups] = useState([]); // will hold groups
  const [contactFields, setContactFields] = useState(CONTACT_FIELDS);

  // Name duplicate check state
  const [nameChecked, setNameChecked] = useState(false);
  const [nameExists, setNameExists] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState([]);

  // Live audience estimation state
  const [estimation, setEstimation] = useState({
    totalRecipients: 0,
    duplicatesRemoved: 0,
    optedOutExcluded: 0,
    estimatedMessageCount: 0
  });
  const [estimating, setEstimating] = useState(false);
  const [estimationError, setEstimationError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [activeAudienceTab, setActiveAudienceTab] = useState('groups');
  const [allContacts, setAllContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const [launchError, setLaunchError] = useState('');

  // Fetch templates when step === 1
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

  // Debounced Campaign Name duplicate validation
  useEffect(() => {
    if (!form.name.trim()) {
      setNameExists(false);
      setNameSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      api.get(`/campaigns/check-name?name=${encodeURIComponent(form.name.trim())}`)
        .then(res => {
          const exists = res?.data?.data?.exists ?? res?.data?.exists;
          if (exists) {
            setNameExists(true);
            const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
            setNameSuggestions([
              `${form.name.trim()} - Copy`,
              `${form.name.trim()} - ${dateStr}`,
              `${form.name.trim()} v2`
            ]);
          } else {
            setNameExists(false);
            setNameSuggestions([]);
          }
          setNameChecked(true);
        })
        .catch(err => {
          console.error("check name duplicate error:", err);
        });
    }, 400);

    return () => clearTimeout(handler);
  }, [form.name]);

  // Fetch contact groups, lists and tags when step === 2
  useEffect(() => {
    let mounted = true;
    if (step !== 2) return undefined;
    setLoadingContactLists(true);
    
    // Get Contact Lists & Tags
    api.get('/contacts/lists')
      .then(res => {
        if (!mounted) return;
        const groups = (res && res.data && res.data.data && res.data.data.groups) || (res && res.data && res.data.groups) || [];
        setContactLists(Array.isArray(groups) ? groups : []);
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoadingContactLists(false); });

    // Get Contact Groups
    api.get('/contact-groups')
      .then(res => {
        if (!mounted) return;
        setContactGroups(res?.data?.data?.groups || []);
      })
      .catch(console.error);

    // Get all individual contacts
    setLoadingContacts(true);
    api.get('/contacts?limit=250')
      .then(res => {
        if (!mounted) return;
        const cts = res?.data?.data?.contacts || res?.data?.contacts || [];
        setAllContacts(Array.isArray(cts) ? cts : []);
      })
      .catch(console.error)
      .finally(() => { if (mounted) setLoadingContacts(false); });

    return () => { mounted = false };
  }, [step]);

  // Real-time live audience estimation when targets/exclusions change
  useEffect(() => {
    if (step !== 2) return;

    const payload = {
      contactListIds: form.contactLists,
      targetGroups: form.targetGroups,
      targetTags: form.targetTags,
      exclusionGroups: form.exclusionGroups,
      exclusionTags: form.exclusionTags,
      targetContacts: form.targetContacts,
      exclusionContacts: form.exclusionContacts
    };

    setEstimating(true);
    setEstimationError(false);
    const handler = setTimeout(() => {
      api.post('/campaigns/estimate-audience', payload)
        .then(res => {
          if (res?.data?.success && res.data.data) {
            setEstimation(res.data.data);
            setEstimationError(false);
          } else {
            setEstimationError(true);
          }
        })
        .catch(err => {
          console.error("estimate audience error:", err);
          setEstimationError(true);
        })
        .finally(() => {
          setEstimating(false);
        });
    }, 300);

    return () => clearTimeout(handler);
  }, [form.contactLists, form.targetGroups, form.targetTags, form.exclusionGroups, form.exclusionTags, form.targetContacts, form.exclusionContacts, step, retryCount]);

  // Fetch contact fields when user reaches Step 3
  useEffect(() => {
    let mounted = true;
    if (step !== 3) return undefined;
    api.get('/contacts/fields')
      .then(res => {
        if (!mounted) return;
        const fields = (res && res.data && res.data.data && res.data.data.fields) || (res && res.data && res.data.fields) || [];
        setContactFields(Array.isArray(fields) && fields.length ? fields : CONTACT_FIELDS);
      })
      .catch(err => {
        console.error('contact fields error', err);
        setContactFields(CONTACT_FIELDS);
      });
    return () => { mounted = false };
  }, [step]);

  const selectedTemplate = templates.find(t => String(t.id || t._id) === String(form.templateId));
  const normTemplate = normalizeTemplate(selectedTemplate);

  const toggleTargetGroup = (id) => {
    setForm(f => ({
      ...f, selectAll: false,
      targetGroups: f.targetGroups.includes(id) ? f.targetGroups.filter(x => x !== id) : [...f.targetGroups, id],
      // Remove from exclusions if targeted
      exclusionGroups: f.exclusionGroups.filter(x => x !== id)
    }));
  };

  const toggleTargetTag = (id) => {
    setForm(f => ({
      ...f, selectAll: false,
      targetTags: f.targetTags.includes(id) ? f.targetTags.filter(x => x !== id) : [...f.targetTags, id],
      exclusionTags: f.exclusionTags.filter(x => x !== id)
    }));
  };

  const toggleExclusionGroup = (id) => {
    setForm(f => ({
      ...f, selectAll: false,
      exclusionGroups: f.exclusionGroups.includes(id) ? f.exclusionGroups.filter(x => x !== id) : [...f.exclusionGroups, id],
      // Remove from target groups if excluded
      targetGroups: f.targetGroups.filter(x => x !== id)
    }));
  };

  const toggleExclusionTag = (id) => {
    setForm(f => ({
      ...f, selectAll: false,
      exclusionTags: f.exclusionTags.includes(id) ? f.exclusionTags.filter(x => x !== id) : [...f.exclusionTags, id],
      targetTags: f.targetTags.filter(x => x !== id)
    }));
  };

  const toggleTargetContact = (id) => {
    setForm(f => ({
      ...f, selectAll: false,
      targetContacts: f.targetContacts.includes(id) ? f.targetContacts.filter(x => x !== id) : [...f.targetContacts, id],
      // Remove from exclusions if targeted
      exclusionContacts: f.exclusionContacts.filter(x => x !== id)
    }));
  };

  const toggleExclusionContact = (id) => {
    setForm(f => ({
      ...f, selectAll: false,
      exclusionContacts: f.exclusionContacts.includes(id) ? f.exclusionContacts.filter(x => x !== id) : [...f.exclusionContacts, id],
      // Remove from targets if excluded
      targetContacts: f.targetContacts.filter(x => x !== id)
    }));
  };

  const canNext = () => {
    if (step === 1) return form.name.trim() && form.templateId && !nameExists;
    if (step === 2) {
      const selectedAny = form.targetGroups.length > 0 || form.targetTags.length > 0 || form.contactLists.length > 0 || (form.targetContacts && form.targetContacts.length > 0);
      if (isAgent && estimation.totalRecipients > 100) return false;
      return selectedAny && estimation.totalRecipients > 0 && !estimating && !estimationError;
    }
    if (step === 3) return true;
    if (step === 4) {
      if (!form.scheduleNow) {
        return form.scheduleDate && form.scheduleTime && form.timezone;
      }
      return true;
    }
    return true;
  };

  const handleLaunch = async () => {
    setLaunchError('');
    setLaunching(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || form.internalNotes || '',
        templateId: selectedTemplate ? (selectedTemplate._id || selectedTemplate.id || selectedTemplate) : null,
        contactListIds: form.contactLists,
        targetGroups: form.targetGroups,
        targetTags: form.targetTags,
        exclusionGroups: form.exclusionGroups,
        exclusionTags: form.exclusionTags,
        targetContacts: form.targetContacts,
        exclusionContacts: form.exclusionContacts,
        timezone: form.timezone,
        selectAll: form.selectAll,
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

  // Unified template normalization layer
  const normalizeTemplate = (t) => {
    if (!t) return null;
    
    let header = t.header || null;
    let body = t.body || null;
    let footer = t.footer || null;
    let buttons = t.buttons || [];
    
    // If template utilizes the raw Meta components list structure
    if (Array.isArray(t.components)) {
      const headerComp = t.components.find(c => c.type === 'HEADER');
      if (headerComp) {
        header = {
          type: headerComp.format || 'TEXT',
          text: headerComp.text || '',
          mediaUrl: (headerComp.example && headerComp.example.header_url && headerComp.example.header_url[0]) || '',
          mediaType: headerComp.format === 'IMAGE' ? 'image/jpeg' : headerComp.format === 'VIDEO' ? 'video/mp4' : 'application/pdf'
        };
      }
      
      const bodyComp = t.components.find(c => c.type === 'BODY');
      if (bodyComp) {
        body = {
          text: bodyComp.text || '',
          variables: (bodyComp.example && bodyComp.example.body_text && bodyComp.example.body_text[0]) || []
        };
      }
      
      const footerComp = t.components.find(c => c.type === 'FOOTER');
      if (footerComp) {
        footer = {
          text: footerComp.text || ''
        };
      }
      
      const buttonsComp = t.components.find(c => c.type === 'BUTTONS');
      if (buttonsComp && Array.isArray(buttonsComp.buttons)) {
        buttons = buttonsComp.buttons.map(b => ({
          type: b.type,
          text: b.text,
          url: b.url || '',
          phoneNumber: b.phone_number || ''
        }));
      }
    }
    
    // Normalize properties to prevent null exceptions
    header = header ? {
      type: header.type || 'NONE',
      text: header.text || '',
      mediaUrl: header.mediaUrl || '',
      mediaType: header.mediaType || ''
    } : null;
    
    // Handle legacy seeded templates where body is just a string
    if (typeof body === 'string') {
      body = {
        text: body,
        variables: []
      };
    } else {
      body = body ? {
        text: body.text || '',
        variables: Array.isArray(body.variables) ? body.variables : []
      } : { text: '', variables: [] };
    }

    
    footer = footer ? {
      text: footer.text || ''
    } : null;
    
    buttons = Array.isArray(buttons) ? buttons.map(b => ({
      type: b.type || 'QUICK_REPLY',
      text: b.text || '',
      url: b.url || '',
      phoneNumber: b.phoneNumber || b.phone_number || ''
    })) : [];
    
    // Parse any curly braces placeholders e.g. {{1}}, {{2}} in body text
    const bodyText = body.text || '';
    const detectedVariables = [];
    const regex = /\{\{(\d+)\}\}/g;
    let match;
    while ((match = regex.exec(bodyText)) !== null) {
      const varNum = match[1];
      if (!detectedVariables.includes(varNum)) {
        detectedVariables.push(varNum);
      }
    }
    detectedVariables.sort((a, b) => Number(a) - Number(b));
    
    return {
      ...t,
      header,
      body,
      footer,
      buttons,
      variables: detectedVariables.length > 0 ? detectedVariables : body.variables
    };
  };

  // Helper: Live render WhatsApp message template text
  const renderMessageBody = () => {
    if (!selectedTemplate) return "Select a template in Step 1 to preview your message.";
    const norm = normalizeTemplate(selectedTemplate);
    if (!norm || !norm.body || !norm.body.text) {
      return "This template contains no message body.";
    }

    let text = norm.body.text;
    const vars = norm.variables || [];
    vars.forEach((v, index) => {
      const mapping = form.varMap[v] || `{{${v}}}`;
      text = text.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), `[${mapping}]`);
    });

    return text;
  };

  const getHeaderComponent = () => {
    if (!selectedTemplate) return null;
    const norm = normalizeTemplate(selectedTemplate);
    return norm ? norm.header : null;
  };

  const getFooterComponent = () => {
    if (!selectedTemplate) return null;
    const norm = normalizeTemplate(selectedTemplate);
    return norm ? norm.footer : null;
  };

  const getButtonsComponent = () => {
    if (!selectedTemplate) return [];
    const norm = normalizeTemplate(selectedTemplate);
    return norm ? norm.buttons : [];
  };

  // Success Screen
  if (launched) {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:T.greenLight, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke={T.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ fontSize:22, fontWeight:700, color:T.text, marginBottom:8 }}>
          Campaign launched successfully! 🚀
        </div>
        <div style={{ fontSize:14, color:T.muted, textAlign:"center", marginBottom:32, maxWidth:400, lineHeight:1.6 }}>
          <strong style={{ color:T.text }}>{form.name}</strong> is now running. {estimation.totalRecipients.toLocaleString()} contacts will be messaged at {form.sendRate} messages/minute.
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onBack} style={{ padding:"10px 20px", borderRadius:9, border:`1px solid ${T.border}`, background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>
            Back to campaigns
          </button>
          <button onClick={() => onLaunch()} style={{ padding:"10px 20px", borderRadius:9, border:"none", background:T.green, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            View live stats →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden", background: '#F0F4F8' }}>
      <Topbar
        title="Enterprise Campaign Builder"
        subtitle={`Step ${step} of 5 · HubSpot Grade WhatsApp Marketing Orchestrator`}
        actions={
          <button onClick={onBack} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, fontSize:14, color:T.text, cursor:"pointer" }}>
            Cancel
          </button>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"24px 20px" }}>
        
        {/* STEP PROGRESS TRACKER */}
        <div style={{ display:"flex", alignItems:"flex-start", marginBottom:30, maxWidth:800, margin:'0 auto 30px' }}>
          {WIZARD_STEPS.map((s, i) => {
            const done   = s.num < step;
            const active = s.num === step;
            return (
              <React.Fragment key={s.num}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, zIndex:2, width: 90 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700,
                    flexShrink:0, border: active || done ? '2.5px solid #10B981' : `2.5px solid ${T.borderMid}`,
                    background: active ? '#D1FAE5' : done ? '#10B981' : '#fff',
                    color: active ? '#047857' : done ? '#fff' : T.subtle,
                    transition:"all .25s" }}>
                    {done ? "✓" : s.num}
                  </div>
                  <div style={{ textAlign:"center", whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize:12, fontWeight: 700, color: active ? T.text : T.muted }}>{s.label}</div>
                    <div style={{ fontSize:10, color:T.subtle }}>{s.sub}</div>
                  </div>
                </div>
                {i < WIZARD_STEPS.length-1 && (
                  <div style={{ flex:1, height:3, marginTop:18, margin: '18px 6px 0',
                    background: done ? '#10B981' : T.border,
                    transition:"background .25s", zIndex:1 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: CAMPAIGN SETUP ── */}
        {step === 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth: 700, margin: '0 auto' }}>
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:16 }}>
                Campaign properties
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.muted, marginBottom:6 }}>Campaign Name</label>
                  <input value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Holi VIP Offer 2025"
                      aria-label="Campaign name"
                      style={{ width:"100%", padding:"12px 14px", borderRadius:8,
                        border:`1px solid ${nameExists ? T.red : T.border}`, fontSize:14, color:T.text,
                        fontFamily:T.font, outline:"none", boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.muted, marginBottom:6 }}>Channel</label>
                  <select value={form.channel}
                      onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:8,
                        border:`1px solid ${T.border}`, fontSize:14, color:T.text,
                        fontFamily:T.font, outline:"none", boxSizing: 'border-box', background: '#F8FAFC' }}>
                    <option value="WhatsApp">WhatsApp Message Blast</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.muted, marginBottom:6 }}>Category Tag</label>
                  <select value={form.categoryTag}
                      onChange={e => setForm(f => ({ ...f, categoryTag: e.target.value }))}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:8,
                        border:`1px solid ${T.border}`, fontSize:14, color:T.text,
                        fontFamily:T.font, outline:"none", boxSizing: 'border-box', background: '#fff' }}>
                    <option value="Marketing">Marketing / Promotional</option>
                    <option value="Transactional">Transactional / Alert</option>
                    <option value="Newsletter">Monthly Newsletter</option>
                    <option value="Other">Other Blast</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:T.muted, marginBottom:6 }}>Internal Notes</label>
                  <input value={form.internalNotes}
                      onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
                      placeholder="Optional internal context for team"
                      style={{ width:"100%", padding:"12px 14px", borderRadius:8,
                        border:`1px solid ${T.border}`, fontSize:14, color:T.text,
                        fontFamily:T.font, outline:"none", boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Duplicate warnings & suggestions */}
              {nameExists && (
                <div style={{ marginTop: 12, padding: 12, background: T.redLight, borderRadius: 8, border: `1px solid ${T.red}` }}>
                  <div style={{ fontSize: 13, color: T.red, fontWeight: 700, marginBottom: 4 }}>
                    ⚠️ A campaign with this name already exists.
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    Try these smart suggested alternatives:
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {nameSuggestions.map(sug => (
                      <button key={sug} onClick={() => setForm(f => ({ ...f, name: sug }))}
                        style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: '#fff', fontSize: 11, cursor: 'pointer', color: T.text }}>
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Select Template Card */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:4 }}>
                Approved templates
              </div>
              <div style={{ fontSize:12, color:T.subtle, marginBottom:20 }}>
                Select a Meta-approved message template for this broadcast.
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
                        style={{ display:"flex", alignItems:"center", gap:16, padding:"14px 18px",
                          borderRadius:10, border: sel ? `2px solid #10B981` : `1px solid ${T.border}`,
                          background: '#fff', cursor:"pointer",
                          transition:"all .15s" }}>

                        <div style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                          border:`2px solid ${sel ? '#10B981' : T.borderMid}`,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {sel && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />}
                        </div>

                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color: T.text }}>{t.name || t.title}</div>
                          <div style={{ display:"flex", gap:6, marginTop:4, alignItems: 'center' }}>
                            <span style={{ fontSize:11, fontWeight:600, color:catColor }}>
                              {t.category || 'MARKETING'}
                            </span>
                            <span style={{ color:T.subtle, fontSize: 12 }}>·</span>
                            <span style={{ fontSize:11, color: T.muted }}>
                              {(t.variables || []).length} variables
                            </span>
                          </div>
                        </div>

                        <span style={{ fontSize:10, fontWeight:700, padding:"4px 10px",
                          borderRadius:20, background:'#D1FAE5', color:'#065F46', letterSpacing: '0.05em' }}>
                          APPROVED
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Wizard Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingBottom: 40 }}>
              <button onClick={onBack} style={{ padding: '12px 24px', borderRadius: 8, background: '#fff', border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500, color: T.text, cursor: 'pointer' }}>Cancel</button>
              <div style={{ fontSize: 14, color: T.subtle }}>Step 1 of 5</div>
              <button 
                onClick={() => setStep(2)} 
                disabled={!canNext()} 
                style={{ padding: '12px 24px', borderRadius: 8, background: canNext() ? '#2563EB' : '#E2E8F0', color: canNext() ? '#fff' : '#94A3B8', border: 'none', fontSize: 14, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: AUDIENCE SELECTION ── */}
        {step === 2 && (
          <div style={{ display:"grid", gridTemplateColumns: '3fr 2fr', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
            
            {/* Targets & Exclusions Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Audience Navigation Tabs */}
              <div style={{ display: 'flex', gap: 4, background: T.bg, padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
                {[
                  { id: 'groups', label: 'Groups' },
                  { id: 'tags', label: 'Lists & Tags' },
                  { id: 'individual', label: 'Manual Contacts' },
                  { id: 'exclusions', label: 'Exclusions' }
                ].map(tab => {
                  const active = activeAudienceTab === tab.id;
                  let badge = 0;
                  if (tab.id === 'groups') badge = form.targetGroups.length;
                  if (tab.id === 'tags') badge = form.targetTags.length;
                  if (tab.id === 'individual') badge = form.targetContacts.length;
                  if (tab.id === 'exclusions') badge = form.exclusionGroups.length + form.exclusionTags.length + form.exclusionContacts.length;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAudienceTab(tab.id)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: active ? '#fff' : 'transparent',
                        color: active ? '#2563EB' : T.subtle,
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                      {badge > 0 && (
                        <span style={{
                          background: active ? '#2563EB' : T.borderMid,
                          color: active ? '#fff' : T.text,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 10
                        }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: GROUPS */}
              {activeAudienceTab === 'groups' && (
                <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Select target groups</div>
                  <div style={{ fontSize:12, color:T.subtle, marginBottom:16 }}>Target contacts matching these multi-tenant groups.</div>
                  
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {loadingContactLists ? (
                      <div style={{ padding:24, textAlign:'center' }}>Loading groups...</div>
                    ) : contactGroups.length === 0 ? (
                      <div style={{ padding:24, textAlign:'center', color: T.subtle }}>No contact groups found.</div>
                    ) : (
                      contactGroups.map(g => {
                        const id = g._id || g.id;
                        const sel = form.targetGroups.includes(id);
                        return (
                          <div key={id} onClick={() => toggleTargetGroup(id)}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, border:`1.5px solid ${sel ? '#10B981' : T.border}`, background: sel ? '#ECFDF5' : T.card, cursor:"pointer", transition:"all .15s" }}>
                            <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${sel ? '#10B981' : T.border}`, background: sel ? '#10B981' : T.card, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {sel && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                            </div>
                            <div style={{ flex:1, minWidth:0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize:13, fontWeight:600, color: sel ? '#065F46' : T.text }}>{g.name}</span>
                              <span style={{ fontSize:11, color: T.muted }}>
                                <strong style={{ color: sel ? '#047857' : T.text }}>{g.optedInCount || 0}</strong> opted-in / {g.contactCount || 0} total
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LISTS & TAGS */}
              {activeAudienceTab === 'tags' && (
                <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Select target tags & segments</div>
                  <div style={{ fontSize:12, color:T.subtle, marginBottom:16 }}>Target contacts matching these tags.</div>
                  
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {loadingContactLists ? (
                      <div style={{ padding:24, textAlign:'center' }}>Loading lists & tags...</div>
                    ) : contactLists.length === 0 ? (
                      <div style={{ padding:24, textAlign:'center', color: T.subtle }}>No lists or tags found.</div>
                    ) : (
                      contactLists.map(tag => {
                        const sel = form.targetTags.includes(tag.id) || form.contactLists.includes(tag.id);
                        return (
                          <div key={tag.id} onClick={() => toggleTargetTag(tag.id)}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, border:`1.5px solid ${sel ? '#2563EB' : T.border}`, background: sel ? '#EFF6FF' : T.card, cursor:"pointer", transition:"all .15s" }}>
                            <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${sel ? '#2563EB' : T.border}`, background: sel ? '#2563EB' : T.card, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {sel && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                            </div>
                            <div style={{ flex:1, minWidth:0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize:13, fontWeight:600, color: sel ? '#1E40AF' : T.text }}>{tag.name}</span>
                              <span style={{ fontSize:11, color: T.muted }}>{tag.optIn || 0} opted-in</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: INDIVIDUAL CONTACTS SELECTOR */}
              {activeAudienceTab === 'individual' && (
                <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Target individual contacts</div>
                  <div style={{ fontSize:12, color:T.subtle, marginBottom:16 }}>Select specific contacts to target directly in this campaign broadcast.</div>
                  
                  {/* Selected Contact Chips */}
                  {form.targetContacts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: 12, background: T.bg, borderRadius: 10, border: `1px dashed ${T.border}` }}>
                      {form.targetContacts.map(id => {
                        const contactObj = allContacts.find(c => String(c._id || c.id) === String(id));
                        const label = contactObj ? (contactObj.name || contactObj.phoneNumber) : id;
                        return (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#fff', border: `1px solid ${T.border}`, borderRadius: 20, fontSize: 11, fontWeight: 600, color: T.text }}>
                            <span>{label}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleTargetContact(id); }}
                              style={{ border: 'none', background: 'transparent', color: T.red, fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Search Bar */}
                  <div style={{ position: 'relative', marginBottom: 14 }}>
                    <input
                      type="text"
                      placeholder="Search contacts by name or phone..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text }}
                    />
                    <span style={{ position: 'absolute', left: 12, top: 11, color: T.muted }}>🔍</span>
                    {contactSearch && (
                      <button
                        onClick={() => setContactSearch('')}
                        style={{ position: 'absolute', right: 12, top: 9, border: 'none', background: 'transparent', fontSize: 14, color: T.muted, cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Contacts Table List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                    {loadingContacts ? (
                      <div style={{ padding: 24, textAlign: 'center', color: T.subtle }}>Loading contacts...</div>
                    ) : (() => {
                      const filtered = allContacts.filter(c => {
                        const searchLower = contactSearch.toLowerCase().trim();
                        if (!searchLower) return true;
                        return (c.name || '').toLowerCase().includes(searchLower) || (c.phoneNumber || '').includes(searchLower);
                      });

                      if (filtered.length === 0) {
                        return <div style={{ padding: 20, textAlign: 'center', color: T.subtle, fontSize: 12 }}>No matching contacts found.</div>;
                      }

                      return filtered.map(c => {
                        const id = c._id || c.id;
                        const sel = form.targetContacts.includes(id);
                        const isOptedOut = c.optInStatus === 'opted_out';
                        const isBlocked = c.isBlocked;

                        return (
                          <div
                            key={id}
                            onClick={() => {
                              if (isOptedOut || isBlocked) return;
                              toggleTargetContact(id);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: `1.5px solid ${sel ? '#2563EB' : T.border}`,
                              background: sel ? '#EFF6FF' : (isOptedOut || isBlocked) ? T.bg : T.card,
                              cursor: (isOptedOut || isBlocked) ? 'not-allowed' : 'pointer',
                              opacity: (isOptedOut || isBlocked) ? 0.6 : 1,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{
                              width: 18,
                              height: 18,
                              borderRadius: 4,
                              flexShrink: 0,
                              border: `2px solid ${sel ? '#2563EB' : T.border}`,
                              background: sel ? '#2563EB' : T.card,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {sel && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>{c.name || 'Unnamed Contact'}</span>
                                {isOptedOut && <span style={{ fontSize: 9, background: T.amberLight, color: T.amber, padding: '2px 6px', borderRadius: 10 }}>Opted Out</span>}
                                {isBlocked && <span style={{ fontSize: 9, background: T.redLight, color: T.red, padding: '2px 6px', borderRadius: 10 }}>Blocked</span>}
                              </div>
                              <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>{c.phoneNumber}</div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* TAB 4: EXCLUSIONS */}
              {activeAudienceTab === 'exclusions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Groups Exclusion Card */}
                  <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Exclude Groups</div>
                    <div style={{ fontSize:12, color:T.subtle, marginBottom:16 }}>Opted-in contacts matching excluded groups will be skipped.</div>
                    
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {contactGroups.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: T.subtle, fontSize: 12 }}>No groups available to exclude.</div>
                      ) : (
                        contactGroups.map(g => {
                          const id = g._id || g.id;
                          const sel = form.exclusionGroups.includes(id);
                          return (
                            <div key={id} onClick={() => toggleExclusionGroup(id)}
                              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${sel ? T.red : T.border}`, background: sel ? T.redLight : T.card, cursor:"pointer", transition:"all .15s" }}>
                              <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${sel ? T.red : T.border}`, background: sel ? T.red : T.card, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {sel && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                              </div>
                              <div style={{ flex:1, minWidth:0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize:13, fontWeight:600, color: sel ? T.red : T.text }}>{g.name}</span>
                                <span style={{ fontSize:11, color: T.muted }}>{g.optedInCount || g.contactCount || 0} contacts</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Lists & Tags Exclusion Card */}
                  <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Exclude Lists & Tags</div>
                    <div style={{ fontSize:12, color:T.subtle, marginBottom:16 }}>Suppress contacts matching these tags.</div>
                    
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {contactLists.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: T.subtle, fontSize: 12 }}>No lists or tags available to exclude.</div>
                      ) : (
                        contactLists.map(tag => {
                          const sel = form.exclusionTags.includes(tag.id);
                          return (
                            <div key={tag.id} onClick={() => toggleExclusionTag(tag.id)}
                              style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${sel ? T.red : T.border}`, background: sel ? T.redLight : T.card, cursor:"pointer", transition:"all .15s" }}>
                              <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${sel ? T.red : T.border}`, background: sel ? T.red : T.card, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                {sel && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                              </div>
                              <div style={{ flex:1, minWidth:0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize:13, fontWeight:600, color: sel ? T.red : T.text }}>{tag.name}</span>
                                <span style={{ fontSize:11, color: T.muted }}>{tag.optIn || 0} contacts</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Specific Individual Suppression */}
                  <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px" }}>
                    <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>Exclude Specific Contacts</div>
                    <div style={{ fontSize:12, color:T.subtle, marginBottom:16 }}>Suppress sending to specific individuals in this broadcast.</div>
                    
                    {form.exclusionContacts.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, padding: 12, background: T.redLight, borderRadius: 10, border: `1px dashed ${T.red}` }}>
                        {form.exclusionContacts.map(id => {
                          const contactObj = allContacts.find(c => String(c._id || c.id) === String(id));
                          const label = contactObj ? (contactObj.name || contactObj.phoneNumber) : id;
                          return (
                            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#fff', border: `1px solid ${T.red}`, borderRadius: 20, fontSize: 11, fontWeight: 600, color: T.red }}>
                              <span>{label}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExclusionContact(id); }}
                                style={{ border: 'none', background: 'transparent', color: T.red, fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 13, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                      {allContacts.map(c => {
                        const id = c._id || c.id;
                        const sel = form.exclusionContacts.includes(id);
                        return (
                          <div key={id} onClick={() => toggleExclusionContact(id)}
                            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${sel ? T.red : T.border}`, background: sel ? T.redLight : T.card, cursor:"pointer", transition:"all .15s" }}>
                            <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, border:`2px solid ${sel ? T.red : T.border}`, background: sel ? T.red : T.card, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              {sel && <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                            </div>
                            <div style={{ flex:1, minWidth:0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize:13, fontWeight:600, color: sel ? T.red : T.text }}>{c.name || c.phoneNumber}</span>
                              <span style={{ fontSize:11, color: T.muted, fontFamily: T.mono }}>{c.phoneNumber}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Estimation Dashboard */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px", position: 'sticky', top: 76 }}>
                <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:16 }}>
                  Live audience estimation
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: T.bg, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', marginBottom: 4 }}>Total deduped recipients</div>
                    <div style={{
                      fontSize: 32,
                      fontFamily: T.mono,
                      fontWeight: 700,
                      color: estimation.totalRecipients > 0 ? T.green : T.subtle,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: estimating ? 'scale(0.97)' : 'scale(1)',
                      opacity: estimating ? 0.75 : 1,
                      display: 'inline-block'
                    }}>
                      {estimating ? "Calculating…" : estimation.totalRecipients.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: T.subtle, marginTop: 4 }}>
                      Opted-in contacts matching filters
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, background: '#fff' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Duplicates skipped</div>
                      <div style={{ fontSize: 16, fontFamily: T.mono, fontWeight: 700, color: T.text, marginTop: 2 }}>{estimation.duplicatesRemoved}</div>
                    </div>
                    <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, background: '#fff' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.muted, textTransform: 'uppercase' }}>Opt-outs skipped</div>
                      <div style={{ fontSize: 16, fontFamily: T.mono, fontWeight: 700, color: T.amber, marginTop: 2 }}>{estimation.optedOutExcluded}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.muted }}>Broadcast count</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{estimation.totalRecipients} msgs</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.muted }}>Base rate per msg</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>₹0.72</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.muted }}>Meta platform fee</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>₹0.48</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 12, color: T.muted }}>Total est. charges</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.greenDark }}>
                      ₹{(estimation.totalRecipients * 1.20).toFixed(2)}
                    </span>
                  </div>

                  {estimationError && (
                    <div style={{ background: T.redLight, border: `1px solid ${T.red}`, padding: 12, borderRadius: 8, fontSize: 11, color: T.red, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontWeight: 700 }}>⚠️ Live estimation failed</div>
                      <div>Check your network status or retry calculation.</div>
                      <button onClick={() => setRetryCount(r => r + 1)} style={{ padding: '6px 12px', background: T.red, color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.15s' }}>
                        Retry Calculation
                      </button>
                    </div>
                  )}

                  {estimation.totalRecipients === 0 && !estimating && !estimationError && (
                    <div style={{
                      background: '#fff',
                      border: `1.5px dashed ${T.border}`,
                      padding: '20px 14px',
                      borderRadius: 10,
                      textAlign: 'center',
                      color: T.subtle
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>No Audience Selected</div>
                      <div style={{ fontSize: 11, color: T.muted }}>
                        Select a target group, list, tag, or manual contacts to calculate your live broadcast audience.
                      </div>
                    </div>
                  )}

                  {estimation.totalRecipients > 0 && estimation.duplicatesRemoved > (estimation.totalRecipients * 0.3) && (
                    <div style={{ background: T.amberLight, border: `1px solid ${T.amber}`, padding: 10, borderRadius: 8, fontSize: 11, color: T.amber }}>
                      ℹ️ High overlap warning: {estimation.duplicatesRemoved} contacts are in multiple selected tags/groups. Skipping duplicates safely.
                    </div>
                  )}

                  {isAgent && estimation.totalRecipients > 100 && (
                    <div style={{ background: T.redLight, border: `1px solid ${T.red}`, padding: 10, borderRadius: 8, fontSize: 11, color: T.red }}>
                      ⚠️ <strong>Role Limit Restrict:</strong> Agents are restricted from launching campaigns to more than 100 contacts. Total targeted contacts: {estimation.totalRecipients.toLocaleString()}. Please reduce targeted selections or contact an administrator to approve higher volume blasts.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2 Footer */}
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingBottom: 40 }}>
              <button onClick={() => setStep(1)} style={{ padding: '12px 24px', borderRadius: 8, background: '#fff', border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500, color: T.text, cursor: 'pointer' }}>← Back</button>
              <div style={{ fontSize: 14, color: T.subtle }}>Step 2 of 5</div>
              <button 
                onClick={() => setStep(3)} 
                disabled={!canNext()} 
                style={{ padding: '12px 24px', borderRadius: 8, background: canNext() ? '#2563EB' : '#E2E8F0', color: canNext() ? '#fff' : '#94A3B8', border: 'none', fontSize: 14, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PERSONALISATION & MESSAGE PREVIEW ── */}
        {step === 3 && (
          <div style={{ display:"grid", gridTemplateColumns: '4fr 3fr', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
            
            {/* Variable Mapping Inputs */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>
                Map template variables
              </div>
              <div style={{ fontSize:12, color:T.subtle, marginBottom:20 }}>
                Map each placeholder variable in <strong>{selectedTemplate?.name}</strong> to contact fields.
              </div>

              {(!normTemplate || (normTemplate.variables || []).length === 0) && (
                <div style={{ padding:"24px", textAlign:"center", color:T.subtle, fontSize:13 }}>
                  This template has no variables — no mapping needed ✓
                </div>
              )}

              {(normTemplate?.variables || []).map((v, i) => (
                <div key={v} style={{ display:"flex", flexDirection: 'column', gap: 8, padding:"16px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}`, marginBottom:12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontFamily:T.mono, background:T.purpleLight, color:T.purple, border:`1px solid #C4B5FD` }}>
                      {`{{${i+1}}}`}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Variable Mapping</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: T.muted, marginBottom: 4 }}>Map to dynamic field</label>
                      <select value={form.varMap[v] || ""}
                        onChange={e => setForm(f => ({ ...f, varMap: { ...f.varMap, [v]: e.target.value } }))}
                        style={{ width: '100%', padding:"8px 10px", borderRadius:7, border:`1px solid ${T.border}`, fontSize:12, color:T.text, background:T.card, fontFamily:T.font, outline:"none", cursor:"pointer" }}>
                        <option value="">— Select dynamic field —</option>
                        <optgroup label="Contact attributes">
                          {(contactFields || CONTACT_FIELDS).map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 10, color: T.muted, marginBottom: 4 }}>Or use a fallback / fixed text</label>
                      <input
                        placeholder="e.g. VIP Customer"
                        value={typeof form.varMap[v] === "string" && !CONTACT_FIELDS.includes(form.varMap[v]) ? form.varMap[v] : ""}
                        onChange={e => setForm(f => ({ ...f, varMap: { ...f.varMap, [v]: e.target.value } }))}
                        style={{ width: '100%', padding:"8px 10px", borderRadius:7, border:`1px solid ${T.border}`, fontSize:12, color:T.text, fontFamily:T.font, outline:"none" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Real-time WhatsApp Device Preview Mockup */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 280, height: 500, background: '#0B141A', border: '8px solid #334155', borderRadius: 32, padding: 12, boxSizing: 'border-box', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 76 }}>
                
                {/* Phone Header Mockup */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid #1F2C34', marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.green, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>WA</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#E9EDEF' }}>WhatsApp Support</div>
                    <div style={{ fontSize: 8, color: '#8696A0' }}>Online</div>
                  </div>
                </div>

                {/* Message Bubble Container */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                  <div style={{ alignSelf: 'flex-start', background: '#202C33', borderRadius: 8, padding: 8, borderTopLeftRadius: 0, maxWidth: '90%', marginBottom: 10, border: '1px solid #2F3B43' }}>
                    
                    {/* Media Header Preview */}
                    {getHeaderComponent() && getHeaderComponent().type !== 'NONE' && (
                      <div style={{ marginBottom: 6 }}>
                        {getHeaderComponent().type === 'IMAGE' && (
                          <div style={{
                            width: '100%',
                            height: 110,
                            borderRadius: 6,
                            background: getHeaderComponent().mediaUrl ? `url(${getHeaderComponent().mediaUrl}) center/cover no-repeat` : '#111B21',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed #4F5E68',
                            overflow: 'hidden'
                          }}>
                            {!getHeaderComponent().mediaUrl && (
                              <>
                                <span style={{ fontSize: 20 }}>🖼️</span>
                                <span style={{ fontSize: 8, color: '#8696A0', marginTop: 4, fontWeight: 600 }}>Header Image</span>
                              </>
                            )}
                          </div>
                        )}

                        {getHeaderComponent().type === 'VIDEO' && (
                          <div style={{
                            width: '100%',
                            height: 110,
                            borderRadius: 6,
                            background: '#111B21',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed #4F5E68',
                            position: 'relative'
                          }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1.5px solid #fff'
                            }}>
                              <span style={{ color: '#fff', fontSize: 10, marginLeft: 2 }}>▶</span>
                            </div>
                            <span style={{ fontSize: 8, color: '#8696A0', marginTop: 6, fontWeight: 600 }}>Header Video Preview</span>
                          </div>
                        )}

                        {getHeaderComponent().type === 'DOCUMENT' && (
                          <div style={{
                            width: '100%',
                            borderRadius: 6,
                            background: '#111B21',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            border: '1px solid #2F3B43',
                            boxSizing: 'border-box'
                          }}>
                            <span style={{ fontSize: 24 }}>📄</span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#E9EDEF' }}>Attachment.pdf</span>
                              <span style={{ fontSize: 8, color: '#8696A0' }}>PDF Document · 1.2 MB</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Header text if any */}
                    {getHeaderComponent() && getHeaderComponent().type === 'TEXT' && getHeaderComponent().text && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#E9EDEF', marginBottom: 6 }}>
                        {getHeaderComponent().text}
                      </div>
                    )}

                    {/* Body text with live replaced variables */}
                    <div style={{ fontSize: 11, color: '#E9EDEF', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                      {renderMessageBody()}
                    </div>

                    {/* Footer component */}
                    {getFooterComponent() && getFooterComponent().text && (
                      <div style={{ fontSize: 8.5, color: '#8696A0', marginTop: 5 }}>
                        {getFooterComponent().text}
                      </div>
                    )}
                  </div>

                  {/* Buttons Mockup */}
                  {getButtonsComponent() && getButtonsComponent().length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '90%', marginTop: 2 }}>
                      {getButtonsComponent().map((btn, idx) => {
                        const icon = btn.type === 'URL' ? '🔗' : btn.type === 'PHONE_NUMBER' ? '📞' : '💬';
                        return (
                          <div key={idx} style={{
                            background: '#202C33',
                            border: '1px solid #2F3B43',
                            padding: '8px 12px',
                            borderRadius: 6,
                            fontSize: 10.5,
                            color: '#34D399',
                            textAlign: 'center',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}>
                            <span>{icon}</span>
                            <span>{btn.text || "Quick Action"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3 Footer */}
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingBottom: 40 }}>
              <button onClick={() => setStep(2)} style={{ padding: '12px 24px', borderRadius: 8, background: '#fff', border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500, color: T.text, cursor: 'pointer' }}>← Back</button>
              <div style={{ fontSize: 14, color: T.subtle }}>Step 3 of 5</div>
              <button 
                onClick={() => setStep(4)} 
                disabled={!canNext()} 
                style={{ padding: '12px 24px', borderRadius: 8, background: canNext() ? '#2563EB' : '#E2E8F0', color: canNext() ? '#fff' : '#94A3B8', border: 'none', fontSize: 14, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: SCHEDULING & THROTTLING ── */}
        {step === 4 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth: 700, margin: '0 auto' }}>
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16 }}>
                Launch scheduling
              </div>
              
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom: 20 }}>
                {[
                  { key:true,  label:"Send now",         sub:"Launch campaign and start dispatching immediately" },
                  { key:false, label:"Schedule for later", sub:"Orchestrate campaign to execute automatically at specific time" },
                ].map(opt => (
                  <div key={String(opt.key)}
                    onClick={() => setForm(f => ({ ...f, scheduleNow: opt.key }))}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                      borderRadius:10, border:`2px solid ${form.scheduleNow===opt.key ? T.green : T.border}`,
                      background: form.scheduleNow===opt.key ? T.greenLight : T.card,
                      cursor:"pointer", transition:"all .15s" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", flexShrink:0,
                      border:`2px solid ${form.scheduleNow===opt.key ? T.green : T.border}`,
                      background: form.scheduleNow===opt.key ? T.green : T.card,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {form.scheduleNow === opt.key && (
                        <div style={{ width:8, height:8, borderRadius:"50%", background:"#fff" }} />
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
                <div style={{ display:"flex", flexDirection: 'column', gap: 14, background: T.bg, padding: 16, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ flex:1 }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.muted, marginBottom:4 }}>Send Date</label>
                      <input type="date" value={form.scheduleDate}
                        onChange={e => setForm(f => ({ ...f, scheduleDate: e.target.value }))}
                        style={{ width:"100%", padding:"8px 11px", borderRadius:8,
                          border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font,
                          outline:"none" }} />
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.muted, marginBottom:4 }}>Send Time</label>
                      <input type="time" value={form.scheduleTime}
                        onChange={e => setForm(f => ({ ...f, scheduleTime: e.target.value }))}
                        style={{ width:"100%", padding:"8px 11px", borderRadius:8,
                          border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font,
                          outline:"none" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:600, color:T.muted, marginBottom:4 }}>Target Timezone</label>
                    <select value={form.timezone}
                      onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                      style={{ width:"100%", padding:"8px 11px", borderRadius:8,
                        border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font,
                        outline:"none", cursor:"pointer", background: '#fff' }}>
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Rate Limiting & Throttling */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.text }}>
                    Send throttling / Rate limits
                  </div>
                  <div style={{ fontSize:11, color:T.subtle }}>
                    Prevent spam triggers by pacing WhatsApp message dispatch rates.
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700, color:T.green }}>{form.sendRate}</div>
                  <div style={{ fontSize:10, color:T.subtle }}>messages / min</div>
                </div>
              </div>

              <input type="range" min="1" max="60" value={form.sendRate}
                onChange={e => setForm(f => ({ ...f, sendRate: Number(e.target.value) }))}
                style={{ width:"100%", accentColor:T.green, marginBottom:10 }} />

              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.subtle }}>
                <span>1 message/min (sparks no spam warnings)</span>
                <span>60 messages/min (maximum limit)</span>
              </div>
            </div>

            {/* Step 4 Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingBottom: 40 }}>
              <button onClick={() => setStep(3)} style={{ padding: '12px 24px', borderRadius: 8, background: '#fff', border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500, color: T.text, cursor: 'pointer' }}>← Back</button>
              <div style={{ fontSize: 14, color: T.subtle }}>Step 4 of 5</div>
              <button 
                onClick={() => setStep(5)} 
                disabled={!canNext()} 
                style={{ padding: '12px 24px', borderRadius: 8, background: canNext() ? '#2563EB' : '#E2E8F0', color: canNext() ? '#fff' : '#94A3B8', border: 'none', fontSize: 14, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                Continue <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: REVIEW & LAUNCH ── */}
        {step === 5 && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth: 700, margin: '0 auto' }}>
            
            {/* Audit Checklist Card */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"24px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16 }}>
                Pre-launch validation checklist
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: "Campaign Name Unique check", status: !nameExists ? "pass" : "fail", desc: "No overlapping campaign names in active space" },
                  { label: "Audience Target selected", status: (form.targetGroups.length + form.targetTags.length + form.targetContacts.length > 0) ? "pass" : "fail", desc: `${estimation.totalRecipients} unique recipients targeted` },
                  { label: "Meta Approved Template", status: selectedTemplate ? "pass" : "fail", desc: `Selected: ${selectedTemplate?.name}` },
                  { label: "Spam Throttling limit set", status: form.sendRate <= 45 ? "pass" : "warning", desc: `Send rate configured to: ${form.sendRate} msgs/min` },
                ].map(chk => (
                  <div key={chk.label} style={{ display: 'flex', gap: 12, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
                    <span style={{ fontSize: 14 }}>
                      {chk.status === "pass" ? "✅" : chk.status === "warning" ? "⚠️" : "❌"}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{chk.label}</div>
                      <div style={{ fontSize: 11, color: T.subtle }}>{chk.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Cost Summary Card */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden" }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, background:T.bg }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Final broadcast spec summary</div>
              </div>
              <div style={{ padding:"16px 18px" }}>
                {[
                  ["Campaign name", form.name],
                  ["Template",      selectedTemplate?.name || "—"],
                  ["Targeted contacts", `${estimation.totalRecipients.toLocaleString()} unique opted-in`],
                  ["Excluded contacts", `${estimation.optedOutExcluded.toLocaleString()}`],
                  ["Send rate",     `${form.sendRate} messages / minute`],
                  ["Schedule",      form.scheduleNow ? "Send Immediately" : `Scheduled at ${form.scheduleDate} ${form.scheduleTime} (${form.timezone})`],
                  ["Total estimated cost", `₹${(estimation.totalRecipients * 1.20).toFixed(2)}`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between",
                    padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:12, color:T.muted }}>{label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch actions */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, paddingBottom: 40 }}>
              {launchError && (
                <div style={{ color:T.red, fontSize: 13, marginBottom:4 }}>⚠️ {launchError}</div>
              )}
              {isAgent && estimation.totalRecipients > 100 && (
                <div style={{ color:T.red, fontSize: 12, marginBottom:4, fontWeight:600 }}>⚠️ Restricted: Agents cannot launch blasts exceeding 100 contacts.</div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(4)} style={{ padding: '12px 24px', borderRadius: 8, background: '#fff', border: `1px solid ${T.border}`, fontSize: 14, fontWeight: 500, color: T.text, cursor: 'pointer' }}>← Back</button>
                <button onClick={handleLaunch} disabled={launching || estimation.totalRecipients === 0 || (isAgent && estimation.totalRecipients > 100)}
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"12px 24px",
                    borderRadius:8, border:"none", background: (launching || estimation.totalRecipients === 0 || (isAgent && estimation.totalRecipients > 100)) ? T.border : T.green,
                    color:"#fff", fontSize:14, fontWeight:700, cursor: (launching || estimation.totalRecipients === 0 || (isAgent && estimation.totalRecipients > 100)) ? "not-allowed" : "pointer" }}>
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
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      {form.scheduleNow ? "Launch Campaign Now 🚀" : "Orchestrate Schedule ⏰"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3 — CAMPAIGN DETAIL (live stats)
───────────────────────────────────────────── */
function CampaignDetail({ campaign: initialCampaign, onBack }) {
  const { user } = useAuthStore();
  const isViewer = user?.role === 'viewer';

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
                disabled={isViewer}
                style={{ padding:"7px 13px", borderRadius:8,
                  border:`1px solid ${isViewer ? T.border : `${T.amber}30`}`,
                  background: isViewer ? T.border : T.amberLight,
                  fontSize:12, color: isViewer ? T.muted : T.amber,
                  fontWeight:600, cursor: isViewer ? "not-allowed" : "pointer" }}>
                ⏸ Pause
              </button>
            )}
            {campaign.status === "paused" && (
              <button onClick={() => setCampaign(c => ({ ...c, status:"running" }))}
                disabled={isViewer}
                style={{ padding:"7px 13px", borderRadius:8,
                  border:`1px solid ${isViewer ? T.border : `${T.green}30`}`,
                  background: isViewer ? T.border : T.greenLight,
                  fontSize:12, color: isViewer ? T.muted : T.greenDark,
                  fontWeight:600, cursor: isViewer ? "not-allowed" : "pointer" }}>
                ▶ Resume
              </button>
            )}
            {(isRunning || campaign.status === "paused") && (
              <button onClick={() => setConfirmCancel(true)}
                disabled={isViewer}
                style={{ padding:"7px 13px", borderRadius:8,
                  border:`1px solid ${isViewer ? T.border : `${T.red}30`}`,
                  background: isViewer ? T.border : T.redLight,
                  fontSize:12, color: isViewer ? T.muted : T.red,
                  fontWeight:600, cursor: isViewer ? "not-allowed" : "pointer" }}>
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
