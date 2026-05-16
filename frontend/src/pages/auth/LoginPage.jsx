import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff, FiMail, FiLock, FiShield, FiArrowRight } from 'react-icons/fi'
import api, { authAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'

const T = {
  bg: '#0F172A',
  card: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderFocus: '#10B981',
  green: '#10B981',
  greenHover: '#059669',
  text: '#F8FAFC',
  muted: '#94A3B8',
  inputBg: 'rgba(0, 0, 0, 0.2)',
  error: '#EF4444',
};

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')

  async function onSubmit(formData) {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', formData)
      const data = res.data?.data || res.data || res
      
      if (data?.twoFactorRequired) {
        setTwoFactorRequired(true)
        toast.success('Two-factor authentication required')
        return
      }

      const user = data?.user || data?.profile || data
      const token = data?.accessToken || data?.token || data?.access_token
      
      if (!token) throw new Error('Login successful but no token received')

      setAuth(user, token)
      localStorage.setItem('token', token)
      
      toast.success('Login successful!')
      navigate('/dashboard')
    } catch (err) {
      console.error('LOGIN_ERROR', err)
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  async function submit2FA(e) {
    e.preventDefault()
    if (twoFactorToken.length !== 6) {
      toast.error('Enter a 6-digit code')
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.verify2fa({ code: twoFactorToken })
      const body = res.data?.data || res.data || res
      const user = body?.user || body
      const token = body?.accessToken || body?.token || body?.access_token
      if (!token) throw new Error('No token returned')
      setAuth(user, token)
      localStorage.setItem('token', token)
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '2FA verification failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: T.bg,
      backgroundImage: `radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), 
                        radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)`,
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Abstract Background Elements */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }}></div>

      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: T.card,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${T.border}`,
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 10,
        margin: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${T.green}, #059669)`,
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '800',
            boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)',
            marginBottom: '20px'
          }}>
            WA
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: T.text, marginBottom: '8px' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '14px', color: T.muted }}>
            Sign in to manage your WhatsApp campaigns
          </p>
        </div>

        {!twoFactorRequired && (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email Field */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: T.muted, marginBottom: '8px', marginLeft: '4px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: '18px' }} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    background: T.inputBg,
                    border: `1.5px solid ${errors.email ? T.error : T.border}`,
                    borderRadius: '12px',
                    color: T.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = T.green;
                    e.target.style.boxShadow = `0 0 0 4px rgba(16, 185, 129, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? T.error : T.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.email && <p style={{ color: T.error, fontSize: '12px', marginTop: '6px', marginLeft: '4px' }}>{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: T.muted, marginBottom: '8px', marginLeft: '4px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: '18px' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 48px',
                    background: T.inputBg,
                    border: `1.5px solid ${errors.password ? T.error : T.border}`,
                    borderRadius: '12px',
                    color: T.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = T.green;
                    e.target.style.boxShadow = `0 0 0 4px rgba(16, 185, 129, 0.1)`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.password ? T.error : T.border;
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: T.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {errors.password && <p style={{ color: T.error, fontSize: '12px', marginTop: '6px', marginLeft: '4px' }}>{errors.password.message}</p>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: T.muted, cursor: 'pointer' }}>
                <input type="checkbox" {...register('remember')} style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  accentColor: T.green
                }} />
                Remember me
              </label>
              <a href="#" style={{ fontSize: '14px', color: T.green, textDecoration: 'none', fontWeight: '500' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? T.muted : `linear-gradient(135deg, ${T.green}, #059669)`,
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 10px 20px -5px rgba(16, 185, 129, 0.3)',
                marginTop: '8px'
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <div style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              ) : (
                <>
                  Sign In
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        )}

        {twoFactorRequired && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px'
              }}>
                <FiShield />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: T.text, marginBottom: '8px' }}>Security Verification</h2>
              <p style={{ fontSize: '14px', color: T.muted }}>Enter the 6-digit code from your authenticator app</p>
            </div>

            <form onSubmit={submit2FA} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                inputMode="numeric"
                autoFocus
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '16px',
                  background: T.inputBg,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: '12px',
                  color: T.text,
                  fontSize: '24px',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '12px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = T.green}
                onBlur={(e) => e.target.style.borderColor = T.border}
              />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setTwoFactorRequired(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'transparent',
                    color: T.muted,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '14px',
                    background: `linear-gradient(135deg, ${T.green}, #059669)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <p style={{ fontSize: '14px', color: T.muted }}>
            Don't have an account? <a href="#" style={{ color: T.green, textDecoration: 'none', fontWeight: '600' }}>Contact Sales</a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  )
}
