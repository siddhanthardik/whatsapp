import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';

const T = {
  bg:         "#F0F4F8",
  card:       "#FFFFFF",
  green:      "#00A884",
  greenLight: "#E6F7F2",
  red:        "#DC2626",
  redLight:   "#FFF1F2",
  blue:       "#2563EB",
  text:       "#0F172A",
  muted:      "#64748B",
  border:     "#E2E8F0",
  mono:       "'DM Mono','SF Mono',monospace",
};

export default function DeliveryInspector() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await superAdminAPI.delivery({ page, limit: 20, search, status: statusFilter });
      if (res.data?.success) {
        setMessages(res.data.data.messages);
        setTotalPages(Math.ceil(res.data.data.meta.total / 20));
      }
    } catch (err) {
      console.error('Failed to fetch delivery logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [page, statusFilter]);

  const StatusBadge = ({ status }) => {
    const isError = status === 'failed';
    const isSuccess = ['delivered', 'read'].includes(status);
    const color = isError ? T.red : isSuccess ? T.green : T.blue;
    const bg = isError ? T.redLight : isSuccess ? T.greenLight : '#EFF6FF';
    
    return (
      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: bg, color, textTransform: 'capitalize' }}>
        {status || 'unknown'}
      </span>
    );
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: T.text }}>Delivery Inspector</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: T.muted }}>Deep dive into outgoing Meta API payloads and incoming webhooks.</p>
        </div>
        <button onClick={fetchMessages} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', fontSize: 13 }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input 
          type="text" 
          placeholder="Search phone number..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchMessages()}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none' }}
        />
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.border}`, outline: 'none', background: T.card }}
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="read">Read</option>
          <option value="failed">Failed</option>
        </select>
        <button onClick={fetchMessages} style={{ padding: '0 20px', borderRadius: 8, border: 'none', background: T.green, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          Search
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', gap: 20, minHeight: 0 }}>
        {/* Left List */}
        <div style={{ flex: 1, background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.bg, textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', color: T.muted, fontWeight: 600 }}>Recipient</th>
                <th style={{ padding: '12px 16px', color: T.muted, fontWeight: 600 }}>Org / Campaign</th>
                <th style={{ padding: '12px 16px', color: T.muted, fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', color: T.muted, fontWeight: 600 }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: T.muted }}>Loading...</td></tr>
              ) : messages.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: T.muted }}>No messages found.</td></tr>
              ) : (
                messages.map(m => (
                  <tr 
                    key={m.id} 
                    onClick={() => setSelectedMessage(m)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selectedMessage?.id === m.id ? T.bg : 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: T.mono }}>{m.to}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{m.organizationName}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{m.campaignName}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={m.status} /></td>
                    <td style={{ padding: '12px 16px', color: T.muted, fontSize: 12 }}>{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Inspector panel */}
        {selectedMessage && (
          <div style={{ width: 450, background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: `1px solid ${T.border}`, background: T.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: T.text }}>Message Details</div>
              <button onClick={() => setSelectedMessage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            
            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Meta WAMID</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, background: T.bg, padding: 8, borderRadius: 6, wordBreak: 'break-all' }}>
                  {selectedMessage.wamid || 'N/A'}
                </div>
              </div>

              {selectedMessage.errorDetails && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: T.red, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Error Details</div>
                  <div style={{ fontSize: 13, background: T.redLight, color: T.red, padding: 12, borderRadius: 6 }}>
                    {selectedMessage.errorDetails}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Outbound Meta Payload</div>
                <pre style={{ fontFamily: T.mono, fontSize: 11, background: '#1E293B', color: '#E2E8F0', padding: 12, borderRadius: 6, overflowX: 'auto', margin: 0 }}>
                  {JSON.stringify(selectedMessage.metaResponse, null, 2) || 'No meta response recorded'}
                </pre>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                  Webhook History ({selectedMessage.webhookPayloads?.length || 0})
                </div>
                {selectedMessage.webhookPayloads && selectedMessage.webhookPayloads.length > 0 ? (
                  selectedMessage.webhookPayloads.map((wh, idx) => (
                    <pre key={idx} style={{ fontFamily: T.mono, fontSize: 11, background: '#F8FAFC', color: T.text, padding: 12, borderRadius: 6, overflowX: 'auto', margin: '0 0 8px 0', border: `1px solid ${T.border}` }}>
                      {JSON.stringify(wh, null, 2)}
                    </pre>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: T.muted }}>No webhook events recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, cursor: page === 1 ? 'not-allowed' : 'pointer', background: T.card }}>Prev</button>
        <span style={{ fontSize: 13, color: T.muted, display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${T.border}`, cursor: page >= totalPages ? 'not-allowed' : 'pointer', background: T.card }}>Next</button>
      </div>
    </div>
  );
}
