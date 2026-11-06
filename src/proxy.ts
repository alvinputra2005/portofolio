import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {localAdminAllowed} from "./lib/admin/local-access";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env=(key:string):string|undefined=>Reflect.get(process.env,key);
  if(localAdminAllowed({enabled:env("LOCAL_ADMIN_NO_AUTH"),nodeEnv:env("NODE_ENV"),host:request.headers.get("host"),forwardedHost:request.headers.get("x-forwarded-host"),forwardedFor:request.headers.get("x-forwarded-for")})) {
    response.headers.set("Cache-Control","private, no-store");return response;
  }
  const url=env("NEXT_PUBLIC_SUPABASE_URL"),key=env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return response;
  const client = createServerClient(url, key, { cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) { values.forEach(({ name, value }) => request.cookies.set(name,value)); response = NextResponse.next({ request }); values.forEach(({name,value,options}) => response.cookies.set(name,value,options)); },
  } });
  await client.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = { matcher: ["/alvin-ganteng/:path*", "/api/alvin-ganteng/:path*"] };
