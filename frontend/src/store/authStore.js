import { create } from 'zustand'
import { authAPI } from '../services/api'

const STORAGE_KEY = 'auth'

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: null }
    const parsed = JSON.parse(raw)
    return { user: parsed.user || null, token: parsed.token || null }
  } catch (e) {
    return { user: null, token: null }
  }
}

const initialState = readStoredAuth()

export const useAuthStore = create((set, get) => ({
  // initial state
  user: initialState.user,
  token: initialState.token,
  isAuthenticated: !!initialState.token,

  // actions
  setAuth: (user, token) => {
    set({ user, token, isAuthenticated: !!token })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    } catch (e) {
      // ignore
    }
  },

  clearAuth: () => {
    set({ user: null, token: null, isAuthenticated: false })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
  },

  // global upgrade modal state
  showUpgradeModal: false,
  upgradeReason: '',

  setShowUpgradeModal: (show, reason = '') => {
    set({ showUpgradeModal: show, upgradeReason: reason })
  },

  fetchMe: async () => {
    try {
      const token = get().token
      if (!token) return
      const res = await authAPI.me()
      const data = res.data?.data || res.data
      if (data && data.user) {
        const userObj = {
          ...data.user,
          organization: data.organization,
          subscription: data.subscription,
        }
        set({ user: userObj })
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userObj, token }))
      }
    } catch (e) {
      console.error('fetchMe error:', e)
    }
  },

  initAuth: () => {
    const stored = readStoredAuth()
    const { user, token } = stored
    set({ user, token, isAuthenticated: !!token })
    if (token) {
      get().fetchMe()
    }
  },
}))

export default useAuthStore
