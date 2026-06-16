import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText } from 'lucide-react'
import { EmptyState, SkeletonRow } from '@/components/ui'
import { formatDate, formatFileSize } from '@/lib/formatters'
import { DocumentTypeBadge, DocumentTypeIcon } from '@/features/documents/DocumentTypeBadge'
import { useTenantDocuments } from './hooks'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function TenantDocumentsPage() {
  const { t } = useTranslation()
  const { data, isLoading } = useTenantDocuments()
  const docs = data ?? []

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('tenant.documents.title')}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {t('tenant.documents.subtitle')}
        </p>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white px-4 dark:border-surface-800 dark:bg-surface-900">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText size={26} />}
            title={t('tenant.documents.emptyState.title')}
            description={t('tenant.documents.emptyState.description')}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {docs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.025 }}
                  className={
                    i < docs.length - 1
                      ? 'border-b border-surface-100 dark:border-surface-800'
                      : ''
                  }
                >
                  <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
                    <DocumentTypeIcon category={doc.category} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                        {doc.name}
                      </p>
                      <p className="text-xs text-surface-400">
                        {formatDate(doc.created_at)}
                        {doc.file_size_bytes !== null && (
                          <> · {formatFileSize(doc.file_size_bytes)}</>
                        )}
                      </p>
                    </div>

                    <div className="hidden sm:block">
                      <DocumentTypeBadge category={doc.category} showLabel />
                    </div>

                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t('tenant.documents.download')}
                      title={t('tenant.documents.download')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-surface-800 dark:hover:text-surface-200"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
