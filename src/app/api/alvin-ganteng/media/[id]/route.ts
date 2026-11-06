import {z} from "zod";
import {requireAdmin,ApiError} from "@/lib/supabase/server";
import {endpoint,result} from "@/lib/cms/http";
import {mediaIds} from "@/lib/cms/model";
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){return endpoint(request,async()=>{
 const{client}=await requireAdmin();const{id}=await context.params;z.uuid().parse(id);
 const{data:m}=await client.from("portfolio_media").select("*").eq("id",id).single();if(!m)throw new ApiError("Media tidak ditemukan.",404);
 if(m.public_path)return new Response(null,{status:302,headers:{Location:client.storage.from("portfolio-public").getPublicUrl(m.public_path).data.publicUrl,"Cache-Control":"private, no-store"}});
 // Signed URL is generated on demand; private drafts never enter page source as permanent URLs.
 const{data,error}=await client.storage.from("portfolio-media").createSignedUrl(m.private_path,60);if(error||!data)throw new ApiError("Media belum dapat dibuka.",503);
 return new Response(null,{status:302,headers:{Location:data.signedUrl,"Cache-Control":"private, no-store"}});
});}
export async function DELETE(request:Request,context:Context){return endpoint(request,async()=>{
 const{client}=await requireAdmin();const{id}=await context.params;z.uuid().parse(id);
 const[{data:entries,error:e1},{data:pubs,error:e2},{data:designs,error:e3}]=await Promise.all([client.from("content_entries").select("draft"),client.from("content_publications").select("payload"),client.from("mockup_designs").select("design")]);
 if(e1||e2||e3)throw new ApiError("Referensi media belum dapat diperiksa.",503);
 if(mediaIds([entries,pubs,designs]).includes(id))throw new ApiError("Media masih digunakan oleh konten atau desain. Lepaskan dari semua konten dahulu.",409);
 const{data:m}=await client.from("portfolio_media").select("*").eq("id",id).single();if(!m)throw new ApiError("Media tidak ditemukan.",404);
 const{error:privateError}=await client.storage.from("portfolio-media").remove([m.private_path]);if(privateError)throw privateError;
 if(m.public_path){const{error}=await client.storage.from("portfolio-public").remove([m.public_path]);if(error)throw error;}
 const{error}=await client.from("portfolio_media").delete().eq("id",id);if(error)throw error;return result({ok:true});
});}
