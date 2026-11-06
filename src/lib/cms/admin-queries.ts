import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {ApiError} from "@/lib/supabase/server";
import {adminMediaUrls,getMedia} from "./media";
import {mediaIds,type ContentKind,type ContentEntry} from "./model";
export async function readAdminEntries(client:SupabaseClient,kind?:ContentKind){
  let entriesQuery=client.from("content_entries").select("*").order("position");
  let publicationQuery=client.from("content_publications").select("id,published_at");
  if(kind){entriesQuery=entriesQuery.eq("kind",kind);publicationQuery=publicationQuery.eq("kind",kind);}
  const[{data,error},{data:publications,error:pubError}]=await Promise.all([entriesQuery,publicationQuery]);
  if(error||pubError)throw new ApiError("Data belum dapat dimuat. Pastikan migrasi sudah dijalankan.",503);
  const published=new Map(publications.map(p=>[p.id,p.published_at]));
  const entries=data.map(e=>({...e,published_at:published.get(e.id)||null})) as ContentEntry[];
  const mediaUrls=await adminMediaUrls(client,await getMedia(client,mediaIds(entries)));
  return {entries,mediaUrls};
}
