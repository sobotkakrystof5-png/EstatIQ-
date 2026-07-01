import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type CalendarView = 'agenda' | 'month'

// ── Pomocné funkce ────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Týdenní pruh — 7 dní kolem selectedDate
function WeekStrip({
  selected,
  onSelect,
}: {
  selected: Date
  onSelect: (d: Date) => void
}) {
  const { i18n } = useTranslation()
  const today = new Date()

  // Základ = pondělí týdne vybraného data
  const monday = new Date(selected)
  const dow = monday.getDay() || 7
  monday.setDate(monday.getDate() - dow + 1)

  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))

  const dayLabels = Array.from({ length: 7 }, (_, i) =>
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      .toLocaleDateString(i18n.language, { weekday: 'short' })
  )

  return (
    <div className="flex gap-1">
      {days.map((day, i) => {
        const isSelected = isSameDay(day, selected)
        const isToday = isSameDay(day, today)
        return (
          <button
            key={i}
            onClick={() => onSelect(day)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-all',
              isSelected
                ? 'bg-emerald-600 text-white'
                : isToday
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
            )}
          >
            <span className="uppercase">{dayLabels[i]}</span>
            <span className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full font-semibold tabular-nums',
              isSelected && 'bg-white/20',
            )}>
              {day.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Hlavní stránka ────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const [view, setView] = useState<CalendarView>('agenda')
  const [selected, setSelected] = useState(new Date())

  function goToday() { setSelected(new Date()) }
  function prevWeek() { setSelected((d) => addDays(d, -7)) }
  function nextWeek() { setSelected((d) => addDays(d, 7)) }

  const selectedLabel = selected.toLocaleDateString(i18n.language, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  // Capitalize
  const labelCapitalized = selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)

  return (
    <div className="p-4 md:p-8">
      {/* Hlavička */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold text-surface-900 dark:text-surface-50"
        >
          {t('calendar.title')}
        </motion.h1>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
            {(['agenda', 'month'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                  view === v
                    ? 'bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-50'
                    : 'text-surface-500 hover:text-surface-700 dark:text-surface-400',
                )}
              >
                {t(`calendar.view.${v}`)}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={goToday}>
            {t('calendar.today')}
          </Button>
        </div>
      </div>

      {/* Týdenní pruh s navigací */}
      <Card padding="lg" className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={prevWeek}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 transition-colors dark:hover:bg-surface-800"
            aria-label={t('calendar.prevWeek')}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
            {selected.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextWeek}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 transition-colors dark:hover:bg-surface-800"
            aria-label={t('calendar.nextWeek')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <WeekStrip selected={selected} onSelect={setSelected} />
      </Card>

      {/* Detail vybraného dne */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.toDateString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
              {labelCapitalized}
            </h2>
            <Button size="sm" leftIcon={<Plus size={14} />}>
              {t('calendar.addEvent')}
            </Button>
          </div>

          {/* Empty state */}
          <Card padding="lg">
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CalendarDays size={36} className="text-surface-300 dark:text-surface-600" />
              <p className="font-medium text-surface-500 dark:text-surface-400">
                {t('calendar.empty.title')}
              </p>
              <p className="text-sm text-surface-400">
                {t('calendar.empty.description')}
              </p>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
