import { useState, useCallback, useRef, useEffect } from "react";

/* ─────────────────────────────────────────────
   DESIGN TOKENS — consistent with Dashboard & Contacts
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
  indigo:      "#4338CA",
  text:        "#0F172A",
  muted:       "#64748B",
  subtle:      "#94A3B8",
  border:      "#E2E8F0",
  borderMid:   "#CBD5E1",
  font:        "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono:        "'DM Mono', 'SF Mono', monospace",
  // WhatsApp phone colors
  waBg:        "#ECE5DD",
  waMsgBg:     "#DCF8C6",
  waSystemBg:  "#FFF3CD",
  waHeaderBg:  "#075E54",
};

/* ─────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────── */
const TEMPLATES = [
  {
    id: 1, name: "festival_promo_diwali", displayName: "Festival Promo — Diwali",
    category: "MARKETING", language: "en", status: "APPROVED",
    header: { type: "TEXT", text: "🪔 Big Diwali Sale is Here!" },
    body: "Hi {{1}}, this Diwali get *{{2}}% OFF* on all orders above ₹{{3}}. Use code *DIWALI{{4}}* at checkout. Valid till {{5}} only! 🎉",
    footer: "Reply STOP to unsubscribe",
    buttons: [{ type: "URL", text: "Shop Now", url: "https://shop.example.com" }, { type: "QUICK_REPLY", text: "Get Offer" }],
    variables: ["1","2","3","4","5"], readRate: 78.4, sent: 12400, createdAt: "Jan 5, 2025",
  },
  {
    id: 2, name: "order_confirmation", displayName: "Order Confirmation",
    category: "UTILITY", language: "en", status: "APPROVED",
    header: { type: "TEXT", text: "✅ Order Confirmed!" },
    body: "Hello {{1}}, your order *#{{2}}* has been confirmed!\n\n📦 Items: {{3}}\n💰 Total: ₹{{4}}\n🚚 Estimated delivery: {{5}}\n\nTrack your order anytime below.",
    footer: "Acme Store — support@acme.com",
    buttons: [{ type: "URL", text: "Track Order", url: "https://track.example.com" }],
    variables: ["1","2","3","4","5"], readRate: 68.9, sent: 22100, createdAt: "Dec 12, 2024",
  },
  {
    id: 3, name: "cart_abandonment_v2", displayName: "Cart Recovery",
    category: "MARKETING", language: "en", status: "APPROVED",
    header: { type: "TEXT", text: "🛒 You left something behind!" },
    body: "Hey {{1}}, you have items in your cart worth ₹{{2}}.\n\nWe're holding them for you for the next *24 hours*. Complete your purchase now and get *free shipping* on us! 🎁",
    footer: null,
    buttons: [{ type: "URL", text: "Complete Purchase", url: "https://cart.example.com" }, { type: "QUICK_REPLY", text: "Not Interested" }],
    variables: ["1","2"], readRate: 71.2, sent: 8900, createdAt: "Jan 20, 2025",
  },
  {
    id: 4, name: "otp_verification", displayName: "OTP Verification",
    category: "AUTHENTICATION", language: "en", status: "APPROVED",
    header: { type: "TEXT", text: "🔐 Verification Code" },
    body: "Your verification code for Acme is *{{1}}*.\n\nThis code expires in *{{2}} minutes*. Do not share this with anyone.",
    footer: "Acme Security Team",
    buttons: [],
    variables: ["1","2"], readRate: 91.3, sent: 54200, createdAt: "Nov 8, 2024",
  },
  {
    id: 5, name: "weekly_newsletter", displayName: "Weekly Newsletter",
    category: "MARKETING", language: "en", status: "REJECTED",
    header: { type: "TEXT", text: "📰 This Week at Acme" },
    body: "Hi {{1}}, here's what's happening this week:\n\n• {{2}}\n• {{3}}\n• {{4}}\n\nRead the full newsletter for exclusive deals!",
    footer: "Manage your preferences",
    buttons: [{ type: "URL", text: "Read Newsletter", url: "https://news.example.com" }],
    variables: ["1","2","3","4"], readRate: null, sent: 0, createdAt: "Feb 14, 2025",
    rejectionReason: "Marketing message contains excessive promotional language and emoji usage beyond policy limits.",
  },
  {
    id: 6, name: "payment_reminder", displayName: "Payment Reminder",
    category: "UTILITY", language: "en", status: "PENDING",
    header: { type: "TEXT", text: "💳 Payment Due" },
    body: "Dear {{1}}, your invoice *#{{2}}* for ₹{{3}} is due on *{{4}}*.\n\nPlease complete payment to avoid late fees. Contact us if you have any questions.",
    footer: "Acme Billing — billing@acme.com",
    buttons: [{ type: "URL", text: "Pay Now", url: "https://pay.example.com" }, { type: "QUICK_REPLY", text: "Need Help" }],
    variables: ["1","2","3","4"], readRate: null, sent: 0, createdAt: "Mar 10, 2025",
  },
  {
    id: 7, name: "product_launch_announcement", displayName: "Product Launch",
    category: "MARKETING", language: "en", status: "APPROVED",
    header: { type: "TEXT", text: "🚀 New Product Alert!" },
    body: "Exciting news, {{1}}! We just launched *{{2}}* — our most awaited product of the year.\n\n⭐ Price: ₹{{3}}\n🎯 Early bird offer: {{4}}% OFF for the first 100 buyers!",
    footer: null,
    buttons: [{ type: "URL", text: "Buy Now", url: "https://shop.example.com/new" }, { type: "QUICK_REPLY", text: "Tell Me More" }],
    variables: ["1","2","3","4"], readRate: 62.1, sent: 9800, createdAt: "Mar 1, 2025",
  },
  {
    id: 8, name: "appointment_reminder", displayName: "Appointment Reminder",
    category: "UTILITY", language: "hi", status: "APPROVED",
    header: { type: "TEXT", text: "📅 Appointment Reminder" },
    body: "Dear {{1}}, this is a reminder for your appointment with *{{2}}* on *{{3}}* at {{4}}.\n\nPlease arrive 10 minutes early. Reply YES to confirm or NO to reschedule.",
    footer: "Acme Services",
    buttons: [{ type: "QUICK_REPLY", text: "Confirm ✅" }, { type: "QUICK_REPLY", text: "Reschedule" }],
    variables: ["1","2","3","4"], readRate: 84.7, sent: 3200, createdAt: "Feb 28, 2025",
  },
];

const CATEGORY_CFG = {
  MARKETING:      { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D", label: "Marketing"      },
  UTILITY:        { bg: "#EFF6FF", color: "#1D4ED8", border: "#93C5FD", label: "Utility"        },
  AUTHENTICATION: { bg: "#F5F3FF", color: "#5B21B6", border: "#C4B5FD", label: "Authentication" },
};

const STATUS_CFG = {
  APPROVED: { bg: "#DCFCE7", color: "#166534", dot: "#22C55E", label: "Approved" },
  PENDING:  { bg: "#FEF3C7", color: "#78350F", dot: "#F59E0B", label: "Pending"  },
  REJECTED: { bg: "#FEE2E2", color: "#7F1D1D", dot: "#EF4444", label: "Rejected" },
};

const LANGUAGES = [
  { code: "en", label: "English" }, { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi"  }, { code: "ta", label: "Tamil"  },
  { code: "te", label: "Telugu"   }, { code: "kn", label: "Kannada" },
  { code: "gu", label: "Gujarati" }, { code: "bn", label: "Bengali" },
];

/* ─────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────── */
const NAV_LABELS = ["Dashboard","Contacts","Templates","Campaigns","Analytics","Reports","Opt-In / Out"];

function Sidebar() {
  return (
    <div style={{ width: 200, flexShrink: 0, background: T.sidebar, display: "flex",
      flexDirection: "column", height: "100vh", position: "sticky", top: 0,
      borderRight: "1px solid #1A2744" }}>
      <div style={{ padding: "18px 16px 14px", borderBottom: "1px solid #1A2744",
        display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.green,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L0 24l6.35-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.002-1.368l-.36-.213-3.71.883.939-3.61-.236-.371A9.79 9.79 0 0 1 2.182 12C2.182 6.573 6.573 2.182 12 2.182S21.818 6.573 21.818 12 17.427 21.818 12 21.818z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>WA Platform</div>
          <div style={{ fontSize: 9, color: "#475569" }}>Enterprise</div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
        {NAV_LABELS.map(label => {
          const active = label === "Templates";
          return (
            <div key={label} style={{ padding: "8px 10px", borderRadius: 7, marginBottom: 2,
              fontSize: 12, fontWeight: active ? 600 : 400,
              color: active ? "#fff" : "#94A3B8",
              background: active ? T.green : "transparent", cursor: "pointer" }}>
              {label}
            </div>
          );
        })}
      </nav>
      <div style={{ padding: "12px 14px", borderTop: "1px solid #1A2744",
        display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.green,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: "#fff" }}>PA</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#E2E8F0" }}>Piyush Admin</div>
          <div style={{ fontSize: 9, color: "#475569" }}>Super Admin</div>
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
    <div style={{ height: 56, background: T.card, borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12,
      position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 10, color: T.subtle }}>{subtitle}</div>}
      </div>
      {actions}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS + CATEGORY BADGES
───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.PENDING;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color,
      fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot,
        ...(status === "PENDING" ? { animation: "pulse 2s infinite" } : {}) }} />
      {cfg.label}
    </span>
  );
}

function CategoryBadge({ category }) {
  const cfg = CATEGORY_CFG[category] || CATEGORY_CFG.UTILITY;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────── */
function ConfirmModal({ open, onClose, onConfirm, title, msg, label = "Confirm", danger = false }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 14,
        width: 400, padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,.25)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12,
          background: danger ? T.redLight : T.amberLight,
          display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24"
            stroke={danger ? T.red : T.amber} strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 22, lineHeight: 1.6 }}>{msg}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8,
            border: `1px solid ${T.border}`, background: T.card,
            fontSize: 13, color: T.text, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "8px 16px", borderRadius: 8, border: "none",
            background: danger ? T.red : T.amber, color: "#fff",
            fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{label}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   WHATSAPP PHONE PREVIEW
───────────────────────────────────────────── */
function parseBody(body, vars) {
  if (!body) return "";
  let txt = body;
  Object.entries(vars).forEach(([k, v]) => {
    txt = txt.replaceAll(`{{${k}}}`, v ? `*${v}*` : `{{${k}}}`);
  });
  return txt;
}

function renderWAText(text) {
  // Convert *bold* to <strong>, \n to <br>
  const parts = text.split(/(\*[^*]+\*|\n)/g);
  return parts.map((p, i) => {
    if (p === "\n") return <br key={i} />;
    if (p.startsWith("*") && p.endsWith("*")) return <strong key={i}>{p.slice(1, -1)}</strong>;
    return <span key={i}>{p}</span>;
  });
}

function PhonePreview({ template, sampleVars }) {
  const body = parseBody(template.body || "", sampleVars);
  const headerText = template.header?.text
    ? parseBody(template.header.text, sampleVars)
    : null;

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ width: 260, flexShrink: 0, userSelect: "none" }}>
      {/* Phone shell */}
      <div style={{ background: "#1C1C1E", borderRadius: 32, padding: "12px 6px 16px",
        boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        {/* Notch */}
        <div style={{ width: 80, height: 6, borderRadius: 99, background: "#333",
          margin: "0 auto 8px" }} />
        {/* Screen */}
        <div style={{ background: T.waBg, borderRadius: 24, overflow: "hidden",
          minHeight: 420 }}>
          {/* WA Header */}
          <div style={{ background: T.waHeaderBg, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#25D366",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              A
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Acme Store</div>
              <div style={{ fontSize: 10, color: "#B2DFDB" }}>Business Account</div>
            </div>
          </div>

          {/* Chat area */}
          <div style={{ padding: "10px 8px", display: "flex", flexDirection: "column",
            gap: 6, background: T.waBg, backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8bfb8' fill-opacity='0.18'%3E%3Cpath d='M20 20c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10S20 25.5 20 20zm-20 0c0-5.5 4.5-10 10-10s10 4.5 10 10S15.5 30 10 30 0 25.5 0 20z'/%3E%3C/g%3E%3C/svg%3E\")" }}>

            {/* System message */}
            <div style={{ background: T.waSystemBg, borderRadius: 8, padding: "5px 10px",
              fontSize: 10, color: "#6D5B40", textAlign: "center", margin: "0 auto",
              maxWidth: "85%" }}>
              Messages from business accounts are end-to-end encrypted
            </div>

            {/* Message bubble */}
            <div style={{ background: T.waMsgBg, borderRadius: "12px 12px 4px 12px",
              padding: "8px 10px 20px", maxWidth: "88%", alignSelf: "flex-start",
              boxShadow: "0 1px 2px rgba(0,0,0,.12)", position: "relative" }}>

              {/* Header */}
              {headerText && (
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A",
                  marginBottom: 6, borderBottom: "1px solid #B8E6C0", paddingBottom: 6 }}>
                  {renderWAText(headerText)}
                </div>
              )}

              {/* Body */}
              <div style={{ fontSize: 12, color: "#1A1A1A", lineHeight: 1.55,
                whiteSpace: "pre-line", wordBreak: "break-word" }}>
                {renderWAText(body)}
              </div>

              {/* Footer */}
              {template.footer && (
                <div style={{ fontSize: 10, color: "#8A8A8A", marginTop: 6,
                  borderTop: "1px solid #C8E6C0", paddingTop: 5 }}>
                  {template.footer}
                </div>
              )}

              {/* Timestamp */}
              <div style={{ position: "absolute", bottom: 5, right: 8,
                fontSize: 9, color: "#67A860", display: "flex", alignItems: "center", gap: 3 }}>
                {now}
                <svg width="14" height="8" viewBox="0 0 18 10" fill="#67A860">
                  <path d="M1 5l4 4L15 1M6 5l4 4L22 1" stroke="#67A860" strokeWidth="2" fill="none"/>
                </svg>
              </div>
            </div>

            {/* Quick reply / URL buttons */}
            {template.buttons && template.buttons.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: "88%" }}>
                {template.buttons.map((btn, i) => (
                  <div key={i} style={{ background: T.waMsgBg, borderRadius: 8, padding: "8px 10px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    boxShadow: "0 1px 2px rgba(0,0,0,.12)", cursor: "pointer" }}>
                    {btn.type === "URL" ? (
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                        stroke="#00A884" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    ) : (
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                        stroke="#00A884" strokeWidth="2">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                      </svg>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#00A884" }}>{btn.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview label */}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 11,
        color: T.subtle, fontStyle: "italic" }}>
        Live preview
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TEMPLATE CARD (for list view)
───────────────────────────────────────────── */
function TemplateCard({ tmpl, onEdit, onView, onDelete, onSubmit }) {
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const catCfg = CATEGORY_CFG[tmpl.category] || CATEGORY_CFG.UTILITY;
  const bodyPreview = (tmpl.body || "").replace(/\*([^*]+)\*/g, "$1").slice(0, 100);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
          borderTop: `3px solid ${catCfg.border}`,
          overflow: "hidden", cursor: "pointer",
          transition: "box-shadow .2s, transform .2s",
          boxShadow: hovered ? "0 8px 28px rgba(0,0,0,.10)" : "none",
          transform: hovered ? "translateY(-2px)" : "none" }}>

        {/* Card header */}
        <div style={{ padding: "14px 16px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <CategoryBadge category={tmpl.category} />
              <StatusBadge status={tmpl.status} />
            </div>
            <div style={{ fontSize: 10, color: T.subtle, whiteSpace: "nowrap", marginLeft: 8 }}>
              {LANGUAGES.find(l => l.code === tmpl.language)?.label || tmpl.language}
            </div>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4,
            lineHeight: 1.3 }}>{tmpl.displayName}</div>
          <div style={{ fontSize: 10, color: T.subtle, fontFamily: T.mono,
            marginBottom: 10 }}>{tmpl.name}</div>

          {/* Header preview */}
          {tmpl.header?.text && (
            <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6,
              padding: "5px 9px", background: T.bg, borderRadius: 6,
              borderLeft: `3px solid ${catCfg.border}` }}>
              {tmpl.header.text}
            </div>
          )}

          {/* Body preview */}
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.55 }}>
            {bodyPreview}{tmpl.body?.length > 100 ? "…" : ""}
          </div>
        </div>

        {/* Variables */}
        {tmpl.variables.length > 0 && (
          <div style={{ padding: "0 16px 10px",
            display: "flex", gap: 4, flexWrap: "wrap" }}>
            {tmpl.variables.slice(0, 5).map(v => (
              <span key={v} style={{ padding: "2px 7px", borderRadius: 20, fontSize: 10,
                fontFamily: T.mono, background: "#F1F5F9", color: T.muted,
                border: `1px solid ${T.border}` }}>
                {`{{${v}}}`}
              </span>
            ))}
            {tmpl.variables.length > 5 && (
              <span style={{ fontSize: 10, color: T.subtle }}>+{tmpl.variables.length - 5}</span>
            )}
          </div>
        )}

        {/* Rejection reason */}
        {tmpl.status === "REJECTED" && tmpl.rejectionReason && (
          <div style={{ margin: "0 16px 10px", padding: "8px 10px", background: T.redLight,
            borderRadius: 8, fontSize: 11, color: "#7F1D1D", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>Rejected: </span>{tmpl.rejectionReason}
          </div>
        )}

        {/* Stats */}
        {tmpl.status === "APPROVED" && (
          <div style={{ padding: "8px 16px", background: T.bg,
            borderTop: `1px solid ${T.border}`,
            display: "flex", gap: 16 }}>
            <div>
              <div style={{ fontSize: 9, color: T.subtle, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>Sent</div>
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700,
                color: T.text }}>{tmpl.sent.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: T.subtle, textTransform: "uppercase",
                letterSpacing: "0.06em" }}>Open rate</div>
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700,
                color: T.green }}>{tmpl.readRate}%</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: T.subtle, marginBottom: 3,
                textTransform: "uppercase", letterSpacing: "0.06em" }}>Rate</div>
              <div style={{ height: 5, background: T.border, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${tmpl.readRate}%`, height: "100%",
                  background: `linear-gradient(90deg, ${T.green}, ${T.blue})`,
                  borderRadius: 99 }} />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.border}`,
          display: "flex", gap: 6, justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={e => { e.stopPropagation(); onView(tmpl); }}
              style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${T.border}`,
                background: T.card, fontSize: 11, color: T.muted, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              Preview
            </button>
            <button onClick={e => { e.stopPropagation(); onEdit(tmpl); }}
              style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${T.border}`,
                background: T.card, fontSize: 11, color: T.muted, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {tmpl.status !== "APPROVED" && (
              <button onClick={e => { e.stopPropagation(); setConfirmSubmit(true); }}
                style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${T.green}`,
                  background: T.greenLight, fontSize: 11, color: T.greenDark,
                  fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4 }}>
                <svg width="11" height="11" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Submit to WA
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${T.border}`,
                background: T.card, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: T.red }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete} onClose={() => setConfirmDelete(false)}
        onConfirm={() => setConfirmDelete(false)}
        title={`Delete "${tmpl.displayName}"?`}
        msg="This template will be permanently removed. Any campaigns using it will need a new template."
        label="Delete Template" danger />
      <ConfirmModal
        open={confirmSubmit} onClose={() => setConfirmSubmit(false)}
        onConfirm={() => setConfirmSubmit(false)}
        title={`Submit to WhatsApp?`}
        msg={`"${tmpl.displayName}" will be sent to Meta for review. Approval usually takes 24–48 hours. You'll be notified when it's ready.`}
        label="Submit Now" />
    </>
  );
}

/* ─────────────────────────────────────────────
   PREVIEW DRAWER MODAL
───────────────────────────────────────────── */
function PreviewDrawer({ template, onClose, onEdit }) {
  if (!template) return null;
  const sampleVars = {};
  (template.variables || []).forEach(v => {
    const samples = { "1": "Priya", "2": "40", "3": "999", "4": "2025", "5": "March 31" };
    sampleVars[v] = samples[v] || `value_${v}`;
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0,
      background: "rgba(15,23,42,.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.card,
        borderRadius: 18, width: 700, maxWidth: "95vw", maxHeight: "92vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,.3)" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{template.displayName}</div>
            <div style={{ fontSize: 11, color: T.subtle, fontFamily: T.mono }}>{template.name}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <CategoryBadge category={template.category} />
            <StatusBadge status={template.status} />
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.bg, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: T.muted }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px",
          display: "flex", gap: 24, alignItems: "flex-start" }}>
          {/* Left: details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Header
              </div>
              <div style={{ padding: "10px 14px", background: T.bg, borderRadius: 9,
                fontSize: 13, fontWeight: 600, color: T.text }}>
                {template.header?.text || <span style={{ color: T.subtle }}>No header</span>}
              </div>
            </div>
            {/* Body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Body
              </div>
              <div style={{ padding: "12px 14px", background: T.bg, borderRadius: 9,
                fontSize: 13, color: T.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                {template.body}
              </div>
            </div>
            {/* Footer */}
            {template.footer && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Footer
                </div>
                <div style={{ padding: "8px 14px", background: T.bg, borderRadius: 9,
                  fontSize: 12, color: T.muted }}>{template.footer}</div>
              </div>
            )}
            {/* Buttons */}
            {template.buttons.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted,
                  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  Buttons ({template.buttons.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {template.buttons.map((btn, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", background: T.bg, borderRadius: 8,
                      border: `1px solid ${T.border}` }}>
                      <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 9,
                        fontWeight: 700, background: btn.type === "URL" ? T.blueLight : T.greenLight,
                        color: btn.type === "URL" ? T.blue : T.green }}>{btn.type}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{btn.text}</span>
                      {btn.url && (
                        <span style={{ fontSize: 10, color: T.subtle, fontFamily: T.mono,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {btn.url}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Variables */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Variables ({template.variables.length})
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {template.variables.map(v => (
                  <span key={v} style={{ padding: "3px 9px", borderRadius: 20,
                    fontSize: 11, fontFamily: T.mono, background: "#F1F5F9",
                    border: `1px solid ${T.border}`, color: T.muted }}>{`{{${v}}}`}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: phone */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <PhonePreview template={template} sampleVars={sampleVars} />
            <button onClick={() => { onEdit(template); onClose(); }}
              style={{ padding: "9px 20px", borderRadius: 9, border: "none",
                background: T.green, color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", width: "100%" }}>
              Edit Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 1 — TEMPLATES LIST
───────────────────────────────────────────── */
function TemplatesListScreen({ onNew, onEdit }) {
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statFilter, setStatFilter] = useState("ALL");
  const [previewTmpl, setPreviewTmpl] = useState(null);
  const [sortBy, setSortBy]       = useState("recent");

  const filtered = TEMPLATES.filter(t => {
    const q = search.toLowerCase();
    const ms = !search || t.displayName.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
    const cs = catFilter === "ALL" || t.category === catFilter;
    const ss = statFilter === "ALL" || t.status === statFilter;
    return ms && cs && ss;
  }).sort((a, b) => {
    if (sortBy === "readRate") return (b.readRate || 0) - (a.readRate || 0);
    if (sortBy === "sent")     return b.sent - a.sent;
    return b.id - a.id;
  });

  const counts = {
    ALL:      TEMPLATES.length,
    APPROVED: TEMPLATES.filter(t => t.status === "APPROVED").length,
    PENDING:  TEMPLATES.filter(t => t.status === "PENDING").length,
    REJECTED: TEMPLATES.filter(t => t.status === "REJECTED").length,
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <Topbar
        title="Templates"
        subtitle={`${TEMPLATES.length} templates · ${counts.APPROVED} approved · ${counts.PENDING} pending review`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onNew} style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8, border: "none",
              background: T.green, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Template
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

        {/* STATUS PILLS */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { key: "ALL",      label: "All",      color: T.blue  },
            { key: "APPROVED", label: "Approved", color: T.green },
            { key: "PENDING",  label: "Pending",  color: T.amber },
            { key: "REJECTED", label: "Rejected", color: T.red   },
          ].map(s => (
            <button key={s.key} onClick={() => setStatFilter(s.key)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "7px 13px", borderRadius: 9, cursor: "pointer", transition: "all .15s",
              border: `1.5px solid ${statFilter === s.key ? s.color : T.border}`,
              background: statFilter === s.key ? `${s.color}14` : T.card,
            }}>
              <span style={{ fontFamily: T.mono, fontSize: 17, fontWeight: 700,
                color: statFilter === s.key ? s.color : T.text }}>{counts[s.key]}</span>
              <span style={{ fontSize: 11,
                color: statFilter === s.key ? s.color : T.muted }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* FILTER BAR */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8,
            background: T.card, borderRadius: 8, padding: "7px 12px",
            border: `1px solid ${T.border}` }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
              stroke={T.subtle} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…"
              style={{ border: "none", background: "transparent", outline: "none",
                fontSize: 12, color: T.text, width: "100%", fontFamily: T.font }} />
          </div>

          {/* Category */}
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.card, fontSize: 12, color: catFilter !== "ALL" ? T.text : T.muted,
              cursor: "pointer", fontFamily: T.font, outline: "none",
              fontWeight: catFilter !== "ALL" ? 600 : 400 }}>
            <option value="ALL">All categories</option>
            <option value="MARKETING">Marketing</option>
            <option value="UTILITY">Utility</option>
            <option value="AUTHENTICATION">Authentication</option>
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.card, fontSize: 12, color: T.muted,
              cursor: "pointer", fontFamily: T.font, outline: "none" }}>
            <option value="recent">Sort: Newest</option>
            <option value="readRate">Sort: Open Rate</option>
            <option value="sent">Sort: Most Sent</option>
          </select>
        </div>

        {/* GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14 }}>
          {filtered.map(t => (
            <TemplateCard key={t.id} tmpl={t}
              onEdit={onEdit} onView={setPreviewTmpl}
              onDelete={() => {}} onSubmit={() => {}} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", color: T.subtle, fontSize: 13 }}>
            No templates match your filters
          </div>
        )}
      </div>

      {previewTmpl && (
        <PreviewDrawer template={previewTmpl} onClose={() => setPreviewTmpl(null)} onEdit={onEdit} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SCREEN 2 — TEMPLATE BUILDER
───────────────────────────────────────────── */
const EMPTY_TEMPLATE = {
  name: "", displayName: "", category: "MARKETING", language: "en",
  header: { type: "TEXT", text: "" },
  body: "", footer: "", buttons: [],
  variables: [],
};

function TemplateBuilderScreen({ editTemplate, onBack }) {
  const isEdit = !!editTemplate;
  const initial = editTemplate ? { ...editTemplate } : { ...EMPTY_TEMPLATE };

  const [form, setForm]           = useState(initial);
  const [charCount, setCharCount] = useState(initial.body?.length || 0);
  const [sampleVars, setSampleVars] = useState({});
  const [activeSection, setActiveSection] = useState("header");
  const [saved, setSaved]         = useState(false);

  // Extract variables from body in real time
  const extractVars = useCallback((text) => {
    const matches = [...new Set((text.match(/\{\{(\d+)\}\}/g) || [])
      .map(m => m.replace(/\{\{|\}\}/g, "")))];
    return matches.sort((a, b) => Number(a) - Number(b));
  }, []);

  const updateBody = (val) => {
    const vars = extractVars(val);
    setForm(f => ({ ...f, body: val, variables: vars }));
    setCharCount(val.length);
  };

  const addButton = (type) => {
    if (form.buttons.length >= 3) return;
    setForm(f => ({
      ...f,
      buttons: [...f.buttons, { type, text: "", ...(type === "URL" ? { url: "" } : {}) }]
    }));
  };

  const removeButton = (i) => {
    setForm(f => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));
  };

  const updateButton = (i, key, val) => {
    setForm(f => {
      const btns = [...f.buttons];
      btns[i] = { ...btns[i], [key]: val };
      return { ...f, buttons: btns };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sectionClass = (key) => ({
    padding: "16px",
    background: activeSection === key ? T.card : "transparent",
    borderRadius: 10,
    border: `1px solid ${activeSection === key ? T.border : "transparent"}`,
    marginBottom: 8,
    cursor: "pointer",
    transition: "all .2s",
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
      <Topbar
        title={isEdit ? `Edit: ${editTemplate.displayName}` : "Create Template"}
        subtitle="Build your WhatsApp message template — preview updates live"
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={onBack} style={{ padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.card,
              fontSize: 12, color: T.text, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
            {saved && (
              <span style={{ fontSize: 12, color: T.green, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                  stroke={T.green} strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved!
              </span>
            )}
            <button onClick={handleSave} style={{ padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: T.card,
              fontSize: 12, color: T.text, cursor: "pointer" }}>
              Save Draft
            </button>
            <button onClick={handleSave} style={{ padding: "7px 14px", borderRadius: 8,
              border: "none", background: T.green, color: "#fff",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Submit to WhatsApp
            </button>
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", gap: 18, alignItems: "flex-start" }}>

        {/* ── LEFT: FORM ── */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* NAME + META */}
          <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
            padding: "16px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
              letterSpacing: "0.06em", marginBottom: 12 }}>Template info</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600,
                  color: T.muted, marginBottom: 4 }}>Display name</label>
                <input value={form.displayName}
                  onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                  placeholder="e.g. Diwali Offer 2025"
                  style={{ width: "100%", padding: "8px 11px", borderRadius: 8,
                    border: `1px solid ${T.border}`, fontSize: 12, color: T.text,
                    fontFamily: T.font, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600,
                  color: T.muted, marginBottom: 4 }}>Template ID (snake_case)</label>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") }))}
                  placeholder="diwali_offer_2025"
                  style={{ width: "100%", padding: "8px 11px", borderRadius: 8,
                    border: `1px solid ${T.border}`, fontSize: 12, color: T.text,
                    fontFamily: T.mono, outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600,
                  color: T.muted, marginBottom: 4 }}>Category</label>
                <select value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", padding: "8px 11px", borderRadius: 8,
                    border: `1px solid ${T.border}`, fontSize: 12, color: T.text,
                    fontFamily: T.font, outline: "none", cursor: "pointer",
                    background: T.card }}>
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600,
                  color: T.muted, marginBottom: 4 }}>Language</label>
                <select value={form.language}
                  onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                  style={{ width: "100%", padding: "8px 11px", borderRadius: 8,
                    border: `1px solid ${T.border}`, fontSize: 12, color: T.text,
                    fontFamily: T.font, outline: "none", cursor: "pointer",
                    background: T.card }}>
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* HEADER */}
          <div onClick={() => setActiveSection("header")} style={sectionClass("header")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: activeSection === "header" ? 12 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: T.blueLight,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                    stroke={T.blue} strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/>
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Header</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["NONE","TEXT"].map(opt => (
                  <button key={opt} onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, header: { ...f.header, type: opt } })); }}
                    style={{ padding: "3px 9px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600,
                      background: form.header?.type === opt ? T.blue : T.bg,
                      color: form.header?.type === opt ? "#fff" : T.muted }}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {activeSection === "header" && form.header?.type === "TEXT" && (
              <input value={form.header.text}
                onChange={e => setForm(f => ({ ...f, header: { ...f.header, text: e.target.value } }))}
                placeholder="Header text (optional, max 60 chars)"
                maxLength={60}
                style={{ width: "100%", padding: "8px 11px", borderRadius: 8,
                  border: `1px solid ${T.border}`, fontSize: 13, color: T.text,
                  fontFamily: T.font, outline: "none" }} />
            )}
            {activeSection === "header" && form.header?.type === "NONE" && (
              <div style={{ fontSize: 12, color: T.subtle }}>No header will be shown</div>
            )}
          </div>

          {/* BODY */}
          <div onClick={() => setActiveSection("body")} style={sectionClass("body")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: activeSection === "body" ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: T.greenLight,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                    stroke={T.green} strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                  Body <span style={{ color: T.red, fontSize: 11 }}>*</span>
                </span>
              </div>
              <span style={{ fontSize: 11, color: charCount > 900 ? T.red : T.subtle }}>
                {charCount} / 1024
              </span>
            </div>
            {activeSection === "body" && (
              <>
                <textarea
                  value={form.body}
                  onChange={e => updateBody(e.target.value)}
                  placeholder={"Write your message body here.\n\nUse {{1}}, {{2}}, {{3}} for dynamic variables.\nUse *text* for bold.\n\nExample:\nHi {{1}}, your order #{{2}} is confirmed!"}
                  rows={6}
                  maxLength={1024}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8,
                    border: `1px solid ${T.border}`, fontSize: 12, color: T.text,
                    fontFamily: T.font, outline: "none", resize: "vertical",
                    lineHeight: 1.65 }} />
                {/* Formatting hints */}
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "*bold*", hint: "surround with asterisks" },
                    { label: "{{1}}", hint: "add variable" },
                    { label: "\\n", hint: "line break" },
                  ].map(h => (
                    <div key={h.label} style={{ padding: "2px 8px", borderRadius: 6,
                      background: "#F1F5F9", border: `1px solid ${T.border}`,
                      fontSize: 10, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                      <code style={{ fontFamily: T.mono, color: T.purple }}>{h.label}</code>
                      <span>{h.hint}</span>
                    </div>
                  ))}
                </div>
                {/* Detected variables */}
                {form.variables.length > 0 && (
                  <div style={{ marginTop: 10, padding: "10px 12px", background: T.purpleLight,
                    borderRadius: 8, border: `1px solid #C4B5FD` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 8 }}>
                      Detected variables — enter sample values for preview:
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: 8 }}>
                      {form.variables.map(v => (
                        <div key={v}>
                          <label style={{ display: "block", fontSize: 10, fontFamily: T.mono,
                            color: T.purple, marginBottom: 3 }}>{`{{${v}}}`}</label>
                          <input value={sampleVars[v] || ""}
                            onChange={e => setSampleVars(s => ({ ...s, [v]: e.target.value }))}
                            placeholder={`sample_${v}`}
                            style={{ width: "100%", padding: "5px 8px", borderRadius: 6,
                              border: `1px solid #C4B5FD`, fontSize: 11, fontFamily: T.font,
                              outline: "none", background: "#fff" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER */}
          <div onClick={() => setActiveSection("footer")} style={sectionClass("footer")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              marginBottom: activeSection === "footer" ? 10 : 0 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: T.amberLight,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                  stroke={T.amber} strokeWidth="2">
                  <line x1="3" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="12" x2="15" y2="12"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Footer</span>
              <span style={{ fontSize: 10, color: T.subtle }}>(optional)</span>
            </div>
            {activeSection === "footer" && (
              <input value={form.footer}
                onChange={e => setForm(f => ({ ...f, footer: e.target.value }))}
                placeholder="e.g. Reply STOP to unsubscribe · max 60 chars"
                maxLength={60}
                style={{ width: "100%", padding: "8px 11px", borderRadius: 8,
                  border: `1px solid ${T.border}`, fontSize: 12, color: T.text,
                  fontFamily: T.font, outline: "none" }} />
            )}
          </div>

          {/* BUTTONS */}
          <div onClick={() => setActiveSection("buttons")} style={sectionClass("buttons")}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: activeSection === "buttons" ? 12 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: T.purpleLight,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
                    stroke={T.purple} strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                  Buttons
                </span>
                <span style={{ fontSize: 10, color: T.subtle }}>{form.buttons.length}/3</span>
              </div>
              {activeSection === "buttons" && form.buttons.length < 3 && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); addButton("QUICK_REPLY"); }}
                    style={{ padding: "4px 10px", borderRadius: 6,
                      border: `1px solid ${T.purple}`, background: T.purpleLight,
                      color: T.purple, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    + Quick Reply
                  </button>
                  <button onClick={e => { e.stopPropagation(); addButton("URL"); }}
                    style={{ padding: "4px 10px", borderRadius: 6,
                      border: `1px solid ${T.blue}`, background: T.blueLight,
                      color: T.blue, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    + URL Button
                  </button>
                </div>
              )}
            </div>
            {activeSection === "buttons" && (
              <>
                {form.buttons.length === 0 && (
                  <div style={{ fontSize: 12, color: T.subtle, fontStyle: "italic" }}>
                    No buttons added. Use Quick Reply for text responses or URL Button for links.
                  </div>
                )}
                {form.buttons.map((btn, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8,
                    alignItems: "center", padding: "10px 12px", background: T.bg,
                    borderRadius: 9, border: `1px solid ${T.border}` }}>
                    <span style={{ padding: "2px 7px", borderRadius: 20, fontSize: 9,
                      fontWeight: 700, flexShrink: 0,
                      background: btn.type === "URL" ? T.blueLight : T.greenLight,
                      color: btn.type === "URL" ? T.blue : T.green }}>{btn.type}</span>
                    <input value={btn.text}
                      onChange={e => updateButton(i, "text", e.target.value)}
                      placeholder="Button label"
                      style={{ flex: 1, padding: "6px 9px", borderRadius: 7,
                        border: `1px solid ${T.border}`, fontSize: 12,
                        fontFamily: T.font, outline: "none" }} />
                    {btn.type === "URL" && (
                      <input value={btn.url || ""}
                        onChange={e => updateButton(i, "url", e.target.value)}
                        placeholder="https://your-url.com"
                        style={{ flex: 2, padding: "6px 9px", borderRadius: 7,
                          border: `1px solid ${T.border}`, fontSize: 11,
                          fontFamily: T.mono, outline: "none" }} />
                    )}
                    <button onClick={e => { e.stopPropagation(); removeButton(i); }}
                      style={{ width: 26, height: 26, borderRadius: 6, border: "none",
                        background: T.redLight, color: T.red, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT: PHONE PREVIEW ── */}
        <div style={{ flexShrink: 0, position: "sticky", top: 16,
          display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: 14, textAlign: "center" }}>
            Live Preview
          </div>
          <PhonePreview template={form} sampleVars={sampleVars} />

          {/* Category / policy hint */}
          <div style={{ marginTop: 14, width: 260, padding: "12px 14px",
            background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted,
              textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Category: {CATEGORY_CFG[form.category]?.label}
            </div>
            {form.category === "MARKETING" && (
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
                Marketing templates require opt-in consent and must include an opt-out option in footer or body.
              </div>
            )}
            {form.category === "UTILITY" && (
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
                Utility templates are for transactional messages (orders, payments, appointments). Approved faster.
              </div>
            )}
            {form.category === "AUTHENTICATION" && (
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
                Authentication templates must contain only OTP codes and expiry. No promotional content allowed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT — SCREEN ROUTER
───────────────────────────────────────────── */
export default function TemplatesModule() {
  const [view, setView]             = useState("list"); // "list" | "builder"
  const [editTemplate, setEditTemplate] = useState(null);

  const handleEdit = (tmpl) => { setEditTemplate(tmpl); setView("builder"); };
  const handleNew  = ()     => { setEditTemplate(null); setView("builder"); };
  const handleBack = ()     => { setEditTemplate(null); setView("list");    };

  return (
    <div style={{ fontFamily: T.font, display: "flex", minHeight: "100vh", background: T.bg }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        select:focus, input:focus, textarea:focus {
          box-shadow: 0 0 0 3px ${T.green}22;
          border-color: ${T.green} !important;
        }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {view === "list" && (
          <TemplatesListScreen onNew={handleNew} onEdit={handleEdit} />
        )}
        {view === "builder" && (
          <TemplateBuilderScreen editTemplate={editTemplate} onBack={handleBack} />
        )}
      </div>
    </div>
  );
}
