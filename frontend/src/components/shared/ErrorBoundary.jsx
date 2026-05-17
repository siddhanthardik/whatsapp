import React from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, reported: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    this.reportError(error, errorInfo);
  }

  async reportError(error, errorInfo) {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return; // Only log for logged in users

      const payload = {
        message: error?.message || 'React Uncaught Crash',
        stack: error?.stack || '',
        url: window.location.href,
        metadata: {
          componentStack: errorInfo?.componentStack || '',
          userAgent: navigator.userAgent
        }
      };

      const BASE = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${BASE}/users/crashes`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      this.setState({ reported: true });
    } catch (e) {
      console.error('Failed to report react crash to backend:', e.message);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'DM Sans', sans-serif",
          padding: 24
        }}>
          <div style={{
            maxWidth: 600,
            width: '100%',
            backgroundColor: '#1E293B',
            borderRadius: 16,
            border: '1px solid #334155',
            padding: 32,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold'
              }}>
                ⚠
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                  Application Crash Blocked
                </h1>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '4px 0 0' }}>
                  The error was securely reported to the platform health team.
                </p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 8,
              padding: 16,
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              color: '#F1F5F9',
              maxHeight: 180,
              overflowY: 'auto',
              marginBottom: 24
            }}>
              <strong style={{ color: '#EF4444' }}>{this.state.error?.toString()}</strong>
              <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', color: '#94A3B8' }}>
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global window event listener setup helper
export function setupGlobalErrorCapture() {
  if (typeof window === 'undefined') return;

  const reportGlobalCrash = async (message, stack, url) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return;

      const BASE = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${BASE}/users/crashes`, {
        message,
        stack,
        url,
        metadata: {
          userAgent: navigator.userAgent,
          type: 'window_global'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      // ignore
    }
  };

  window.onerror = function (message, source, lineno, colno, error) {
    reportGlobalCrash(
      message?.toString() || 'Global Window Error',
      error?.stack || `At ${source}:${lineno}:${colno}`,
      window.location.href
    );
    return false; // let standard handler fire
  };

  window.onunhandledrejection = function (event) {
    reportGlobalCrash(
      `Unhandled Promise Rejection: ${event.reason?.message || event.reason}`,
      event.reason?.stack || 'No stack trace available',
      window.location.href
    );
  };
}

export default ErrorBoundary;
