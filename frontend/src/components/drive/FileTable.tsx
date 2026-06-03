import { Download, Eye, FolderInput, FolderOpen, MoreVertical, Share2, Star, Check, Sparkles } from 'lucide-react'
import { type MouseEvent, useState } from 'react'
import { AvatarStack } from '@/components/drive/AvatarStack'
import { FileIcon } from '@/components/drive/FileIcon'
import type { FileItem } from '@/data/drive-data'
import { API_URL, apiFetch, getFileBadgeInfo, formatRelativeTime } from '@/lib/api'
import { getAccessToken } from '@/lib/auth'

export function FileTable({
  files,
  mode = 'default',
  selectedFileIds = new Set<string>(),
  allSelected = false,
  onFileContextMenu,
  onToggleFile,
  onToggleAll,
}: {
  files: FileItem[]
  mode?: 'default' | 'shared' | 'recent' | 'starred' | 'archived'
  selectedFileIds?: Set<string>
  allSelected?: boolean
  onFileContextMenu?: (event: MouseEvent<HTMLElement>, file: FileItem) => void
  onToggleFile?: (file: FileItem) => void
  onToggleAll?: () => void
}) {
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null)

  const handleDownload = (file: FileItem) => {
    const token = getAccessToken()
    const downloadUrl = `${API_URL}/files/${file.id}/download${token ? `?access_token=${token}` : ''}`
    window.open(downloadUrl, '_blank')
  }

  const handleCopyShareLink = async (file: FileItem) => {
    try {
      const data = await apiFetch<{ url: string | null }>(`/files/${file.id}/view-url`)
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        setCopiedFileId(file.id ?? null)
        setTimeout(() => setCopiedFileId(null), 2000)
      } else {
        const shareData = await apiFetch<{ url: string }>(`/files/${file.id}/share`, { method: 'POST' })
        await navigator.clipboard.writeText(shareData.url)
        setCopiedFileId(file.id ?? null)
        setTimeout(() => setCopiedFileId(null), 2000)
      }
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mt-4">
      {/* Mobile card view */}
      <div className="grid gap-2.5 sm:hidden">
        {onToggleAll ? (
          <label className="flex items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 px-4 py-3 text-sm font-bold shadow-sm backdrop-blur-md">
            <span>Select all files</span>
            <input type="checkbox" className="h-5 w-5 accent-blue-600" checked={allSelected} onChange={onToggleAll} />
          </label>
        ) : null}
        {files.map((file) => {
          const selected = selectedFileIds.has(file.id ?? '')
          const relativeTime = formatRelativeTime(file.createdAt)
          const badge = getFileBadgeInfo(file.name, file.mimeType)

          return (
            <article
              key={file.id ?? file.name}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', file.id ?? '')
                event.dataTransfer.effectAllowed = 'move'
              }}
              onClick={() => onToggleFile?.(file)}
              onContextMenu={(event) => onFileContextMenu?.(event, file)}
              className={
                selected
                  ? 'overflow-hidden rounded-2xl border border-blue-500/50 bg-blue-50/20 dark:bg-blue-900/20 p-3.5 shadow-sm cursor-grab active:cursor-grabbing backdrop-blur-md'
                  : 'overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-3.5 shadow-sm cursor-grab active:cursor-grabbing backdrop-blur-md'
              }
            >
              <div className="flex items-center gap-3">
                {onToggleFile ? (
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-blue-600"
                    checked={selected}
                    onChange={() => onToggleFile?.(file)}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : null}
                <div className="shrink-0">
                  {mode === 'starred' ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> : <FileIcon kind={file.kind} />}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}>
                      {badge.ext}
                    </span>
                    <h3 className="truncate text-sm font-bold leading-snug text-slate-950 dark:text-slate-100" title={file.name}>
                      {file.name}
                    </h3>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span>{relativeTime}</span>
                    <span>·</span>
                    <span>{file.size}</span>
                    {file.folderName && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-blue-500 font-medium">
                          <FolderOpen className="h-3 w-3" />
                          {file.folderName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={(event) => {
                    event.stopPropagation()
                    onFileContextMenu?.(event, file)
                  }}
                  aria-label={`Open ${file.name} menu`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/40 dark:border-white/10 text-slate-500 dark:text-slate-400">
              <th className="w-9 py-3 pl-2">
                <input type="checkbox" className="h-4 w-4 accent-blue-600 rounded" checked={allSelected} onChange={onToggleAll} />
              </th>
              <th className="py-3 font-extrabold text-slate-900 dark:text-slate-100">Name</th>
              {mode === 'default' ? <th className="py-3 font-semibold text-slate-500 dark:text-slate-400">Folder</th> : null}
              {mode === 'shared' ? <th className="py-3 font-extrabold">Owner</th> : null}
              {mode === 'recent' ? <th className="py-3 font-extrabold">Last Opened</th> : null}
              {mode === 'starred' ? <th className="py-3 font-extrabold">Starred On</th> : null}
              {mode === 'archived' ? <th className="py-3 font-extrabold">Archived Date</th> : null}
              {mode === 'archived' ? (
                <th className="py-3 font-extrabold">Original Location</th>
              ) : (
                <th className="py-3 font-semibold text-slate-500 dark:text-slate-400">Last Modified</th>
              )}
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400">Size</th>
              <th className="py-3 font-semibold text-slate-500 dark:text-slate-400">Access</th>
              <th className="py-3 text-right pr-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/30 dark:divide-white/5">
            {files.map((file) => {
              const selected = selectedFileIds.has(file.id ?? '')
              const relativeTime = formatRelativeTime(file.createdAt)
              const badge = getFileBadgeInfo(file.name, file.mimeType)

              return (
                <tr
                  key={file.id ?? file.name}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/plain', file.id ?? '')
                    event.dataTransfer.effectAllowed = 'move'
                  }}
                  onContextMenu={(event) => onFileContextMenu?.(event, file)}
                  onClick={() => onToggleFile?.(file)}
                  className={
                    selected
                      ? 'group border-b bg-blue-50/40 dark:bg-blue-900/20 transition-all cursor-grab active:cursor-grabbing'
                      : 'group border-b border-transparent transition-all hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-grab active:cursor-grabbing'
                  }
                >
                  <td className="py-3 pl-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-blue-600 rounded"
                      checked={selected}
                      onChange={() => onToggleFile?.(file)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </td>
                  <td className="py-3 font-semibold">
                    <span className="flex min-w-0 items-center gap-2.5">
                      {mode === 'starred' ? (
                        <Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <FileIcon kind={file.kind} />
                      )}
                      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge.badgeClass}`}>
                        {badge.ext}
                      </span>
                      {file.category && file.category !== 'Other' ? (
                        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-extrabold ${
                          file.category === 'Professional' ? 'bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-500/30' :
                          file.category === 'Personal' ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/30' :
                          file.category === 'Revision' ? 'bg-purple-500/15 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/30' :
                          file.category === 'Financial' ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/30' :
                          file.category === 'Media' ? 'bg-pink-500/15 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400 border-pink-500/30' :
                          'bg-slate-500/15 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-500/30'
                        }`}>
                          🏷️ {file.category}
                        </span>
                      ) : null}
                      <span className="truncate max-w-[200px] lg:max-w-[280px] text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={file.name}>
                        {file.name}
                      </span>
                    </span>
                  </td>

                  {/* Folder path column */}
                  {mode === 'default' ? (
                    <td className="py-3 text-slate-400">
                      {file.folderName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/40">
                          <FolderOpen className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[120px]">{file.folderName}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  ) : null}

                  {mode === 'shared' ? <td className="py-3 text-slate-500">{file.owner}</td> : null}
                  {mode === 'recent' ? <td className="py-3 text-slate-500">{file.openedDate}</td> : null}
                  {mode === 'starred' ? <td className="py-3 text-slate-500">{file.starredDate}</td> : null}
                  {mode === 'archived' ? <td className="py-3 text-slate-500">{file.archivedDate}</td> : null}

                  <td className="py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {relativeTime}
                  </td>
                  <td className="py-3 text-xs text-slate-500 dark:text-slate-400 font-semibold">{file.size}</td>
                  <td className="py-3 text-slate-500">
                    <span className="flex items-center gap-2">
                      <AvatarStack count={file.shared} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[140px]">{file.access}</span>
                    </span>
                  </td>

                  {/* Hover Action Bar */}
                  <td className="py-3 text-right pr-2">
                    <div className="flex items-center justify-end gap-1">
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1">
                        {/* Ask AI / Chat with Document */}
                        <button
                          title="Ask AI / Chat with Document"
                          onClick={(event) => {
                            event.stopPropagation()
                            window.dispatchEvent(new CustomEvent('omnidrive:open-doc-chat', { detail: file }))
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        </button>

                        {/* Quick View / Preview Icon */}
                        <button
                          title="Quick View"
                          onClick={(event) => {
                            event.stopPropagation()
                            onFileContextMenu?.(event, file)
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* Direct Download Icon */}
                        <button
                          title="Direct Download"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDownload(file)
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {/* Quick Copy Share Link Icon */}
                        <button
                          title="Copy Share Link"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleCopyShareLink(file)
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          {copiedFileId === file.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5" />}
                        </button>

                        {/* Move File Icon */}
                        <button
                          title="Move File"
                          onClick={(event) => {
                            event.stopPropagation()
                            window.dispatchEvent(new CustomEvent('9drive:open-move-modal', { detail: file }))
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                        >
                          <FolderInput className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0"
                        onClick={(event) => {
                          event.stopPropagation()
                          onFileContextMenu?.(event, file)
                        }}
                        aria-label={`Open ${file.name} menu`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
