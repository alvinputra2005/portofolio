import { z } from "zod";
import { requireAdmin, ApiError } from "@/lib/supabase/server";
import { endpoint, result, readJson } from "@/lib/cms/http";
import { definitions, payloadSchema, type ContentKind } from "@/lib/cms/model";
import { promoteMedia } from "@/lib/cms/media";
import {invalidatePublicContent} from "@/lib/cms/public-cache";
type Context={params:Promise<{id:string}>};
export async function PATCH(request:Request,context:Context) { return endpoint(request,async()=>{
 const {client}=await requireAdmin();const {id}=await context.params;
 const body=z.object({draft:z.unknown(),expected:z.string().min(1)}).parse(await readJson(request));
 const {data:existing}=await client.from("content_entries").select("kind").eq("id",id).single();if(!existing)throw new ApiError("Konten tidak ditemukan.",404);
 const draft=payloadSchema(existing.kind as ContentKind).parse(body.draft);
 const {data,error}=await client.from("content_entries").update({draft}).eq("id",id).eq("updated_at",body.expected).select().maybeSingle();
 if(error||!data)throw new ApiError("Konten berubah di tempat lain. Muat ulang sebelum menyimpan.",409);
 return result({entry:data});
}); }
export async function POST(request:Request,context:Context) { return endpoint(request,async()=>{
 const {client,local}=await requireAdmin();const {id}=await context.params;const body=z.object({action:z.enum(["publish","unpublish"]),expected:z.string().min(1),draft:z.unknown().optional()}).parse(await readJson(request));
 const {data:existing}=await client.from("content_entries").select("*").eq("id",id).single();if(!existing)throw new ApiError("Konten tidak ditemukan.",404);
 let e=existing;
 if(e.updated_at!==body.expected)throw new ApiError("Konten berubah. Muat ulang dahulu.",409);
 if(body.action==="publish"&&body.draft!==undefined){
  const draft=payloadSchema(e.kind as ContentKind).parse(body.draft);
  if(JSON.stringify(draft)!==JSON.stringify(e.draft)){
   const{data:updated,error}=await client.from("content_entries").update({draft}).eq("id",id).eq("updated_at",body.expected).select().maybeSingle();
   if(error||!updated)throw new ApiError("Konten berubah di tempat lain. Muat ulang sebelum menyimpan.",409);
   e=updated;
  }
 }
 if(body.action==="unpublish") {const {error}=await client.from("content_publications").delete().eq("id",id);if(error)throw error;}
 else {payloadSchema(e.kind as ContentKind).parse(e.draft);await promoteMedia(client,e.draft);
  const{error}=local?await client.from("content_publications").upsert({id:e.id,kind:e.kind,position:e.position,payload:e.draft,published_at:new Date().toISOString()},{onConflict:"id"}):await client.rpc("publish_portfolio_entry",{target_id:id,expected_updated_at:e.updated_at});
  if(error)throw new ApiError("Publikasi gagal atau konten berubah. Muat ulang sebelum mencoba lagi.",409);}
 invalidatePublicContent();
 const{data:publication,error:publicationError}=await client.from("content_publications").select("published_at").eq("id",id).maybeSingle();
 if(publicationError)throw new ApiError("Status publikasi belum dapat dimuat. Muat ulang daftar.",503);
 return result({ok:true,entry:{...e,published_at:publication?.published_at||null}});
}); }
export async function DELETE(request:Request,context:Context) { return endpoint(request,async()=>{
 const{client}=await requireAdmin();const{id}=await context.params;
 const {data:e}=await client.from("content_entries").select("kind").eq("id",id).single();if(!e)throw new ApiError("Konten tidak ditemukan.",404);
 if(definitions[e.kind as ContentKind].singleton)throw new ApiError("Profil dan pengaturan hanya dapat diedit.");
 const {error}=await client.from("content_entries").delete().eq("id",id);if(error)throw error;invalidatePublicContent();return result({ok:true});
}); }
