import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { campaignsAPI } from '../services/api'
import toast from 'react-hot-toast'

function parseResponse(res) {
  const payload = res?.data || res
  return payload.data || payload
}

export function useCampaigns(params = {}, options = {}) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: async () => {
      const res = await campaignsAPI.list(params)
      return parseResponse(res)
    },
    keepPreviousData: true,
    ...options,
  })
}

export function useCampaign(id, options = {}) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await campaignsAPI.get(id)
      return parseResponse(res)
    },
    enabled: !!id,
    refetchInterval: (data) => {
      try {
        return data?.status === 'running' ? 5000 : false
      } catch (e) {
        return false
      }
    },
    ...options,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => campaignsAPI.create(payload),
    onSuccess: () => {
      toast.success('Campaign created')
      qc.invalidateQueries(['campaigns'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Create failed'
      toast.error(msg)
    },
  })
}

export function useLaunchCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => campaignsAPI.launch(id),
    onSuccess: () => {
      toast.success('Campaign launched!')
      qc.invalidateQueries(['campaigns'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Launch failed'
      toast.error(msg)
    },
  })
}

export function usePauseCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => campaignsAPI.pause(id),
    onSuccess: () => {
      toast.success('Campaign paused')
      qc.invalidateQueries(['campaigns'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Pause failed'
      toast.error(msg)
    },
  })
}

export function useResumeCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => campaignsAPI.resume(id),
    onSuccess: () => {
      toast.success('Campaign resumed')
      qc.invalidateQueries(['campaigns'])
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Resume failed'
      toast.error(msg)
    },
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const ok = window.confirm('Are you sure you want to cancel this campaign?')
      if (!ok) throw new Error('User cancelled')
      return campaignsAPI.cancel(id)
    },
    onSuccess: () => {
      toast.success('Campaign cancelled')
      qc.invalidateQueries(['campaigns'])
    },
    onError: (err) => {
      if (err?.message === 'User cancelled') return
      const msg = err?.response?.data?.message || err?.message || 'Cancel failed'
      toast.error(msg)
    },
  })
}

