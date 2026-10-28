"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { TRANSLATIONS, type Lang, type Translations } from "@/constants/translations";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang: "uz",
  setLang: () => {},
  t: TRANSLATIONS.uz,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("crm-lang") as Lang | null;
      if (stored === "uz" || stored === "ru") setLangState(stored);
    } catch {}
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try { localStorage.setItem("crm-lang", l); } catch {}
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
