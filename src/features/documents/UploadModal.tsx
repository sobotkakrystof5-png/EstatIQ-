import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Paperclip } from 'lucide-react'
import { Button, Input, Modal, Select, type SelectOption } from '@/components/ui'
import { formatFileSize } from '@/lib/formatters'
import type { DocumentCategory } from '@/types/database'
import { useProperties } from '@/features/properties/hooks'
import { useTenants } from '@/features/tenants/hooks'
import { type UploadDraft } from './data'
import { useUploadDocument } from './hooks'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
])
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('documents.uploadModal.title')}
    >
      <UploadForm onClose={() => onOpenChange(false)} />
    </Modal>
  )
}

function UploadForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const upload = useUploadDocument()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: properties = [] } = useProperties()
  const { data: tenants = [] } = useTenants()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('lease')
  const [propertyId, setPropertyId] = useState<string>('')
  const [tenantId, setTenantId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const categoryOptions: SelectOption[] = (
    ['lease', 'protocol', 'invoice', 'insurance', 'correspondence', 'other'] as DocumentCategory[]
  ).map((c) => ({ value: c, label: t(`documents.category.${c}`) }))

  const propertyOptions: SelectOption[] = [
    { value: '', label: t('documents.uploadModal.propertyNone') },
    ...properties
      .filter((p) => p.status !== 'archived')
      .map((p) => ({ value: p.id, label: `${p.name}, ${p.address_city}` })),
  ]

  const tenantOptions: SelectOption[] = [
    { value: '', label: t('documents.uploadModal.tenantNone') },
    ...tenants
      .filter((ctx) => !propertyId || ctx.property_id === propertyId)
      .map((ctx) => ({ value: ctx.tenant.id, label: ctx.user.full_name ?? ctx.user.email })),
  ]

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFileError(null)
    if (f) {
      if (!ALLOWED_MIME.has(f.type)) {
        setFileError(t('documents.uploadModal.errorType'))
        e.target.value = ''
        return
      }
      if (f.size > MAX_SIZE_BYTES) {
        setFileError(t('documents.uploadModal.errorSize'))
        e.target.value = ''
        return
      }
    }
    setFile(f)
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  function handlePropertyChange(val: string) {
    setPropertyId(val)
    setTenantId('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || fileError) return
    const draft: UploadDraft = {
      name: name.trim() || file.name,
      category,
      property_id: propertyId || null,
      tenant_id: tenantId || null,
      file,
    }
    upload.mutate(draft, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File picker */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
          {t('documents.uploadModal.file')}
        </p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-surface-300 bg-surface-50 px-4 py-3 text-sm text-surface-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/10 dark:hover:text-emerald-400"
        >
          <Paperclip size={16} className="shrink-0" />
          <span className="truncate">
            {file
              ? t('documents.uploadModal.fileSelected', {
                  name: file.name,
                  size: formatFileSize(file.size),
                })
              : t('documents.uploadModal.filePlaceholder')}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.csv"
          className="sr-only"
          onChange={handleFileChange}
        />
        {fileError && (
          <p className="text-xs text-red-500 dark:text-red-400">{fileError}</p>
        )}
        <p className="text-xs text-surface-400">
          {t('documents.uploadModal.fileHint')}
        </p>
      </div>

      <Input
        label={t('documents.uploadModal.name')}
        placeholder={t('documents.uploadModal.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <Select
        label={t('documents.uploadModal.category')}
        value={category}
        options={categoryOptions}
        onValueChange={(val) => setCategory(val as DocumentCategory)}
      />

      <Select
        label={t('documents.uploadModal.property')}
        value={propertyId}
        options={propertyOptions}
        onValueChange={handlePropertyChange}
      />

      <Select
        label={t('documents.uploadModal.tenant')}
        value={tenantId}
        options={tenantOptions}
        onValueChange={setTenantId}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={upload.isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={upload.isPending} disabled={!file || !!fileError}>
          {t('documents.uploadModal.confirm')}
        </Button>
      </div>
    </form>
  )
}
