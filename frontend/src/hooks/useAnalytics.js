import { useQuery } from '@tanstack/react-query'
import { analyticsAPI } from '../services/api'
import toast from 'react-hot-toast'

const STALE = 5 * 60 * 1000 // 5 minutes

function parseResponse(res) {
  const payload = res?.data || res
  return payload.data || payload
}

export function useDashboardStats(params = {}, options = {}) {
  return useQuery({
    queryKey: ['analytics', 'dashboard', params],
    queryFn: async () => {
      const res = await analyticsAPI.dashboard(params)
      return parseResponse(res)
    },
    staleTime: STALE,
    ...options,
  })
}

export function useCampaignAnalytics(campaignId, params = {}, options = {}) {
  return useQuery({
    queryKey: ['analytics', 'campaign', campaignId, params],
    queryFn: async () => {
      const res = await analyticsAPI.campaign(campaignId, params)
      return parseResponse(res)
    },
    enabled: !!campaignId,
    staleTime: STALE,
    ...options,
  })
}

export function useMessageTrends(days = 30, options = {}) {
  return useQuery({
    queryKey: ['analytics', 'trends', days],
    queryFn: async () => {
      const res = await analyticsAPI.trends({ days })
      return parseResponse(res)
    },
    staleTime: STALE,
    ...options,
  })
}

export function useTopTemplates(options = {}) {
  return useQuery({
    queryKey: ['analytics', 'topTemplates'],
    queryFn: async () => {
      const res = await analyticsAPI.topTemplates()
      return parseResponse(res)
    },
    staleTime: STALE,
    ...options,
  })
}

export function useHeatmap(options = {}) {
  return useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: async () => {
      const res = await analyticsAPI.heatmap()
      return parseResponse(res)
    },
    staleTime: STALE,
    ...options,
  })
}

export function useAudienceGrowth(options = {}) {
  return useQuery({
    queryKey: ['analytics', 'audienceGrowth'],
    queryFn: async () => {
      const res = await analyticsAPI.audienceGrowth()
      return parseResponse(res)
    },
    staleTime: STALE,
    ...options,
  })
}

