import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import {localAdminAllowed} from "@/lib/admin/local-access";
import {cache} from "react";

// Runtime lookup: a build without credentials can be configured later on the server.
const env = (key:string):string|undefined => Reflect.get(process.env,key);
export function supabaseConfigured() { return Boolean(env("NEXT_PUBLIC_SUPABASE_URL") && env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")); }
export function publicClient() {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function localAdminRequest() {
  const incoming=await headers();
  return localAdminAllowed({enabled:env("LOCAL_ADMIN_NO_AUTH"),nodeEnv:env("NODE_ENV"),host:incoming.get("host"),forwardedHost:incoming.get("x-forwarded-host"),forwardedFor:incoming.get("x-forwarded-for")});
}
function localAdminClient() {
  const secret=env("SUPABASE_SECRET_KEY");
  if(!secret)throw new ApiError("Mode lokal memerlukan SUPABASE_SECRET_KEY di env server.",503);
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL")!,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function sessionClient() {
  const jar = await cookies();
  return createServerClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")!, {
    cookies: { getAll: () => jar.getAll(), setAll(values) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Refresh is persisted by proxy for Server Components. */ } } },
  });
}
export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export const requireAdmin=cache(async () => {
  if (!supabaseConfigured()) throw new ApiError("Supabase belum dikonfigurasi. Ikuti docs/admin-setup.md.", 503);
  if(await localAdminRequest())return {client:localAdminClient(),user:{id:"local-development",email:undefined},local:true};
  const client = await sessionClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new ApiError("Silakan login terlebih dahulu.", 401);
  const { data: allowed, error: accessError } = await client.rpc("is_portfolio_admin");
  if (accessError) throw new ApiError("Skema Supabase belum siap atau koneksi bermasalah.", 503);
  if (!allowed) throw new ApiError("Akun ini tidak memiliki akses admin.", 403);
  return { client, user: data.user, local:false };
});
