"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { messages, type Locale } from "@/data/translations";

const storageKey = "alvin-portfolio-language";
const languageEvent = "portfolio-language-change";
let fallbackLocale: Locale = "id";

function getSnapshot(): Locale {
  try {
    const saved = window.localStorage.getItem(storageKey);
    return saved === "en" || saved === "id" ? saved : fallbackLocale;
  } catch { return fallbackLocale; }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(languageEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(languageEvent, callback);
  };
}

function setLocale(locale: Locale) {
  fallbackLocale = locale;
  try { window.localStorage.setItem(storageKey, locale); } catch { /* Switching still works when storage is unavailable. */ }
  window.dispatchEvent(new Event(languageEvent));
}

type LanguageContextValue = { locale: Locale; setLocale: typeof setLocale; copy: (typeof messages)[Locale] };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => "id" as Locale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, copy: messages[locale] }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
