import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve,relative,isAbsolute,extname } from "node:path";
import { initialPublications } from "../src/lib/cms/initial";
import { payloadSchema,mapStrings,type Payload } from "../src/lib/cms/model";

loadEnvConfig(process.cwd());
const execute=process.argv.includes("--execute");
const local=process.argv.includes("--local");
async function main(){
 if(!execute&&!process.argv.includes("--check"))throw new Error("Gunakan --check atau --execute.");
 if(local&&process.env.LOCAL_ADMIN_NO_AUTH!=="true")throw new Error("Aktifkan LOCAL_ADMIN_NO_AUTH=true sebelum memakai --local.");
 const rows=initialPublications();rows.forEach(row=>payloadSchema(row.kind).parse(row.payload));
 const refs=new Set<string>();rows.forEach(row=>mapStrings(row.payload,s=>{if(s.startsWith("/images/")||s.startsWith("/documents/"))refs.add(s);return s;}));
 const files=new Map<string,{bytes:Buffer;id:string;path:string;mime:string;name:string}>();
 const root=resolve("public");
 for(const ref of refs){const path=resolve(root,`.${ref}`);const rel=relative(root,path);if(rel.startsWith("..")||isAbsolute(rel))throw new Error("Path media tidak valid.");const bytes=await readFile(path);const hash=createHash("sha256").update(bytes).digest("hex");const id=`${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;const ext=extname(path).toLowerCase();const mime=({".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".svg":"image/svg+xml",".pdf":"application/pdf"} as Record<string,string>)[ext];if(!mime)throw new Error("Format berkas migrasi tidak didukung.");files.set(ref,{bytes,id,path:`${id}${ext}`,mime,name:ref.split("/").pop()!});}
 console.log(`Validasi lokal: ${rows.length} entri dan ${files.size} referensi media siap. File lokal tidak dihapus.`);
 const required=["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY",...(!local?["SUPABASE_ADMIN_EMAIL"]:[])];
 const missing=required.filter(key=>!process.env[key]?.trim());
 if(missing.length){console.log(`Belum terhubung. Isi ${missing.join(", ")} di .env atau .env.local.`);if(execute)process.exitCode=1;return;}
 const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 let userId:string|undefined;
 if(!local){const email=process.env.SUPABASE_ADMIN_EMAIL!.trim().toLowerCase();
  for(let page=1;page<=100;page++){const{data,error}=await client.auth.admin.listUsers({page,perPage:100});if(error)throw new Error("Koneksi Auth gagal. Periksa Project URL dan Secret key.");userId=data.users.find(u=>u.email?.toLowerCase()===email)?.id;if(userId||data.users.length<100)break;}
  if(!userId)throw new Error("Akun aplikasi belum ditemukan. Buat akun email/password di Authentication > Users, atau gunakan --local untuk mode pengembangan tanpa akun.");
 }
 const{data:existing,error}=await client.from("content_entries").select("id");if(error)throw new Error("Skema belum siap. Jalankan supabase/migrations/001_portfolio.sql di SQL Editor.");
 const existingIds=new Set((existing||[]).map(e=>e.id));const pending=rows.filter(r=>!existingIds.has(r.id));
 console.log(`Koneksi valid${local?" (mode lokal tanpa akun Auth)":" dan akun Auth valid"}. ${pending.length} entri baru; ${rows.length-pending.length} entri dilewati tanpa ditimpa.`);
 if(!execute){console.log("Pemeriksaan selesai tanpa perubahan. Gunakan npm run db:seed untuk migrasi.");return;}
 if(userId){const{error:adminError}=await client.from("portfolio_admins").upsert({user_id:userId},{onConflict:"user_id",ignoreDuplicates:true});if(adminError)throw new Error("Penetapan admin gagal.");}
 let imported=0;
 for(const row of pending){
  const needed=new Set<string>();mapStrings(row.payload,s=>{if(files.has(s))needed.add(s);return s;});
  for(const ref of needed){const f=files.get(ref)!;const{data:known}=await client.from("portfolio_media").select("id,public_path").eq("id",f.id).maybeSingle();if(known?.public_path)continue;
   for(const bucket of ["portfolio-media","portfolio-public"]){const{error:up}=await client.storage.from(bucket).upload(f.path,f.bytes,{contentType:f.mime,upsert:true});if(up)throw new Error("Unggah media migrasi gagal. Periksa bucket dan jalankan ulang; data sebelumnya tidak ditimpa.");}
   const{error:mediaError}=await client.from("portfolio_media").upsert({id:f.id,name:f.name,mime:f.mime,size:f.bytes.length,private_path:f.path,public_path:f.path},{onConflict:"id"});if(mediaError)throw new Error("Pencatatan media gagal.");
  }
  const payload=mapStrings(row.payload,s=>files.has(s)?`media:${files.get(s)!.id}`:s) as Payload;
  const{data:inserted,error:entryError}=await client.from("content_entries").upsert({id:row.id,kind:row.kind,position:row.position,draft:payload},{onConflict:"id",ignoreDuplicates:true}).select("id");if(entryError)throw new Error("Impor konten gagal.");
  if(inserted?.length){const{error:pubError}=await client.from("content_publications").insert({id:row.id,kind:row.kind,position:row.position,payload});if(pubError)throw new Error("Draft sudah diimpor, tetapi publikasi gagal. Publikasikan entri melalui panel admin.");imported++;}
 }
 console.log(`Selesai: ${imported} konten diimpor dan dipublikasikan. ${local?"Jalankan npm run dev dan buka /alvin-ganteng langsung tanpa login.":"Login di /alvin-ganteng. Matikan Allow new users to sign up di Supabase Auth."}`);
}
main().catch(error=>{console.error(error instanceof Error&&!("issues" in error)?error.message:"Validasi data migrasi gagal. Periksa initial.ts.");process.exitCode=1;});
