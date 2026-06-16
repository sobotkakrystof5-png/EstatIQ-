import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@/components/ui'
import type { DocumentWithContext } from './data'
import { useDeleteDocument } from './hooks'

interface Props {
  document: DocumentWithContext | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDocumentModal({ document: doc, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const del = useDeleteDocument()

  function handleConfirm() {
    if (!doc) return
    del.mutate(doc.id, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('documents.deleteModal.title')}
    >
      <div className="space-y-5">
        <p className="text-sm text-surface-600 dark:text-surface-400">
          {t('documents.deleteModal.message', { name: doc?.name ?? '' })}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={del.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={del.isPending}
            onClick={handleConfirm}
          >
            {t('documents.deleteModal.confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
