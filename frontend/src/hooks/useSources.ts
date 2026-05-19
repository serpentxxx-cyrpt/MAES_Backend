import { useCallback } from 'react'
import api from '../lib/apiClient'
import type { Source } from '../stores/sourceStore'
import { useSourceStore } from '../stores/sourceStore'

export function useSources(notebookId: string) {
  const { addSource, setUploading, setSources, isUploading } = useSourceStore()

  const loadSources = useCallback(async () => {
    const { data } = await api.get(`/sources/${notebookId}`)
    setSources(
      (data.sources as Source[]).map((s) => ({
        ...s,
        createdAt: new Date(s.createdAt),
      }))
    )
  }, [notebookId, setSources])

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('notebook_id', notebookId)
        const { data } = await api.post('/sources/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        addSource({ ...data.source, createdAt: new Date(data.source.createdAt) })
      } finally {
        setUploading(false)
      }
    },
    [notebookId, addSource, setUploading]
  )

  const importUrl = useCallback(
    async (url: string) => {
      setUploading(true)
      try {
        const { data } = await api.post('/sources/import-url', {
          notebook_id: notebookId,
          url,
        })
        addSource({ ...data.source, createdAt: new Date(data.source.createdAt) })
      } finally {
        setUploading(false)
      }
    },
    [notebookId, addSource, setUploading]
  )

  const importYouTube = useCallback(
    async (youtubeUrl: string) => {
      setUploading(true)
      try {
        const { data } = await api.post('/sources/import-youtube', {
          notebook_id: notebookId,
          url: youtubeUrl,
        })
        addSource({ ...data.source, createdAt: new Date(data.source.createdAt) })
      } finally {
        setUploading(false)
      }
    },
    [notebookId, addSource, setUploading]
  )

  const pasteText = useCallback(
    async (title: string, content: string) => {
      setUploading(true)
      try {
        const { data } = await api.post('/sources/paste', {
          notebook_id: notebookId,
          title,
          content,
        })
        addSource({ ...data.source, createdAt: new Date(data.source.createdAt) })
      } finally {
        setUploading(false)
      }
    },
    [notebookId, addSource, setUploading]
  )

  return { loadSources, uploadFile, importUrl, importYouTube, pasteText, isUploading }
}
