import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import en from '../locales/en.json'
import th from '../locales/th.json'

type Lang = 'en' | 'th'

type Messages = Record<string, string>

type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

const STORAGE_KEY = 'app_language'

const messagesByLang: Record<Lang, Messages> = {
  en,
  th,
}

const LangContext = createContext<LangContextValue | null>(null)

const getInitialLang = (): Lang => {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const storedLang = window.localStorage.getItem(STORAGE_KEY)
  return storedLang === 'th' ? 'th' : 'en'
}

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  const value = useMemo<LangContextValue>(() => {
    const t = (key: string) => messagesByLang[lang][key] || key

    return {
      lang,
      setLang,
      t,
    }
  }, [lang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

const useLang = () => {
  const context = useContext(LangContext)

  if (!context) {
    throw new Error('useLang must be used within a LangProvider')
  }

  return context
}

export { LangProvider, useLang }
export type { Lang }
