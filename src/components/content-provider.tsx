"use client";
import { createContext, useContext, useMemo } from "react";
import type { Publication } from "@/lib/cms/model";
import { contentFromRows } from "@/lib/cms/content";
import { useLanguage } from "./language-provider";

const Context = createContext<Publication[]>([]);
export function ContentProvider({rows,children}:{rows:Publication[];children:React.ReactNode}) { return <Context.Provider value={rows}>{children}</Context.Provider>; }
export function useContent() { const rows=useContext(Context); const {locale}=useLanguage(); return useMemo(()=>contentFromRows(rows,locale),[rows,locale]); }
