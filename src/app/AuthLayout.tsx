import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      {/* Left panel — visual */}
      <div className="relative hidden w-1/2 overflow-hidden bg-surface-950 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-surface-950 to-indigo-900/30" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link to="/" className="font-display text-2xl font-bold text-white">
            Estat<span className="text-emerald-500">IQ</span>
          </Link>
          <div>
            <blockquote className="mb-6 text-xl font-medium leading-relaxed text-surface-200">
              "Pronájem, který se řídí sám."
            </blockquote>
            <p className="text-sm text-surface-500">— EstatIQ motto</p>
          </div>
        </div>
        {/* Decorative orbs */}
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col">
        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <Link
              to="/"
              className="mb-8 flex justify-center font-display text-xl font-bold text-surface-900 dark:text-surface-50 lg:hidden"
            >
              Estat<span className="text-emerald-600">IQ</span>
            </Link>
            <Outlet />
          </motion.div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-center gap-1 p-4 border-t border-surface-100 dark:border-surface-800">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  )
}
