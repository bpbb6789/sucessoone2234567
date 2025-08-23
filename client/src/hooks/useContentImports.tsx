import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '@/lib/queryClient'
import type { ContentImport, InsertContentImport } from '@shared/schema'

// Get content imports for a channel
export function useContentImports(channelId: string) {
  return useQuery({
    queryKey: ['/api/content-imports', channelId],
    queryFn: async () => {
      const response = await fetch(`/api/content-imports?channelId=${channelId}`)
      if (!response.ok) throw new Error('Failed to fetch content imports')
      return response.json() as Promise<ContentImport[]>
    },
    enabled: !!channelId
  })
}

// Upload file to IPFS
export function useFileUpload() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      file: File
      channelId: string
      contentType: string
      title: string
      description?: string
    }) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('channelId', data.channelId)
      formData.append('contentType', data.contentType)
      formData.append('title', data.title)
      if (data.description) formData.append('description', data.description)

      const response = await fetch('/api/content-imports/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate content imports query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/content-imports'] })
    }
  })
}

// Import from URL
export function useUrlImport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      url: string
      channelId: string
      contentType: string
      title: string
      description?: string
    }) => {
      const response = await fetch('/api/content-imports/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Import failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-imports'] })
    }
  })
}

// Tokenize content
export function useTokenizeContent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await fetch(`/api/content-imports/${contentId}/tokenize`, {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Tokenization failed')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-imports'] })
    }
  })
}

// Delete content import
export function useDeleteContentImport() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (contentId: string) => {
      const response = await fetch(`/api/content-imports/${contentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Delete failed')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content-imports'] })
    }
  })
}