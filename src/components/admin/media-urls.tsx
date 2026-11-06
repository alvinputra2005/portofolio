"use client";
import {createContext,useContext} from "react";
import {assetUrl} from "./api";
const MediaContext=createContext<Record<string,string>>({});
export function AdminMediaProvider({urls,children}:{urls:Record<string,string>;children:React.ReactNode}){return <MediaContext.Provider value={urls}>{children}</MediaContext.Provider>;}
export function useMediaUrl(){const urls=useContext(MediaContext);return (ref:string)=>urls[ref]||assetUrl(ref);}
