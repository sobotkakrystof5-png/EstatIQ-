import { useTranslation } from 'react-i18next'
import { Download, Trash2 } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/formatters'
import type { DocumentWithContext } from './data'
import { DocumentTypeBadge, DocumentTypeIcon } from './DocumentTypeBadge'

interface Props {
  document: DocumentWithContext
  onDelete: (doc: DocumentWithContext) => void
}

export function DocumentRow({ document: doc, onDelete }: Props) {
  const { t } = useTranslation()

  const context = [
    doc.property ? `${doc.property.name}, ${doc.property.address_city}` : null,
    doc.tenant?.full_name ?? null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
      <DocumentTypeIcon category={doc.category} />

      {/* Name + context */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
          {doc.name}
        </p>
        <p className="truncate text-xs text-surface-400">
          {context || t('documents.row.noProperty')}
        </p>
      </div>

      {/* Category badge — hidden on mobile */}
      <div className="hidden sm:block">
        <DocumentTypeBadge category={doc.category} showLabel />
      </div>

      {/* Date + size */}
      <div className="hidden text-right sm:block">
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {formatDate(doc.created_at)}
        </p>
        {doc.file_size_bytes !== null && (
          <p className="text-xs text-surface-400">{formatFileSize(doc.file_size_bytes)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noreferrer"
          aria-label={t('documents.download')}
          title={t('documents.download')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-surface-800 dark:hover:text-surface-200"
        >
          <Download size={16} />
        </a>
        <button
          onClick={() => onDelete(doc)}
          aria-label={t('documents.delete')}
          title={t('documents.delete')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
