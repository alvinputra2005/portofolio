import "server-only";
import { cache } from "react";
import {unstable_cache} from "next/cache";
import { publicClient, supabaseConfigured } from "@/lib/supabase/server";
import { initialPublications } from "./initial";
import { resolveMedia } from "./media";
import type { Publication } from "./model";
import {PUBLIC_CONTENT_TAG} from "./public-cache";
// This cache contains anonymous, published content only. Project URL isolates environments.
const cachedPublications=unstable_cache(async (_project:string):Promise<Publication[]>=>{
  const client=publicClient();
  const {data,error}=await client.from("content_publications").select("*").order("position");
  if(error) throw new Error("Konten belum dapat dimuat dari Supabase. Periksa konfigurasi dan migrasi.");
  return resolveMedia(client,data as Publication[]);
},["portfolio-public-v2"],{revalidate:60,tags:[PUBLIC_CONTENT_TAG]});
export const readPublications=cache(async ():Promise<Publication[]>=>{
  if(!supabaseConfigured())return initialPublications();
  return cachedPublications(String(Reflect.get(process.env,"NEXT_PUBLIC_SUPABASE_URL")));
});
