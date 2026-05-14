import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsAPI } from '../services/api'
import toast from 'react-hot-toast'

function parseResponse(res) {
  const payload = res?.data || res
  return payload.data || payload
}

export function useContacts(params = {}, options = {}) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const localKey = 'local_contacts'
      let local = []
      try {
        local = JSON.parse(localStorage.getItem(localKey) || '[]') || []
      } catch (e) { local = [] }

      try {
        const res = await contactsAPI.list(params)
        const parsed = parseResponse(res)

        // determine array of items in parsed response
        let items = []
        if (Array.isArray(parsed)) items = parsed
        else if (Array.isArray(parsed.items)) items = parsed.items
        else if (Array.isArray(parsed.contacts)) items = parsed.contacts
        else items = Array.isArray(parsed) ? parsed : []

        if (local.length) {
          // merge local and items, prefer server items if duplicate by phoneNumber/_id
          const map = new Map()
          for (const it of local) {
            const key = it._id || it.id || it.phoneNumber || it.phone || JSON.stringify(it)
            map.set(key, it)
          }
          for (const it of items) {
            const key = it._id || it.id || it.phoneNumber || it.phone || JSON.stringify(it)
            map.set(key, it)
          }
          const merged = Array.from(map.values())

          // return in same shape as parsed
          if (Array.isArray(parsed)) return merged
          if (parsed.items) return { ...parsed, items: merged }
          if (parsed.contacts) return { ...parsed, contacts: merged }
          return merged
        }

        return parsed
      } catch (err) {
        // If server fails, return local contacts so UI isn't empty
        if (local.length) return local
        // rethrow so react-query can handle error when no local fallback
        throw err
      }
    },
    keepPreviousData: true,
    ...options,
  })
}

export function useContact(id, options = {}) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const res = await contactsAPI.get(id)
      return parseResponse(res)
    },
    enabled: !!id,
    ...options,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => contactsAPI.create(payload),
    onSuccess: () => {
      toast.success('Contact created')
      qc.invalidateQueries(['contacts'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Create failed'
      toast.error(msg)
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => contactsAPI.update(id, payload),
    onSuccess: () => {
      toast.success('Contact updated')
      qc.invalidateQueries(['contacts'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Update failed'
      toast.error(msg)
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const ok = window.confirm('Are you sure you want to delete this contact?')
      if (!ok) throw new Error('User cancelled')
      return contactsAPI.delete(id)
    },
    onSuccess: () => {
      toast.success('Contact deleted')
      qc.invalidateQueries(['contacts'])
    },
    onError: (err) => {
      if (err?.message === 'User cancelled') return
      const msg = err?.response?.data?.message || err?.message || 'Delete failed'
      toast.error(msg)
    },
  })
}

export function useImportContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData) => contactsAPI.import(formData),
    onSuccess: () => {
      toast.success('Contacts imported')
      qc.invalidateQueries(['contacts'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Import failed'
      toast.error(msg)
    },
  })
}

export function useExportContacts() {
  return useMutation({
    mutationFn: async (params) => {
      const res = await contactsAPI.export(params)
      // res should be a blob
      const blob = res?.data || res
      const url = window.URL.createObjectURL(new Blob([blob]))
      // try to infer filename
      let filename = 'export.csv'
      try {
        const cd = res.headers && (res.headers['content-disposition'] || res.headers['Content-Disposition'])
        if (cd) {
          const match = /filename\*=UTF-8''(.+)$/.exec(cd) || /filename="?([^";]+)"?/.exec(cd)
          if (match) filename = decodeURIComponent(match[1])
        }
      } catch (e) {}

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Export started')
      return res
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Export failed'
      toast.error(msg)
    },
  })
}

