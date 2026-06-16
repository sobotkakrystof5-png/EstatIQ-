import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, RotateCw, Search, Upload } from 'lucide-react'
import { Button, EmptyState, Input, Select, SkeletonRow, type SelectOption } from '@/components/ui'
import type { DocumentCategory } from '@/types/database'
import type { DocumentWithContext } from './data'
import { useDocuments } from './hooks'
import { DocumentRow } from './DocumentRow'
import { UploadModal } from './UploadModal'
import { DeleteDocumentModal } from './DeleteDocumentModal'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
type Filter = 'all' | DocumentCategory

export default function DocumentsPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useDocuments()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DocumentWithContext | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const documents = useMemo(() => data ?? [], [data])

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return documents.filter((doc) => {
      const matchFilter = filter === 'all' || doc.category === filter
      const matchQuery =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        (doc.property?.name ?? '').toLowerCase().includes(q) ||
        (doc.property?.address_city ?? '').toLowerCase().includes(q) ||
        (doc.tenant?.full_name ?? '').toLowerCase().includes(q)
      return matchFilter && matchQuery
    })
  }, [documents, filter, query])

  const filterOptions: SelectOption[] = [
    { value: 'all', label: t('documents.filter.all') },
    ...(
      ['lease', 'protocol', 'invoice', 'insurance', 'correspondence', 'other'] as DocumentCategory[]
    ).map((c) => ({ value: c, label: t(`documents.filter.${c}`) })),
  ]

  function handleDelete(doc: DocumentWithContext) {
    setDeleteTarget(doc)
    setDeleteOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
            {t('documents.title')}
          </h1>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {documents.length > 0
              ? t('documents.count', { count: documents.length })
              : t('documents.subtitle')}
          </p>
        </div>
        <Button leftIcon={<Upload size={16} />} onClick={() => setUploadOpen(true)}>
          {t('documents.upload')}
        </Button>
      </div>

      {/* Toolbar */}
      {!isLoading && !isError && documents.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:w-52">
            <Select
              value={filter}
              options={filterOptions}
              onValueChange={(val) => setFilter(val as Filter)}
              aria-label={t('documents.filter.all')}
            />
          </div>
          <div className="sm:w-64">
            <Input
              type="search"
              placeholder={t('documents.search')}
              value={query}
              leftIcon={<Search size={16} />}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t('documents.search')}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="rounded-2xl border border-surface-100 bg-white px-4 dark:border-surface-800 dark:bg-surface-900">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={<RotateCw size={26} />}
            title={t('common.error')}
            action={
              <Button variant="outline" onClick={() => void refetch()} leftIcon={<RotateCw size={16} />}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={<FileText size={26} />}
            title={t('documents.emptyState.title')}
            description={t('documents.emptyState.description')}
            action={
              <Button onClick={() => setUploadOpen(true)} leftIcon={<Upload size={16} />}>
                {t('documents.emptyState.cta')}
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title={t('documents.emptyFiltered.title')}
            description={
              query.trim()
                ? t('documents.searchEmpty', { query: query.trim() })
                : t('documents.emptyFiltered.description')
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {filtered.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.025 }}
                  className={
                    i < filtered.length - 1
                      ? 'border-b border-surface-100 dark:border-surface-800'
                      : ''
                  }
                >
                  <DocumentRow document={doc} onDelete={handleDelete} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <DeleteDocumentModal
        document={deleteTarget}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeleteTarget(null)
        }}
      />
    </div>
  )
}
