import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { templatesAPI } from '../../services/api';

// Design system colors
const T = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  green: '#00A884',
  blue: '#3B82F6',
  red: '#EF4444',
  yellow: '#FBBF24',
  grey: '#6B7280',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  subtle: '#94A3B8',
  light: '#F1F5F9',
};

// Emoji picker for formatting
const EMOJI_PICKER = ['😀', '😂', '😍', '❤️', '👍', '🔥', '✅', '🎉', '📱', '💰'];

const REVIEW_TIMES = {
  UTILITY: '~5 minutes',
  AUTHENTICATION: '~5 minutes',
  MARKETING: 'up to 24 hours',
};

export default function TemplateBuilderPage() {
  const navigate = useNavigate();
  const { id: templateId } = useParams();
  const fileInputRef = useRef(null);

  // State Management
  const [loading, setLoading] = useState(templateId ? true : false);
  const [displayName, setDisplayName] = useState('');
  const [templateIdAuto, setTemplateIdAuto] = useState('');
  const [category, setCategory] = useState('UTILITY');
  const [language, setLanguage] = useState('en_US');

  // Header State
  const [headerType, setHeaderType] = useState('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerMediaUrl, setHeaderMediaUrl] = useState('');
  const [headerMediaType, setHeaderMediaType] = useState('');
  const [headerThumbnail, setHeaderThumbnail] = useState(null);

  // Body State
  const [bodyText, setBodyText] = useState('');
  const [bodyVariables, setBodyVariables] = useState({});
  const [detectedVariables, setDetectedVariables] = useState([]);
  const [templateFormatMenu, setTemplateFormatMenu] = useState(null);

  // Footer State
  const [footerText, setFooterText] = useState('');

  // Buttons State
  const [buttons, setButtons] = useState([]);
  const [draggedButton, setDraggedButton] = useState(null);

  // UI State
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [createdTemplateId, setCreatedTemplateId] = useState(null);
  const bodyTextRef = useRef(null);

  // Auto-generate templateId from displayName
  useEffect(() => {
    const generated = displayName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    setTemplateIdAuto(generated);
  }, [displayName]);

  // Detect variables from body text {{1}}, {{2}} etc
  useEffect(() => {
    const re = /\{\{\s*(\d+)\s*\}\}/g;
    const vars = [];
    let match;
    while ((match = re.exec(bodyText)) !== null) {
      if (!vars.includes(match[1])) vars.push(match[1]);
    }
    vars.sort((a, b) => Number(a) - Number(b));
    setDetectedVariables(vars);

    // Initialize variables object
    const newVars = {};
    vars.forEach((v) => {
      newVars[v] = bodyVariables[v] || '';
    });
    setBodyVariables(newVars);
  }, [bodyText]);

  // Load template if editing
  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  async function loadTemplate() {
    try {
      const res = await templatesAPI.get(templateId);
      const t = res.data?.data?.template;
      setDisplayName(t.name);
      setTemplateIdAuto(t.templateId);
      setCategory(t.category);
      setLanguage(t.language);
      setBodyText(t.body?.text || '');
      setBodyVariables(t.body?.variables ? {} : {});
      t.body?.variables?.forEach((v, i) => {
        setBodyVariables((prev) => ({ ...prev, [(i + 1).toString()]: v }));
      });
      if (t.header) {
        setHeaderType(t.header.type);
        setHeaderText(t.header.text || '');
        setHeaderMediaUrl(t.header.mediaUrl || '');
        setHeaderMediaType(t.header.mediaType || '');
      }
      setFooterText(t.footer?.text || '');
      setButtons(t.buttons || []);
      setLoading(false);
    } catch (e) {
      console.error('Failed to load template:', e);
      setError('Failed to load template');
      setLoading(false);
    }
  }

  function handleMediaUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setHeaderMediaUrl(base64);
      setHeaderMediaType(file.type);

      // Show thumbnail
      if (headerType === 'IMAGE') {
        setHeaderThumbnail(base64);
      }
    };
    reader.readAsDataURL(file);
  }

  function insertVariable() {
    if (!bodyTextRef.current) return;
    const nextVar = String(detectedVariables.length + 1);
    const cursorPos = bodyTextRef.current.selectionStart;
    const newText = bodyText.slice(0, cursorPos) + `{{${nextVar}}}` + bodyText.slice(cursorPos);
    setBodyText(newText);
  }

  function applyFormat(prefix, suffix = '') {
    if (!bodyTextRef.current) return;
    const start = bodyTextRef.current.selectionStart;
    const end = bodyTextRef.current.selectionEnd;
    const selected = bodyText.substring(start, end);
    if (!selected) return;
    const newText = bodyText.slice(0, start) + prefix + selected + (suffix || prefix) + bodyText.slice(end);
    setBodyText(newText);
  }

  function addButton() {
    const newBtn = { id: Date.now(), type: 'QUICK_REPLY', text: '' };
    setButtons([...buttons, newBtn]);
  }

  function removeButton(btnId) {
    setButtons(buttons.filter((b) => b.id !== btnId));
  }

  function updateButton(btnId, field, value) {
    setButtons(buttons.map((b) => (b.id === btnId ? { ...b, [field]: value } : b)));
  }

  function handleDragStart(index) {
    setDraggedButton(index);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(index) {
    if (draggedButton === null || draggedButton === index) return;
    const newButtons = [...buttons];
    const draggedB = newButtons[draggedButton];
    newButtons.splice(draggedButton, 1);
    newButtons.splice(index, 0, draggedB);
    setButtons(newButtons);
    setDraggedButton(null);
  }

  // Build header object based on type
  function buildHeader() {
    if (headerType === 'NONE') return null;
    const header = { type: headerType };
    if (headerType === 'TEXT') header.text = headerText;
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
      header.mediaUrl = headerMediaUrl;
      header.mediaType = headerMediaType;
    }
    return header;
  }

  // Build buttons array
  function buildButtons() {
    return buttons
      .filter((b) => b.text.trim())
      .map((b) => {
        const btn = { type: b.type, text: b.text.trim() };
        if (b.type === 'URL' && b.url) btn.url = b.url;
        if (b.type === 'PHONE_NUMBER' && b.phoneNumber) btn.phoneNumber = b.phoneNumber;
        return btn;
      });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Validation
      if (!displayName.trim()) throw new Error('Display name is required');
      if (!bodyText.trim()) throw new Error('Message body is required');

      const payload = {
        name: displayName.trim(),
        templateId: templateIdAuto,
        category,
        language,
        header: buildHeader(),
        body: {
          text: bodyText.trim(),
          variables: Object.values(bodyVariables).filter((v) => v),
        },
        footer: footerText.trim() ? { text: footerText.trim() } : null,
        buttons: buildButtons(),
      };

      console.log('📤 Saving template draft:', JSON.stringify(payload, null, 2));

      if (templateId || createdTemplateId) {
        const idToUpdate = templateId || createdTemplateId;
        await templatesAPI.update(idToUpdate, payload);
      } else {
        const res = await templatesAPI.create(payload);
        const newId = res.data?.data?.template?._id;
        if (newId) {
          setCreatedTemplateId(newId);
          window.history.replaceState({}, '', `/templates/${newId}/edit`);
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      console.log('✅ Template saved successfully');
    } catch (e) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Save failed';
      console.error('❌ Save failed:', errorMsg, e?.response?.data);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      // Validation
      if (!displayName.trim()) throw new Error('Display name is required');
      if (!bodyText.trim()) throw new Error('Message body is required');
      
      // Check all variables have sample values
      for (const varNum of detectedVariables) {
        if (!bodyVariables[varNum] || !bodyVariables[varNum].trim()) {
          throw new Error(`Please provide a sample value for variable {{${varNum}}}`);
        }
      }

      // Save draft first
      const payload = {
        name: displayName.trim(),
        templateId: templateIdAuto,
        category,
        language,
        header: buildHeader(),
        body: {
          text: bodyText.trim(),
          variables: Object.values(bodyVariables).filter((v) => v),
        },
        footer: footerText.trim() ? { text: footerText.trim() } : null,
        buttons: buildButtons(),
      };

      console.log('📤 Creating/updating template for submission:', JSON.stringify(payload, null, 2));

      let tid = templateId || createdTemplateId;
      if (!tid) {
        const res = await templatesAPI.create(payload);
        tid = res.data?.data?.template?._id;
        if (!tid) {
          throw new Error('Failed to create template - invalid response');
        }
        setCreatedTemplateId(tid);
        window.history.replaceState({}, '', `/templates/${tid}/edit`);
      } else {
        await templatesAPI.update(tid, payload);
      }

      // Now submit
      console.log('📘 Submitting to WhatsApp:', tid);
      await templatesAPI.submit(tid);
      console.log('✅ Template submitted to WhatsApp');

      // Show success and redirect
      alert(`Template submitted for review! Estimated approval time: ${REVIEW_TIMES[category]}`);
      setTimeout(() => navigate('/templates'), 1500);
    } catch (e) {
      const errorMsg = e?.response?.data?.message || e?.message || 'Submit failed';
      console.error('❌ Submit failed:', errorMsg, e?.response?.data);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: T.bg }}>
        <div style={{ fontSize: 16, color: T.muted }}>Loading template...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: T.bg }}>
      {/* TOPBAR */}
      <div style={{ height: 72, background: T.card, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', padding: '0 32px', zIndex: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>Create WhatsApp Template</div>
          <div style={{ fontSize: 12, color: T.subtle, marginTop: 2 }}>Production-grade template builder with live preview</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/templates')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#fff',
              border: `1px solid ${T.border}`,
              color: T.text,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          {saved && <span style={{ fontSize: 12, color: T.green, fontWeight: 600 }}>Saved! ✓</span>}
          <button
            onClick={handleSave}
            disabled={saving || submitting}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#fff',
              border: `1px solid ${T.border}`,
              color: T.text,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || saving}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: T.green,
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.8 : 1,
            }}
          >
            {submitting ? 'Submitting...' : '✓ Submit to WhatsApp'}
          </button>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 100,
            right: 20,
            background: '#FEE2E2',
            border: `2px solid ${T.red}`,
            borderRadius: 12,
            padding: '16px 20px',
            maxWidth: 400,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ color: T.red, fontSize: 20 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7F1D1D', marginBottom: 4 }}>Error</div>
              <div style={{ fontSize: 13, color: '#B91C1C', marginBottom: 8 }}>{error}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Check browser console (F12) for details</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* LEFT PANEL - FORM */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', background: T.bg }}>
          <div style={{ maxWidth: 600 }}>
            {/* ===== TEMPLATE INFO SECTION ===== */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Template Info</div>
              <div
                style={{
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>Display Name *</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Diwali Offer 20%"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      fontSize: 14,
                      outline: 'none',
                      color: T.text,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>Template ID (auto-generated)</label>
                  <input
                    value={templateIdAuto}
                    onChange={(e) => setTemplateIdAuto(e.target.value)}
                    placeholder="diwali_offer_20"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      fontSize: 13,
                      fontFamily: 'monospace',
                      outline: 'none',
                      color: T.text,
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: 11, color: T.subtle, marginTop: 4 }}>Lowercase letters, numbers, underscores only. Auto-generated from display name.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${T.border}`,
                        fontSize: 14,
                        outline: 'none',
                        color: T.text,
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="UTILITY">Utility</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="AUTHENTICATION">Authentication</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>Language *</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${T.border}`,
                        fontSize: 14,
                        outline: 'none',
                        color: T.text,
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="en_US">English (US)</option>
                      <option value="en_GB">English (UK)</option>
                      <option value="hi_IN">Hindi</option>
                      <option value="es_ES">Spanish</option>
                      <option value="fr_FR">French</option>
                      <option value="de_DE">German</option>
                      <option value="it_IT">Italian</option>
                      <option value="pt_BR">Portuguese (BR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== HEADER SECTION ===== */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Header (Optional)</div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: T.blue, fontSize: 18 }}>📦</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Header Type</div>
                </div>
                <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                  {['NONE', 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT'].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setHeaderType(type);
                        if (type === 'NONE') {
                          setHeaderText('');
                          setHeaderMediaUrl('');
                          setHeaderThumbnail(null);
                        }
                      }}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 8,
                        border: `2px solid ${headerType === type ? T.green : T.border}`,
                        background: headerType === type ? '#E8F5E9' : '#fff',
                        color: T.text,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {headerType === 'TEXT' && (
                  <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>Header Text (max 60 chars)</label>
                    <input
                      value={headerText}
                      onChange={(e) => setHeaderText(e.target.value.slice(0, 60))}
                      placeholder="Example: User Verification"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${T.border}`,
                        fontSize: 14,
                        outline: 'none',
                        color: T.text,
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ fontSize: 11, color: T.subtle, marginTop: 4 }}>{headerText.length}/60 characters</div>
                  </div>
                )}

                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                  <div style={{ padding: 20, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 12 }}>Upload File</label>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 8,
                          border: `2px dashed ${T.border}`,
                          background: T.light,
                          color: T.blue,
                          fontWeight: 600,
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        📁 Choose {headerType.toLowerCase()} from computer
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={headerType === 'IMAGE' ? 'image/*' : headerType === 'VIDEO' ? 'video/*' : '.pdf,.doc,.docx'}
                        onChange={handleMediaUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 8 }}>OR Enter URL</label>
                      <input
                        value={headerMediaUrl}
                        onChange={(e) => setHeaderMediaUrl(e.target.value)}
                        placeholder={`https://example.com/${headerType.toLowerCase()}`}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${T.border}`,
                          fontSize: 14,
                          outline: 'none',
                          color: T.text,
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {headerType === 'IMAGE' && headerMediaUrl && (
                      <div style={{ background: T.light, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                        <img
                          src={headerMediaUrl}
                          alt="preview"
                          style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4 }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ===== BODY SECTION ===== */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Message Body *</div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: T.blue, fontSize: 18 }}>✏️</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text, flex: 1 }}>Compose Message</div>
                </div>

                {/* Formatting Toolbar */}
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => applyFormat('*', '*')}
                    title="Bold"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: '#fff',
                      color: T.text,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    B
                  </button>
                  <button
                    onClick={() => applyFormat('_', '_')}
                    title="Italic"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: '#fff',
                      color: T.text,
                      fontStyle: 'italic',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    I
                  </button>
                  <button
                    onClick={() => applyFormat('~', '~')}
                    title="Strikethrough"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: '#fff',
                      color: T.text,
                      textDecoration: 'line-through',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    S
                  </button>
                  <div style={{ width: 1, background: T.border }}></div>
                  <button
                    onClick={() => insertVariable()}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: '#fff',
                      color: T.blue,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    + Variable
                  </button>
                  <div style={{ flex: 1 }}></div>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${T.border}`,
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    😀
                  </button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8 }}>
                    {EMOJI_PICKER.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          if (bodyTextRef.current) {
                            const pos = bodyTextRef.current.selectionStart;
                            const newText = bodyText.slice(0, pos) + emoji + bodyText.slice(pos);
                            setBodyText(newText);
                          }
                          setShowEmojiPicker(false);
                        }}
                        style={{
                          fontSize: 18,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 8px',
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Text Area */}
                <div style={{ padding: 20 }}>
                  <textarea
                    ref={bodyTextRef}
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value.slice(0, 1024))}
                    placeholder="Write your message here...&#10;&#10;Use {{1}}, {{2}} for variables&#10;Use *text* for bold, _text_ for italic&#10;Use ~text~ for strikethrough"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      fontSize: 14,
                      fontFamily: 'monospace',
                      outline: 'none',
                      color: T.text,
                      boxSizing: 'border-box',
                      minHeight: 200,
                      resize: 'vertical',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 8,
                      fontSize: 12,
                      color: T.subtle,
                    }}
                  >
                    <span>{bodyText.length}/1024 characters</span>
                    {detectedVariables.length > 0 && (
                      <span style={{ color: T.blue }}>
                        {detectedVariables.length} variable{detectedVariables.length > 1 ? 's' : ''} detected
                      </span>
                    )}
                  </div>
                </div>

                {/* Variable Sample Inputs */}
                {detectedVariables.length > 0 && (
                  <div style={{ padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: '#FFFBEB' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>📝 Sample Values (required for preview)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                      {detectedVariables.map((varNum) => (
                        <div key={varNum}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: T.text, display: 'block', marginBottom: 6 }}>
                            Variable {'{' + varNum + '}'}
                          </label>
                          <input
                            value={bodyVariables[varNum] || ''}
                            onChange={(e) => setBodyVariables({ ...bodyVariables, [varNum]: e.target.value })}
                            placeholder={`e.g., John Doe`}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: `1px solid ${T.border}`,
                              fontSize: 12,
                              outline: 'none',
                              color: T.text,
                              boxSizing: 'border-box',
                              background: '#fff',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ===== FOOTER SECTION ===== */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Footer (Optional)</div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <input
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value.slice(0, 60))}
                  placeholder="Footer text (e.g., Powered by XYZ)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${T.border}`,
                    fontSize: 14,
                    outline: 'none',
                    color: T.text,
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: T.subtle, marginTop: 6 }}>{footerText.length}/60 characters • Appears below the message</div>
              </div>
            </div>

            {/* ===== BUTTONS SECTION ===== */}
            <div style={{ marginBottom: 40 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Buttons (Optional, max 10)</span>
                {buttons.length < 10 && (
                  <button
                    onClick={addButton}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: `1px solid ${T.green}`,
                      background: '#E8F5E9',
                      color: T.green,
                      fontWeight: 600,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    + Add Button
                  </button>
                )}
              </div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {buttons.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>No buttons yet</div>
                    <button
                      onClick={addButton}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: `1px solid ${T.green}`,
                        background: '#E8F5E9',
                        color: T.green,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Button
                    </button>
                  </div>
                ) : (
                  buttons.map((btn, idx) => (
                    <div
                      key={btn.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      style={{
                        padding: 16,
                        borderBottom: idx < buttons.length - 1 ? `1px solid ${T.border}` : 'none',
                        background: draggedButton === idx ? T.light : '#fff',
                        cursor: 'grab',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ color: T.muted, fontWeight: 700 }}>☰</span>
                        <select
                          value={btn.type}
                          onChange={(e) => updateButton(btn.id, 'type', e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `1px solid ${T.border}`,
                            fontSize: 12,
                            outline: 'none',
                            color: T.text,
                          }}
                        >
                          <option value="QUICK_REPLY">Quick Reply</option>
                          <option value="URL">Visit Website</option>
                          <option value="PHONE_NUMBER">Call Phone</option>
                        </select>
                        <button
                          onClick={() => removeButton(btn.id)}
                          style={{
                            marginLeft: 'auto',
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: `1px solid ${T.red}`,
                            background: '#FEE2E2',
                            color: T.red,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: T.text, display: 'block', marginBottom: 4 }}>Button Text *</label>
                          <input
                            value={btn.text}
                            onChange={(e) => updateButton(btn.id, 'text', e.target.value)}
                            placeholder="e.g., Yes, No, Learn More"
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              borderRadius: 6,
                              border: `1px solid ${T.border}`,
                              fontSize: 12,
                              outline: 'none',
                              color: T.text,
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {btn.type === 'URL' && (
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: T.text, display: 'block', marginBottom: 4 }}>URL *</label>
                            <input
                              value={btn.url || ''}
                              onChange={(e) => updateButton(btn.id, 'url', e.target.value)}
                              placeholder="https://example.com"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: `1px solid ${T.border}`,
                                fontSize: 12,
                                outline: 'none',
                                color: T.text,
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        )}

                        {btn.type === 'PHONE_NUMBER' && (
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: T.text, display: 'block', marginBottom: 4 }}>Phone Number *</label>
                            <input
                              value={btn.phoneNumber || ''}
                              onChange={(e) => updateButton(btn.id, 'phoneNumber', e.target.value)}
                              placeholder="+91-9876543210"
                              style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: `1px solid ${T.border}`,
                                fontSize: 12,
                                outline: 'none',
                                color: T.text,
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - LIVE PREVIEW */}
        <div
          style={{
            flex: 1,
            background: T.light,
            borderLeft: `1px solid ${T.border}`,
            padding: '32px 40px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 24, textAlign: 'center' }}>WhatsApp Preview</div>

          {/* Mobile Phone Frame */}
          <div
            style={{
              width: 320,
              background: T.card,
              borderRadius: 40,
              padding: 12,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: 640,
                background: '#E5DDD5',
                borderRadius: 30,
                padding: 12,
                boxSizing: 'border-box',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              {/* Preview Message Bubble */}
              <div
                style={{
                  background: T.green,
                  color: '#fff',
                  borderRadius: '18px 18px 4px 18px',
                  padding: '12px 16px',
                  maxWidth: '85%',
                  wordWrap: 'break-word',
                }}
              >
                {/* Header */}
                {headerType !== 'NONE' && (
                  <div style={{ marginBottom: 12 }}>
                    {headerType === 'TEXT' && (
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{headerText || '(header text)'}</div>
                    )}
                    {headerType === 'IMAGE' && headerMediaUrl && (
                      <img
                        src={headerMediaUrl}
                        alt="header"
                        style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 8, marginBottom: 8 }}
                      />
                    )}
                    {['VIDEO', 'DOCUMENT'].includes(headerType) && (
                      <div style={{ fontSize: 12, fontStyle: 'italic', marginBottom: 8 }}>({headerType.toLowerCase()} attached)</div>
                    )}
                  </div>
                )}

                {/* Body with sample values substituted */}
                <div style={{ fontSize: 13, lineHeight: '1.5' }}>
                  {bodyText ? (
                    bodyText.split('\n').map((line, i) => (
                      <div key={i}>
                        {line.split(/(\{\{\d+\}\})/).map((part, j) => {
                          const varMatch = part.match(/\{\{(\d+)\}\}/);
                          if (varMatch) {
                            const varNum = varMatch[1];
                            return (
                              <span
                                key={j}
                                style={{
                                  background: 'rgba(255,255,255,0.3)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}
                              >
                                {bodyVariables[varNum] || '(sample)'}
                              </span>
                            );
                          }
                          return part;
                        })}
                      </div>
                    ))
                  ) : (
                    <div style={{ opacity: 0.7, fontStyle: 'italic' }}>Message preview appears here...</div>
                  )}
                </div>

                {/* Footer */}
                {footerText && (
                  <div style={{ fontSize: 11, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.3)', opacity: 0.9 }}>
                    {footerText}
                  </div>
                )}

                {/* Buttons */}
                {buildButtons().length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {buildButtons().map((btn, i) => (
                      <button
                        key={i}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.5)',
                          borderRadius: 20,
                          padding: '8px 16px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'default',
                          width: '100%',
                        }}
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: 10, marginTop: 8, opacity: 0.7, textAlign: 'right' }}>
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div style={{ marginTop: 32, width: '100%', maxWidth: 320 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 12 }}>Template Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11 }}>
                <div>
                  <div style={{ color: T.muted, marginBottom: 4 }}>Category</div>
                  <div style={{ color: T.text, fontWeight: 600 }}>{category}</div>
                </div>
                <div>
                  <div style={{ color: T.muted, marginBottom: 4 }}>Language</div>
                  <div style={{ color: T.text, fontWeight: 600 }}>{language}</div>
                </div>
                <div>
                  <div style={{ color: T.muted, marginBottom: 4 }}>Review Time</div>
                  <div style={{ color: T.blue, fontWeight: 600 }}>{REVIEW_TIMES[category]}</div>
                </div>
                <div>
                  <div style={{ color: T.muted, marginBottom: 4 }}>Buttons</div>
                  <div style={{ color: T.text, fontWeight: 600 }}>{buildButtons().length}/10</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
