import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMessageTrends, useHeatmap, useTopTemplates, useAudienceGrowth, useDashboardStats } from "../../hooks/useAnalytics";

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
  indigo:      "#4338CA",
  text:        "#0F172A",
  muted:       "#64748B",
  subtle:      "#94A3B8",
  border:      "#E2E8F0",
  borderMid:   "#CBD5E1",
  font:        "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
  mono:        "'DM Mono','SF Mono',monospace",
};

/* Analytics data will be retrieved via hooks inside the component (moved below)
   to ensure React hook rules are respected. */

/* ─────────────────────────────────────────────
   TINY SVG CHART ENGINE (no deps)
───────────────────────────────────────────── */
function pathFromPoints(pts, w, h, minV, maxV) {
  if (!pts.length) return "";
  const xStep = w / (pts.length - 1);
  const range  = maxV - minV || 1;
  return pts.map((v, i) => {
    const x = i * xStep;
    const y = h - ((v - minV) / range) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function areaFromPoints(pts, w, h, minV, maxV) {
  const line = pathFromPoints(pts, w, h, minV, maxV);
  if (!line) return "";
  const lastX = ((pts.length - 1) * w / (pts.length - 1)).toFixed(1);
  return `${line} L ${lastX} ${h} L 0 ${h} Z`;
}

function smoothPath(pts, w, h, minV, maxV) {
  if (pts.length < 2) return "";
  const xStep = w / (pts.length - 1);
  const range  = maxV - minV || 1;
  const toXY = (i, v) => [i * xStep, h - ((v - minV) / range) * h];
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = toXY(i, pts[i]);
    if (i === 0) { d += `M ${x.toFixed(1)} ${y.toFixed(1)}`; continue; }
    const [px, py] = toXY(i - 1, pts[i - 1]);
    const cpx = (px + x) / 2;
    d += ` C ${cpx.toFixed(1)} ${py.toFixed(1)}, ${cpx.toFixed(1)} ${y.toFixed(1)}, ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

/* ─────────────────────────────────────────────
   SHARED COMPONENTS
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
        <div style={{ fontSize:9, fontWeight:700, color:"#334155",
          letterSpacing:"0.1em", padding:"8px 10px 4px", textTransform:"uppercase" }}>Main</div>
        {NAV.map(label => {
          const active = label === "Analytics";
          return (
            <div key={label} style={{ padding:"8px 10px", borderRadius:7, marginBottom:2,
              fontSize:12, fontWeight:active?600:400,
              color: active?"#fff":"#94A3B8",
              background: active ? T.green : "transparent", cursor:"pointer" }}>
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

function Card({ children, style = {} }) {
  return (
    <div style={{ background:T.card, borderRadius:12, border:`1px solid ${T.border}`,
      overflow:"hidden", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }) {
  return (
    <div style={{ padding:"14px 18px 12px", borderBottom:`1px solid ${T.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{title}</div>
        {sub && <div style={{ fontSize:10, color:T.subtle, marginTop:2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, sub, trend, color, icon }) {
  const up   = trend > 0;
  const zero = trend === 0;
  return (
    <div style={{ flex:1, background:T.card, borderRadius:12, padding:"16px 18px",
      border:`1px solid ${T.border}`, borderTop:`3px solid ${color}`, minWidth:0,
      transition:"box-shadow .2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.muted,
          textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</span>
        <div style={{ width:30, height:30, borderRadius:7, background:`${color}18`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color, fontSize:14 }}>{icon}</div>
      </div>
      <div style={{ fontFamily:T.mono, fontSize:26, fontWeight:700, color:T.text,
        letterSpacing:"-0.02em", lineHeight:1, marginBottom:8 }}>{value}</div>
      {trend !== undefined && (
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, fontWeight:700,
            color: up ? "#16A34A" : zero ? T.muted : T.red }}>
            {up ? "↑" : zero ? "—" : "↓"} {Math.abs(trend)}%
          </span>
          <span style={{ fontSize:11, color:T.subtle }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART: AREA/LINE (no Recharts, pure SVG)
───────────────────────────────────────────── */
function AreaLineChart({ data, range, metric }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const W = 640, H = 200, PAD = { top:8, right:8, bottom:24, left:44 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const slice = data.slice(-range);
  const sentVals      = slice.map(d => d.sent);
  const deliveredVals = slice.map(d => d.delivered);
  const readVals      = slice.map(d => d.read);
  const maxVal = Math.max(...sentVals) * 1.1;
  const minVal = 0;

  const toX = i  => PAD.left + (i / (slice.length - 1)) * innerW;
  const toY = v  => PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const makePath = (vals) => {
    if (vals.length < 2) return "";
    return vals.map((v, i) => {
      const x = toX(i), y = toY(v);
      if (i === 0) return `M ${x} ${y}`;
      const px = toX(i-1), py = toY(vals[i-1]);
      const cpx = (px + x) / 2;
      return ` C ${cpx} ${py} ${cpx} ${y} ${x} ${y}`;
    }).join("");
  };

  const makeArea = (vals, color) => {
    const line = makePath(vals);
    if (!line) return null;
    const lastX = toX(vals.length - 1);
    return `${line} L ${lastX} ${PAD.top + innerH} L ${PAD.left} ${PAD.top + innerH} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(minVal + f * (maxVal - minVal)));
  const xLabels = slice.map((d, i) => ({
    label: d.d.replace(/^(Feb|Mar) /,""),
    x: toX(i), show: range <= 14 || i % Math.ceil(range/10) === 0
  }));

  const series = [
    { vals:sentVals,      color:T.blue,   label:"Sent",      dash:false },
    { vals:deliveredVals, color:T.teal,   label:"Delivered", dash:true  },
    { vals:readVals,      color:T.green,  label:"Read",      dash:false },
  ];

  return (
    <div style={{ position:"relative" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible" }}
        onMouseLeave={() => { setTooltip(null); setHoverIdx(null); }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.label} id={`area-${s.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
            </linearGradient>
          ))}
        </defs>

        {/* Grid */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={PAD.left + innerW} y2={toY(v)}
              stroke={T.border} strokeWidth="0.5" strokeDasharray="3 3"/>
            <text x={PAD.left - 6} y={toY(v) + 4} textAnchor="end"
              fontSize="9" fill={T.subtle}>
              {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
            </text>
          </g>
        ))}

        {/* Areas */}
        {series.map(s => (
          <path key={`area-${s.label}`}
            d={makeArea(s.vals, s.color)} fill={`url(#area-${s.label})`} stroke="none"/>
        ))}

        {/* Lines */}
        {series.map(s => (
          <path key={`line-${s.label}`}
            d={makePath(s.vals)}
            fill="none" stroke={s.color} strokeWidth="1.8"
            strokeDasharray={s.dash ? "5 3" : "none"}/>
        ))}

        {/* Hover overlay */}
        {slice.map((d, i) => (
          <rect key={i}
            x={toX(i) - innerW / (2 * slice.length)}
            y={PAD.top} width={innerW / slice.length} height={innerH}
            fill="transparent" style={{ cursor:"crosshair" }}
            onMouseEnter={() => {
              setHoverIdx(i);
              setTooltip({ i, d, x:toX(i), y:100 });
            }}/>
        ))}

        {/* Hover line + dots */}
        {hoverIdx !== null && (
          <g>
            <line x1={toX(hoverIdx)} y1={PAD.top}
              x2={toX(hoverIdx)} y2={PAD.top + innerH}
              stroke={T.borderMid} strokeWidth="1"/>
            {series.map(s => (
              <circle key={s.label}
                cx={toX(hoverIdx)} cy={toY(s.vals[hoverIdx])}
                r="4" fill={s.color} stroke="white" strokeWidth="2"/>
            ))}
          </g>
        )}

        {/* X labels */}
        {xLabels.map(({label, x, show}) => show && (
          <text key={label} x={x} y={H - 4} textAnchor="middle"
            fontSize="9" fill={T.subtle}>{label}</text>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position:"absolute", left:tooltip.x + 8, top:20, zIndex:20,
          background:"#0F172A", borderRadius:8, padding:"10px 13px",
          boxShadow:"0 8px 24px rgba(0,0,0,.25)", pointerEvents:"none",
          minWidth:140 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:7 }}>
            {slice[tooltip.i]?.d}
          </div>
          {series.map(s => (
            <div key={s.label} style={{ display:"flex", justifyContent:"space-between",
              gap:16, marginBottom:3 }}>
              <span style={{ fontSize:11, color:s.color }}>{s.label}</span>
              <span style={{ fontSize:11, fontFamily:T.mono, fontWeight:700, color:"#fff" }}>
                {s.vals[tooltip.i]?.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART: AUDIENCE GROWTH (stacked bars, SVG)
───────────────────────────────────────────── */
function AudienceGrowthChart({ data, range }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const slice = data.slice(-range);
  const W = 380, H = 160, PAD = { top:8, right:8, bottom:28, left:36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const barW   = innerW / slice.length * 0.6;
  const barGap = innerW / slice.length;
  const maxOptIn = Math.max(...slice.map(d => d.optIn)) * 1.1;

  const toX = i => PAD.left + i * barGap + barGap * 0.2;
  const toH = v => (v / maxOptIn) * innerH;
  const netGrowth = slice.reduce((s, d) => s + d.optIn - d.optOut, 0);

  return (
    <div style={{ position:"relative" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {/* Grid */}
        {[0, 0.5, 1].map(f => {
          const v = Math.round(f * maxOptIn);
          const y = PAD.top + innerH - (v / maxOptIn) * innerH;
          return (
            <g key={f}>
              <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
                stroke={T.border} strokeWidth="0.5"/>
              <text x={PAD.left - 4} y={y + 3} textAnchor="end"
                fontSize="8" fill={T.subtle}>
                {v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {slice.map((d, i) => {
          const x      = toX(i);
          const hIn    = toH(d.optIn);
          const hOut   = toH(d.optOut);
          const yIn    = PAD.top + innerH - hIn;
          const yOut   = PAD.top + innerH - hOut;
          const isHov  = hoverIdx === i;
          return (
            <g key={i} style={{ cursor:"pointer" }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}>
              {/* Opt-in bar */}
              <rect x={x} y={yIn} width={barW} height={hIn} rx="2"
                fill={T.green} opacity={isHov ? 1 : 0.75}/>
              {/* Opt-out bar */}
              <rect x={x + barW * 0.1} y={yOut} width={barW * 0.8} height={hOut} rx="2"
                fill={T.red} opacity={isHov ? 0.9 : 0.6}/>
              {/* X label */}
              {(i === 0 || i === Math.floor(slice.length/2) || i === slice.length-1) && (
                <text x={x + barW/2} y={H - 4} textAnchor="middle"
                  fontSize="8" fill={T.subtle}>
                  {d.w.replace(/ W\d.*$/,"").replace(/ \(now\)/,"")}
                </text>
              )}
              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect x={x - 2} y={yIn - 52} width={84} height={48}
                    rx="6" fill="#0F172A"/>
                  <text x={x + 40} y={yIn - 37} textAnchor="middle"
                    fontSize="9" fill="#94A3B8">{d.w}</text>
                  <text x={x + 40} y={yIn - 24} textAnchor="middle"
                    fontSize="9" fill={T.green}>+{d.optIn} opt-in</text>
                  <text x={x + 40} y={yIn - 12} textAnchor="middle"
                    fontSize="9" fill={T.red}>-{d.optOut} opt-out</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Net growth pill */}
      <div style={{ position:"absolute", top:8, right:8, padding:"3px 9px",
        borderRadius:20, background:T.greenLight,
        border:`1px solid #6EE7B7`, fontSize:11, fontWeight:700, color:T.greenDark }}>
        +{netGrowth.toLocaleString()} net growth
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART: CAMPAIGN PERFORMANCE (horizontal bars)
───────────────────────────────────────────── */
function CampaignPerfChart({ data }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10, padding:"4px 0" }}>
      {data.map((c, i) => (
        <div key={c.name}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ padding:"10px 12px", borderRadius:9,
            background: hoverIdx===i ? T.bg : "transparent",
            border:`1px solid ${hoverIdx===i ? T.border : "transparent"}`,
            transition:"all .15s", cursor:"default" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:7 }}>
            <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{c.name}</span>
            <div style={{ display:"flex", gap:10 }}>
              <span style={{ fontSize:11, color:T.muted }}>
                <span style={{ fontFamily:T.mono, fontWeight:700, color:T.teal }}>
                  {c.delivery}%
                </span> delivery
              </span>
              <span style={{ fontSize:11, color:T.muted }}>
                <span style={{ fontFamily:T.mono, fontWeight:700, color:T.purple }}>
                  {c.openRate}%
                </span> open
              </span>
            </div>
          </div>
          {/* Stacked bar */}
          <div style={{ height:8, background:T.border, borderRadius:99,
            overflow:"hidden", display:"flex" }}>
            <div style={{ width:`${c.openRate}%`, background:T.purple,
              transition:"width .6s ease" }}/>
            <div style={{ width:`${c.delivery - c.openRate}%`, background:T.teal,
              transition:"width .6s ease" }}/>
            <div style={{ width:`${c.failed}%`, background:T.redLight,
              transition:"width .6s ease" }}/>
          </div>
          {hoverIdx === i && (
            <div style={{ display:"flex", gap:14, marginTop:6 }}>
              {[
                { color:T.purple, label:`${c.openRate}% read` },
                { color:T.teal,   label:`${(c.delivery - c.openRate).toFixed(1)}% delivered` },
                { color:T.red,    label:`${c.failed}% failed` },
              ].map(l => (
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:4,
                  fontSize:10, color:T.muted }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:l.color }}/>
                  {l.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   CHART: HEATMAP (7×24 grid)
───────────────────────────────────────────── */
function HeatmapChart({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = Array.from({length:24}, (_,i) => i);
  const maxV  = Math.max(...data.map(d => d.value));

  const cellW = 100 / 25;
  const opacity = v => v === 0 ? 0.04 : 0.1 + (v / maxV) * 0.9;

  // Color based on value intensity
  const cellColor = v => {
    const t = v / maxV;
    if (t > 0.8) return T.green;
    if (t > 0.6) return T.teal;
    if (t > 0.4) return T.blue;
    if (t > 0.2) return T.purple;
    return T.subtle;
  };

  const getValue = (day, hour) => {
    const d = data.find(x => x.day === day && x.hour === hour);
    return d ? d.value : 0;
  };

  const bestHour = hours.reduce((best, h) => {
    const total = days.reduce((s, d) => s + getValue(d, h), 0);
    const btotal = days.reduce((s, d) => s + getValue(d, best), 0);
    return total > btotal ? h : best;
  }, 9);

  const formatHour = h => h === 0 ? "12am" : h === 12 ? "12pm" : h < 12 ? `${h}am` : `${h-12}pm`;

  return (
    <div>
      {/* Hour labels */}
      <div style={{ display:"flex", marginLeft:36, marginBottom:4 }}>
        {hours.map(h => (
          <div key={h} style={{ flex:1, textAlign:"center", fontSize:8, color:T.subtle,
            opacity: h % 3 === 0 ? 1 : 0 }}>
            {h % 3 === 0 ? formatHour(h) : ""}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      {days.map(day => (
        <div key={day} style={{ display:"flex", alignItems:"center", marginBottom:3 }}>
          <div style={{ width:34, fontSize:10, fontWeight:600, color:T.muted,
            textAlign:"right", paddingRight:8, flexShrink:0 }}>{day}</div>
          <div style={{ display:"flex", flex:1, gap:2 }}>
            {hours.map(h => {
              const v = getValue(day, h);
              const isHot = v === data.filter(d=>d.day===day).reduce((a,b)=>a.value>b.value?a:b).value;
              return (
                <div key={h}
                  onMouseEnter={() => setTooltip({ day, hour:h, value:v })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ flex:1, height:16, borderRadius:3,
                    background: cellColor(v),
                    opacity: opacity(v),
                    cursor:"pointer", transition:"opacity .15s",
                    outline: tooltip?.day===day && tooltip?.hour===h
                      ? `2px solid ${T.green}` : "none" }}/>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginTop:12, paddingLeft:36 }}>
        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:T.subtle }}>
          <span>Low</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
            <div key={o} style={{ width:14, height:10, borderRadius:2,
              background:T.green, opacity:o }}/>
          ))}
          <span>High</span>
        </div>
        <div style={{ fontSize:10, color:T.green, fontWeight:600 }}>
          Peak: {formatHour(bestHour)}–{formatHour(bestHour+1)}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.value > 0 && (
        <div style={{ marginTop:8, padding:"7px 12px", background:T.bg,
          borderRadius:8, border:`1px solid ${T.border}`,
          fontSize:11, color:T.text }}>
          <strong>{tooltip.day}</strong> at {formatHour(tooltip.hour)} —{" "}
          <span style={{ fontFamily:T.mono, color:T.green, fontWeight:700 }}>
            {tooltip.value.toLocaleString()}
          </span> messages sent
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOP TEMPLATES TABLE
───────────────────────────────────────────── */
function TopTemplates({ data }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const CAT_COLOR = { MARKETING:"#D97706", UTILITY:"#2563EB", AUTHENTICATION:"#7C3AED" };
  const maxRate = data.length ? Math.max(...data.map(d => d.readRate)) : 1;

  return (
    <div>
      {data.map((t, i) => (
        <div key={t.name}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ padding:"11px 0",
            borderBottom: i < data.length-1 ? `1px solid ${T.border}` : "none",
            transition:"background .12s" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Rank */}
            <div style={{ width:22, height:22, borderRadius:6, flexShrink:0,
              background: i === 0 ? "#FEF3C7" : i === 1 ? "#F1F5F9" : "transparent",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:11, fontWeight:700,
              color: i === 0 ? "#D97706" : i === 1 ? T.muted : T.subtle }}>
              {i+1}
            </div>

            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:5 }}>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    maxWidth:200 }}>{t.name}</div>
                  <span style={{ fontSize:9, fontWeight:700,
                    color: CAT_COLOR[t.category] || T.muted }}>{t.category}</span>
                </div>
                <div style={{ textAlign:"right", flexShrink:0, marginLeft:8 }}>
                  <div style={{ fontFamily:T.mono, fontSize:16, fontWeight:700,
                    color:T.green }}>{t.readRate}%</div>
                  <div style={{ fontSize:9, color:t.trend > 0 ? "#16A34A" : T.red,
                    fontWeight:600 }}>
                    {t.trend > 0 ? "↑" : "↓"} {Math.abs(t.trend)}%
                  </div>
                </div>
              </div>

              {/* Rate bar */}
              <div style={{ height:5, background:T.border, borderRadius:99,
                overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:99, transition:"width .7s ease",
                  width: `${(t.readRate / maxRate) * 100}%`,
                  background: `linear-gradient(90deg, ${T.green}, ${T.blue})` }}/>
              </div>

              {hoverIdx === i && (
                <div style={{ display:"flex", gap:12, marginTop:5 }}>
                  <span style={{ fontSize:10, color:T.subtle }}>
                    <span style={{ fontFamily:T.mono, color:T.text, fontWeight:600 }}>
                      {t.sent.toLocaleString()}
                    </span> sent
                  </span>
                  <span style={{ fontSize:10, color:T.subtle }}>
                    <span style={{ fontFamily:T.mono, color:T.teal, fontWeight:600 }}>
                      {t.delivered.toLocaleString()}
                    </span> delivered
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   RANGE SELECTOR
───────────────────────────────────────────── */
function RangeSelector({ value, onChange, options }) {
  return (
    <div style={{ display:"flex", background:T.bg, borderRadius:8,
      border:`1px solid ${T.border}`, padding:3, gap:2 }}>
      {options.map(o => (
        <button key={o.val} onClick={() => onChange(o.val)}
          style={{ padding:"4px 10px", borderRadius:6, border:"none",
            cursor:"pointer", fontSize:11, fontWeight: value===o.val ? 700 : 400,
            background: value===o.val ? T.green : "transparent",
            color: value===o.val ? "#fff" : T.muted,
            transition:"all .15s" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MINI SPARKLINE
───────────────────────────────────────────── */
function Sparkline({ values, color, height=32, width=80 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height * 0.85 - height * 0.075;
    return `${x},${y}`;
  });
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  const up   = last >= prev;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
      <svg width={width} height={height} style={{ overflow:"visible" }}>
        <polyline points={pts.join(" ")} fill="none"
          stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx={pts[pts.length-1].split(",")[0]}
          cy={pts[pts.length-1].split(",")[1]}
          r="2.5" fill={color}/>
      </svg>
      <div style={{ fontSize:9, color: up ? "#16A34A" : T.red, fontWeight:700 }}>
        {up ? "↑" : "↓"} {Math.abs(Math.round(((last-prev)/prev)*100))}%
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN ANALYTICS PAGE
───────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [trendRange,     setTrendRange]     = useState(14);
  const [growthRange,    setGrowthRange]    = useState(8);
  const [metricPeriod,   setMetricPeriod]   = useState("30d");
  const [animIn,         setAnimIn]         = useState(false);

  useEffect(() => { const t = setTimeout(() => setAnimIn(true), 80); return () => clearTimeout(t); }, []);

  // --- Data hooks (moved here to satisfy React hook rules) ---
  const { data: trendsRes } = useMessageTrends(30);
  const rawTrends = Array.isArray(trendsRes) ? trendsRes : (trendsRes && trendsRes.series) || [];
  const TREND_DATA = rawTrends.map(d => ({
    d: d.d || d.date || "",
    sent: d.sent !== undefined ? d.sent : (d.count || 0),
    delivered: d.delivered !== undefined ? d.delivered : Math.round((d.count || 0) * 0.9),
    read: d.read !== undefined ? d.read : Math.round((d.count || 0) * 0.7),
    optOut: d.optOut || 0
  }));

  const { data: heatmapRes } = useHeatmap();
  const heatmapMap = (heatmapRes && (heatmapRes.heatmap || heatmapRes)) || {};
  const HEATMAP_DATA = (() => {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const data = [];
    days.forEach((day) => {
      for (let h = 0; h < 24; h++) {
        data.push({ day, hour: h, value: Math.round(heatmapMap[h] || 0) });
      }
    });
    return data;
  })();

  const { data: topTemplatesRes } = useTopTemplates();
  const TOP_TEMPLATES = (topTemplatesRes && (topTemplatesRes.templates || topTemplatesRes)) || [];

  const { data: audienceRes } = useAudienceGrowth();
  const AUDIENCE_GROWTH = (audienceRes && (audienceRes.series || audienceRes))
    ? (audienceRes.series || audienceRes).map(s => ({ w: s.week || s.w || "", optIn: s.optIns || s.optIn || 0, optOut: s.optOuts || s.optOut || 0 }))
    : [];

  const { data: dashboardRes } = useDashboardStats();
  const CAMPAIGN_PERF = (TOP_TEMPLATES.length ? TOP_TEMPLATES.slice(0,5).map(t => ({
    name: t.name || t._id || 'Template',
    delivery: t.sent ? Math.round(((t.delivered || t.read || 0) / t.sent) * 100) : 0,
    openRate: Math.round(t.readRate || 0),
    failed: t.sent ? Math.max(0, 100 - Math.round(((t.delivered || t.read || 0) / t.sent) * 100)) : 0,
  })) : []);

  // Computed summary stats from last N days
  const stats30 = TREND_DATA.slice(-30);
  const stats7  = TREND_DATA.slice(-7);
  const stats1  = TREND_DATA.slice(-1);
  const D = metricPeriod === "30d" ? stats30 : metricPeriod === "7d" ? stats7 : stats1;
  const totalSent      = D.reduce((s,d) => s + d.sent, 0);
  const totalDelivered = D.reduce((s,d) => s + d.delivered, 0);
  const totalRead      = D.reduce((s,d) => s + d.read, 0);
  const totalOptOut    = D.reduce((s,d) => s + d.optOut, 0);
  const avgDelivery    = totalSent > 0 ? ((totalDelivered / totalSent)*100).toFixed(1) : 0;
  const avgOpen        = totalSent > 0 ? ((totalRead      / totalSent)*100).toFixed(1) : 0;

  // Trends vs prior period
  const prevD = metricPeriod === "30d" ? TREND_DATA.slice(-60,-30)
    : metricPeriod === "7d" ? TREND_DATA.slice(-14,-7)
    : TREND_DATA.slice(-2,-1);
  const prevSent = prevD.reduce((s,d) => s + d.sent, 0);
  const sentTrend = prevSent > 0 ? +((totalSent - prevSent) / prevSent * 100).toFixed(1) : 0;

  const sparkSent = TREND_DATA.slice(-14).map(d => d.sent);
  const sparkOpen = TREND_DATA.slice(-14).map(d => Math.round((d.read/d.sent)*100));

  const fadeIn = (delay = 0) => ({
    opacity: animIn ? 1 : 0,
    transform: animIn ? "translateY(0)" : "translateY(10px)",
    transition: `opacity .4s ease ${delay}ms, transform .4s ease ${delay}ms`,
  });

  return (
    <div style={{ fontFamily:T.font, display:"flex", minHeight:"100vh", background:T.bg }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }
        button:hover { opacity:.9; }
      `}</style>

      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", overflowY:"auto" }}>

        {/* ── TOPBAR ── */}
        <div style={{ height:56, background:T.card, borderBottom:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", padding:"0 20px", gap:12,
          position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:700, color:T.text, letterSpacing:"-0.02em" }}>
              Analytics
            </div>
            <div style={{ fontSize:10, color:T.subtle }}>
              Sunday, 22 March 2025 · Data from WhatsApp Business API
            </div>
          </div>

          {/* Period selector */}
          <RangeSelector value={metricPeriod} onChange={setMetricPeriod} options={[
            { val:"1d", label:"Today" }, { val:"7d", label:"7 days" },
            { val:"30d", label:"30 days" }
          ]}/>

          {/* Export */}
          <button style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 13px",
            borderRadius:8, border:`1px solid ${T.border}`, background:T.card,
            fontSize:12, color:T.muted, cursor:"pointer" }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export
          </button>
        </div>

        <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:16 }}>

          {/* ── ROW 1: METRIC CARDS ── */}
          <div style={{ display:"flex", gap:12, ...fadeIn(0) }}>
            <MetricCard
              label="Messages sent"
              value={totalSent >= 1000 ? `${(totalSent/1000).toFixed(0)}k` : totalSent}
              sub="vs previous period"
              trend={sentTrend}
              color={T.blue}
              icon="✉"
            />
            <MetricCard
              label="Delivery rate"
              value={`${avgDelivery}%`}
              sub="avg across all campaigns"
              trend={+0.4}
              color={T.teal}
              icon="✓"
            />
            <MetricCard
              label="Open rate"
              value={`${avgOpen}%`}
              sub="read / sent"
              trend={+2.1}
              color={T.green}
              icon="👁"
            />
            <MetricCard
              label="Opt-outs"
              value={totalOptOut}
              sub="contacts unsubscribed"
              trend={-3.2}
              color={T.red}
              icon="✕"
            />
          </div>

          {/* ── ROW 2: AREA CHART + TOP TEMPLATES ── */}
          <div style={{ display:"flex", gap:14, ...fadeIn(80) }}>

            {/* Area chart */}
            <Card style={{ flex:2 }}>
              <CardHeader
                title="Message volume trend"
                sub={`Sent · Delivered · Read — last ${trendRange} days`}
                action={
                  <RangeSelector value={trendRange} onChange={setTrendRange} options={[
                    { val:7, label:"7d" }, { val:14, label:"14d" }, { val:30, label:"30d" }
                  ]}/>
                }
              />
              <div style={{ padding:"14px 18px 10px" }}>
                <AreaLineChart data={TREND_DATA} range={trendRange} />
              </div>
              {/* Legend */}
              <div style={{ padding:"0 18px 14px",
                display:"flex", gap:16, justifyContent:"flex-end" }}>
                {[
                  { color:T.blue,  label:"Sent" },
                  { color:T.teal,  label:"Delivered", dash:true },
                  { color:T.green, label:"Read" },
                ].map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5,
                    fontSize:11, color:T.subtle }}>
                    <div style={{ width:20, height:2, borderRadius:1,
                      background: l.dash ? "transparent" : l.color,
                      backgroundImage: l.dash
                        ? `repeating-linear-gradient(90deg,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : "none" }}/>
                    {l.label}
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Templates */}
            <Card style={{ flex:1 }}>
              <CardHeader
                title="Top templates"
                sub="Ranked by read rate"
                action={
                  <span style={{ fontSize:10, color:T.subtle }}>
                    {TOP_TEMPLATES.length} templates
                  </span>
                }
              />
              <div style={{ padding:"6px 18px 14px" }}>
                <TopTemplates data={TOP_TEMPLATES} />
              </div>
            </Card>
          </div>

          {/* ── ROW 3: CAMPAIGN PERF + AUDIENCE GROWTH ── */}
          <div style={{ display:"flex", gap:14, ...fadeIn(160) }}>

            {/* Campaign performance */}
            <Card style={{ flex:1 }}>
              <CardHeader
                title="Campaign performance"
                sub="Delivery · open · failure breakdown"
              />
              <div style={{ padding:"8px 18px 14px" }}>
                <CampaignPerfChart data={CAMPAIGN_PERF} />
              </div>
              <div style={{ padding:"8px 18px 14px",
                borderTop:`1px solid ${T.border}`,
                display:"flex", gap:16 }}>
                {[
                  { color:T.purple, label:"Read" },
                  { color:T.teal,   label:"Delivered (not read)" },
                  { color:T.redLight, label:"Failed", border:T.red },
                ].map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5,
                    fontSize:10, color:T.subtle }}>
                    <div style={{ width:10, height:10, borderRadius:2,
                      background:l.color, border: l.border ? `1px solid ${l.border}` : "none" }}/>
                    {l.label}
                  </div>
                ))}
              </div>
            </Card>

            {/* Audience Growth */}
            <Card style={{ flex:1 }}>
              <CardHeader
                title="Audience growth"
                sub="Opt-ins vs opt-outs per week"
                action={
                  <RangeSelector value={growthRange} onChange={setGrowthRange} options={[
                    { val:4, label:"4w" }, { val:8, label:"8w" }, { val:12, label:"12w" }
                  ]}/>
                }
              />
              <div style={{ padding:"14px 18px 10px" }}>
                <AudienceGrowthChart data={AUDIENCE_GROWTH} range={growthRange} />
              </div>
              <div style={{ padding:"4px 18px 14px",
                display:"flex", gap:16 }}>
                {[
                  { color:T.green, label:"Opt-in" },
                  { color:T.red,   label:"Opt-out" },
                ].map(l => (
                  <div key={l.label} style={{ display:"flex", alignItems:"center", gap:5,
                    fontSize:10, color:T.subtle }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:l.color }}/>
                    {l.label}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ── ROW 4: HEATMAP (full width) ── */}
          <div style={{ ...fadeIn(240) }}>
            <Card>
              <CardHeader
                title="Message volume heatmap"
                sub="Best times to send — hover any cell to see exact volume"
                action={
                  <div style={{ padding:"4px 10px", borderRadius:20, background:T.greenLight,
                    border:`1px solid #6EE7B7`, fontSize:11, fontWeight:700, color:T.greenDark }}>
                    Best: 9–11 AM & 7–9 PM
                  </div>
                }
              />
              <div style={{ padding:"16px 20px 18px" }}>
                <HeatmapChart data={HEATMAP_DATA} />
              </div>
            </Card>
          </div>

          {/* ── ROW 5: QUICK STATS BAR ── */}
          <div style={{ ...fadeIn(320) }}>
            <div style={{ display:"flex", gap:12, padding:"16px 20px",
              background:T.card, borderRadius:12, border:`1px solid ${T.border}` }}>

              {/* Sparkline cards */}
              {[
                { label:"Sent (14d)",    vals:sparkSent,
                  val:`${(sparkSent[sparkSent.length-1]/1000).toFixed(1)}k`, color:T.blue },
                { label:"Open rate (14d)", vals:sparkOpen,
                  val:`${sparkOpen[sparkOpen.length-1]}%`, color:T.green },
              ].map(s => (
                <div key={s.label} style={{ flex:1, padding:"10px 14px",
                  background:T.bg, borderRadius:9, border:`1px solid ${T.border}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:T.muted,
                      textTransform:"uppercase", letterSpacing:"0.06em",
                      marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontFamily:T.mono, fontSize:22, fontWeight:700,
                      color:s.color }}>{s.val}</div>
                  </div>
                  <Sparkline values={s.vals} color={s.color} />
                </div>
              ))}

              <div style={{ flex:1, padding:"10px 14px", background:T.bg, borderRadius:9,
                border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.muted,
                  textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                  Category breakdown
                </div>
                {[
                  { label:"Marketing",      pct:67, color:T.amber  },
                  { label:"Utility",        pct:28, color:T.blue   },
                  { label:"Authentication", pct:5,  color:T.purple },
                ].map(c => (
                  <div key={c.label} style={{ marginBottom:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      fontSize:11, marginBottom:3 }}>
                      <span style={{ color:T.muted }}>{c.label}</span>
                      <span style={{ fontFamily:T.mono, fontWeight:700,
                        color:c.color }}>{c.pct}%</span>
                    </div>
                    <div style={{ height:4, background:T.border, borderRadius:99,
                      overflow:"hidden" }}>
                      <div style={{ width:`${c.pct}%`, height:"100%",
                        background:c.color, borderRadius:99 }}/>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ flex:1, padding:"10px 14px", background:T.bg, borderRadius:9,
                border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.muted,
                  textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>
                  Today's snapshot
                </div>
                {[
                  { label:"Messages sent",    val:"21.4k", color:T.blue  },
                  { label:"Delivery rate",    val:"97.1%", color:T.teal  },
                  { label:"Open rate",        val:"68.6%", color:T.green },
                  { label:"Opt-outs today",   val:"58",    color:T.red   },
                  { label:"Active campaigns", val:"2",     color:T.amber },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between",
                    padding:"4px 0", borderBottom:`1px solid ${T.border}`,
                    fontSize:11 }}>
                    <span style={{ color:T.muted }}>{r.label}</span>
                    <span style={{ fontFamily:T.mono, fontWeight:700, color:r.color }}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display:"flex", justifyContent:"space-between",
            fontSize:11, color:T.subtle, padding:"0 2px 8px" }}>
            <span>WhatsApp Business Platform · Analytics · Acme Corp</span>
            <span>Data refreshes every 5 minutes · Last refresh: just now</span>
          </div>

        </div>
      </div>
    </div>
  );
}
