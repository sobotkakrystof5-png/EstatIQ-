import { useEffect, useState } from 'react'
import i18n from '@/i18n/config'

export type SupportedCurrency = 'CZK' | 'EUR' | 'USD' | 'GBP' | 'PLN' | 'RUB' | 'CNY'

const STORAGE_KEY = 'estatiq_currency'

export const LANGUAGE_TO_CURRENCY: Record<string, SupportedCurrency> = {
  cs: 'CZK',
  sk: 'EUR',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  en: 'GBP',
  ru: 'RUB',
  zh: 'CNY',
}

export function getStoredCurrency(): SupportedCurrency {
  return (localStorage.getItem(STORAGE_KEY) as SupportedCurrency) ?? 'CZK'
}

export function useCurrency() {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(getStoredCurrency)

  useEffect(() => {
    const handler = (lang: string) => {
      const next = LANGUAGE_TO_CURRENCY[lang] ?? 'CZK'
      localStorage.setItem(STORAGE_KEY, next)
      setCurrencyState(next)
    }
    i18n.on('languageChanged', handler)
    return () => i18n.off('languageChanged', handler)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currency)
  }, [currency])

  function setCurrency(value: SupportedCurrency) {
    setCurrencyState(value)
  }

  return { currency, setCurrency }
}
