import { useTranslation } from 'react-i18next'
import {
  ClipboardList,
  File,
  FileText,
  Mail,
  Receipt,
  Shield,
} from 'lucide-react'
import type { DocumentCategory } from '@/types/database'

const CONFIG: Record<
  DocumentCategory,
  { icon: React.ElementType; bg: string; text: string }
> = {
  lease:          { icon: FileText,      bg: 'bg-indigo-50 dark:bg-indigo-900/25',  text: 'text-indigo-600 dark:text-indigo-400'  },
  protocol:       { icon: ClipboardList, bg: 'bg-violet-50 dark:bg-violet-900/25',  text: 'text-violet-600 dark:text-violet-400'  },
  invoice:        { icon: Receipt,       bg: 'bg-amber-50  dark:bg-amber-900/25',   text: 'text-amber-600  dark:text-amber-400'   },
  insurance:      { icon: Shield,        bg: 'bg-emerald-50 dark:bg-emerald-900/25',text: 'text-emerald-600 dark:text-emerald-400'},
  correspondence: { icon: Mail,          bg: 'bg-sky-50    dark:bg-sky-900/25',     text: 'text-sky-600    dark:text-sky-400'     },
  other:          { icon: File,          bg: 'bg-surface-100 dark:bg-surface-800',  text: 'text-surface-500 dark:text-surface-400'},
}

interface Props {
  category: DocumentCategory
  showLabel?: boolean
}

export function DocumentTypeBadge({ category, showLabel = false }: Props) {
  const { t } = useTranslation()
  const { icon: Icon, bg, text } = CONFIG[category] ?? CONFIG.other

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${bg} ${text}`}
    >
      <Icon size={13} className="shrink-0" />
      {showLabel && t(`documents.category.${category}`)}
    </span>
  )
}

export function DocumentTypeIcon({ category }: { category: DocumentCategory }) {
  const { icon: Icon, bg, text } = CONFIG[category] ?? CONFIG.other
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${text}`}
    >
      <Icon size={17} />
    </span>
  )
}
