import {requireAdmin} from "@/lib/supabase/server";
import {resolveMedia} from "@/lib/cms/media";
import {ContentProvider} from "@/components/content-provider";
import {Portfolio} from "@/components/portfolio";
import type {Publication} from "@/lib/cms/model";
export default async function Page(){const{client}=await requireAdmin();const{data,error}=await client.from("content_entries").select("*");if(error)throw new Error("Draft belum dapat dimuat.");const rows=await resolveMedia(client,data.map(e=>({id:e.id,kind:e.kind,position:e.position,payload:e.draft})) as Publication[],true);return <><div className="admin-preview-banner">Preview draft — hanya untuk admin <a href="/alvin-ganteng">Kembali ke studio</a></div><ContentProvider rows={rows}><Portfolio/></ContentProvider></>;}
