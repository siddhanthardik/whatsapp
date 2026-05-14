import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const T = {
  bg:          "#F0F4F8",
  sidebar:     "#0C1628",
  card:        "#FFFFFF",
  green:       "#00A884",
  greenLight:  "#E6F7F2",
  greenDark:   "#007A61",
  blue:        "#2563EB",
  blueLight:   "#EFF6FF",
  amber:       "#D97706",
  amberLight:  "#FFFBEB",
  red:         "#DC2626",
  redLight:    "#FFF1F2",
  purple:      "#7C3AED",
  purpleLight: "#F5F3FF",
  teal:        "#0D9488",
  tealLight:   "#F0FDFA",
  text:        "#0F172A",
  muted:       "#64748B",
  subtle:      "#94A3B8",
  border:      "#E2E8F0",
  borderMid:   "#CBD5E1",
  font:        "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  mono:        "'DM Mono','SF Mono',monospace",
};

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const CAMPAIGNS_LIST = [
  "All campaigns",
  "Diwali Promo 2024",
  "October Newsletter",
  "Cart Abandonment Flow",
  "OTP Blast — March",
  "Customer Survey Q1",
  "Payment Reminder Batch",
  "Product Launch",
];

// 80 delivery records
const DELIVERY_RECORDS = (() => {
  const names = [
    "Priya Sharma","Rahul Verma","Ananya Gupta","Karan Malhotra","Sneha Patel",
    "Arjun Nair","Deepika Reddy","Vikram Joshi","Meera Krishnan","Rohan Bhatt",
    "Pooja Singh","Nikhil Agarwal","Tanvi Mehta","Suresh Yadav","Kavya Pillai",
    "Raj Chaudhary","Akash Dubey","Nisha Tiwari","Sanjay Kapoor","Ritu Sharma",
  ];
  const phones = [
    "+91 98765 43210","+91 87654 32109","+91 76543 21098","+91 65432 10987",
    "+91 54321 09876","+91 43210 98765","+91 32109 87654","+91 21098 76543",
    "+91 10987 65432","+91 99876 54321","+91 88765 43210","+91 77654 32109",
    "+91 66543 21098","+91 55432 10987","+91 44321 09876","+91 33210 98765",
    "+91 22109 87654","+91 11098 76543","+91 90987 65432","+91 89876 54321",
  ];
  const campaigns = [
    "Diwali Promo 2024","October Newsletter","Cart Abandonment Flow",
    "OTP Blast — March","Customer Survey Q1","Payment Reminder Batch",
  ];
  const templates = [
    "festival_promo_diwali","weekly_newsletter","cart_abandonment_v2",
    "otp_verification","monthly_update","payment_reminder",
  ];
  const statuses = ["read","read","read","delivered","delivered","sent","failed"];
  const errors = [null,null,null,null,"Template not approved","Contact opted out","Invalid phone number"];

  const records = [];
  for (let i = 0; i < 80; i++) {
    const ni = i % names.length;
    const ci = i % campaigns.length;
    const si = Math.floor(Math.random() * statuses.length);
    const status = statuses[si];
    const sentDate = new Date(2025, 2, 10 + (i % 13));
    const sentStr = sentDate.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })
      + " · " + (9 + (i % 8)) + ":" + String(i % 60).padStart(2,"0") + " AM";
    const delStr  = status !== "failed" && status !== "sent" ? sentStr.replace(/·.*$/, "· " + (9 + (i%8)) + ":" + String((i+1)%60).padStart(2,"0") + " AM") : null;
    const readStr = status === "read" ? sentStr.replace(/·.*$/, "· " + (10 + (i%5)) + ":" + String((i+12)%60).padStart(2,"0") + " AM") : null;

    records.push({
      id:        i + 1,
      name:      names[ni],
      phone:     phones[ni],
      campaign:  campaigns[ci],
      template:  templates[ci],
      status,
      sentAt:    sentStr,
      deliveredAt: delStr,
      readAt:    readStr,
      error:     status === "failed" ? errors[Math.floor(Math.random() * 3) + 4] : null,
      date:      sentDate,
    });
  }
  return records;
})();

// Opt-in / opt-out records
const OPT_IN_RECORDS = [
  { id:1,  name:"Priya Sharma",    phone:"+91 98765 43210", email:"priya@gmail.com",    source:"web_form",   optDate:"Mar 22, 2025", tags:["VIP","Delhi"],    msgs:24 },
  { id:2,  name:"Rahul Verma",     phone:"+91 87654 32109", email:"rahul@outlook.com",  source:"csv_import",  optDate:"Mar 20, 2025", tags:["Mumbai"],         msgs:11 },
  { id:3,  name:"Karan Malhotra",  phone:"+91 65432 10987", email:"karan@malhotra.in",  source:"api",         optDate:"Mar 18, 2025", tags:["VIP","Festival"], msgs:31 },
  { id:4,  name:"Sneha Patel",     phone:"+91 54321 09876", email:"sneha@patel.com",    source:"web_form",    optDate:"Mar 15, 2025", tags:["New User"],       msgs:7  },
  { id:5,  name:"Deepika Reddy",   phone:"+91 32109 87654", email:"deepika@reddy.com",  source:"csv_import",  optDate:"Mar 12, 2025", tags:["Premium"],        msgs:18 },
  { id:6,  name:"Vikram Joshi",    phone:"+91 21098 76543", email:"vikram@joshi.net",   source:"api",         optDate:"Mar 10, 2025", tags:["VIP","Mumbai"],   msgs:44 },
  { id:7,  name:"Pooja Singh",     phone:"+91 88765 43210", email:"pooja@singh.org",    source:"csv_import",  optDate:"Mar 8, 2025",  tags:["Festival"],       msgs:9  },
  { id:8,  name:"Rohan Bhatt",     phone:"+91 99876 54321", email:"rohan@bhatt.com",    source:"web_form",    optDate:"Mar 5, 2025",  tags:["New User"],       msgs:4  },
  { id:9,  name:"Tanvi Mehta",     phone:"+91 66543 21098", email:"tanvi@mehta.co",     source:"keyword",     optDate:"Mar 3, 2025",  tags:["Mumbai"],         msgs:6  },
  { id:10, name:"Suresh Yadav",    phone:"+91 55432 10987", email:"suresh@yadav.in",    source:"api",         optDate:"Feb 28, 2025", tags:["Wholesale"],      msgs:13 },
  { id:11, name:"Kavya Pillai",    phone:"+91 44321 09876", email:"kavya@pillai.com",   source:"web_form",    optDate:"Feb 25, 2025", tags:["Premium"],        msgs:8  },
  { id:12, name:"Raj Chaudhary",   phone:"+91 33210 98765", email:"raj@chaudhary.biz",  source:"csv_import",  optDate:"Feb 20, 2025", tags:["Delhi"],          msgs:21 },
];

const OPT_OUT_RECORDS = [
  { id:1,  name:"Ananya Gupta",    phone:"+91 76543 21098", email:"ananya@company.co",  reason:"STOP keyword",     source:"keyword",  optOutDate:"Mar 20, 2025", optInDate:"Oct 5, 2024",  msgs:3  },
  { id:2,  name:"Meera Krishnan",  phone:"+91 10987 65432", email:"meera@krishnan.in",  reason:"UNSUBSCRIBE reply", source:"keyword",  optOutDate:"Mar 15, 2025", optInDate:"Aug 14, 2024", msgs:2  },
  { id:3,  name:"Arjun Nair",      phone:"+91 43210 98765", email:"arjun@nair.co.in",   reason:"Manual opt-out",    source:"manual",   optOutDate:"Mar 12, 2025", optInDate:"Mar 1, 2025",  msgs:0  },
  { id:4,  name:"Ritu Sharma",     phone:"+91 89876 54321", email:"ritu@sharma.com",    reason:"STOP keyword",     source:"keyword",  optOutDate:"Mar 10, 2025", optInDate:"Jan 8, 2025",  msgs:7  },
  { id:5,  name:"Sanjay Kapoor",   phone:"+91 22109 87654", email:"sanjay@kapoor.net",  reason:"Delivery failure",  source:"system",   optOutDate:"Mar 8, 2025",  optInDate:"Feb 3, 2025",  msgs:1  },
  { id:6,  name:"Akash Dubey",     phone:"+91 90987 65432", email:"akash@dubey.com",    reason:"CANCEL keyword",   source:"keyword",  optOutDate:"Mar 5, 2025",  optInDate:"Dec 12, 2024", msgs:5  },
  { id:7,  name:"Nisha Tiwari",    phone:"+91 11098 76543", email:"nisha@tiwari.in",    reason:"Manual opt-out",    source:"manual",   optOutDate:"Feb 28, 2025", optInDate:"Nov 22, 2024", msgs:4  },
  { id:8,  name:"Nikhil Agarwal",  phone:"+91 77654 32109", email:"nikhil@agarwal.biz", reason:"STOP keyword",     source:"keyword",  optOutDate:"Feb 20, 2025", optInDate:"Feb 12, 2025", msgs:2  },
];

/* ─────────────────────────────────────────────
   SHARED ATOMS
───────────────────────────────────────────── */
const MSG_STATUS_CFG = {
  read:      { label:"Read",      bg:"#DCFCE7", color:"#166534", dot:"#22C55E" },
  delivered: { label:"Delivered", bg:"#EFF6FF", color:"#1E40AF", dot:"#3B82F6" },
  sent:      { label:"Sent",      bg:"#F1F5F9", color:"#475569", dot:"#94A3B8" },
  failed:    { label:"Failed",    bg:"#FEE2E2", color:"#7F1D1D", dot:"#EF4444" },
};

const SOURCE_CFG = {
  web_form:   { label:"Web form",   bg:"#EFF6FF", color:"#1D4ED8" },
  csv_import: { label:"CSV import", bg:"#F5F3FF", color:"#5B21B6" },
  api:        { label:"API",        bg:"#ECFDF5", color:"#065F46" },
  keyword:    { label:"Keyword",    bg:"#FEF3C7", color:"#92400E" },
  system:     { label:"System",     bg:"#FEE2E2", color:"#7F1D1D" },
  manual:     { label:"Manual",     bg:"#F1F5F9", color:"#374151" },
};

const TAG_COLORS = {
  VIP:       { bg:"#FEF3C7", color:"#92400E" },
  Delhi:     { bg:"#EFF6FF", color:"#1D4ED8" },
  Mumbai:    { bg:"#F0FDF4", color:"#166534" },
  Premium:   { bg:"#F5F3FF", color:"#5B21B6" },
  "New User":{ bg:"#FFF7ED", color:"#9A3412" },
  Festival:  { bg:"#FDF2F8", color:"#9D174D" },
  Wholesale: { bg:"#ECFDF5", color:"#065F46" },
};

function MsgBadge({ status }) {
  const c = MSG_STATUS_CFG[status] || MSG_STATUS_CFG.sent;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
      padding:"2px 8px", borderRadius:20, background:c.bg, color:c.color,
      fontSize:10, fontWeight:700, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot }} />
      {c.label}
    </span>
  );
}

function SourceBadge({ source }) {
  const c = SOURCE_CFG[source] || SOURCE_CFG.manual;
  return (
    <span style={{ padding:"2px 8px", borderRadius:20, background:c.bg,
      color:c.color, fontSize:10, fontWeight:600, whiteSpace:"nowrap" }}>
      {c.label}
    </span>
  );
}

function Tag({ label }) {
  const c = TAG_COLORS[label] || { bg:T.border, color:T.muted };
  return (
    <span style={{ padding:"2px 7px", borderRadius:20, fontSize:9,
      fontWeight:600, background:c.bg, color:c.color, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function Avatar({ name, size = 30 }) {
  const colors = ["#00A884","#2563EB","#7C3AED","#D97706","#0D9488","#DB2777","#EA580C"];
  let h = 0; for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  const bg = colors[Math.abs(h) % colors.length];
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size * 0.35, fontWeight:700, color:"#fff" }}>
      {initials}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
const NAV = ["Dashboard","Contacts","Templates","Campaigns","Analytics","Reports","Opt-In / Out"];

function Sidebar({ activeView }) {
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
          const active = label === "Reports" || label === "Opt-In / Out";
          const current = (label === "Reports" && activeView === "delivery") ||
                          (label === "Opt-In / Out" && activeView === "optinout");
          return (
            <div key={label} style={{ padding:"8px 10px", borderRadius:7, marginBottom:2,
              fontSize:12, fontWeight: current ? 600 : 400,
              color: current ? "#fff" : "#94A3B8",
              background: current ? T.green : "transparent", cursor:"pointer" }}>
              {label}
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

/* ─────────────────────────────────────────────
   EXPORT BUTTON
───────────────────────────────────────────── */
function ExportButton({ onCSV, onPDF, exporting }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px",
          borderRadius:8, border:`1px solid ${T.border}`, background:T.card,
          fontSize:12, color:T.text, cursor:"pointer", fontWeight:500 }}>
        {exporting ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            style={{ animation:"spin .8s linear infinite" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        )}
        Export
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:50,
          background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,.10)", minWidth:180, overflow:"hidden" }}>
          {[
            { label:"Export as CSV",  sub:"Spreadsheet file",  icon:"📊", fn:onCSV  },
            { label:"Export as PDF",  sub:"Formatted report",  icon:"📄", fn:onPDF  },
          ].map(opt => (
            <button key={opt.label} onClick={() => { opt.fn?.(); setOpen(false); }}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"10px 14px", border:"none", background:"transparent",
                cursor:"pointer", textAlign:"left" }}
              onMouseEnter={e => e.currentTarget.style.background = T.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize:16 }}>{opt.icon}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{opt.label}</div>
                <div style={{ fontSize:10, color:T.subtle }}>{opt.sub}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, title, msg, label = "Confirm", danger = false }) {
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
          <button onClick={onClose}
            style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ padding:"8px 16px", borderRadius:8, border:"none",
              background: danger ? T.red : T.amber,
              color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
            {label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1 — DELIVERY REPORT
───────────────────────────────────────────── */
function DeliveryReport() {
  const [campaignFilter, setCampaignFilter] = useState("All campaigns");
  const [statusFilter,   setStatusFilter]   = useState("all");
  const [search,         setSearch]         = useState("");
  const [dateFrom,       setDateFrom]       = useState("");
  const [dateTo,         setDateTo]         = useState("");
  const [page,           setPage]           = useState(1);
  const [sortBy,         setSortBy]         = useState("date");
  const [sortDir,        setSortDir]        = useState("desc");
  const [exporting,      setExporting]      = useState(false);
  const [exportToast,    setExportToast]    = useState(null);
  const [hoverRow,       setHoverRow]       = useState(null);
  const PER_PAGE = 12;

  const handleExport = (type) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExportToast(`Report exported as ${type.toUpperCase()} successfully`);
      setTimeout(() => setExportToast(null), 3000);
    }, 1400);
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const filtered = DELIVERY_RECORDS.filter(r => {
    const q = search.toLowerCase();
    const ms = !search || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.campaign.toLowerCase().includes(q);
    const cs = campaignFilter === "All campaigns" || r.campaign === campaignFilter;
    const ss = statusFilter === "all" || r.status === statusFilter;
    return ms && cs && ss;
  }).sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "name") return a.name.localeCompare(b.name) * dir;
    if (sortBy === "status") return a.status.localeCompare(b.status) * dir;
    return (b.date - a.date) * dir;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  // Summary stats
  const totals = {
    sent:      filtered.length,
    delivered: filtered.filter(r => ["delivered","read"].includes(r.status)).length,
    read:      filtered.filter(r => r.status === "read").length,
    failed:    filtered.filter(r => r.status === "failed").length,
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <span style={{ color:T.border, fontSize:10 }}>⇅</span>;
    return <span style={{ color:T.green, fontSize:10 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

      {/* TOPBAR */}
      <div style={{ height:56, background:T.card, borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", padding:"0 20px", gap:12,
        position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>
            Delivery Report
          </div>
          <div style={{ fontSize:10, color:T.subtle }}>
            Message-level delivery status across all campaigns
          </div>
        </div>
        <ExportButton
          onCSV={() => handleExport("csv")}
          onPDF={() => handleExport("pdf")}
          exporting={exporting}
        />
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

        {/* SUMMARY STAT PILLS */}
        <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
          {[
            { key:"all",       label:"Total",     val:totals.sent,      color:T.blue   },
            { key:"read",      label:"Read",      val:totals.read,      color:T.green  },
            { key:"delivered", label:"Delivered", val:totals.delivered, color:T.teal   },
            { key:"sent",      label:"Sent",      val:filtered.filter(r=>r.status==="sent").length, color:T.muted },
            { key:"failed",    label:"Failed",    val:totals.failed,    color:T.red    },
          ].map(s => (
            <button key={s.key} onClick={() => { setStatusFilter(s.key); setPage(1); }}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 13px",
                borderRadius:9, cursor:"pointer", transition:"all .15s",
                border:`1.5px solid ${statusFilter === s.key ? s.color : T.border}`,
                background: statusFilter === s.key ? `${s.color}14` : T.card }}>
              <span style={{ fontFamily:T.mono, fontSize:18, fontWeight:700,
                color: statusFilter === s.key ? s.color : T.text }}>{s.val}</span>
              <span style={{ fontSize:11,
                color: statusFilter === s.key ? s.color : T.muted }}>{s.label}</span>
            </button>
          ))}

          {/* Delivery rate pill */}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8,
            padding:"7px 14px", borderRadius:9, background:T.greenLight,
            border:`1px solid #6EE7B7` }}>
            <span style={{ fontSize:11, color:T.greenDark }}>Delivery rate</span>
            <span style={{ fontFamily:T.mono, fontSize:15, fontWeight:700, color:T.green }}>
              {totals.sent > 0 ? ((totals.delivered / totals.sent) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          {/* Search */}
          <div style={{ flex:1, minWidth:200, display:"flex", alignItems:"center", gap:8,
            background:T.card, borderRadius:8, padding:"7px 12px",
            border:`1px solid ${T.border}` }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke={T.subtle} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, phone or campaign…"
              style={{ border:"none", background:"transparent", outline:"none",
                fontSize:12, color:T.text, width:"100%", fontFamily:T.font }} />
          </div>

          {/* Campaign */}
          <select value={campaignFilter}
            onChange={e => { setCampaignFilter(e.target.value); setPage(1); }}
            style={{ padding:"7px 11px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:12,
              color: campaignFilter !== "All campaigns" ? T.text : T.muted,
              fontFamily:T.font, outline:"none", cursor:"pointer",
              fontWeight: campaignFilter !== "All campaigns" ? 600 : 400 }}>
            {CAMPAIGNS_LIST.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Date from */}
          <input type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ padding:"7px 11px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:12, color: dateFrom ? T.text : T.subtle,
              fontFamily:T.font, outline:"none" }} />

          {/* Date to */}
          <input type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ padding:"7px 11px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:12, color: dateTo ? T.text : T.subtle,
              fontFamily:T.font, outline:"none" }} />

          {/* Clear */}
          {(search || campaignFilter !== "All campaigns" || dateFrom || dateTo || statusFilter !== "all") && (
            <button onClick={() => {
              setSearch(""); setCampaignFilter("All campaigns");
              setDateFrom(""); setDateTo(""); setStatusFilter("all"); setPage(1);
            }} style={{ padding:"7px 12px", borderRadius:8,
              border:`1px solid ${T.border}`, background:T.card,
              fontSize:12, color:T.muted, cursor:"pointer" }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* TABLE */}
        <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
          overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:T.bg }}>
                {[
                  { key:"name",   label:"Contact",   sortable:true },
                  { key:"campaign",label:"Campaign",  sortable:false},
                  { key:"status", label:"Status",    sortable:true },
                  { key:"date",   label:"Sent at",   sortable:true },
                  { key:null,     label:"Delivered",  sortable:false},
                  { key:null,     label:"Read",       sortable:false},
                  { key:null,     label:"Error",      sortable:false},
                ].map(h => (
                  <th key={h.label}
                    onClick={h.sortable ? () => handleSort(h.key) : undefined}
                    style={{ padding:"10px 14px", textAlign:"left", fontSize:9,
                      fontWeight:700, color:T.muted, letterSpacing:"0.06em",
                      textTransform:"uppercase", borderBottom:`1px solid ${T.border}`,
                      whiteSpace:"nowrap",
                      cursor: h.sortable ? "pointer" : "default",
                      userSelect:"none" }}>
                    <div style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                      {h.label}
                      {h.sortable && <SortIcon col={h.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((r, i) => (
                <tr key={r.id}
                  onMouseEnter={() => setHoverRow(r.id)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{ background: hoverRow === r.id ? T.bg : T.card,
                    borderBottom: i < paged.length - 1 ? `1px solid ${T.border}` : "none",
                    transition:"background .1s" }}>

                  {/* Contact */}
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <Avatar name={r.name} size={28} />
                      <div>
                        <div style={{ fontWeight:600, color:T.text, fontSize:12,
                          whiteSpace:"nowrap" }}>{r.name}</div>
                        <div style={{ fontSize:10, color:T.subtle,
                          fontFamily:T.mono }}>{r.phone}</div>
                      </div>
                    </div>
                  </td>

                  {/* Campaign */}
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ fontSize:12, color:T.text, whiteSpace:"nowrap",
                      maxWidth:160, overflow:"hidden", textOverflow:"ellipsis" }}>
                      {r.campaign}
                    </div>
                    <div style={{ fontSize:10, color:T.subtle, fontFamily:T.mono }}>
                      {r.template}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding:"12px 14px" }}>
                    <MsgBadge status={r.status} />
                  </td>

                  {/* Sent at */}
                  <td style={{ padding:"12px 14px", fontSize:11, color:T.muted,
                    whiteSpace:"nowrap" }}>
                    {r.sentAt}
                  </td>

                  {/* Delivered */}
                  <td style={{ padding:"12px 14px", fontSize:11, color:T.muted,
                    whiteSpace:"nowrap" }}>
                    {r.deliveredAt
                      ? r.deliveredAt.split("·").pop().trim()
                      : <span style={{ color:T.border }}>—</span>}
                  </td>

                  {/* Read */}
                  <td style={{ padding:"12px 14px", fontSize:11, color:T.muted,
                    whiteSpace:"nowrap" }}>
                    {r.readAt
                      ? r.readAt.split("·").pop().trim()
                      : <span style={{ color:T.border }}>—</span>}
                  </td>

                  {/* Error */}
                  <td style={{ padding:"12px 14px" }}>
                    {r.error
                      ? <span style={{ fontSize:10, color:T.red, background:T.redLight,
                          padding:"2px 8px", borderRadius:20 }}>{r.error}</span>
                      : <span style={{ color:T.border }}>—</span>}
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding:"48px", textAlign:"center",
                    color:T.subtle, fontSize:13 }}>
                    No messages match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ padding:"10px 16px", borderTop:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background:T.bg }}>
            <span style={{ fontSize:11, color:T.muted }}>
              Showing{" "}
              <strong style={{ color:T.text }}>
                {Math.min((page-1)*PER_PAGE + 1, filtered.length)}–
                {Math.min(page*PER_PAGE, filtered.length)}
              </strong>
              {" "}of{" "}
              <strong style={{ color:T.text }}>{filtered.length}</strong>
              {" "}messages
            </span>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.border}`,
                  background:T.card, cursor: page===1 ? "default" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: page===1 ? T.border : T.muted, fontSize:16,
                  opacity: page===1 ? .5 : 1 }}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) n = i + 1;
                  else if (page >= totalPages - 2) n = totalPages - 4 + i;
                  else n = page - 2 + i;
                }
                return (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ width:30, height:30, borderRadius:7,
                      border:`1px solid ${n === page ? T.green : T.border}`,
                      background: n === page ? T.green : T.card,
                      color: n === page ? "#fff" : T.muted,
                      fontSize:12, fontWeight: n === page ? 700 : 400, cursor:"pointer" }}>
                    {n}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.border}`,
                  background:T.card, cursor: page===totalPages ? "default" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: page===totalPages ? T.border : T.muted, fontSize:16,
                  opacity: page===totalPages ? .5 : 1 }}>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT TOAST */}
      {exportToast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999,
          display:"flex", alignItems:"center", gap:10, padding:"12px 18px",
          background:"#0F172A", borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,.3)", color:"#fff",
          fontSize:13, fontWeight:500,
          animation:"slideIn .3s ease" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
            stroke={T.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {exportToast}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2 — OPT-IN / OPT-OUT MANAGER
───────────────────────────────────────────── */
function OptInOutManager() {
  const [tab,            setTab]            = useState("opted_in");
  const [search,         setSearch]         = useState("");
  const [sourceFilter,   setSourceFilter]   = useState("all");
  const [exporting,      setExporting]      = useState(false);
  const [exportToast,    setExportToast]    = useState(null);
  const [confirmOptOut,  setConfirmOptOut]  = useState(null);
  const [confirmReOptIn, setConfirmReOptIn] = useState(null);
  const [hoverRow,       setHoverRow]       = useState(null);
  const [optOutData,     setOptOutData]     = useState(OPT_OUT_RECORDS);
  const [optInData,      setOptInData]      = useState(OPT_IN_RECORDS);
  const [addManualOpen,  setAddManualOpen]  = useState(false);
  const [manualPhone,    setManualPhone]    = useState("");
  const [manualReason,   setManualReason]   = useState("");

  const handleExport = (type) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExportToast(`Opt-${tab === "opted_in" ? "in" : "out"} list exported as ${type.toUpperCase()}`);
      setTimeout(() => setExportToast(null), 3000);
    }, 1200);
  };

  const doOptOut = (contact) => {
    setOptInData(d => d.filter(r => r.id !== contact.id));
    setOptOutData(d => [{
      id: Date.now(), name: contact.name, phone: contact.phone,
      email: contact.email, reason: manualReason || "Manual opt-out",
      source: "manual", optOutDate: "Mar 22, 2025",
      optInDate: contact.optDate, msgs: contact.msgs,
    }, ...d]);
    setConfirmOptOut(null);
    setManualReason("");
    setExportToast(`${contact.name} has been opted out`);
    setTimeout(() => setExportToast(null), 3000);
  };

  const doReOptIn = (contact) => {
    setOptOutData(d => d.filter(r => r.id !== contact.id));
    setOptInData(d => [{
      id: Date.now(), name: contact.name, phone: contact.phone,
      email: contact.email, source: "manual",
      optDate: "Mar 22, 2025", tags: [], msgs: contact.msgs,
    }, ...d]);
    setConfirmReOptIn(null);
    setExportToast(`${contact.name} has been re-opted in`);
    setTimeout(() => setExportToast(null), 3000);
  };

  const filteredIn = optInData.filter(r => {
    const q = search.toLowerCase();
    const ms = !search || r.name.toLowerCase().includes(q) || r.phone.includes(q);
    const ss = sourceFilter === "all" || r.source === sourceFilter;
    return ms && ss;
  });

  const filteredOut = optOutData.filter(r => {
    const q = search.toLowerCase();
    const ms = !search || r.name.toLowerCase().includes(q) || r.phone.includes(q);
    const ss = sourceFilter === "all" || r.source === sourceFilter;
    return ms && ss;
  });

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden" }}>

      {/* TOPBAR */}
      <div style={{ height:56, background:T.card, borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", padding:"0 20px", gap:12,
        position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>
            Opt-In / Opt-Out Manager
          </div>
          <div style={{ fontSize:10, color:T.subtle }}>
            Manage contact subscription status and compliance
          </div>
        </div>
        <ExportButton
          onCSV={() => handleExport("csv")}
          onPDF={() => handleExport("pdf")}
          exporting={exporting} />
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

        {/* SUMMARY CARDS */}
        <div style={{ display:"flex", gap:12, marginBottom:18 }}>
          {[
            { label:"Opted in",         val:optInData.length,  color:T.green,  icon:"✓",
              sub:`${((optInData.length/(optInData.length+optOutData.length))*100).toFixed(1)}% of total` },
            { label:"Opted out",        val:optOutData.length, color:T.red,    icon:"✕",
              sub:"Will not receive messages" },
            { label:"Net growth (30d)", val:`+${optInData.length - optOutData.length}`, color:T.teal, icon:"↑",
              sub:"Opt-ins minus opt-outs" },
            { label:"Opt-out rate",
              val:`${((optOutData.length/(optInData.length+optOutData.length))*100).toFixed(1)}%`,
              color:T.amber, icon:"⚠",
              sub:"Industry avg: < 2%" },
          ].map(s => (
            <div key={s.label} style={{ flex:1, background:T.card, borderRadius:11,
              padding:"14px 16px", border:`1px solid ${T.border}`,
              borderTop:`3px solid ${s.color}` }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:700, color:T.muted,
                  textTransform:"uppercase", letterSpacing:"0.06em" }}>{s.label}</span>
                <div style={{ width:28, height:28, borderRadius:7,
                  background:`${s.color}18`, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  color:s.color, fontSize:14, fontWeight:700 }}>{s.icon}</div>
              </div>
              <div style={{ fontFamily:T.mono, fontSize:24, fontWeight:700,
                color:s.color, letterSpacing:"-0.02em", lineHeight:1,
                marginBottom:5 }}>{s.val}</div>
              <div style={{ fontSize:11, color:T.subtle }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* TABS + FILTERS */}
        <div style={{ display:"flex", gap:10, marginBottom:14,
          alignItems:"center", flexWrap:"wrap" }}>
          {/* Tabs */}
          <div style={{ display:"flex", background:T.card, borderRadius:10,
            padding:4, border:`1px solid ${T.border}`, gap:0 }}>
            {[
              { key:"opted_in",  label:`Opted in (${optInData.length})`  },
              { key:"opted_out", label:`Opted out (${optOutData.length})` },
            ].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setSearch(""); setSourceFilter("all"); }}
                style={{ padding:"7px 16px", borderRadius:7, border:"none",
                  cursor:"pointer", fontSize:12, fontWeight: tab===t.key ? 700 : 400,
                  background: tab===t.key ? T.green : "transparent",
                  color: tab===t.key ? "#fff" : T.muted, transition:"all .15s" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex:1, minWidth:160, display:"flex", alignItems:"center", gap:7,
            background:T.card, borderRadius:8, padding:"7px 11px",
            border:`1px solid ${T.border}` }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
              stroke={T.subtle} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              style={{ border:"none", background:"transparent", outline:"none",
                fontSize:12, color:T.text, width:"100%", fontFamily:T.font }} />
          </div>

          {/* Source filter */}
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
            style={{ padding:"7px 11px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:12, color: sourceFilter!=="all"?T.text:T.muted,
              fontFamily:T.font, outline:"none", cursor:"pointer",
              fontWeight: sourceFilter!=="all"?600:400 }}>
            <option value="all">All sources</option>
            <option value="web_form">Web form</option>
            <option value="csv_import">CSV import</option>
            <option value="api">API</option>
            <option value="keyword">Keyword</option>
            <option value="manual">Manual</option>
            <option value="system">System</option>
          </select>

          {/* Manual opt-out button */}
          {tab === "opted_in" && (
            <button onClick={() => setAddManualOpen(true)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px",
                borderRadius:8, border:`1px solid ${T.red}30`,
                background:T.redLight, fontSize:12, color:T.red,
                fontWeight:600, cursor:"pointer" }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Manual opt-out
            </button>
          )}
        </div>

        {/* ── OPTED-IN TABLE ── */}
        {tab === "opted_in" && (
          <div style={{ background:T.card, borderRadius:12,
            border:`1px solid ${T.border}`, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`,
              background:T.bg, display:"flex", alignItems:"center",
              justifyContent:"space-between" }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.text }}>
                Opted-in contacts
              </div>
              <span style={{ fontSize:11, color:T.subtle }}>
                {filteredIn.length} contacts · eligible to receive messages
              </span>
            </div>

            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg }}>
                  {["Contact","Tags","Source","Opted in","Messages sent","Action"].map(h => (
                    <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:9,
                      fontWeight:700, color:T.muted, letterSpacing:"0.06em",
                      textTransform:"uppercase", borderBottom:`1px solid ${T.border}`,
                      whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIn.map((r, i) => (
                  <tr key={r.id}
                    onMouseEnter={() => setHoverRow(`in-${r.id}`)}
                    onMouseLeave={() => setHoverRow(null)}
                    style={{ background: hoverRow===`in-${r.id}` ? T.bg : T.card,
                      borderBottom: i < filteredIn.length-1 ? `1px solid ${T.border}` : "none",
                      transition:"background .1s" }}>

                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <Avatar name={r.name} size={30} />
                        <div>
                          <div style={{ fontWeight:600, color:T.text, fontSize:12 }}>{r.name}</div>
                          <div style={{ fontSize:10, color:T.subtle, fontFamily:T.mono }}>{r.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {(r.tags || []).slice(0,2).map(t => <Tag key={t} label={t} />)}
                        {(r.tags || []).length > 2 && (
                          <span style={{ fontSize:9, color:T.subtle }}>
                            +{r.tags.length - 2}
                          </span>
                        )}
                        {(!r.tags || r.tags.length === 0) && (
                          <span style={{ fontSize:10, color:T.border }}>—</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <SourceBadge source={r.source} />
                    </td>

                    <td style={{ padding:"12px 14px", fontSize:11, color:T.muted,
                      whiteSpace:"nowrap" }}>{r.optDate}</td>

                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontFamily:T.mono, fontWeight:700, color:T.blue,
                          fontSize:13 }}>{r.msgs}</span>
                        <div style={{ height:4, width:40, background:T.border,
                          borderRadius:99, overflow:"hidden" }}>
                          <div style={{ width:`${Math.min(100, r.msgs / 50 * 100)}%`,
                            height:"100%", background:T.blue, borderRadius:99 }}/>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <button onClick={() => setConfirmOptOut(r)}
                        style={{ padding:"4px 10px", borderRadius:7,
                          border:`1px solid ${T.red}30`, background:T.redLight,
                          fontSize:11, color:T.red, fontWeight:600, cursor:"pointer" }}>
                        Opt out
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredIn.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding:"40px", textAlign:"center",
                      color:T.subtle, fontSize:13 }}>
                      No opted-in contacts match your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── OPTED-OUT TABLE ── */}
        {tab === "opted_out" && (
          <div style={{ background:T.card, borderRadius:12,
            border:`1px solid ${T.border}`, overflow:"hidden" }}>
            <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`,
              background:"#FFF5F5", display:"flex", alignItems:"center",
              justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:T.text }}>
                  Opted-out contacts
                </div>
                <div style={{ fontSize:10, color:T.subtle, marginTop:1 }}>
                  These contacts will not receive any messages until they re-opt-in
                </div>
              </div>
              <div style={{ padding:"4px 10px", borderRadius:20, background:T.redLight,
                border:`1px solid #FECACA`, fontSize:11, fontWeight:700, color:T.red }}>
                {filteredOut.length} blocked
              </div>
            </div>

            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:T.bg }}>
                  {["Contact","Reason","Source","Opted out","Previously sent","Action"].map(h => (
                    <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:9,
                      fontWeight:700, color:T.muted, letterSpacing:"0.06em",
                      textTransform:"uppercase", borderBottom:`1px solid ${T.border}`,
                      whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOut.map((r, i) => (
                  <tr key={r.id}
                    onMouseEnter={() => setHoverRow(`out-${r.id}`)}
                    onMouseLeave={() => setHoverRow(null)}
                    style={{ background: hoverRow===`out-${r.id}` ? "#FFF5F5" : T.card,
                      borderBottom: i < filteredOut.length-1 ? `1px solid ${T.border}` : "none",
                      transition:"background .1s" }}>

                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <div style={{ position:"relative" }}>
                          <Avatar name={r.name} size={30} />
                          {/* Red blocked indicator */}
                          <div style={{ position:"absolute", bottom:-2, right:-2,
                            width:12, height:12, borderRadius:"50%", background:T.red,
                            border:"2px solid #fff", display:"flex", alignItems:"center",
                            justifyContent:"center", fontSize:7, color:"#fff", fontWeight:900 }}>
                            ✕
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight:600, color:T.text, fontSize:12 }}>{r.name}</div>
                          <div style={{ fontSize:10, color:T.subtle, fontFamily:T.mono }}>{r.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontSize:11, color:T.muted,
                        padding:"2px 8px", borderRadius:20, background:T.redLight,
                        border:`1px solid #FECACA` }}>
                        {r.reason}
                      </span>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <SourceBadge source={r.source} />
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ fontSize:11, color:T.text }}>{r.optOutDate}</div>
                      <div style={{ fontSize:9, color:T.subtle }}>opted in: {r.optInDate}</div>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ fontFamily:T.mono, fontWeight:700,
                        color:T.muted, fontSize:12 }}>{r.msgs}</span>
                    </td>

                    <td style={{ padding:"12px 14px" }}>
                      <button onClick={() => setConfirmReOptIn(r)}
                        style={{ padding:"4px 10px", borderRadius:7,
                          border:`1px solid ${T.green}30`, background:T.greenLight,
                          fontSize:11, color:T.greenDark, fontWeight:600, cursor:"pointer" }}>
                        Re-opt in
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOut.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding:"40px", textAlign:"center",
                      color:T.subtle, fontSize:13 }}>
                      No opted-out contacts match your search
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* COMPLIANCE NOTE */}
        <div style={{ marginTop:14, padding:"12px 16px", background:T.amberLight,
          borderRadius:9, border:`1px solid #FCD34D`,
          display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.amber, marginBottom:3 }}>
              Compliance reminder
            </div>
            <div style={{ fontSize:11, color:"#78350F", lineHeight:1.6 }}>
              Opted-out contacts are automatically excluded from all future campaigns.
              Re-opt-in is only permitted when the contact initiates contact with your business number.
              Never manually re-opt-in a contact who has opted out via keyword.
            </div>
          </div>
        </div>
      </div>

      {/* MANUAL OPT-OUT MODAL */}
      {addManualOpen && (
        <div onClick={() => setAddManualOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(15,23,42,.55)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:T.card, borderRadius:14, width:420, padding:"24px",
              boxShadow:"0 24px 64px rgba(0,0,0,.25)" }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:4 }}>
              Manual opt-out
            </div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:20 }}>
              Enter the phone number of the contact you want to opt out manually.
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:600,
                color:T.muted, marginBottom:5 }}>Phone number</label>
              <input value={manualPhone} onChange={e => setManualPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8,
                  border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font,
                  outline:"none" }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:600,
                color:T.muted, marginBottom:5 }}>Reason (optional)</label>
              <select value={manualReason} onChange={e => setManualReason(e.target.value)}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8,
                  border:`1px solid ${T.border}`, fontSize:13, fontFamily:T.font,
                  outline:"none", cursor:"pointer", background:T.card }}>
                <option value="">Select a reason…</option>
                <option value="Customer request">Customer request</option>
                <option value="Spam complaint">Spam complaint</option>
                <option value="Delivery failure">Delivery failure</option>
                <option value="Data cleanup">Data cleanup</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setAddManualOpen(false)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`,
                  background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>
                Cancel
              </button>
              <button onClick={() => {
                setAddManualOpen(false);
                setExportToast(`${manualPhone} has been opted out`);
                setManualPhone(""); setManualReason("");
                setTimeout(() => setExportToast(null), 3000);
              }} style={{ padding:"8px 16px", borderRadius:8, border:"none",
                background:T.red, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
                Opt Out Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM OPT-OUT */}
      <ConfirmModal
        open={!!confirmOptOut} onClose={() => setConfirmOptOut(null)}
        onConfirm={() => doOptOut(confirmOptOut)}
        title={`Opt out ${confirmOptOut?.name}?`}
        msg="This contact will be immediately blocked from all future campaigns. They can only re-opt-in by messaging your WhatsApp number directly."
        label="Opt Out" danger />

      {/* CONFIRM RE-OPT-IN */}
      <ConfirmModal
        open={!!confirmReOptIn} onClose={() => setConfirmReOptIn(null)}
        onConfirm={() => doReOptIn(confirmReOptIn)}
        title={`Re-opt in ${confirmReOptIn?.name}?`}
        msg="Only re-opt-in this contact if they have messaged your WhatsApp business number directly and given consent. This is required for GDPR compliance."
        label="Re-Opt In" />

      {/* EXPORT TOAST */}
      {exportToast && (
        <div style={{ position:"fixed", bottom:24, right:24, zIndex:999,
          display:"flex", alignItems:"center", gap:10, padding:"12px 18px",
          background:"#0F172A", borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,.3)", color:"#fff",
          fontSize:13, fontWeight:500 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24"
            stroke={T.green} strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {exportToast}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT — MODULE ROUTER
───────────────────────────────────────────── */
export default function ReportsModule() {
  const [view, setView] = useState("delivery"); // "delivery" | "optinout"

  return (
    <div style={{ fontFamily:T.font, display:"flex", minHeight:"100vh", background:T.bg }}>
      <style>{`
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
        input:focus, select:focus { outline:none; box-shadow:0 0 0 3px ${T.green}22; border-color:${T.green}!important; }
      `}</style>

      <Sidebar activeView={view} />

      {/* Sub-nav strip */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Sub nav */}
        <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`,
          padding:"0 20px", display:"flex", gap:0, flexShrink:0 }}>
          {[
            { key:"delivery",  label:"Delivery Report",      icon:"📋" },
            { key:"optinout",  label:"Opt-In / Out Manager", icon:"🔄" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"12px 16px", border:"none", background:"transparent",
                cursor:"pointer", fontSize:12, fontWeight: view===tab.key ? 700 : 400,
                color: view===tab.key ? T.green : T.muted,
                borderBottom: view===tab.key ? `2px solid ${T.green}` : "2px solid transparent",
                transition:"all .15s", whiteSpace:"nowrap" }}>
              <span style={{ fontSize:14 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {view === "delivery"  && <DeliveryReport />}
        {view === "optinout"  && <OptInOutManager />}
      </div>
    </div>
  );
}
