import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'
import useAuthStore from '../store/authStore'

export function useLogin() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => authAPI.login(payload),
    onSuccess: (res) => {
      const payload = res?.data || res
      const body = payload.data || payload
      const user = body?.user || body?.profile || body
      const token = body?.accessToken || body?.token || body?.access_token
      if (token) {
        setAuth(user, token)
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        toast.success('Signed in')
        navigate('/dashboard')
      } else {
        toast.error('No token returned')
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Login failed'
      toast.error(msg)
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (refreshToken) => authAPI.logout(refreshToken),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      toast.success('Signed out')
      navigate('/login')
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Logout failed'
      toast.error(msg)
      // still clear local auth
      clearAuth()
      navigate('/login')
    },
  })
}

export function useCurrentUser(enabled = true) {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await authAPI.me()
      const payload = res?.data || res
      const body = payload.data || payload
      const user = body?.user || body
      return user
    },
    enabled,
    onSuccess: (user) => {
      // preserve existing token in store
      const token = useAuthStore.getState().token
      if (user) setAuth(user, token)
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message
      if (msg) toast.error(msg)
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email) => authAPI.forgotPassword(email),
    onSuccess: () => toast.success('Password reset email sent'),
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Request failed'
      toast.error(msg)
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }) => authAPI.resetPassword(token, password),
    onSuccess: () => toast.success('Password reset successful'),
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Reset failed'
      toast.error(msg)
    },
  })
}

export function useVerify2FA() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: (payload) => authAPI.verify2fa(payload),
    onSuccess: (res) => {
      const payload = res?.data || res
      const body = payload.data || payload
      const user = body?.user || body
      const token = body?.accessToken || body?.token || body?.access_token
      if (token) {
        setAuth(user, token)
        toast.success('2FA verified')
        navigate('/dashboard')
      } else {
        toast.error('No token returned')
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Verification failed'
      toast.error(msg)
    },
  })
}

