import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Bot, Send, X, Eye, ArrowRight, RefreshCw } from 'lucide-react'
import { apiFetch, formatBytes, getFileBadgeInfo } from '@/lib/api'

type SearchFile = {
  id: string
  name: string
  mimeType: string
  sizeBytes: string
  category?: string
}

type NlpResponse = {
  intent: {
    categoryTag: string
    keywords: string[]
    explanation: string
    engineUsed?: string
  }
  files: SearchFile[]
}

type ChatMessage = {
  id: string
  sender: 'user' | 'ai'
  text: string
  intent?: NlpResponse['intent']
  files?: SearchFile[]
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

export function AiSearchChatbot() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! 👋 I'm OmniDrive AI. Ask me anything about your files (e.g., 'Find my DBMS notes', 'Show my resume from last month', or 'Where is my electric bill?')."
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  async function handleSend(queryText?: string) {
    const text = (queryText || input).trim()
    if (!text || loading) return

    const userMsgId = 'user-' + Date.now()
    const userMsg: ChatMessage = { id: userMsgId, sender: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const data = await apiFetch<NlpResponse>('/files/nlp-search', {
        method: 'POST',
        body: JSON.stringify({ query: text })
      })

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: data.files.length > 0
          ? `Found ${data.files.length} matching candidate ${data.files.length === 1 ? 'file' : 'files'} under category ${data.intent.categoryTag}:`
          : `No matching files found under category ${data.intent.categoryTag}. Upload a document or explore the category below:`,
        intent: data.intent,
        files: data.files
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          sender: 'ai',
          text: 'Failed to search files: ' + (err.message || err)
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    '📚 DBMS Notes',
    '💼 Find my resume',
    '💰 Electric bills',
    '🎬 Recent videos'
  ]

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-xl shadow-blue-500/25 transition-all hover:scale-105 active:scale-95 border border-white/20"
          aria-label="Open AI Search Assistant"
        >
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4 animate-pulse text-white" />
          </div>
          <span className="text-xs font-extrabold tracking-wide">AI Search</span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </button>
      )}

      {/* Glassmorphic Chat Widget Window */}
      {isOpen && (
        <div className="flex h-[520px] w-[360px] sm:w-[400px] flex-col rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  OmniDrive AI Search
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                    Ollama
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Tag-Aware Smart Intent Engine</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Transcript Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 font-medium ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>

                {/* AI Intent Details & Results */}
                {msg.intent && (
                  <div className="mt-2 w-full space-y-2">
                    {/* Tag Badge & Reasoning */}
                    <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2.5 border border-blue-200/60 dark:border-blue-800/40">
                      <span className="rounded-lg bg-blue-600 text-white px-2 py-0.5 font-extrabold text-[10px] shrink-0">
                        {CATEGORY_EMOJIS[msg.intent.categoryTag] || '✨'} {msg.intent.categoryTag}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate">
                        {msg.intent.explanation}
                      </span>
                    </div>

                    {/* Matching Files */}
                    {msg.files && msg.files.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {msg.files.slice(0, 4).map((file) => {
                          const badge = getFileBadgeInfo(file.name, file.mimeType)
                          return (
                            <div
                              key={file.id}
                              className="group flex items-center justify-between rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-2.5 hover:border-blue-500/40 transition-all shadow-sm"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${badge.badgeClass}`}>
                                  {badge.ext}
                                </span>
                                <span className="truncate font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {file.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[10px] text-slate-400">
                                  {formatBytes(file.sizeBytes)}
                                </span>
                                <button
                                  onClick={() => navigate(`/all-files?q=${encodeURIComponent(file.name)}`)}
                                  className="rounded-lg p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                  title="View File"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )
                        })}

                        {/* View All Filter Button */}
                        <button
                          onClick={() => {
                            const catParam = msg.intent?.categoryTag && msg.intent.categoryTag !== 'All' ? `category=${msg.intent.categoryTag}` : ''
                            navigate(`/all-files?${catParam}`)
                          }}
                          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          View all {msg.intent.categoryTag} files <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/all-files?category=${msg.intent?.categoryTag}`)}
                        className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      >
                        Explore {msg.intent?.categoryTag} Category <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                <span>AI is thinking & analyzing category...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {suggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleSend(sug.replace(/^[^\s]+\s/, ''))}
                className="shrink-0 rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 border-t border-slate-200/80 dark:border-white/10 p-3 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI search..."
              className="flex-1 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
