import React, { useState, useRef, useCallback, useEffect } from "react";
import { contactsAPI, contactGroupsAPI } from "../../services/api";
import { toast } from 'react-hot-toast';

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
  font:        "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:        "'DM Mono', 'SF Mono', monospace",
};

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const TAGS = ["VIP", "Delhi", "Mumbai", "Premium", "New User", "Inactive", "Festival", "Wholesale"];
const TAG_COLORS = {
  VIP:       { bg:"#FEF3C7", color:"#92400E" },
  Delhi:     { bg:"#EFF6FF", color:"#1D4ED8" },
  Mumbai:    { bg:"#F0FDF4", color:"#166534" },
  Premium:   { bg:"#F5F3FF", color:"#5B21B6" },
  "New User":{ bg:"#FFF7ED", color:"#9A3412" },
  Inactive:  { bg:"#F1F5F9", color:"#475569" },
  Festival:  { bg:"#FDF2F8", color:"#9D174D" },
  Wholesale: { bg:"#ECFDF5", color:"#065F46" },
};

const CONTACTS = [
  { id:1,  name:"Priya Sharma",      phone:"+91 98765 43210", email:"priya.sharma@gmail.com",    status:"opted_in",  tags:["VIP","Delhi"],        source:"csv_import",   optDate:"Jan 12, 2025", lastMsg:"Mar 20", msgs:24, org:"Sharma Enterprises"    },
  { id:2,  name:"Rahul Verma",       phone:"+91 87654 32109", email:"rahul.v@outlook.com",        status:"opted_in",  tags:["Mumbai","Premium"],   source:"web_form",     optDate:"Feb 3, 2025",  lastMsg:"Mar 21", msgs:11, org:"Verma & Sons"           },
  { id:3,  name:"Ananya Gupta",      phone:"+91 76543 21098", email:"ananya.g@company.co",        status:"opted_out", tags:["Inactive"],           source:"keyword",      optDate:"Oct 5, 2024",  lastMsg:"Nov 14", msgs:3,  org:"Gupta Retail"           },
  { id:4,  name:"Karan Malhotra",    phone:"+91 65432 10987", email:"karan@malhotra.in",          status:"opted_in",  tags:["VIP","Festival"],     source:"api",          optDate:"Mar 1, 2025",  lastMsg:"Mar 22", msgs:31, org:"Malhotra Group"         },
  { id:5,  name:"Sneha Patel",       phone:"+91 54321 09876", email:"sneha.patel@patel.com",      status:"opted_in",  tags:["Delhi","New User"],   source:"web_form",     optDate:"Mar 10, 2025", lastMsg:"Mar 18", msgs:7,  org:"Patel Distributors"     },
  { id:6,  name:"Arjun Nair",        phone:"+91 43210 98765", email:"arjun.n@nair.co.in",         status:"pending",   tags:["Mumbai"],             source:"csv_import",   optDate:"Mar 15, 2025", lastMsg:"—",      msgs:0,  org:"Nair Logistics"         },
  { id:7,  name:"Deepika Reddy",     phone:"+91 32109 87654", email:"deepika.r@reddy.com",        status:"opted_in",  tags:["Premium","Wholesale"],source:"csv_import",   optDate:"Dec 20, 2024", lastMsg:"Mar 19", msgs:18, org:"Reddy Industries"       },
  { id:8,  name:"Vikram Joshi",      phone:"+91 21098 76543", email:"vikram.j@joshi.net",         status:"opted_in",  tags:["VIP","Mumbai","VIP"], source:"api",          optDate:"Jan 28, 2025", lastMsg:"Mar 21", msgs:44, org:"Joshi & Partners"       },
  { id:9,  name:"Meera Krishnan",    phone:"+91 10987 65432", email:"meera.k@krishnan.in",        status:"opted_out", tags:["Delhi","Inactive"],   source:"keyword",      optDate:"Aug 14, 2024", lastMsg:"Sep 3",  msgs:2,  org:"Krishnan Textiles"      },
  { id:10, name:"Rohan Bhatt",       phone:"+91 99876 54321", email:"rohan.bhatt@bhatt.com",      status:"opted_in",  tags:["New User"],           source:"web_form",     optDate:"Mar 18, 2025", lastMsg:"Mar 22", msgs:4,  org:"Bhatt Electronics"      },
  { id:11, name:"Pooja Singh",       phone:"+91 88765 43210", email:"pooja.singh@singh.org",      status:"opted_in",  tags:["Festival","Delhi"],   source:"csv_import",   optDate:"Feb 25, 2025", lastMsg:"Mar 20", msgs:9,  org:"Singh Jewellers"        },
  { id:12, name:"Nikhil Agarwal",    phone:"+91 77654 32109", email:"nikhil.a@agarwal.biz",       status:"pending",   tags:["Wholesale"],          source:"api",          optDate:"Mar 19, 2025", lastMsg:"—",      msgs:0,  org:"Agarwal Wholesale"      },
];

const MESSAGE_HISTORY = [
  { id:1, campaign:"Diwali Offer 2024",     template:"festival_promo",    status:"read",      sent:"Nov 1, 2024 · 10:30 AM",  delivered:"Nov 1 · 10:31 AM", read:"Nov 1 · 11:14 AM" },
  { id:2, campaign:"October Newsletter",    template:"monthly_update",    status:"delivered", sent:"Oct 20, 2024 · 9:00 AM",  delivered:"Oct 20 · 9:01 AM", read:null },
  { id:3, campaign:"Flash Sale Jan",        template:"flash_sale",        status:"read",      sent:"Jan 15, 2025 · 2:00 PM",  delivered:"Jan 15 · 2:00 PM", read:"Jan 15 · 2:47 PM" },
  { id:4, campaign:"Cart Recovery Feb",     template:"cart_abandonment",  status:"read",      sent:"Feb 8, 2025 · 11:00 AM",  delivered:"Feb 8 · 11:00 AM", read:"Feb 8 · 11:33 AM" },
  { id:5, campaign:"Diwali Promo 2024",     template:"festival_promo_v2", status:"failed",    sent:"Mar 1, 2025 · 3:00 PM",   delivered:null,               read:null, error:"Template not approved" },
  { id:6, campaign:"New Product Launch",    template:"product_launch",    status:"read",      sent:"Mar 15, 2025 · 10:00 AM", delivered:"Mar 15 · 10:01 AM",read:"Mar 15 · 10:22 AM" },
];

const CSV_PREVIEW = [
  { Name:"Akash Dubey",    Phone:"9876543210", Email:"akash@dubey.com",  City:"Noida",   Tag:"VIP"      },
  { Name:"Tanvi Mehta",    Phone:"8765432109", Email:"tanvi@mehta.co",   City:"Pune",    Tag:"Festival" },
  { Name:"Suresh Yadav",   Phone:"7654321098", Email:"suresh@yadav.in",  City:"Lucknow", Tag:"Wholesale"},
  { Name:"Kavya Pillai",   Phone:"6543210987", Email:"kavya@pillai.com", City:"Kochi",   Tag:"Premium"  },
  { Name:"Raj Chaudhary",  Phone:"5432109876", Email:"raj@chaudhary.biz",City:"Jaipur",  Tag:"New User" },
];

/* ─────────────────────────────────────────────
   SMALL HELPERS
───────────────────────────────────────────── */
const avatarColors = ["#00A884","#2563EB","#7C3AED","#D97706","#0D9488","#DB2777","#EA580C","#0284C7"];
function avatarColor(name) { let h=0; for(let c of name) h=(h<<5)-h+c.charCodeAt(0); return avatarColors[Math.abs(h)%avatarColors.length]; }
function initials(name) { return name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(); }

function Avatar({ name, size=34 }) {
  const bg = avatarColor(name);
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:bg, flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.35, fontWeight:700, color:"#fff", letterSpacing:"-0.02em" }}>
      {initials(name)}
    </div>
  );
}

function Tag({ label }) {
  const cfg = TAG_COLORS[label] || { bg:T.border, color:T.muted };
  return (
    <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600,
      background:cfg.bg, color:cfg.color, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

const STATUS_CFG = {
  opted_in:  { label:"Opted in",  bg:"#DCFCE7", color:"#166534", dot:"#22C55E" },
  opted_out: { label:"Opted out", bg:"#FEE2E2", color:"#7F1D1D", dot:"#EF4444" },
  pending:   { label:"Pending",   bg:"#FEF3C7", color:"#78350F", dot:"#F59E0B" },
};
const MSG_STATUS_CFG = {
  read:      { label:"Read",      bg:"#DCFCE7", color:"#166534" },
  delivered: { label:"Delivered", bg:"#EFF6FF", color:"#1E40AF" },
  sent:      { label:"Sent",      bg:"#F1F5F9", color:"#475569" },
  failed:    { label:"Failed",    bg:"#FEE2E2", color:"#7F1D1D" },
};

function StatusBadge({ status, size="md" }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  const pad = size==="sm" ? "2px 7px" : "3px 10px";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5,
      padding:pad, borderRadius:20, background:cfg.bg, color:cfg.color,
      fontSize:size==="sm"?10:11, fontWeight:600, whiteSpace:"nowrap" }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:cfg.dot, flexShrink:0 }}/>
      {cfg.label}
    </span>
  );
}

function MsgBadge({ status }) {
  const cfg = MSG_STATUS_CFG[status] || MSG_STATUS_CFG.sent;
  return (
    <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600,
      background:cfg.bg, color:cfg.color, whiteSpace:"nowrap" }}>
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   SVG ICONS
───────────────────────────────────────────── */
const I = {
  search:  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  filter:  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  upload:  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  plus:    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevR:   <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  chevL:   <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
  chevD:   <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>,
  back:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  phone:   <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.45a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail:    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  org:     <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  calendar:<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check:   <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  trash:   <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  optOut:  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  msg:     <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  edit:    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  grid:    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  cloud:   <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  file:    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  spinner: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin 0.8s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
};

/* ─────────────────────────────────────────────
   SIDEBAR (same as Dashboard)
───────────────────────────────────────────── */
const NAV = [
  { label:"Dashboard" }, { label:"Contacts", active:true },
  { label:"Templates" }, { label:"Campaigns" },
  { label:"Analytics" }, { label:"Reports"   }, { label:"Opt-In / Out" },
];
const NAV_ICONS = {
  "Dashboard":   <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  "Contacts":    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  "Templates":   <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  "Campaigns":   <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  "Analytics":   <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  "Reports":     <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
  "Opt-In / Out":<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>,
};

function Sidebar({ view, setView }) {
  return (
    <div style={{ width:220, flexShrink:0, background:T.sidebar, display:"flex",
      flexDirection:"column", height:"100vh", position:"sticky", top:0, borderRight:"1px solid #1A2744" }}>
      <div style={{ padding:"22px 20px 18px", borderBottom:"1px solid #1A2744" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:T.green,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L0 24l6.35-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.002-1.368l-.36-.213-3.71.883.939-3.61-.236-.371A9.79 9.79 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#F8FAFC", letterSpacing:"-0.01em" }}>WA Platform</div>
            <div style={{ fontSize:10, color:"#475569", marginTop:1 }}>Enterprise</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto" }}>
        <div style={{ fontSize:9, fontWeight:700, color:"#334155", letterSpacing:"0.1em",
          padding:"8px 10px 4px", textTransform:"uppercase" }}>Main</div>
        {NAV.map(item => {
          const isActive = item.label === "Contacts";
          return (
            <button key={item.label} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%",
              padding:"9px 10px", borderRadius:8, border:"none", cursor:"pointer",
              background: isActive ? T.green : "transparent",
              color: isActive ? "#fff" : "#94A3B8",
              fontSize:13, fontWeight: isActive ? 600 : 400,
              marginBottom:2, transition:"all .15s", textAlign:"left",
            }}
              onMouseEnter={e => { if(!isActive){ e.currentTarget.style.background="#142238"; e.currentTarget.style.color="#E2E8F0"; }}}
              onMouseLeave={e => { if(!isActive){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#94A3B8"; }}}
            >
              <span style={{ opacity: isActive ? 1 : 0.7 }}>{NAV_ICONS[item.label]}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:"14px", borderTop:"1px solid #1A2744" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:"50%", background:T.green,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>PA</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#E2E8F0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Piyush Admin</div>
            <div style={{ fontSize:10, color:"#475569" }}>Super Admin</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOPBAR
───────────────────────────────────────────── */
function Topbar({ title, subtitle, actions }) {
  return (
    <div style={{ height:60, background:T.card, borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"center", padding:"0 24px", gap:12,
      position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:17, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:T.subtle }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
function Modal({ open, onClose, title, children, width=440 }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:100 }}
      onClick={onClose}>
      <div style={{ background:T.card, borderRadius:14, width, maxWidth:"95vw", maxHeight:"90vh",
        overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding:"20px 22px 16px", borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:15, fontWeight:700, color:T.text }}>{title}</div>
          <button onClick={onClose} style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`,
            background:T.bg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.muted }}>×</button>
        </div>
        <div style={{ padding:"20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function AddContactForm({ onSaved, onCancel }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const save = async () => {
    // basic client-side validation
    if (!phone || !String(phone).trim()) {
      toast.error('Phone number is required');
      return;
    }

    // immediate feedback so clicks are observable
    console.log('AddContactForm.save clicked', { name, phone, email, tags });
    toast.loading('Saving contact...', { id: 'save-contact' });
    setLoading(true);
    try {
      const payload = { phoneNumber: phone.trim(), name: name.trim() || undefined, email: email.trim() || undefined, tags };
      const res = await contactsAPI.create(payload);
      if (res?.data?.success) {
        toast.success('Contact added', { id: 'save-contact' });
        const created = res.data.data?.contact || res.data.data || null;
        if (typeof onSaved === 'function') onSaved(created);
      } else {
        const msg = res?.data?.message || 'Failed to add contact';
        toast.error(msg, { id: 'save-contact' });
      }
    } catch (err) {
      console.error('create contact failed', err);
      const msg = err?.response?.data?.message || err.message || 'Failed to add contact';
      toast.error(msg, { id: 'save-contact' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Full name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Priya Sharma" style={{ width:"100%", padding:"9px 12px", borderRadius:8,
          border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Phone number</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" style={{ width:"100%", padding:"9px 12px", borderRadius:8,
          border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Email address</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="priya@example.com" style={{ width:"100%", padding:"9px 12px", borderRadius:8,
          border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Organisation</label>
        <input value={org} onChange={e=>setOrg(e.target.value)} placeholder="Sharma Enterprises" style={{ width:"100%", padding:"9px 12px", borderRadius:8,
          border:`1px solid ${T.border}`, fontSize:13, color:T.text, fontFamily:T.font, outline:"none" }}/>
      </div>
      <div style={{ marginBottom:18 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:8 }}>Tags</label>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {TAGS.map(t => (
            <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])}
              style={{ padding:"6px 10px", borderRadius:20, border: tags.includes(t) ? `1px solid ${T.green}` : `1px solid ${T.border}` , background: tags.includes(t) ? T.greenLight : 'transparent', cursor:'pointer' }}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"10px", borderRadius:9, border:`1px solid ${T.border}`, background:T.card, fontSize:14, color:T.text }}>Cancel</button>
      </div>
      <div style={{ marginTop:12 }}>
        <button type="button" onClick={save} disabled={loading} style={{ width:'100%', padding:"12px 14px", borderRadius:10, border:"none", background:T.green, color:'#fff', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}> {loading? I.spinner : 'Save Contact'}</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, title, msg, label="Confirm", loading=false }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.5)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}
      onClick={onClose}>
      <div style={{ background:T.card, borderRadius:14, width:400, padding:"24px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width:44, height:44, borderRadius:12, background:T.redLight,
          display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={T.red} strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:13, color:T.muted, marginBottom:22, lineHeight:1.6 }}>{msg}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`,
            background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding:"8px 16px", borderRadius:8, border:"none",
            background:T.red, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer",
            display:"flex", alignItems:"center", gap:6 }}>
            {loading && I.spinner}{label}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1 — CONTACTS LIST
───────────────────────────────────────────── */
function ContactsListScreen({ onViewContact, onImport }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOptOutConfirm, setShowOptOutConfirm] = useState(null);
  const [hoverRow, setHoverRow] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [meta, setMeta] = useState({ total: CONTACTS.length, page: 1, limit: 8 });
  const [loading, setLoading] = useState(false);
  const PER_PAGE = 8;

  const sourceContacts = contacts.length ? contacts : CONTACTS;
  const filtered = sourceContacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchTag    = tagFilter === "all" || c.tags.includes(tagFilter);
    return matchSearch && matchStatus && matchTag;
  });

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === paginated.length ? [] : paginated.map(c=>c.id));

  const stats = {
    total:     meta.total || CONTACTS.length,
    opted_in:  sourceContacts.filter(c=>c.status==="opted_in").length,
    opted_out: sourceContacts.filter(c=>c.status==="opted_out").length,
    pending:   sourceContacts.filter(c=>c.status==="pending").length,
  };

  // fetchContacts is callable to refresh the list on demand
  const fetchContacts = async (opts = {}) => {
    setLoading(true);
    try {
      const params = { page: opts.page || page, limit: PER_PAGE };
      if (opts.search !== undefined ? opts.search : search) params.search = opts.search !== undefined ? opts.search : search;
      if (opts.tag !== undefined ? opts.tag : (tagFilter !== 'all')) params.tag = opts.tag !== undefined ? opts.tag : (tagFilter !== 'all' ? tagFilter : undefined);
      if (opts.status !== undefined ? opts.status : (statusFilter !== 'all')) params.optInStatus = opts.status !== undefined ? opts.status : (statusFilter !== 'all' ? statusFilter : undefined);
      const res = await contactsAPI.list(params);
      if (res?.data?.success) {
        setContacts(res.data.data.contacts);
        setMeta(res.data.data.meta || { total: res.data.data.contacts.length, page: params.page, limit: PER_PAGE });
      }
    } catch (err) {
      // fallback to mock data
      console.error('fetch contacts failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // initial load
    fetchContacts();
  }, [page, search, tagFilter, statusFilter]);

  useEffect(() => {
    // listen for external refresh requests
    const handler = () => fetchContacts({ page: 1 });
    window.addEventListener('contacts:refresh', handler);
    return () => window.removeEventListener('contacts:refresh', handler);
  }, []);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
      <Topbar
        title="Contacts"
        subtitle={`${stats.total} total · ${stats.opted_in} opted in · ${stats.opted_out} opted out`}
        actions={
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onImport} style={{ display:"flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:13, color:T.text, cursor:"pointer", fontWeight:500 }}>
              {I.upload} Import CSV
            </button>
            <button type="button" onClick={()=>{ console.log('open add modal'); setShowAddModal(true); }} style={{ display:"flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:8, border:"none",
              background:T.green, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {I.plus} Add Contact
            </button>
          </div>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

        {/* STAT PILLS */}
        <div style={{ display:"flex", gap:10, marginBottom:18 }}>
          {[
            { label:"All contacts",   val:stats.total,     key:"all",       color:T.blue   },
            { label:"Opted in",       val:stats.opted_in,  key:"opted_in",  color:T.green  },
            { label:"Opted out",      val:stats.opted_out, key:"opted_out", color:T.red    },
            { label:"Pending",        val:stats.pending,   key:"pending",   color:T.amber  },
          ].map(s => (
            <button key={s.key} onClick={()=>{ setStatusFilter(s.key); setPage(1); }} style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"8px 14px", borderRadius:9, border:`1.5px solid`,
              borderColor: statusFilter===s.key ? s.color : T.border,
              background: statusFilter===s.key ? `${s.color}12` : T.card,
              cursor:"pointer", transition:"all .15s",
            }}>
              <span style={{ fontFamily:T.mono, fontSize:18, fontWeight:700,
                color: statusFilter===s.key ? s.color : T.text }}>{s.val}</span>
              <span style={{ fontSize:12, color: statusFilter===s.key ? s.color : T.muted, whiteSpace:"nowrap" }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={{ display:"flex", gap:10, marginBottom:14, alignItems:"center" }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", gap:8,
            background:T.card, borderRadius:8, padding:"8px 12px", border:`1px solid ${T.border}` }}>
            <span style={{ color:T.subtle }}>{I.search}</span>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="Search by name, phone or email…"
              style={{ border:"none", background:"transparent", outline:"none",
                fontSize:13, color:T.text, width:"100%", fontFamily:T.font }} />
          </div>

          <div style={{ position:"relative" }}>
            <button onClick={()=>setDropdownOpen(o=>!o)} style={{
              display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
              borderRadius:8, border:`1px solid ${T.border}`, background:T.card,
              fontSize:13, color: tagFilter!=="all" ? T.green : T.muted, cursor:"pointer", fontWeight: tagFilter!=="all"?600:400 }}>
              {I.filter} {tagFilter==="all" ? "Filter by tag" : tagFilter} {I.chevD}
            </button>
            {dropdownOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:50,
                background:T.card, border:`1px solid ${T.border}`, borderRadius:10,
                boxShadow:"0 8px 24px rgba(0,0,0,.1)", minWidth:160, overflow:"hidden" }}>
                {["all", ...TAGS].map(t => (
                  <button key={t} onClick={()=>{ setTagFilter(t); setDropdownOpen(false); setPage(1); }}
                    style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left",
                      border:"none", background: tagFilter===t ? T.greenLight : "transparent",
                      color: tagFilter===t ? T.greenDark : T.text, fontSize:13, cursor:"pointer",
                      fontWeight: tagFilter===t ? 600 : 400 }}>
                    {t==="all" ? "All tags" : t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selected.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
            background:"#EFF6FF", border:`1px solid #BFDBFE`, borderRadius:9, marginBottom:12 }}>
            <span style={{ fontSize:13, fontWeight:600, color:T.blue }}>{selected.length} selected</span>
            <div style={{ flex:1 }}/>
            {[
              { label:"Export CSV",    color:T.blue  },
              { label:"Opt out all",  color:T.red   },
              { label:"Delete",       color:T.red   },
            ].map(a => (
              <button key={a.label} style={{ padding:"6px 12px", borderRadius:7,
                border:`1px solid ${a.color}30`, background:`${a.color}12`,
                color:a.color, fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {a.label}
              </button>
            ))}
            <button onClick={()=>setSelected([])} style={{ padding:"6px 10px", borderRadius:7,
              border:`1px solid ${T.border}`, background:T.card, color:T.muted, fontSize:12, cursor:"pointer" }}>
              Clear
            </button>
          </div>
        )}

        {/* TABLE */}
        <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:T.bg }}>
                <th style={{ padding:"10px 16px", width:40 }}>
                  <input type="checkbox" checked={selected.length===paginated.length && paginated.length>0}
                    onChange={toggleAll} style={{ cursor:"pointer", accentColor:T.green }} />
                </th>
                {["Contact","Phone","Status","Tags","Last message","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:10, fontWeight:700,
                    color:T.muted, letterSpacing:"0.06em", textTransform:"uppercase",
                    borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, i) => (
                <tr key={c.id}
                  onMouseEnter={()=>setHoverRow(c.id)} onMouseLeave={()=>setHoverRow(null)}
                  style={{ background: selected.includes(c.id) ? "#F0FDF4" : hoverRow===c.id ? T.bg : T.card,
                    borderBottom: i < paginated.length-1 ? `1px solid ${T.border}` : "none",
                    transition:"background .1s", cursor:"pointer" }}>
                  <td style={{ padding:"12px 16px" }} onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={()=>toggleSelect(c.id)}
                      style={{ cursor:"pointer", accentColor:T.green }} />
                  </td>
                  <td style={{ padding:"12px 14px" }} onClick={()=>onViewContact(c)}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={c.name} size={32} />
                      <div>
                        <div style={{ fontWeight:600, color:T.text, fontSize:13 }}>{c.name}</div>
                        <div style={{ fontSize:11, color:T.subtle }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", fontFamily:T.mono, fontSize:12, color:T.muted }}
                    onClick={()=>onViewContact(c)}>{c.phone}</td>
                  <td style={{ padding:"12px 14px" }} onClick={()=>onViewContact(c)}>
                    <StatusBadge status={c.status} size="sm" />
                  </td>
                  <td style={{ padding:"12px 14px" }} onClick={()=>onViewContact(c)}>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                      {[...new Set(c.tags)].slice(0,2).map(t => <Tag key={t} label={t}/>)}
                      {[...new Set(c.tags)].length > 2 &&
                        <span style={{ fontSize:10, color:T.subtle }}>+{[...new Set(c.tags)].length-2}</span>}
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", fontSize:11, color:T.muted }}
                    onClick={()=>onViewContact(c)}>
                    {c.lastMsg==="—" ? <span style={{color:T.border}}>—</span> : c.lastMsg}
                  </td>
                  <td style={{ padding:"12px 14px" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ display:"flex", gap:4 }}>
                      <button onClick={()=>onViewContact(c)} title="View"
                        style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`,
                          background:T.card, cursor:"pointer", display:"flex", alignItems:"center",
                          justifyContent:"center", color:T.muted }}>
                        {I.edit}
                      </button>
                      {c.status === "opted_in" && (
                        <button onClick={()=>setShowOptOutConfirm(c)} title="Opt out"
                          style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`,
                            background:T.card, cursor:"pointer", display:"flex", alignItems:"center",
                            justifyContent:"center", color:T.red }}>
                          {I.optOut}
                        </button>
                      )}
                      <button title="Delete"
                        style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.border}`,
                          background:T.card, cursor:"pointer", display:"flex", alignItems:"center",
                          justifyContent:"center", color:T.muted }}>
                        {I.trash}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={7} style={{ padding:"48px 0", textAlign:"center", color:T.subtle, fontSize:13 }}>
                  No contacts match your search
                </td></tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            background:T.bg }}>
            <span style={{ fontSize:12, color:T.muted }}>
              Showing <strong>{Math.min((page-1)*PER_PAGE+1, filtered.length)}–{Math.min(page*PER_PAGE, filtered.length)}</strong> of <strong>{filtered.length}</strong> contacts
            </span>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.border}`,
                  background:page===1?"transparent":T.card, cursor:page===1?"default":"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:page===1?T.border:T.muted, opacity:page===1?0.5:1 }}>{I.chevL}</button>
              {Array.from({length:totalPages},(_, i)=>i+1).map(n => (
                <button key={n} onClick={()=>setPage(n)}
                  style={{ width:30, height:30, borderRadius:7, cursor:"pointer",
                    background: n===page ? T.green : T.card,
                    color: n===page ? "#fff" : T.muted, fontSize:12, fontWeight: n===page?700:400,
                    border:`1px solid ${n===page ? T.green : T.border}` }}>{n}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.border}`,
                  background:page===totalPages?"transparent":T.card, cursor:page===totalPages?"default":"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:page===totalPages?T.border:T.muted, opacity:page===totalPages?0.5:1 }}>{I.chevR}</button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD CONTACT MODAL */}
      <Modal open={showAddModal} onClose={()=>setShowAddModal(false)} title="Add new contact">
            <AddContactForm onSaved={async (created) => {
              // refresh from server to get canonical list
              window.dispatchEvent(new Event('contacts:refresh'));
              setShowAddModal(false);
            }} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <ConfirmModal open={!!showOptOutConfirm} onClose={()=>setShowOptOutConfirm(null)}
        onConfirm={()=>setShowOptOutConfirm(null)}
        title={`Opt out ${showOptOutConfirm?.name}?`}
        msg="This contact will be immediately removed from all future campaigns. They can re-opt-in only by messaging you directly."
        label="Opt Out" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2 — IMPORT CSV
───────────────────────────────────────────── */
function ImportScreen({ onBack }) {
  const [step, setStep] = useState(1); // 1=upload 2=map 3=importing 4=done
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [mapping, setMapping] = useState({});
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef();

  const [csvHeaders, setCsvHeaders] = useState(Object.keys(CSV_PREVIEW[0]));
  const [csvPreview, setCsvPreview] = useState(CSV_PREVIEW);
  const [parseError, setParseError] = useState(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [inputTags, setInputTags] = useState("");

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#10B981");
  const [creatingGroup, setCreatingGroup] = useState(false);
  // Real-time name availability state
  const [nameCheckStatus, setNameCheckStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [nameCheckMsg, setNameCheckMsg] = useState("");
  const nameDebounceRef = useRef(null);

  useEffect(() => {
    contactGroupsAPI.list().then(res => {
      if (res?.data?.success) setGroups(res.data.data.groups);
    }).catch(console.error);
  }, []);

  const handleGroupSelect = (e) => {
    if (e.target.value === "CREATE_NEW") {
      setShowCreateGroup(true);
    } else {
      setSelectedGroupId(e.target.value);
    }
  };

  // Debounced real-time name availability check (400ms)
  const handleNewGroupNameChange = (e) => {
    const val = e.target.value;
    setNewGroupName(val);
    setNameCheckStatus(null);
    setNameCheckMsg("");
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    if (!val.trim()) return;
    setNameCheckStatus('checking');
    nameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await contactGroupsAPI.checkName(val.trim());
        if (res?.data?.exists) {
          setNameCheckStatus('taken');
          setNameCheckMsg(res.data.message || 'Group already exists in your organization');
        } else {
          setNameCheckStatus('available');
          setNameCheckMsg(res.data.message || 'Group name available');
        }
      } catch (_) {
        setNameCheckStatus(null);
        setNameCheckMsg("");
      }
    }, 400);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return toast.error("Group name is required");
    if (nameCheckStatus === 'taken') return toast.error("Group name already exists in your organization");
    setCreatingGroup(true);
    try {
      const res = await contactGroupsAPI.create({ name: newGroupName.trim(), description: newGroupDesc, color: newGroupColor });
      if (res?.data?.success) {
        const created = res.data.data.group;
        setGroups(prev => [...prev, created].sort((a,b)=>a.name.localeCompare(b.name)));
        setSelectedGroupId(created._id || created.id);
        setShowCreateGroup(false);
        setNewGroupName("");
        setNewGroupDesc("");
        setNewGroupColor("#10B981");
        setNameCheckStatus(null);
        setNameCheckMsg("");
        toast.success("Group created successfully");
      } else {
        toast.error(res?.data?.message || "Failed to create group");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const fieldOptions = ["skip","Name","Phone","Email","Tag","City","Custom Field 1","Custom Field 2"];

  // Lightweight CSV parser
  function parseCSVText(text) {
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i+1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) { row.push(cur); cur = ''; }
      else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && text[i+1] === '\n') { i++; }
        row.push(cur); rows.push(row); row = []; cur = '';
      } else { cur += ch; }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) { handleFile(f); }
  }, []);

  const handleFile = async (f) => {
    setParseError(null);
    setFile(f);
    try {
      const text = await f.text();
      const rows = parseCSVText(text);
      if (!rows || rows.length < 1) throw new Error('No rows found');
      const headers = rows[0].map(h=>String(h||'').trim()).filter(Boolean);
      const dataRows = rows.slice(1).map(r=>{
        const obj = {};
        for (let i=0;i<headers.length;i++) obj[headers[i]] = r[i] !== undefined ? r[i] : '';
        return obj;
      });
      setCsvHeaders(headers.length ? headers : Object.keys(CSV_PREVIEW[0]));
      setCsvPreview(dataRows.length ? dataRows.slice(0,5) : CSV_PREVIEW);
      // heuristics for mapping
      const mp = {};
      for (const h of headers) {
        const k = h.toLowerCase();
        if (k.includes('phone')||k.includes('mobile')||k.includes('msisdn')) mp[h] = 'Phone';
        else if (k.includes('name')) mp[h] = 'Name';
        else if (k.includes('email')) mp[h] = 'Email';
        else if (k.includes('tag')) mp[h] = 'Tag';
        else if (k.includes('city')) mp[h] = 'City';
        else mp[h] = 'Custom Field 1';
      }
      setMapping(mp);
      setTimeout(()=>setStep(2), 220);
    } catch (err) {
      console.error('parse csv failed', err);
      setParseError(err.message || 'Failed to parse CSV');
    }
  };

  const startImport = async () => {
    if (!file) return;
    setStep(3); setImporting(true); setProgress(8);
    try {
      setProgress(35);
      const groupIds = selectedGroupId ? [selectedGroupId] : [];
      const tags = inputTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await contactsAPI.importWithMapping(file, mapping, groupIds, tags);
      setProgress(90);
      if (res?.data?.success) {
        const { imported = 0, duplicates = 0, invalidRows = [], errors = [] } = res.data.data;
        setImportResult(res.data.data);
        const errCount = (invalidRows?.length || 0) + (errors?.length || 0);
        
        let msg = `Imported ${imported} contacts`;
        if (duplicates > 0) msg += ` (${duplicates} existing skipped)`;
        
        if (errCount > 0) {
          toast.error(`${msg}. ${errCount} errors found.`);
        } else {
          toast.success(msg);
        }
      }
      else setImportResult({ imported:0, duplicates:0, invalidRows:[], errors:[] });
    } catch (err) {
      console.error('import failed', err);
      const errorMsg = err.response?.data?.message || 'Failed to import contacts';
      toast.error(errorMsg);
      setImportResult({ imported:0, duplicates:0, invalidRows:[], errors:[] });
    } finally {
      setProgress(100); setImporting(false);
      window.dispatchEvent(new Event('contacts:refresh'));
      // show summary then go back
      setTimeout(()=>{ setStep(4); setTimeout(()=>{ if (typeof onBack === 'function') onBack(); }, 900); }, 500);
    }
  };

  const STEPS = ["Upload file","Map columns","Import"];

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
      <Topbar
        title="Import Contacts"
        subtitle="Upload a CSV to bulk-import contacts"
        actions={
          <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6,
            padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`,
            background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>
            {I.back} Back to contacts
          </button>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"24px", maxWidth:1100, width:"100%", margin:"0 auto" }}>

        {/* STEPPER */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:30, gap:0 }}>
          {STEPS.map((s,i) => {
            const done = i+1 < step;
            const active = i+1 === step;
            return (
              <div key={s} style={{ display:"flex", alignItems:"center", flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
                    background: done ? T.green : active ? T.green : T.border,
                    color: done||active ? "#fff" : T.muted, flexShrink:0 }}>
                    {done ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i+1}
                  </div>
                  <span style={{ fontSize:13, fontWeight: active?600:400,
                    color: active ? T.text : done ? T.green : T.muted }}>{s}</span>
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ flex:1, height:2, margin:"0 12px", background: done ? T.green : T.border }}/>
                )}
              </div>
            );
          })}
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div>
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}
              onClick={()=>fileRef.current?.click()}
              style={{ border:`2px dashed ${dragging?T.green:T.borderMid}`, borderRadius:12,
                padding:"72px 24px", textAlign:"center", cursor:"pointer", maxWidth:960, margin:"0 auto",
                background: dragging ? T.greenLight : T.bg, transition:"all .2s" }}>
              <div style={{ width:56, height:56, borderRadius:14, background: dragging?T.greenLight:"#F1F5F9",
                display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px",
                color: dragging?T.green:T.muted }}>{I.cloud}</div>
              <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:6 }}>{dragging ? "Drop to upload" : "Drag & drop your CSV file"}</div>
              <div style={{ fontSize:13, color:T.subtle, marginBottom:16 }}>or click to browse</div>
              <span style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`,
                background:T.card, fontSize:13, color:T.muted, fontWeight:600 }}>Browse file</span>
              <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]) handleFile(e.target.files[0]); }} />
            </div>

            {/* Sample CSV download */}
            <div style={{ marginTop:14, textAlign:'center' }}>
              <button
                onClick={() => {
                  const csv = `Name,Phone,Email,Tag,City\nSiddhant Hardik,+917838033664,siddhant@example.com,Delhi,New Delhi\nSaroj Kumari,+917303443664,saroj@example.com,Delhi,New Delhi`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'sample_contacts.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8,
                  border:`1px solid ${T.green}`, background:'#F0FDF4', color:T.green, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                <svg width='14' height='14' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth='2'><path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/><polyline points='7 10 12 15 17 10'/><line x1='12' y1='15' x2='12' y2='3'/></svg>
                Download sample CSV
              </button>
            </div>

            <div style={{ marginTop:20, padding:"16px", background:T.card, borderRadius:10, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.muted, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.05em" }}>Expected columns</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {["Name","Phone","Email","Tag (optional)","City (optional)"].map(c => (
                  <div key={c} style={{ background:T.card, border:`1px solid ${T.border}`, padding:'8px 12px', borderRadius:10, color:T.muted }}>{c}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MAP COLUMNS */}
        {step === 2 && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
              background:T.greenLight, borderRadius:9, border:`1px solid #6EE7B7`, marginBottom:20, justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div style={{ color:T.green }}>{I.file}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.greenDark }}>{file?.name || "contacts_import.csv"}</div>
                  <div style={{ fontSize:11, color:"#059669" }}>{csvPreview.length} rows detected · {csvHeaders.length} columns</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:T.subtle }}>{parseError ? <span style={{color:T.red}}>{parseError}</span> : null}</div>
            </div>

            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:20 }}>
              <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, background:T.bg }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Map your CSV columns</div>
                <div style={{ fontSize:11, color:T.subtle }}>Match each column from your file to a contact field</div>
              </div>
              <div style={{ padding:"4px 0" }}>
                {csvHeaders.map(h => (
                  <div key={h} style={{ display:"flex", alignItems:"center", padding:"12px 18px", borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ flex:1, fontSize:13, fontFamily:T.mono, color:T.text }}>{h}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ fontSize:11, color:T.subtle }}>maps to</div>
                      <select value={mapping[h]||"skip"} onChange={e=>setMapping(m=>({...m,[h]:e.target.value}))}
                        style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${T.border}`, fontSize:12, color:T.text, background:T.card, cursor:"pointer", fontFamily:T.font, outline:"none" }}>
                        {fieldOptions.map(o=><option key={o} value={o}>{o==="skip"?"— Skip this column —":o}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PREVIEW */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:20 }}>
              <div style={{ padding:"12px 18px", borderBottom:`1px solid ${T.border}`, background:T.bg, fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                Preview — first 5 rows
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>{csvHeaders.filter(h=>mapping[h]!="skip").map(h=>(
                      <th key={h} style={{ padding:"8px 14px", textAlign:"left", fontSize:10, fontWeight:700, color:T.muted, letterSpacing:"0.05em", textTransform:"uppercase", background:T.bg, borderBottom:`1px solid ${T.border}` }}>{mapping[h]}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${T.border}` }}>
                        {csvHeaders.filter(h=>mapping[h]!="skip").map(h=>(
                          <td key={h} style={{ padding:"9px 14px", color:T.text, fontFamily:h.includes('Phone')?T.mono:"inherit" }}>{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ASSIGN GROUP & TAGS */}
            <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"20px", marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text, marginBottom:16 }}>Assign to Group & Tags</div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:6, fontWeight:600 }}>Contact Group (Optional)</label>
                  <select value={selectedGroupId} onChange={handleGroupSelect}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, outline:"none" }}>
                    <option value="">— Select a group —</option>
                    <optgroup label="Existing Groups">
                      {groups.map(g => <option key={g._id || g.id} value={g._id || g.id}>{g.name}</option>)}
                    </optgroup>
                    <optgroup label="Actions">
                      <option value="CREATE_NEW">+ Create New Group</option>
                    </optgroup>
                  </select>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:6, fontWeight:600 }}>Tags (comma separated)</label>
                  <input type="text" value={inputTags} onChange={e=>setInputTags(e.target.value)} placeholder="e.g. Festival, VIP"
                    style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:12, color:T.muted }}>
                <strong style={{ color:T.text }}>{csvPreview.length}</strong> valid contacts ready · <strong style={{ color:T.amber }}>0</strong> duplicates found
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setStep(1)} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>Back</button>
                <button onClick={startImport} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:T.green, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>Start Import →</button>
              </div>
            </div>

            {/* CREATE GROUP MODAL */}
            {showCreateGroup && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ background:T.card, width:420, borderRadius:16, boxShadow:"0 20px 40px rgba(0,0,0,0.2)", overflow:"hidden", animation:"slideUp 0.3s ease" }}>
                  <div style={{ padding:"16px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <h3 style={{ margin:0, fontSize:16, fontWeight:700, color:T.text }}>Create New Group</h3>
                    <button onClick={()=>{ setShowCreateGroup(false); setSelectedGroupId(""); setNameCheckStatus(null); setNameCheckMsg(""); }} style={{ border:"none", background:"transparent", cursor:"pointer", color:T.muted, fontSize:20 }}>&times;</button>
                  </div>
                  <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:16 }}>
                    <div>
                      <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:6, fontWeight:600 }}>Group Name *</label>
                      <input type="text" value={newGroupName} onChange={handleNewGroupNameChange} placeholder="e.g. VIP Clients"
                        style={{ width:"100%", padding:"10px 12px", borderRadius:8,
                          border:`1px solid ${nameCheckStatus === 'taken' ? T.red : nameCheckStatus === 'available' ? T.green : T.border}`,
                          fontSize:13, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }} autoFocus />
                      {/* Real-time availability feedback */}
                      {nameCheckStatus === 'checking' && (
                        <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>Checking availability…</div>
                      )}
                      {nameCheckStatus === 'available' && (
                        <div style={{ fontSize:11, color:T.green, marginTop:4, fontWeight:600 }}>✓ {nameCheckMsg}</div>
                      )}
                      {nameCheckStatus === 'taken' && (
                        <div style={{ fontSize:11, color:T.red, marginTop:4, fontWeight:600 }}>✕ {nameCheckMsg}</div>
                      )}
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:6, fontWeight:600 }}>Description (Optional)</label>
                      <input type="text" value={newGroupDesc} onChange={e=>setNewGroupDesc(e.target.value)} placeholder="Brief description..."
                        style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, fontSize:13, outline:"none", boxSizing:"border-box" }} />
                    </div>
                    <div>
                      <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:6, fontWeight:600 }}>Color Label</label>
                      <div style={{ display:"flex", gap:8 }}>
                        {["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#64748B"].map(c => (
                          <div key={c} onClick={()=>setNewGroupColor(c)} style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer", border:`2px solid ${newGroupColor===c ? T.sidebar : "transparent"}` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, background:T.bg, display:"flex", justifyContent:"flex-end", gap:12 }}>
                    <button onClick={()=>{ setShowCreateGroup(false); setSelectedGroupId(""); setNameCheckStatus(null); setNameCheckMsg(""); }} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>Cancel</button>
                    <button onClick={handleCreateGroup} disabled={creatingGroup || nameCheckStatus === 'taken' || nameCheckStatus === 'checking'}
                      style={{ padding:"8px 16px", borderRadius:8, border:"none",
                        background: (creatingGroup || nameCheckStatus === 'taken' || nameCheckStatus === 'checking') ? T.muted : T.blue,
                        color:"#fff", fontSize:13, fontWeight:600,
                        cursor:(creatingGroup || nameCheckStatus === 'taken' || nameCheckStatus === 'checking') ? "not-allowed" : "pointer" }}>
                      {creatingGroup ? "Creating…" : "Create Group"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: IMPORTING */}
        {step === 3 && (
          <div style={{ textAlign:"center", padding:"48px 24px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:T.greenLight, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2" style={{ animation:"spin 1s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>Importing contacts…</div>
            <div style={{ fontSize:13, color:T.subtle, marginBottom:28 }}>Processing {Math.round(Math.min(progress,100))}%</div>
            <div style={{ width:320, margin:"0 auto", height:8, background:T.border, borderRadius:99, overflow:"hidden" }}>
              <div style={{ height:"100%", background:T.green, borderRadius:99, width:`${Math.min(progress,100)}%`, transition:"width .2s" }}/>
            </div>
            <div style={{ marginTop:10, fontFamily:T.mono, fontSize:13, color:T.green, fontWeight:700 }}>{Math.round(Math.min(progress,100))}%</div>
          </div>
        )}

        {/* STEP 4: DONE */}
        {step === 4 && (
          <div style={{ textAlign:"center", padding:"48px 24px" }}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:T.greenLight, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={T.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:8 }}>Import complete!</div>
            <div style={{ fontSize:13, color:T.subtle, marginBottom:28 }}>Your contacts have been processed.</div>
            <div style={{ display:"flex", gap:14, justifyContent:"center", marginBottom:28 }}>
              {[{ label:"Imported", val: importResult ? (importResult.imported || 0) : csvPreview.length, color:T.green }, { label:"Duplicates", val: importResult ? (importResult.duplicates || 0) : 0, color:T.amber }, { label:"Errors", val: importResult ? (importResult.errors?.length || importResult.invalidRows?.length || 0) : 0, color:T.red }].map(s=> (
                <div key={s.label} style={{ padding:"14px 24px", background:T.card, borderRadius:10, border:`1px solid ${T.border}`, minWidth:110 }}>
                  <div style={{ fontFamily:T.mono, fontSize:26, fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:12, color:T.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={onBack} style={{ padding:"10px 24px", borderRadius:9, border:"none", background:T.green, color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>View all contacts →</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 3 — CONTACT DETAIL
───────────────────────────────────────────── */
function ContactDetailScreen({ contact, onBack }) {
  const [editing, setEditing] = useState(false);
  const [showOptOut, setShowOptOut] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [org, setOrg] = useState(contact.org);

  const saveContact = async () => {
    const id = contact._id || contact.id;
    try {
      const payload = { name, email, organisation: org, org, customFields: contact.customFields };
      const res = await contactsAPI.update(id, { name, email, org });
      if (res?.data?.success) {
        // update local contact fields
        contact.name = res.data.data.contact.name;
        contact.email = res.data.data.contact.email;
        contact.org = res.data.data.contact.org || org;
        setEditing(false);
      }
    } catch (err) {
      console.error('update contact failed', err);
    }
  };

  const optedOut = contact.status === "opted_out";

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
      <Topbar
        title={contact.name}
        subtitle={`${contact.phone} · ${contact.org}`}
        actions={
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6,
              padding:"8px 14px", borderRadius:8, border:`1px solid ${T.border}`,
              background:T.card, fontSize:13, color:T.text, cursor:"pointer" }}>
              {I.back} All contacts
            </button>
            {!optedOut && (
              <button onClick={()=>setShowOptOut(true)} style={{ display:"flex", alignItems:"center", gap:6,
                padding:"8px 14px", borderRadius:8, border:`1px solid ${T.red}30`,
                background:T.redLight, color:T.red, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                {I.optOut} Opt Out
              </button>
            )}
          </div>
        }
      />

      <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
        <div style={{ display:"flex", gap:18, alignItems:"flex-start" }}>

          {/* LEFT: PROFILE CARD */}
          <div style={{ width:280, flexShrink:0, display:"flex", flexDirection:"column", gap:14 }}>

            {/* Avatar + name */}
            <div style={{ background:T.card, borderRadius:14, padding:"24px 20px",
              border:`1px solid ${T.border}`, textAlign:"center" }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
                <Avatar name={contact.name} size={64} />
              </div>
              {editing ? (
                <input value={name} onChange={e=>setName(e.target.value)}
                  style={{ width:"100%", padding:"6px 10px", borderRadius:7, border:`1px solid ${T.green}`,
                    fontSize:15, fontWeight:700, color:T.text, textAlign:"center", fontFamily:T.font,
                    outline:"none", marginBottom:6 }}/>
              ) : (
                <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:4 }}>{name}</div>
              )}
              <div style={{ marginBottom:12 }}><StatusBadge status={contact.status}/></div>
              <div style={{ display:"flex", gap:6, justifyContent:"center", marginBottom:16 }}>
                {[...new Set(contact.tags)].map(t=><Tag key={t} label={t}/>)}
              </div>
              <button onClick={()=>editing ? saveContact() : setEditing(true)} style={{
                width:"100%", padding:"8px", borderRadius:8,
                border:`1px solid ${editing ? T.green : T.border}`,
                background: editing ? T.green : T.card,
                color: editing ? "#fff" : T.text,
                fontSize:13, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {editing ? <>{I.check} Save changes</> : <>{I.edit} Edit contact</>}
              </button>
            </div>

            {/* Contact info */}
            <div style={{ background:T.card, borderRadius:12, padding:"16px 18px",
              border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, letterSpacing:"0.06em",
                textTransform:"uppercase", marginBottom:12 }}>Contact info</div>
              {[
                { icon:I.phone,    label:"Phone",   val:contact.phone, mono:true },
                { icon:I.mail,     label:"Email",   val:email,         edit:true },
                { icon:I.org,      label:"Org",     val:org,           edit:true },
              ].map(row=>(
                <div key={row.label} style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:12 }}>
                  <div style={{ width:28, height:28, borderRadius:6, background:T.bg,
                    display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, flexShrink:0 }}>
                    {row.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:10, color:T.subtle, marginBottom:2 }}>{row.label}</div>
                    {editing && row.edit ? (
                      <input value={row.label==="Email"?email:org}
                        onChange={e=>row.label==="Email"?setEmail(e.target.value):setOrg(e.target.value)}
                        style={{ width:"100%", padding:"5px 8px", borderRadius:6,
                          border:`1px solid ${T.green}`, fontSize:12, fontFamily:T.font, outline:"none" }}/>
                    ) : (
                      <div style={{ fontSize:12, color:T.text, fontFamily: row.mono?T.mono:"inherit",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.val}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Opt-in info */}
            <div style={{ background: optedOut ? T.redLight : T.greenLight, borderRadius:12,
              padding:"16px 18px", border:`1px solid ${optedOut?"#FECACA":"#6EE7B7"}` }}>
              <div style={{ fontSize:11, fontWeight:700,
                color: optedOut ? "#7F1D1D" : T.greenDark,
                letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:12 }}>
                Opt-in status
              </div>
              {[
                { label:"Status",  val:<StatusBadge status={contact.status} size="sm"/> },
                { label:"Source",  val:contact.source.replace(/_/g," ") },
                { label:"Date",    val:contact.optDate },
                { label:"Messages",val:`${contact.msgs} sent` },
              ].map(r=>(
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, color: optedOut?"#B91C1C":T.greenDark }}>{r.label}</span>
                  <span style={{ fontSize:11, fontWeight:600,
                    color: optedOut?"#7F1D1D":T.greenDark }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Stats mini */}
            <div style={{ display:"flex", gap:10 }}>
              {[
                { label:"Sent",  val:contact.msgs, color:T.blue   },
                { label:"Read",  val:Math.round(contact.msgs*0.71), color:T.green  },
              ].map(s=>(
                <div key={s.label} style={{ flex:1, background:T.card, borderRadius:10,
                  padding:"12px 14px", border:`1px solid ${T.border}`, textAlign:"center" }}>
                  <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: TABS */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Tabs */}
            <div style={{ display:"flex", gap:0, marginBottom:16,
              background:T.card, borderRadius:10, padding:4, border:`1px solid ${T.border}`,
              width:"fit-content" }}>
              {[
                { key:"messages", label:`Messages (${MESSAGE_HISTORY.length})` },
                { key:"lists",    label:"Lists & tags" },
              ].map(tab=>(
                <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                  style={{ padding:"7px 16px", borderRadius:7, border:"none", cursor:"pointer", fontSize:13,
                    background: activeTab===tab.key ? T.green : "transparent",
                    color: activeTab===tab.key ? "#fff" : T.muted,
                    fontWeight: activeTab===tab.key ? 600 : 400, transition:"all .15s" }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* MESSAGE HISTORY */}
            {activeTab === "messages" && (
              <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, background:T.bg,
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Message history</div>
                  <span style={{ fontSize:11, color:T.muted }}>All {MESSAGE_HISTORY.length} messages sent to {contact.name.split(" ")[0]}</span>
                </div>
                <div>
                  {MESSAGE_HISTORY.map((msg, i) => (
                    <div key={msg.id} style={{
                      padding:"16px 18px",
                      borderBottom: i < MESSAGE_HISTORY.length-1 ? `1px solid ${T.border}` : "none",
                      display:"flex", gap:14, alignItems:"flex-start",
                    }}>
                      {/* Timeline dot */}
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:0, paddingTop:3, flexShrink:0 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0,
                          background: MSG_STATUS_CFG[msg.status]?.bg,
                          border:`2px solid ${msg.status==="failed"?T.red:msg.status==="read"?T.green:T.blue}` }}/>
                        {i < MESSAGE_HISTORY.length-1 && (
                          <div style={{ width:1, height:"100%", minHeight:20, background:T.border, marginTop:4 }}/>
                        )}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                          <span style={{ fontWeight:600, fontSize:13, color:T.text }}>{msg.campaign}</span>
                          <MsgBadge status={msg.status}/>
                          {msg.error && (
                            <span style={{ fontSize:10, color:T.red, background:T.redLight,
                              padding:"2px 7px", borderRadius:20 }}>{msg.error}</span>
                          )}
                        </div>
                        <div style={{ fontSize:11, color:T.subtle, marginBottom:6 }}>
                          Template: <span style={{ fontFamily:T.mono, color:T.muted }}>{msg.template}</span>
                        </div>
                        <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                          {[
                            { label:"Sent",      val:msg.sent,      show:true },
                            { label:"Delivered", val:msg.delivered, show:!!msg.delivered },
                            { label:"Read",      val:msg.read,      show:!!msg.read },
                          ].filter(r=>r.show).map(r=>(
                            <div key={r.label} style={{ fontSize:11 }}>
                              <span style={{ color:T.subtle }}>{r.label}: </span>
                              <span style={{ color:T.muted, fontFamily:T.mono }}>{r.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LISTS & TAGS */}
            {activeTab === "lists" && (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}` }}>
                  <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`, background:T.bg }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Tags</div>
                  </div>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                      {[...new Set(contact.tags)].map(t=>(
                        <div key={t} style={{ display:"flex", alignItems:"center", gap:5 }}>
                          <Tag label={t}/>
                          <button style={{ width:16, height:16, borderRadius:"50%", border:"none",
                            background:T.border, cursor:"pointer", fontSize:10, color:T.muted, lineHeight:1 }}>×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:12, color:T.subtle }}>Add tags:</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                      {TAGS.filter(t=>![...new Set(contact.tags)].includes(t)).map(t=>(
                        <button key={t} style={{ padding:"3px 10px", borderRadius:20, fontSize:11,
                          border:`1px dashed ${T.borderMid}`, background:"transparent",
                          color:T.muted, cursor:"pointer" }}>
                          + {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.muted, letterSpacing:"0.05em",
                    textTransform:"uppercase", marginBottom:12 }}>Contact lists</div>
                  {["Premium Customers", "Festival Campaign 2025", "Delhi Region"].map((list,i)=>(
                    <div key={list} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"9px 0", borderBottom: i<2?`1px solid ${T.border}`:"none" }}>
                      <span style={{ fontSize:13, color:T.text }}>{list}</span>
                      <button style={{ fontSize:11, color:T.red, border:"none", background:"transparent",
                        cursor:"pointer", padding:"3px 8px" }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal open={showOptOut} onClose={()=>setShowOptOut(false)}
        onConfirm={async () => {
          try {
            const id = contact._id || contact.id;
            await contactsAPI.update(id, { optInStatus: 'opted_out' });
            contact.status = 'opted_out';
          } catch (err) { console.error('opt-out failed', err); }
          setShowOptOut(false);
        }}
        title={`Opt out ${contact.name}?`}
        msg="This contact will stop receiving all WhatsApp messages. They can only re-opt-in by messaging your business number directly."
        label="Opt Out Contact"/>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT — VIEW ROUTER
───────────────────────────────────────────── */
export default function ContactsModule() {
  const [view, setView] = useState("list"); // "list" | "import" | "detail"
  const [selectedContact, setSelectedContact] = useState(null);

  const handleViewContact = (c) => { setSelectedContact(c); setView("detail"); };
  const handleImport      = ()  => setView("import");
  const handleBack        = ()  => { setView("list"); setSelectedContact(null); };

  return (
    <div style={{ fontFamily:T.font, display:"flex", minHeight:"100vh", background:T.bg }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        select:focus, input:focus { box-shadow: 0 0 0 3px ${T.green}22; }
      `}</style>

      <Sidebar view={view} setView={setView}/>

      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {view === "list"   && <ContactsListScreen   onViewContact={handleViewContact} onImport={handleImport}/>}
        {view === "import" && <ImportScreen          onBack={handleBack}/>}
        {view === "detail" && selectedContact &&
          <ContactDetailScreen contact={selectedContact} onBack={handleBack}/>}
      </div>
    </div>
  );
}

// export ImportScreen so ImportPage can reuse it
export { ImportScreen };
