import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function SvjPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-md"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          <Crown size={28} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="font-display mb-3 text-2xl font-bold text-surface-900 dark:text-surface-50">
          {t('svj.title')}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
          {t('svj.description')}
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={() => void navigate('/app/settings')}
        >
          {t('svj.cta')}
        </Button>
      </motion.div>
    </div>
  )
}
