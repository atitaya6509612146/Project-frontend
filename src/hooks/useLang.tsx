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

// context กลางสำหรับสถานะภาษาและ helper ค้นหาคำแปล
const LangContext = createContext<LangContextValue | null>(null)

const applyDocumentLang = (lang: Lang) => {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.lang = lang
}

const getInitialLang = (): Lang => {
  if (typeof window === 'undefined') {
    return 'en'
  }

  const storedLang = window.localStorage.getItem(STORAGE_KEY)
  const initialLang = storedLang === 'th' ? 'th' : 'en'
  applyDocumentLang(initialLang)
  return initialLang
}

// ครอบแอปเพื่อให้ทุกหน้าอ่านหรือเปลี่ยนภาษาได้ผ่าน useLang()
function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, lang)
    applyDocumentLang(lang)
  }, [lang])

  const value = useMemo<LangContextValue>(() => {
    // ถ้าไม่มี key แปลภาษา จะแสดงชื่อ key เพื่อให้เห็นข้อความที่ยังไม่ได้แปล
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
