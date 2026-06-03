import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, RefreshCw, MessageSquare } from 'lucide-react'
import { apiFetch, formatBytes, getFileBadgeInfo } from '@/lib/api'
import type { FileItem } from '@/data/drive-data'

type QaMessage = {
  id: string
  sender: 'user' | 'ai'
  text: string
  engineUsed?: string
}

type DocumentChatDrawerProps = {
  isOpen: boolean
  file: FileItem | null
  onClose: () => void
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

export function DocumentChatDrawer({ isOpen, file, onClose }: DocumentChatDrawerProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<QaMessage[]>([])

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (file?.id) {
      setMessages([
        {
          id: 'welcome-' + file.id,
          sender: 'ai',
          text: `Hi! I'm your AI assistant for "${file.name}". Ask me questions, request a summary, or get key insights about this document!`
        }
      ])
    }
  }, [file?.id, file?.name])

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  if (!isOpen || !file) return null

  const badge = getFileBadgeInfo(file.name, file.mimeType || '')
  const category = file.category || 'Other'

  async function handleSend(questionText?: string) {
    const q = (questionText || input).trim()
    if (!q || !file?.id || loading) return

    const userMsgId = 'user-' + Date.now()
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: q }])
    setInput('')
    setLoading(true)

    try {
      const data = await apiFetch<{ answer: string; engineUsed: string }>(`/files/${file.id}/chat`, {
        method: 'POST',
        body: JSON.stringify({ question: q })
      })

      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          sender: 'ai',
          text: data.answer,
          engineUsed: data.engineUsed
        }
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: 'Error asking AI: ' + (err.message || err)
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    '💡 Summarize document',
    '🔑 Key takeaways',
    '📄 File details & overview',
    '❓ Is this confidential?'
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Side Drawer Window */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}>
                  {badge.ext}
                </span>
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-blue-600 dark:text-blue-400">
                  {CATEGORY_EMOJIS[category]} {category}
                </span>
              </div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate mt-0.5" title={file.name}>
                {file.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document Context Card */}
        <div className="bg-slate-50/80 dark:bg-slate-950/60 p-3 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>Size: <strong className="text-slate-700 dark:text-slate-300">{formatBytes(file.sizeBytes || file.size)}</strong></span>
            <span>Type: <strong className="text-slate-700 dark:text-slate-300">{badge.ext.toUpperCase()}</strong></span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
            <Bot className="h-3 w-3 text-blue-500" /> minimax-m2.5:cloud
          </span>
        </div>

        {/* Chat Messages Transcript */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 font-medium whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-white/5'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
              </div>

              {msg.engineUsed && (
                <span className="mt-1 text-[9px] text-slate-400 font-semibold px-1">
                  Answered by {msg.engineUsed.includes('ollama') ? 'minimax-m2.5:cloud' : 'AI Assistant'}
                </span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
              <span>Analyzing "{file.name}" with AI...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {suggestions.map((sug) => (
            <button
              key={sug}
              onClick={() => handleSend(sug.replace(/^[^\s]+\s/, ''))}
              className="shrink-0 rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
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
            placeholder={`Ask a question about ${file.name}...`}
            className="flex-1 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  )
}
