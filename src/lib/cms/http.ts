import { NextResponse } from "next/server";
import { ApiError,localAdminRequest } from "@/lib/supabase/server";
import { ZodError } from "zod";

export function result(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
// Serialize local development writes; normal authenticated writes use PostgreSQL RPC.
const localQueue=globalThis as typeof globalThis & {alvinLocalWrites?:Promise<void>};
async function localWrite(action:()=>Promise<Response>){const previous=localQueue.alvinLocalWrites||Promise.resolve();let release!:()=>void;localQueue.alvinLocalWrites=new Promise<void>(resolve=>{release=resolve;});await previous;try{return await action();}finally{release();}}
export async function endpoint(request: Request, action: () => Promise<Response>) {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      const origin = request.headers.get("origin");
      // Next may construct Request.url with an internal localhost hostname.
      // Browsers control Origin and Host, so compare against the actual incoming host.
      let valid=false;
      try { const source=new URL(origin||"");valid=["http:","https:"].includes(source.protocol)&&source.host===(request.headers.get("host")||new URL(request.url).host); } catch { /* Missing/opaque Origin is denied. */ }
      if (!valid) throw new ApiError("Asal permintaan tidak diizinkan.", 403);
    }
    return !["GET","HEAD"].includes(request.method)&&await localAdminRequest()?await localWrite(action):await action();
  } catch (error) {
    if (error instanceof ZodError) return result({ error: "Isian belum valid.", details: error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }, 400);
    if (error instanceof ApiError) return result({ error: error.message }, error.status);
    // Never echo database messages, keys, provider errors or uploaded content.
    return result({ error: "Permintaan gagal. Periksa koneksi dan konfigurasi, lalu coba lagi." }, 500);
  }
}
export async function readJson(request: Request) {
  const text = await request.text();
  if (text.length > 400000) throw new ApiError("Data terlalu besar.", 413);
  try { return JSON.parse(text); } catch { throw new ApiError("Format permintaan tidak valid."); }
}
