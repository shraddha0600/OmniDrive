import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileArchive,
  Gauge,
  Share2,
  Settings,
  Upload,
  FolderPlus,
  RefreshCw,
  X,
  Sparkles,
  Bot
} from 'lucide-react'
import { apiFetch, formatBytes, getFileBadgeInfo } from '@/lib/api'

type SearchFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  category?: string
  folderId?: string | null
}

type NlpSearchResponse = {
  intent: {
    categoryTag: string
    keywords: string[]
    explanation: string
    engineUsed?: string
  }
  files: SearchFile[]
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Professional: '💼',
  Personal: '🏠',
  Revision: '📚',
  Financial: '💰',
  Media: '🎬',
  Other: '📂',
  All: '✨'
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenUpload,
  onOpenNewFolder,
  onSyncDrive,
}: {
  isOpen: boolean
  onClose: () => void
  onOpenUpload?: () => void
  onOpenNewFolder?: () => void
  onSyncDrive?: () => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchFile[]>([])
  const [aiIntent, setAiIntent] = useState<NlpSearchResponse['intent'] | null>(null)
  const [loading, setLoading] = useState(false)

  // Listen for ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          setQuery('')
          setSearchResults([])
          setAiIntent(null)
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  // Tag-Aware AI NLP Search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setAiIntent(null)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch<NlpSearchResponse>('/files/nlp-search', {
          method: 'POST',
          body: JSON.stringify({ query: query.trim() })
        })
        setSearchResults(data.files.slice(0, 5))
        setAiIntent(data.intent)
      } catch {
        setSearchResults([])
        setAiIntent(null)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  if (!isOpen) return null

  const actions = [
    {
      id: 'nav-files',
      label: 'Go to All Files',
      icon: FileArchive,
      run: () => {
        navigate('/all-files')
        onClose()
      },
    },
    {
      id: 'nav-quota',
      label: 'Go to Quota Tracker',
      icon: Gauge,
      run: () => {
        navigate('/quota')
        onClose()
      },
    },
    {
      id: 'nav-shared',
      label: 'Go to Shared Links & Invites',
      icon: Share2,
      run: () => {
        navigate('/shared')
        onClose()
      },
    },
    {
      id: 'nav-settings',
      label: 'Go to Settings',
      icon: Settings,
      run: () => {
        navigate('/settings')
        onClose()
      },
    },
    {
      id: 'action-upload',
      label: 'Upload New File',
      icon: Upload,
      run: () => {
        onClose()
        onOpenUpload?.()
      },
    },
    {
      id: 'action-new-folder',
      label: 'Create New Folder',
      icon: FolderPlus,
      run: () => {
        onClose()
        onOpenNewFolder?.()
      },
    },
    {
      id: 'action-sync',
      label: 'Sync Google Drive Storage',
      icon: RefreshCw,
      run: () => {
        onClose()
        onSyncDrive?.()
      },
    },
  ]

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/50 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!query.trim()) return
            const cat = aiIntent?.categoryTag && aiIntent.categoryTag !== 'All' ? `category=${aiIntent.categoryTag}&` : ''
            navigate(`/all-files?${cat}q=${encodeURIComponent(query.trim())}`)
            onClose()
          }}
          className="flex items-center gap-3 border-b border-slate-200/80 dark:border-white/10 px-4 py-3.5"
        >
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI Search (e.g., 'Can you find me my DBMS notes?')..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {loading ? <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" /> : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* AI Intent Intelligence Pill */}
        {aiIntent && query.trim() && (
          <div className="bg-blue-500/10 dark:bg-blue-500/20 border-b border-blue-500/20 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (aiIntent.categoryTag && aiIntent.categoryTag !== 'All') {
                    navigate(`/all-files?category=${aiIntent.categoryTag}`)
                    onClose()
                  }
                }}
                className="font-extrabold text-blue-600 dark:text-blue-300 flex items-center gap-1.5 shrink-0 bg-blue-500/20 hover:bg-blue-500/30 px-2 py-0.5 rounded-lg border border-blue-500/30 transition-colors cursor-pointer"
              >
                {CATEGORY_EMOJIS[aiIntent.categoryTag] || '✨'} Category: {aiIntent.categoryTag}
              </button>
              <span className="truncate text-slate-600 dark:text-slate-300 font-medium">
                {aiIntent.explanation}
              </span>
            </div>
            {aiIntent.engineUsed && (
              <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <Bot className="h-3 w-3" /> {aiIntent.engineUsed.includes('ollama') ? 'minimax-m2.5:cloud' : 'Local Rules'}
              </span>
            )}
          </div>
        )}

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {/* File Results */}
          {searchResults.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Matching Files ({searchResults.length})</span>
                {aiIntent?.categoryTag && aiIntent.categoryTag !== 'All' ? (
                  <span className="text-blue-600 dark:text-blue-400">Filtered by {aiIntent.categoryTag}</span>
                ) : null}
              </p>
              {searchResults.map((file) => {
                const badge = getFileBadgeInfo(file.name, file.mimeType)
                return (
                  <button
                    key={file.id}
                    onClick={() => {
                      const categoryParam = aiIntent?.categoryTag && aiIntent.categoryTag !== 'All' ? `&category=${aiIntent.categoryTag}` : ''
                      navigate(`/all-files?q=${encodeURIComponent(file.name)}${categoryParam}`)
                      onClose()
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}>
                        {badge.ext}
                      </span>
                      <span className="truncate font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">
                      {formatBytes(file.sizeBytes)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <p className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Quick Actions & Navigation
            </p>
            {filteredActions.length > 0 ? (
              filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.run}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 group"
                >
                  <action.icon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 shrink-0" />
                  <span>{action.label}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-xs text-slate-400">
                No matching actions found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
