import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin,ApiError } from "@/lib/supabase/server";
import { endpoint,result } from "@/lib/cms/http";
import {adminMediaUrls,type Media} from "@/lib/cms/media";
export async function GET(request:Request){return endpoint(request,async()=>{const{client}=await requireAdmin();const{data,error}=await client.from("portfolio_media").select("*").order("created_at",{ascending:false}).limit(500);if(error)throw error;const urls=await adminMediaUrls(client,data as Media[]);return result({media:data.map(m=>({id:m.id,name:m.name,mime:m.mime,size:m.size,created_at:m.created_at,url:urls[`media:${m.id}`]}))});});}
export async function POST(request:Request){return endpoint(request,async()=>{
 const{client}=await requireAdmin();if(Number(request.headers.get("content-length"))>21*1024*1024)throw new ApiError("Berkas terlalu besar.",413);
 const form=await request.formData(),file=form.get("file");if(!(file instanceof File)||!file.size)throw new ApiError("Pilih berkas.");
 const ext:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","application/pdf":"pdf"};
 if(!ext[file.type])throw new ApiError("Gunakan JPEG, PNG, WebP, atau PDF.");
 if(file.size>(file.type==="application/pdf"?20:10)*1024*1024)throw new ApiError("Ukuran maksimal gambar 10 MB; PDF 20 MB.",413);
 const buffer=Buffer.from(await file.arrayBuffer());
 if(file.type==="application/pdf"){if(buffer.subarray(0,5).toString()!=="%PDF-")throw new ApiError("Berkas PDF tidak valid.");}
 else {try{const metadata=await sharp(buffer,{limitInputPixels:60000000}).metadata();if(!["jpeg","png","webp"].includes(metadata.format||"")||!metadata.width)throw new Error();if(`image/${metadata.format}`!==file.type)throw new Error();}catch{throw new ApiError("Gambar tidak valid atau resolusinya terlalu besar.");}}
 const id=randomUUID(),path=`${id}.${ext[file.type]}`;
 const{error:up}=await client.storage.from("portfolio-media").upload(path,buffer,{contentType:file.type});if(up)throw new ApiError("Unggah gagal. Periksa bucket dan aturan akses.",503);
 const{error}=await client.from("portfolio_media").insert({id,name:file.name.slice(0,200),mime:file.type,size:file.size,private_path:path});
 if(error){await client.storage.from("portfolio-media").remove([path]);throw error;}
 return result({ref:`media:${id}`,url:`/api/alvin-ganteng/media/${id}`,id,name:file.name},201);
});}
