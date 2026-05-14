import { contactsAPI } from '../services/api'
import toast from 'react-hot-toast'

const LOCAL_KEY = 'local_contacts'
let syncing = false

async function syncOne(localContact) {
  try {
    // map local contact to API payload
    const payload = {
      phoneNumber: localContact.phoneNumber || localContact.phone || undefined,
      name: localContact.name,
      email: localContact.email,
      tags: localContact.tags || [],
      organisation: localContact.organisation || localContact.org || undefined,
    }
    const res = await contactsAPI.create(payload)
    if (res?.data?.success) return { ok: true }
    // if server responded but not success, treat as failure
    return { ok: false, error: res?.data?.message || 'unknown' }
  } catch (err) {
    // If conflict (already exists), remove local copy
    const status = err?.response?.status
    if (status === 409) return { ok: true, removed: true }
    // network error or server error: propagate for retry
    return { ok: false, error: err }
  }
}

export async function syncLocalContacts(queryClient) {
  if (syncing) return
  syncing = true
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return
    let list = []
    try { list = JSON.parse(raw) || [] } catch(e) { list = [] }
    if (!list.length) return

    // attempt sequential sync to avoid rate issues
    const remaining = []
    for (const c of list) {
      // skip if already has server id
      if (c._synced) continue
      const r = await syncOne(c)
      if (r.ok) {
        // invalidate queries so UI updates
        try { queryClient.invalidateQueries(['contacts']) } catch (e) {}
        continue // success -> drop
      }
      // if error is conflict, drop local
      if (r.removed) continue
      // keep for retry
      remaining.push(c)
    }

    if (remaining.length) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(remaining))
    } else {
      localStorage.removeItem(LOCAL_KEY)
    }

    if (list.length && list.length !== remaining.length) {
      toast.success(`${list.length - remaining.length} local contact(s) synced`) 
    }
  } finally {
    syncing = false
  }
}

export function startOfflineSync(queryClient) {
  // Run on startup
  if (navigator.onLine) syncLocalContacts(queryClient)

  // Listen for coming back online
  window.addEventListener('online', () => {
    syncLocalContacts(queryClient)
  })
}
