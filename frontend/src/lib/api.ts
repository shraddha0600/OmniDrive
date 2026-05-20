import { clearAuthSession, getAccessToken, getRefreshToken, setAccessToken } from '@/lib/auth'

const isProd = import.meta.env.PROD
const rawApiUrl = import.meta.env.VITE_API_URL
export const API_URL = (rawApiUrl && rawApiUrl !== 'http://localhost:4000')
  ? rawApiUrl
  : (isProd ? '/api' : 'http://localhost:4000')


type ApiOptions = RequestInit & { skipAuth?: boolean; retry?: boolean }

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!response.ok) return false
  const data = await response.json() as { accessToken: string }
  setAccessToken(data.accessToken)
  return true
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (!options.skipAuth && token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401 && options.retry !== false && !options.skipAuth && await refreshAccessToken()) {
    return apiFetch<T>(path, { ...options, retry: false })
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    if (response.status === 401) clearAuthSession()
    throw new Error(error.message ?? 'Request failed')
  }

  return response.json() as Promise<T>
}

export function formatBytes(input: string | number | bigint | null | undefined) {
  if (input === null || input === undefined) return '--'
  const bytes = Number(input)
  if (!Number.isFinite(bytes)) return '--'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function formatRelativeTime(value: string | Date | undefined | null): string {
  if (!value) return '--'
  const date = new Date(value)
  if (isNaN(date.getTime())) return '--'
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSecs = Math.floor(diffInMs / 1000)
  if (diffInSecs < 60) return 'just now'
  const diffInMins = Math.floor(diffInSecs / 60)
  if (diffInMins < 60) return `${diffInMins}m ago`
  const diffInHours = Math.floor(diffInMins / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined }).format(date)
}

export function getFileBadgeInfo(name: string, mimeType?: string): { ext: string; badgeClass: string } {
  const parts = name.split('.')
  const rawExt = parts.length > 1 ? parts.pop()!.toUpperCase() : ''
  
  if (mimeType?.includes('pdf') || rawExt === 'PDF') {
    return { ext: 'PDF', badgeClass: 'bg-red-500/15 text-red-500 border-red-500/30 dark:bg-red-500/20 dark:text-red-400' }
  }
  if (mimeType?.startsWith('image/') || ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG', 'AVIF'].includes(rawExt)) {
    return { ext: rawExt || 'IMG', badgeClass: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400' }
  }
  if (mimeType?.startsWith('video/') || ['MP4', 'MOV', 'MKV', 'WEBM', 'AVI'].includes(rawExt)) {
    return { ext: rawExt || 'VID', badgeClass: 'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-400' }
  }
  if (mimeType?.startsWith('audio/') || ['MP3', 'WAV', 'AAC', 'FLAC', 'OGG'].includes(rawExt)) {
    return { ext: rawExt || 'AUD', badgeClass: 'bg-pink-500/15 text-pink-600 border-pink-500/30 dark:bg-pink-500/20 dark:text-pink-400' }
  }
  if (mimeType?.includes('zip') || mimeType?.includes('tar') || mimeType?.includes('rar') || ['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(rawExt)) {
    return { ext: rawExt || 'ZIP', badgeClass: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400' }
  }
  if (mimeType?.includes('json') || mimeType?.includes('javascript') || mimeType?.includes('typescript') || ['JS', 'TS', 'JSON', 'PY', 'HTML', 'CSS'].includes(rawExt)) {
    return { ext: rawExt || 'CODE', badgeClass: 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30 dark:bg-cyan-500/20 dark:text-cyan-400' }
  }
  return { ext: rawExt || 'DOC', badgeClass: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400' }
}

