"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LangContext = createContext<LangContextValue>({
  lang: "vi",
  setLang: () => {}
});

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "vi";
  try {
    const stored = localStorage.getItem("tungphat-lang");
    if (stored === "en" || stored === "vi") return stored;
  } catch {}
  return "vi";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(getInitialLang());
    setMounted(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem("tungphat-lang", next);
    } catch {}
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = lang;
    }
  }, [lang, mounted]);

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}