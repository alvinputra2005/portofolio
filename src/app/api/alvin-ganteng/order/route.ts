import {z} from "zod";
import {requireAdmin,ApiError} from "@/lib/supabase/server";
import {endpoint,readJson,result} from "@/lib/cms/http";
import {kinds} from "@/lib/cms/model";
import {invalidatePublicContent} from "@/lib/cms/public-cache";
export async function POST(request:Request){return endpoint(request,async()=>{
 const{client,local}=await requireAdmin();const body=z.object({kind:z.enum(kinds),ids:z.array(z.string()).max(1000),publish:z.boolean().default(false)}).parse(await readJson(request));
 if(!local){const{error}=await client.rpc("reorder_portfolio_entries",{entry_ids:body.ids,entry_kind:body.kind,publish_order:body.publish});if(error)throw new ApiError("Urutan gagal disimpan. Muat ulang daftar.",409);}
 else{
  const{data:entries,error}=await client.from("content_entries").select("*").eq("kind",body.kind);
  if(error||!entries||new Set(body.ids).size!==body.ids.length||entries.length!==body.ids.length||body.ids.some(id=>!entries.some(e=>e.id===id)))throw new ApiError("Daftar berubah. Muat ulang daftar.",409);
  if(entries.length){const{error:e}=await client.from("content_entries").upsert(body.ids.map((id,position)=>({...entries.find(e=>e.id===id)!,position})),{onConflict:"id"});if(e)throw new ApiError("Urutan draft gagal disimpan.",503);}
  if(body.publish){const{data:pubs,error:e}=await client.from("content_publications").select("*").eq("kind",body.kind);if(e)throw e;if(pubs?.length){const{error:save}=await client.from("content_publications").upsert(pubs.map(p=>({...p,position:body.ids.indexOf(p.id)})),{onConflict:"id"});if(save)throw new ApiError("Urutan publik belum diperbarui. Coba terbitkan urutan kembali.",503);}}
 }
 if(body.publish)invalidatePublicContent();
 const{data:entries,error}=await client.from("content_entries").select("id,position,updated_at").eq("kind",body.kind);
 if(error)throw new ApiError("Urutan tersimpan, tetapi daftar belum dapat diperbarui. Muat ulang daftar.",503);
 return result({ok:true,entries});
});}
