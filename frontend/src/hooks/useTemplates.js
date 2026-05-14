import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesAPI } from '../services/api'
import toast from 'react-hot-toast'

function parseResponse(res) {
  const payload = res?.data || res
  return payload.data || payload
}

export function useTemplates(params = {}, options = {}) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: async () => {
      const res = await templatesAPI.list(params)
      return parseResponse(res)
    },
    keepPreviousData: true,
    ...options,
  })
}

export function useTemplate(id, options = {}) {
  return useQuery({
    queryKey: ['template', id],
    queryFn: async () => {
      const res = await templatesAPI.get(id)
      return parseResponse(res)
    },
    enabled: !!id,
    ...options,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => templatesAPI.create(payload),
    onSuccess: () => {
      toast.success('Template created')
      qc.invalidateQueries(['templates'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Create failed'
      toast.error(msg)
    },
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => templatesAPI.update(id, payload),
    onSuccess: () => {
      toast.success('Template updated')
      qc.invalidateQueries(['templates'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Update failed'
      toast.error(msg)
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const ok = window.confirm('Are you sure you want to delete this template?')
      if (!ok) throw new Error('User cancelled')
      return templatesAPI.delete(id)
    },
    onSuccess: () => {
      toast.success('Template deleted')
      qc.invalidateQueries(['templates'])
    },
    onError: (err) => {
      if (err?.message === 'User cancelled') return
      const msg = err?.response?.data?.message || err?.message || 'Delete failed'
      toast.error(msg)
    },
  })
}

export function useSubmitTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const toastId = toast.loading('Submitting template...')
      try {
        const res = await templatesAPI.submit(id)
        toast.success('Template submitted', { id: toastId })
        qc.invalidateQueries(['templates'])
        return res
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Submit failed'
        toast.error(msg, { id: toastId })
        throw err
      }
    },
    onError: () => {},
  })
}
