import { create } from 'zustand'

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

  initAuth: () => {
    const stored = readStoredAuth()
    const { user, token } = stored
    set({ user, token, isAuthenticated: !!token })
  },
}))

export default useAuthStore
