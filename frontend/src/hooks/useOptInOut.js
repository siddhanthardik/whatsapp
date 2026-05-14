import { useQuery, useMutation } from '@tanstack/react-query'
import { optAPI } from '../services/api'
import toast from 'react-hot-toast'

function parse(res) {
  const payload = res?.data || res
  return payload.data || payload
}

export function useOptIns(params = {}, options = {}) {
  return useQuery({
    queryKey: ['opt', 'ins', params],
    queryFn: async () => {
      const res = await optAPI.optInList(params)
      return parse(res)
    },
    keepPreviousData: true,
    ...options,
  })
}

export function useOptOuts(params = {}, options = {}) {
  return useQuery({
    queryKey: ['opt', 'outs', params],
    queryFn: async () => {
      const res = await optAPI.optOutList(params)
      return parse(res)
    },
    keepPreviousData: true,
    ...options,
  })
}

export function useManualOptOut() {
  return useMutation({
    mutationFn: async ({ contactId, reason }) => {
      const res = await optAPI.manualOptOut(contactId, reason)
      toast.success('Contact opted out')
      return res
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Operation failed'
      toast.error(msg)
    }
  })
}

export function useManualOptIn() {
  return useMutation({
    mutationFn: async (contactId) => {
      const res = await optAPI.manualOptIn(contactId)
      toast.success('Contact re-opted in')
      return res
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Operation failed'
      toast.error(msg)
    }
  })
}
