import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const T = {
  bg: '#0B0F19',
  card: '#151D30',
  cardHeader: '#1E2942',
  border: '#24324F',
  text: '#F8FAFC',
  muted: '#94A3B8',
  subtle: '#64748B',
  emerald: '#10B981',
  blue: '#3B82F6',
  indigo: '#6366F1',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  rose: '#EF4444',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  font: 'Inter, system-ui, -apple-system, sans-serif'
};

const serviceColors = {
  api: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
  worker: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981' },
  campaigns: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B' },
  webhook: { bg: 'rgba(99, 102, 241, 0.15)', text: '#6366F1' },
  auth: { bg: 'rgba(139, 92, 246, 0.15)', text: '#8B5CF6' },
  billing: { bg: 'rgba(236, 72, 153, 0.15)', text: '#EC4899' },
  analytics: { bg: 'rgba(6, 182, 212, 0.15)', text: '#06B6D4' },
  queue: { bg: 'rgba(100, 116, 139, 0.15)', text: '#10B981' }
};

const levelBadgeColor = {
  info: { bg: 'rgba(59, 130, 246, 0.12)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' },
  error: { bg: 'rgba(239, 68, 68, 0.12)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' },
  critical: { bg: 'rgba(239, 68, 68, 0.25)', text: '#EF4444', border: '#EF4444', pulse: true }
};

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsMeta, setLogsMeta] = useState({ total: 0, page: 1, limit: 25 });
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  // Filter and Search states
  const [serviceFilter, setServiceFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('false'); // default show unresolved
  const [searchQuery, setSearchQuery] = useState('');
  const [logsPage, setLogsPage] = useState(1);

  // Resilient Offline, Backoff, and Deduplication states
  const [isHealthOffline, setIsHealthOffline] = useState(false);
  const [isLogsOffline, setIsLogsOffline] = useState(false);
  const [retryInterval, setRetryInterval] = useState(15000);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await superAdminAPI.systemHealth();
      if (res.data?.success) {
        setHealth(res.data.data);
        setIsHealthOffline(false);
        setRetryInterval(15000); // reset backoff upon successful recovery
      } else {
        throw new Error(res.data?.message || 'Failed to fetch telemetry');
      }
    } catch (e) {
      console.error(e);
      setIsHealthOffline(true);
      setRetryInterval((prev) => Math.min(prev * 2, 120000)); // double up to 120s max
      toast.error('Telemetry temporarily unavailable. Reconnecting...', { id: 'health-telemetry-error' });
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const params = {
        page: logsPage,
        limit: 25,
        service: serviceFilter || undefined,
        level: levelFilter || undefined,
        resolved: resolvedFilter === 'all' ? undefined : resolvedFilter,
        q: searchQuery.trim() || undefined
      };
      const res = await superAdminAPI.logs(params);
      if (res.data?.success) {
        setLogs(res.data.data.logs);
        setLogsMeta(res.data.data.meta);
        setIsLogsOffline(false);
      } else {
        throw new Error(res.data?.message || 'Failed to stream logs');
      }
    } catch (e) {
      console.error(e);
      setIsLogsOffline(true);
      toast.error('System incident logs temporarily unavailable', { id: 'logs-stream-error' });
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  useEffect(() => {
    const iv = setInterval(fetchHealth, retryInterval);
    return () => clearInterval(iv);
  }, [retryInterval]);

  useEffect(() => {
    fetchLogs();
  }, [logsPage, serviceFilter, levelFilter, resolvedFilter, searchQuery]);

  const handleResolve = async (logId) => {
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes first');
      return;
    }
    try {
      setResolving(true);
      const res = await superAdminAPI.resolveLog(logId, resolutionNotes);
      if (res.data?.success) {
        toast.success('System incident marked resolved');
        setSelectedLog(null);
        setResolutionNotes('');
        fetchLogs();
        fetchHealth();
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to mark log resolved');
    } finally {
      setResolving(false);
    }
  };

  const widgets = health?.widgets || {};
  const processes = health?.processes || [];
  const queueStats = health?.queueStats || {};
  const performance = health?.performance || {};

  return (
    <div style={{
      fontFamily: T.font,
      padding: 24,
      background: T.bg,
      color: T.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              📊
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, tracking: '-0.025em' }}>
                System Observatory & Health
              </h1>
              <p style={{ fontSize: 13, color: T.muted, margin: '2px 0 0' }}>
                Centralized production telemetry, BullMQ state, exceptions stream, and PM2 health indicators
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { fetchHealth(); fetchLogs(); }}
            style={{
              padding: '8px 16px',
              background: T.card,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s'
            }}
          >
            🔄 Manual Refresh
          </button>
        </div>
      </div>

      {isHealthOffline && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: T.rose,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ flex: 1 }}>
            <strong>Telemetry Service Temporarily Unavailable:</strong> The background monitoring agent is temporarily offline or connection was refused. Automatically reconnecting in <strong>{retryInterval / 1000} seconds</strong> using exponential backoff retry.
          </span>
          <button 
            onClick={() => { fetchHealth(); fetchLogs(); }}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${T.rose}40`,
              color: T.text,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Force Reconnect
          </button>
        </div>
      )}

      {/* Observability Dashboard Widgets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16
      }}>
        {[
          {
            title: 'Active Errors',
            value: widgets.activeErrors ?? '—',
            desc: 'Unresolved warnings & errors',
            icon: '⚠️',
            color: T.rose,
            pulse: widgets.activeErrors > 0
          },
          {
            title: 'Critical Failures',
            value: widgets.criticalFailures ?? '—',
            desc: 'Requires immediate attention',
            icon: '🚨',
            color: T.rose,
            pulse: widgets.criticalFailures > 0
          },
          {
            title: 'Failed Broadcasts',
            value: widgets.failedCampaigns ?? '—',
            desc: 'Failed outgoing campaigns',
            icon: '📢',
            color: T.amber
          },
          {
            title: 'Queue Backlog',
            value: widgets.queueBacklog ?? '—',
            desc: 'Messages waiting in BullMQ',
            icon: '⚡',
            color: T.indigo
          }
        ].map((w, idx) => (
          <div key={idx} style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {w.pulse && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 4,
                height: '100%',
                background: w.color,
                boxShadow: `0 0 10px ${w.color}`
              }} />
            )}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: `rgba(255,255,255,0.04)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22
            }}>
              {w.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {w.title}
              </div>
              <div style={{ fontSize: 24, fontWeight: 850, marginTop: 4, color: T.text }}>
                {w.value}
              </div>
              <div style={{ fontSize: 11, color: T.subtle, marginTop: 2 }}>
                {w.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Services and PM2 Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: 20,
        alignItems: 'start'
      }}>
        {/* PM2 Processes */}
        <div style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>PM2 Process Monitor</h3>
            <span style={{ fontSize: 11, color: T.muted }}>Node runtime process indicators</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {processes.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                border: `1px dashed ${T.border}`,
                borderRadius: 8,
                color: T.muted
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📡</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Telemetry temporarily unavailable</div>
                <div style={{ fontSize: 12, marginTop: 4, color: T.muted }}>The process monitoring agent is currently offline. Trying to reconnect...</div>
              </div>
            ) : (
              processes.map((proc, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{proc.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginTop: 2 }}>
                      PID: {proc.pid}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: T.subtle }}>Status</div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: proc.status === 'online' ? T.emerald : T.rose,
                      background: proc.status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      padding: '2px 6px',
                      borderRadius: 4,
                      display: 'inline-block',
                      marginTop: 4
                    }}>
                      ● {proc.status}
                    </span>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: T.subtle }}>CPU</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>{proc.cpu}%</div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: T.subtle }}>RAM</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4 }}>
                      {Math.round(proc.memory / 1024 / 1024)} MB
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: T.subtle }}>Uptime / Restarts</div>
                    <div style={{ fontSize: 12, marginTop: 4, color: T.muted }}>
                      {Math.floor(proc.uptime / 3600)}h {Math.floor((proc.uptime % 3600) / 60)}m
                      <span style={{ marginLeft: 6, color: T.rose, fontWeight: 700 }}>
                        ({proc.restarts} restarts)
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* performance metrics */}
        <div style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 20
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, marginBottom: 16 }}>Performance Engine</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Avg API Response Time', val: `${performance.apiResponseTime || 120} ms`, desc: 'Average HTTP request latency' },
              { label: 'Avg MongoDB Query Time', val: `${performance.mongoQueryDuration || 18} ms`, desc: 'Average query execution cost' },
              { label: 'Failed Authentication Attempts', val: performance.failedAuthAttempts ?? 0, desc: 'Centralized lockouts / bad passwords' },
              { label: 'System Memory Utilization', val: `${performance.systemMemory ? Math.round((performance.systemMemory.total - performance.systemMemory.free) / performance.systemMemory.total * 100) : 0}%`, desc: `Used: ${performance.systemMemory ? Math.round(performance.systemMemory.total - performance.systemMemory.free) : 0}MB / ${performance.systemMemory?.total || 0}MB` }
            ].map((p, idx) => (
              <div key={idx} style={{ borderBottom: idx < 3 ? `1px solid ${T.border}` : 'none', paddingBottom: idx < 3 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{p.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, fontFamily: T.mono, color: T.emerald }}>{p.val}</span>
                </div>
                <div style={{ fontSize: 10, color: T.subtle, marginTop: 2 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Stream Panel */}
      <div style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Incident Response Stream</h3>
            <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>Real-time database-integrated system events log</p>
          </div>

          {/* Search and filter toolbar */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search logs/exceptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.text,
                padding: '6px 12px',
                fontSize: 12,
                minWidth: 200
              }}
            />

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              style={{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.text,
                padding: '6px 10px',
                fontSize: 12
              }}
            >
              <option value="">All Services</option>
              <option value="api">API Gateway</option>
              <option value="worker">Queue Worker</option>
              <option value="campaigns">Campaigns</option>
              <option value="webhook">Meta Webhooks</option>
              <option value="auth">Auth Service</option>
              <option value="billing">Billing/Limits</option>
              <option value="queue">Redis Queue</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.text,
                padding: '6px 10px',
                fontSize: 12
              }}
            >
              <option value="">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={resolvedFilter}
              onChange={(e) => setResolvedFilter(e.target.value)}
              style={{
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.text,
                padding: '6px 10px',
                fontSize: 12
              }}
            >
              <option value="false">Unresolved Only</option>
              <option value="true">Resolved Only</option>
              <option value="all">Show All Logs</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}`, fontSize: 12, color: T.muted }}>
                <th style={{ padding: '10px 8px' }}>Severity</th>
                <th style={{ padding: '10px 8px' }}>Timestamp</th>
                <th style={{ padding: '10px 8px' }}>Service</th>
                <th style={{ padding: '10px 8px' }}>Message</th>
                <th style={{ padding: '10px 8px' }}>Tenant Context</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
                <th style={{ padding: '10px 8px', textAlign: 'center' }}>Diagnostics</th>
              </tr>
            </thead>
            <tbody>
              {loadingLogs ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: T.muted }}>
                    Streaming real-time incident logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: T.muted }}>
                    Zero active incidents found matching these criteria! ✨
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const sColors = serviceColors[log.service] || { bg: 'rgba(255,255,255,0.1)', text: T.text };
                  const lvl = levelBadgeColor[log.level] || levelBadgeColor.info;

                  return (
                    <tr key={log.id} style={{
                      borderBottom: `1px solid ${T.border}`,
                      fontSize: 13,
                      color: T.text,
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }} onClick={() => setSelectedLog(log)}>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: lvl.bg,
                          color: lvl.text,
                          border: `1.5px solid ${lvl.border}`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          display: 'inline-block'
                        }}>
                          {log.level}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: 11, fontFamily: T.mono, color: T.muted }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: sColors.bg,
                          color: sColors.text,
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          {log.service}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {log.message}
                      </td>
                      <td style={{ padding: '12px 8px', color: T.muted }}>
                        {log.organizationName}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: log.resolved ? T.emerald : T.amber
                        }}>
                          {log.resolved ? 'Resolved ✓' : 'Unresolved ⚠'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                          style={{
                            padding: '4px 10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${T.border}`,
                            color: T.text,
                            borderRadius: 6,
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception Detail diagnostics Drawer */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '550px',
          height: '100vh',
          background: T.card,
          borderLeft: `2.5px solid ${T.border}`,
          boxShadow: '-10px 0 25px rgba(0,0,0,0.5)',
          padding: 28,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          zIndex: 999
        }}>
          {/* Drawer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: (levelBadgeColor[selectedLog.level] || levelBadgeColor.info).bg,
                  color: (levelBadgeColor[selectedLog.level] || levelBadgeColor.info).text,
                  padding: '2px 6px',
                  borderRadius: 4
                }}>{selectedLog.level}</span>
                <span style={{ fontSize: 13, color: T.muted }}>Service: <strong style={{ color: T.text }}>{selectedLog.service}</strong></span>
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '8px 0 0' }}>Incident Diagnostics</h2>
            </div>
            <button
              onClick={() => { setSelectedLog(null); setResolutionNotes(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: T.muted,
                fontSize: 20,
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {/* Diagnostics Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: T.muted }}>Message</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 4, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 6, border: `1px solid ${T.border}` }}>
                {selectedLog.message}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: T.muted }}>Timestamp</div>
              <div style={{ fontSize: 12, fontFamily: T.mono, marginTop: 2 }}>
                {new Date(selectedLog.createdAt).toLocaleString()}
              </div>
            </div>

            {selectedLog.organizationName && (
              <div>
                <div style={{ fontSize: 11, color: T.muted }}>Organization Context</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{selectedLog.organizationName}</div>
              </div>
            )}

            {selectedLog.metadata?.url && (
              <div>
                <div style={{ fontSize: 11, color: T.muted }}>Endpoint / URL</div>
                <div style={{ fontSize: 12, fontFamily: T.mono, color: T.blue, marginTop: 2, wordBreak: 'break-all' }}>
                  {selectedLog.metadata.url}
                </div>
              </div>
            )}

            {selectedLog.stack && (
              <div>
                <div style={{ fontSize: 11, color: T.muted }}>Exception Stack Trace</div>
                <pre style={{
                  background: '#070C15',
                  color: T.rose,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 10,
                  fontFamily: T.mono,
                  maxHeight: 220,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  marginTop: 6
                }}>
                  {selectedLog.stack}
                </pre>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Incident Payload (Metadata)</div>
                <pre style={{
                  background: '#070C15',
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 10,
                  fontFamily: T.mono,
                  maxHeight: 150,
                  overflow: 'auto',
                  margin: 0
                }}>
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Resolution workflow block */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, marginTop: 10 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700 }}>Resolution Workflow</h4>
              {selectedLog.resolved ? (
                <div style={{
                  padding: 12,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 6,
                  fontSize: 12
                }}>
                  <div style={{ color: T.emerald, fontWeight: 700 }}>Incident Resolved ✓</div>
                  <div style={{ marginTop: 4, color: T.muted }}>
                    Resolved by {selectedLog.resolvedBy} on {new Date(selectedLog.resolvedAt).toLocaleString()}
                  </div>
                  {selectedLog.resolutionNotes && (
                    <div style={{ marginTop: 8, fontStyle: 'italic', color: T.text }}>
                      "{selectedLog.resolutionNotes}"
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    placeholder="Enter diagnostic steps / resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    style={{
                      width: '100%',
                      height: 70,
                      background: 'rgba(255,255,255,0.02)',
                      border: `1px solid ${T.border}`,
                      borderRadius: 6,
                      color: T.text,
                      padding: 8,
                      fontSize: 12,
                      resize: 'none'
                    }}
                  />
                  <button
                    onClick={() => handleResolve(selectedLog.id)}
                    disabled={resolving}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: T.emerald,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {resolving ? 'Resolving incident...' : 'Mark Resolved ✓'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
