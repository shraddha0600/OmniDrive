import { MoreVertical, FileText } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { FolderItem } from '@/data/drive-data'
import { FolderVisual, normalizeFolderColor } from '@/components/drive/FolderVisual'

export type FolderSizeScale = 'xs' | 'sm' | 'md' | 'lg'

const scaleConfig: Record<FolderSizeScale, {
  grid: string
  card: string
  icon: string
  title: string
  sub: string
  iconMt: string
}> = {
  xs: {
    grid: 'grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2',
    card: 'min-h-24 p-2.5',
    icon: 'h-8 w-8',
    title: 'text-[11px] mt-2',
    sub: 'text-[10px] mt-0.5',
    iconMt: '',
  },
  sm: {
    grid: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5',
    card: 'min-h-28 p-3',
    icon: 'h-10 w-10',
    title: 'text-xs mt-2',
    sub: 'text-[10px] mt-0.5',
    iconMt: '',
  },
  md: {
    grid: 'grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4',
    card: 'min-h-36 p-4 sm:min-h-44 sm:p-5',
    icon: 'h-12 w-12 sm:h-14 sm:w-14',
    title: 'text-sm mt-3 sm:text-base font-extrabold',
    sub: 'text-xs mt-1',
    iconMt: '',
  },
  lg: {
    grid: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6',
    card: 'min-h-48 p-5 sm:min-h-56 sm:p-6',
    icon: 'h-16 w-16 sm:h-20 sm:w-20',
    title: 'text-base mt-4 sm:text-lg font-extrabold',
    sub: 'text-xs mt-1',
    iconMt: '',
  },
}

export function FolderGrid({
  items,
  mobileTwoColumns = false,
  sizeScale = 'md',
  onFolderMenu,
  onFolderOpen,
  onDropItem,
}: {
  items: FolderItem[]
  mobileTwoColumns?: boolean
  sizeScale?: FolderSizeScale
  onFolderMenu?: (event: MouseEvent<HTMLElement>, folder: FolderItem) => void
  onFolderOpen?: (folder: FolderItem) => void
  onDropItem?: (fileId: string, folderId: string) => void
}) {
  const cfg = scaleConfig[sizeScale]

  return (
    <div className={cn('mt-4 grid', cfg.grid, mobileTwoColumns && sizeScale === 'md' && 'grid-cols-2')}>
      {items.map((folder) => {
        const folderColor = normalizeFolderColor(folder.color)

        return (
          <Card
            key={folder.id || folder.name}
            onClick={() => onFolderOpen?.(folder)}
            onContextMenu={(event) => onFolderMenu?.(event, folder)}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}
            onDragEnter={(event) => { event.currentTarget.classList.add('bg-blue-500/10', 'border-blue-500/50') }}
            onDragLeave={(event) => { event.currentTarget.classList.remove('bg-blue-500/10', 'border-blue-500/50') }}
            onDrop={(event) => {
              event.preventDefault()
              event.currentTarget.classList.remove('bg-blue-500/10', 'border-blue-500/50')
              const fileId = event.dataTransfer.getData('text/plain')
              if (fileId && folder.id) onDropItem?.(fileId, folder.id)
            }}
            style={{ borderTopColor: folderColor, borderTopWidth: '3px' }}
            className={cn(
              'group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 dark:bg-slate-900/60 dark:border-white/10 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/30 dark:hover:border-blue-400/40',
              cfg.card
            )}
          >
            {/* Top row: Folder visual icon & option menu */}
            <div className="flex w-full items-start justify-between">
              <div className="relative">
                <FolderVisual folder={folder} className={cn('transition-transform duration-200 group-hover:scale-110', cfg.icon)} />
                {/* Color Pill Tag */}
                <span
                  className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                  style={{ backgroundColor: folderColor }}
                />
              </div>

              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 opacity-80 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-opacity"
                onClick={(event) => { event.stopPropagation(); onFolderMenu?.(event, folder) }}
                aria-label={`Open ${folder.name} menu`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Middle: Title & Metadata */}
            <div className="mt-3 w-full">
              <h2 className={cn('line-clamp-1 font-bold text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors', cfg.title)} title={folder.name}>
                {folder.name}
              </h2>
              <div className="mt-1 flex items-center justify-between text-slate-400 text-xs">
                <span className={cn('line-clamp-1', cfg.sub)}>{folder.updated}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                  <FileText className="h-3 w-3 text-blue-500" />
                  Folder
                </span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
