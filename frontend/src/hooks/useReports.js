import { useQuery, useMutation } from '@tanstack/react-query'
import { reportsAPI } from '../services/api'
import toast from 'react-hot-toast'

function parseResponse(res) {
  const payload = res?.data || res
  return payload.data || payload
}

export function useDeliveryReport(filters = {}, options = {}) {
  return useQuery({
    queryKey: ['reports', 'delivery', filters],
    queryFn: async () => {
      const res = await reportsAPI.delivery(filters)
      return parseResponse(res)
    },
    keepPreviousData: true,
    ...options,
  })
}

export function useExportDeliveryCSV() {
  return useMutation({
    mutationFn: async (params) => {
      const res = await reportsAPI.exportCSV(params)
      const blob = res?.data || res
      const url = window.URL.createObjectURL(new Blob([blob]))
      let filename = 'delivery-report.csv'
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
      toast.success('CSV export started')
      return res
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Export failed'
      toast.error(msg)
    },
  })
}

export function useExportDeliveryPDF() {
  return useMutation({
    mutationFn: async (params) => {
      const res = await reportsAPI.exportPDF(params)
      const blob = res?.data || res
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      window.open(url, '_blank')
      toast.success('Opening PDF')
      return res
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Export failed'
      toast.error(msg)
    },
  })
}

