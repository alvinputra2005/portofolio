import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/supabase/server";
import { mapStrings, mediaIds } from "./model";
export type Media = { id:string;name:string;mime:string;size:number;private_path:string;public_path:string|null };
export async function adminMediaUrls(client:SupabaseClient,rows:Media[]) {
  const urls:Record<string,string>={};
  for(const row of rows)if(row.public_path)urls[`media:${row.id}`]=client.storage.from("portfolio-public").getPublicUrl(row.public_path).data.publicUrl;
  const privateRows=rows.filter(row=>!row.public_path);
  if(privateRows.length){
    const {data,error}=await client.storage.from("portfolio-media").createSignedUrls(privateRows.map(row=>row.private_path),300);
    if(error)throw new ApiError("Preview media belum dapat dimuat.",503);
    for(const item of data||[]){const row=privateRows.find(r=>r.private_path===item.path);if(row&&item.signedUrl)urls[`media:${row.id}`]=item.signedUrl;}
  }
  return urls;
}
export async function getMedia(client: SupabaseClient, ids: string[]) {
  if (!ids.length) return [] as Media[];
  const {data,error}=await client.from("portfolio_media").select("*").in("id",ids);
  if(error) throw new ApiError("Media tidak dapat dibaca.",503);
  return data as Media[];
}
export async function resolveMedia<T>(client: SupabaseClient, value: T, preview=false):Promise<T> {
  const rows=await getMedia(client,mediaIds(value)); const urls=new Map<string,string>();
  for(const row of rows) {
    if(preview) urls.set(row.id,`/api/alvin-ganteng/media/${row.id}/`);
    else if(row.public_path) urls.set(row.id,client.storage.from("portfolio-public").getPublicUrl(row.public_path).data.publicUrl);
  }
  return mapStrings(value,s=>s.startsWith("media:")?urls.get(s.slice(6))||"":s);
}
export async function promoteMedia(client: SupabaseClient, value:unknown) {
  const ids=mediaIds(value), rows=await getMedia(client,ids);
  if(rows.length!==ids.length) throw new ApiError("Ada media yang tidak ditemukan. Pilih ulang berkasnya.");
  for(const row of rows) {
    if(row.public_path) continue;
    const {data:blob,error}=await client.storage.from("portfolio-media").download(row.private_path);
    if(error||!blob) throw new ApiError("Berkas belum dapat dipublikasikan.",503);
    const path=row.private_path;
    const {error:uploadError}=await client.storage.from("portfolio-public").upload(path,blob,{contentType:row.mime,upsert:true});
    if(uploadError) throw new ApiError("Unggah media publik gagal.",503);
    const {error:updateError}=await client.from("portfolio_media").update({public_path:path}).eq("id",row.id);
    if(updateError) throw new ApiError("Pencatatan media publik gagal.",503);
  }
}
