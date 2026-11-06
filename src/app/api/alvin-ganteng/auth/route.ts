import { z } from "zod";
import { endpoint, readJson, result } from "@/lib/cms/http";
import { ApiError, sessionClient, supabaseConfigured } from "@/lib/supabase/server";
export async function POST(request:Request) { return endpoint(request,async()=>{
  if(!supabaseConfigured()) throw new ApiError("Isi konfigurasi Supabase terlebih dahulu.",503);
  const body=z.object({email:z.string().email(),password:z.string().min(1).max(512)}).parse(await readJson(request));
  const client=await sessionClient();
  const {error}=await client.auth.signInWithPassword(body);
  if(error) throw new ApiError("Email atau password tidak sesuai, atau akses sementara dibatasi.",401);
  const {data:allowed,error:dbError}=await client.rpc("is_portfolio_admin");
  if(dbError||!allowed) { await client.auth.signOut(); throw new ApiError(dbError?"Jalankan migrasi Supabase terlebih dahulu.":"Akun ini belum ditetapkan sebagai admin.",dbError?503:403); }
  return result({ok:true});
}); }
export async function DELETE(request:Request) { return endpoint(request,async()=>{if(supabaseConfigured()) await (await sessionClient()).auth.signOut();return result({ok:true});}); }
