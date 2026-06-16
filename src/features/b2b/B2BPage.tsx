import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  UserPlus,
  Copy,
  Check,
  X,
  Shield,
  MessageSquare,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle } from '@/components/ui'
import { Select } from '@/components/ui'
import { EmptyState, SkeletonRow } from '@/components/ui'
import { Badge } from '@/components/ui'
import { formatDate } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { OrgMemberRole } from '@/types/database'
import {
  useOrganization,
  useMembers,
  useInviteMember,
  useRemoveMember,
} from './hooks'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

// ── Role badge ─────────────────────────────────────────────────────────────────

const roleColors: Record<OrgMemberRole, string> = {
  admin:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  manager:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  accountant:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  viewer:
    'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
}

function RoleBadge({ role }: { role: OrgMemberRole }) {
  const { t } = useTranslation()
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', roleColors[role])}>
      {t(`b2b.roles.${role}`)}
    </span>
  )
}

// ── Invite panel ──────────────────────────────────────────────────────────────

function InvitePanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgMemberRole>('manager')
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { mutate: invite, isPending } = useInviteMember()

  const roleOptions: Array<{ value: string; label: string }> = (
    ['admin', 'manager', 'accountant', 'viewer'] as OrgMemberRole[]
  ).map((r) => ({ value: r, label: t(`b2b.roles.${r}`) }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    invite(
      { email: email.trim(), role },
      {
        onSuccess: ({ token: t }) => setToken(t),
      },
    )
  }

  function handleCopy() {
    if (!token) return
    const link = `${window.location.origin}/auth/accept-invite?token=${token}`
    void navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
    >
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">
            {t('b2b.invite.title')}
          </h3>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
          >
            <X size={16} />
          </button>
        </div>

        {token ? (
          // Success state — show invite link
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3.5 dark:bg-emerald-950/20">
              <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {t('b2b.invite.success')}
              </p>
            </div>

            <div className="flex gap-2">
              <input
                readOnly
                value={`${window.location.origin}/auth/accept-invite?token=${token}`}
                className="min-w-0 flex-1 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-xs text-surface-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400"
              />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? t('b2b.invite.linkCopied') : t('b2b.invite.copyLink')}
              </Button>
            </div>

            <p className="text-xs text-surface-400">{t('b2b.invite.note')}</p>

            <Button variant="ghost" size="sm" onClick={() => { setToken(null); setEmail(''); }}>
              {t('b2b.members.invite')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('b2b.members.email')}
              type="email"
              placeholder={t('b2b.invite.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Select
              label={t('b2b.invite.roleLabel')}
              value={role}
              onValueChange={(v) => setRole(v as OrgMemberRole)}
              options={roleOptions}
            />
            <p className="text-xs text-surface-400">{t('b2b.invite.note')}</p>
            <Button type="submit" disabled={isPending || !email.trim()}>
              <UserPlus size={15} />
              {isPending ? t('b2b.invite.sending') : t('b2b.invite.send')}
            </Button>
          </form>
        )}
      </Card>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 'user-tomas'

export default function B2BPage() {
  const { t } = useTranslation()
  const { data: org, isLoading: orgLoading } = useOrganization()
  const { data: members, isLoading: membersLoading } = useMembers()
  const { mutate: remove } = useRemoveMember()

  const [showInvite, setShowInvite] = useState(false)

  const isAdmin = members?.find((m) => m.user_id === CURRENT_USER_ID)?.role === 'admin'

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-5 sm:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: EASE_OUT }}
      >
        <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('b2b.title')}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{t('b2b.subtitle')}</p>
      </motion.div>

      {/* Organization card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.05 }}
      >
        <Card className="p-5">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
              <Building2 size={15} className="text-emerald-500" />
              {t('b2b.org.title')}
            </CardTitle>
          </CardHeader>

          {orgLoading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
              ))}
            </div>
          ) : org ? (
            <div className="mt-4 grid gap-y-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-surface-400">{t('b2b.org.name')}</p>
                <p className="mt-0.5 font-semibold text-surface-900 dark:text-surface-50">{org.name}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">{t('b2b.org.slug')}</p>
                <p className="mt-0.5 font-mono text-sm text-surface-600 dark:text-surface-400">{org.slug}</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">{t('b2b.org.plan')}</p>
                <p className="mt-0.5">
                  <Badge variant="paid">{t('landing.pricing.free.name')}</Badge>
                </p>
              </div>
              <div>
                <p className="text-xs text-surface-400">{t('b2b.members.title')}</p>
                <p className="mt-0.5 tabular-nums text-sm font-medium text-surface-700 dark:text-surface-300">
                  {t('b2b.org.memberCount', { count: members?.length ?? 0 })}
                </p>
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>

      {/* Invite panel */}
      <AnimatePresence>
        {showInvite && <InvitePanel onClose={() => setShowInvite(false)} />}
      </AnimatePresence>

      {/* Members section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.1 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            {t('b2b.members.title')}
          </h2>
          {isAdmin && !showInvite && (
            <Button size="sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} />
              {t('b2b.members.invite')}
            </Button>
          )}
        </div>

        {membersLoading ? (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white px-4 dark:border-surface-800 dark:bg-surface-900">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : !members || members.length === 0 ? (
          <EmptyState
            icon={<Users size={26} />}
            title={t('b2b.members.emptyState.title')}
            description={t('b2b.members.emptyState.description')}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-surface-100 bg-white dark:border-surface-800 dark:bg-surface-900">
            <AnimatePresence mode="popLayout" initial={false}>
              {members.map((member, i) => {
                const isSelf = member.user_id === CURRENT_USER_ID
                const isPending = member.joined_at === null

                return (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.18, ease: EASE_OUT, delay: i * 0.03 }}
                    className={
                      i < members.length - 1
                        ? 'border-b border-surface-100 dark:border-surface-800'
                        : ''
                    }
                  >
                    <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
                      {/* Avatar */}
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-xs font-semibold text-surface-600 dark:bg-surface-800 dark:text-surface-400">
                        {member.user.initials}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
                            {member.user.full_name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs font-normal text-surface-400">(vy)</span>
                            )}
                          </p>
                          {isPending && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Čeká
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-surface-400">{member.user.email}</p>
                      </div>

                      {/* Role */}
                      <div className="hidden sm:block">
                        <RoleBadge role={member.role} />
                      </div>

                      {/* Joined */}
                      <p className="hidden tabular-nums text-xs text-surface-400 md:block">
                        {member.joined_at ? formatDate(member.joined_at) : '—'}
                      </p>

                      {/* Remove (admin only, not self) */}
                      {isAdmin && !isSelf && (
                        <button
                          onClick={() => remove(member.id)}
                          aria-label={t('b2b.members.remove')}
                          title={t('b2b.members.remove')}
                          className="rounded-lg p-1.5 text-surface-300 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/20"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Role legend */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.15 }}
      >
        <Card className="p-5">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
              <Shield size={15} className="text-emerald-500" />
              {t('b2b.roles.admin')} — přehled rolí
            </CardTitle>
          </CardHeader>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(['admin', 'manager', 'accountant', 'viewer'] as OrgMemberRole[]).map((role) => (
              <div key={role} className="flex items-start gap-3">
                <RoleBadge role={role} />
                <p className="text-xs leading-relaxed text-surface-500 dark:text-surface-400">
                  {t(`b2b.roleDescriptions.${role}`)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Messaging note — TODO(fáze 2): real invite management */}
      <div className="flex items-start gap-3 rounded-2xl border border-surface-100 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-900">
        <MessageSquare size={15} className="mt-0.5 shrink-0 text-surface-400" />
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {t('b2b.invite.resendNote')}
        </p>
      </div>

      <div className="h-6" />
    </div>
  )
}
