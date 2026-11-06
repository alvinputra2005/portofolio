import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireAdmin, ApiError } from "@/lib/supabase/server";
import { endpoint, result, readJson } from "@/lib/cms/http";
import { definitions, kinds, payloadSchema } from "@/lib/cms/model";
import {readAdminEntries} from "@/lib/cms/admin-queries";
export async function GET(request:Request) { return endpoint(request,async()=>{
  const {client}=await requireAdmin();
  const filter=new URL(request.url).searchParams.get("kind");
  const kind=filter?z.enum(kinds).parse(filter):undefined;
  return result(await readAdminEntries(client,kind));
}); }
export async function POST(request:Request) { return endpoint(request,async()=>{
  const {client}=await requireAdmin();const body=z.object({kind:z.enum(kinds),draft:z.unknown()}).parse(await readJson(request));
  const draft=payloadSchema(body.kind).parse(body.draft);
  const {data:max}=await client.from("content_entries").select("position").eq("kind",body.kind).order("position",{ascending:false}).limit(1);
  const id=definitions[body.kind].singleton?body.kind:randomUUID();
  const {data,error}=await client.from("content_entries").insert({id,kind:body.kind,position:(max?.[0]?.position??-1)+1,draft}).select().single();
  if(error) throw new ApiError("Konten gagal dibuat. Entri tunggal mungkin sudah tersedia.",409);
  return result({entry:data},201);
}); }
