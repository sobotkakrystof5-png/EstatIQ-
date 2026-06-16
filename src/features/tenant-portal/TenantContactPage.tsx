import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Phone, User } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui'
import { useTenantContext } from './hooks'

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function TenantContactPage() {
  const { t } = useTranslation()
  const { data: ctx, isLoading } = useTenantContext()
  const landlord = ctx?.landlord

  return (
    <div className="mx-auto max-w-2xl p-5 sm:p-8">
      <h1 className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50">
        {t('tenant.contact.title')}
      </h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.05 }}
        className="mt-6"
      >
        <Card className="p-5">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-surface-500 dark:text-surface-400">
              <User size={15} className="text-emerald-500" />
              {t('tenant.contact.landlordSection')}
            </CardTitle>
          </CardHeader>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-5 animate-pulse rounded bg-surface-100 dark:bg-surface-800" />
              ))}
            </div>
          ) : landlord ? (
            <div className="mt-5 space-y-4">
              {/* Name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {landlord.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <p className="font-semibold text-surface-900 dark:text-surface-50">
                  {landlord.full_name}
                </p>
              </div>

              <div className="space-y-3 pl-1">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail size={16} className="shrink-0 text-surface-400" />
                  <div>
                    <p className="text-xs text-surface-400">{t('tenant.contact.email')}</p>
                    <a
                      href={`mailto:${landlord.email}`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      {landlord.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {landlord.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="shrink-0 text-surface-400" />
                    <div>
                      <p className="text-xs text-surface-400">{t('tenant.contact.phone')}</p>
                      <a
                        href={`tel:${landlord.phone}`}
                        className="text-sm font-medium text-surface-800 hover:text-emerald-600 dark:text-surface-200 dark:hover:text-emerald-400"
                      >
                        {landlord.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>

      {/* Messaging note — TODO(fáze 2): replace with real chat */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT, delay: 0.1 }}
        className="mt-4"
      >
        <div className="flex items-start gap-3 rounded-2xl border border-surface-100 bg-surface-50 p-4 dark:border-surface-800 dark:bg-surface-900">
          <MessageSquare size={16} className="mt-0.5 shrink-0 text-surface-400" />
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {t('tenant.contact.messagingNote')}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
