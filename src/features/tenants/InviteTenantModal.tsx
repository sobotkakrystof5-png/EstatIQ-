import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Copy, Check } from 'lucide-react'
import { Button, Input, Modal, Select } from '@/components/ui'
import { useProperties } from '@/features/properties/hooks'
import { useInviteTenant, useCreateInvitation } from './hooks'
import type { InvitationResult } from './data'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormState {
  name: string
  email: string
  propertyId: string
  rent: string
}

const EMPTY: FormState = { name: '', email: '', propertyId: '', rent: '' }

interface InviteTenantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPropertyId?: string
}

export function InviteTenantModal({ open, onOpenChange, defaultPropertyId }: InviteTenantModalProps) {
  const { t } = useTranslation()
  const [result, setResult] = useState<InvitationResult | null>(null)

  function handleClose() {
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleClose}
      title={result ? t('tenants.invite_modal.successTitle') : t('tenants.invite_modal.title')}
      description={result ? undefined : t('tenants.invite_modal.subtitle')}
    >
      {result ? (
        <SuccessView result={result} onClose={handleClose} />
      ) : (
        <InviteForm
          defaultPropertyId={defaultPropertyId}
          onSuccess={setResult}
          onClose={handleClose}
        />
      )}
    </Modal>
  )
}

// ── Success view ─────────────────────────────────────────────────────────────

function SuccessView({ result, onClose }: { result: InvitationResult; onClose: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const expiresDate = new Intl.DateTimeFormat('cs', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(result.expires_at))

  async function handleCopy() {
    await navigator.clipboard.writeText(result.invite_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
        <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-surface-900 dark:text-surface-50">
          {t('tenants.invite_modal.successDesc')}
        </p>
        <p className="text-xs text-surface-400">
          {t('tenants.invite_modal.successExpiry', { date: expiresDate })}
        </p>
      </div>

      <div className="w-full rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-surface-700 dark:bg-surface-800/50">
        <p className="break-all text-left font-mono text-xs text-surface-600 dark:text-surface-300">
          {result.invite_link}
        </p>
      </div>

      <div className="flex w-full gap-3">
        <Button variant="outline" className="flex-1" onClick={handleCopy}>
          {copied ? (
            <>
              <Check size={15} className="mr-1.5 text-emerald-500" />
              {t('tenants.invite_modal.copied')}
            </>
          ) : (
            <>
              <Copy size={15} className="mr-1.5" />
              {t('tenants.invite_modal.copyLink')}
            </>
          )}
        </Button>
        <Button className="flex-1" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </div>
  )
}

// ── Invite form ──────────────────────────────────────────────────────────────

function InviteForm({
  defaultPropertyId,
  onSuccess,
  onClose,
}: {
  defaultPropertyId?: string
  onSuccess: (result: InvitationResult) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: properties = [] } = useProperties()
  const invite = useInviteTenant()
  const createInvitation = useCreateInvitation()

  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    propertyId: defaultPropertyId ?? '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const propertyOptions = properties
    .filter((p) => p.status !== 'archived')
    .map((p) => ({ value: p.id, label: `${p.name} — ${p.address_city}` }))

  function patch(p: Partial<FormState>) {
    setForm((f) => ({ ...f, ...p }))
    if (p.propertyId) {
      const prop = properties.find((x) => x.id === p.propertyId)
      if (prop) setForm((f) => ({ ...f, propertyId: p.propertyId!, rent: String(prop.monthly_rent) }))
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = t('tenants.invite_modal.nameRequired')
    if (!EMAIL_RE.test(form.email.trim())) next.email = t('tenants.invite_modal.emailInvalid')
    if (!form.propertyId) next.propertyId = t('tenants.invite_modal.propertyRequired')
    if (!form.rent.replace(/\D/g, '')) next.rent = t('tenants.invite_modal.rentRequired')
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const isPending = invite.isPending || createInvitation.isPending

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    const prop = properties.find((p) => p.id === form.propertyId)
    invite.mutate(
      {
        property_id: form.propertyId,
        property_name: prop?.name ?? '',
        full_name: form.name.trim(),
        email: form.email.trim(),
        monthly_rent: Number(form.rent.replace(/\D/g, '')),
      },
      {
        onSuccess: (ctx) => {
          const leaseId = ctx.lease?.id
          if (!leaseId) return
          createInvitation.mutate(
            { tenantId: ctx.tenant.id, leaseId, email: form.email.trim() },
            { onSuccess: onSuccess },
          )
        },
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label={t('tenants.invite_modal.name')}
        placeholder={t('tenants.invite_modal.namePlaceholder')}
        value={form.name}
        error={errors.name}
        autoFocus
        onChange={(e) => patch({ name: e.target.value })}
      />
      <Input
        label={t('tenants.invite_modal.email')}
        placeholder={t('tenants.invite_modal.emailPlaceholder')}
        value={form.email}
        error={errors.email}
        type="email"
        autoComplete="off"
        onChange={(e) => patch({ email: e.target.value })}
      />
      <Select
        id="invite-property"
        label={t('tenants.invite_modal.property')}
        value={form.propertyId}
        onValueChange={(v) => patch({ propertyId: v })}
        options={propertyOptions}
        placeholder={t('tenants.invite_modal.propertyPlaceholder')}
      />
      {errors.propertyId && (
        <p className="text-xs text-red-600 dark:text-red-400">{errors.propertyId}</p>
      )}
      <Input
        label={t('tenants.invite_modal.rent')}
        placeholder="18 500"
        value={form.rent}
        error={errors.rent}
        inputMode="numeric"
        className="font-tabular"
        rightIcon={<span className="text-sm font-medium">Kč</span>}
        onChange={(e) => patch({ rent: e.target.value })}
      />
      <p className="text-xs text-surface-400">{t('tenants.invite_modal.note')}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={isPending}>
          {t('tenants.invite_modal.submit')}
        </Button>
      </div>
    </form>
  )
}
