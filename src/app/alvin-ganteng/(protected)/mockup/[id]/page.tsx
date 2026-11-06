import {notFound} from "next/navigation";
import {requireAdmin} from "@/lib/supabase/server";
import {MockupEditor} from "@/components/admin/mockup-editor";
import type {ContentEntry} from "@/lib/cms/model";
export default async function Page({params}:{params:Promise<{id:string}>}){const{id}=await params;const{client}=await requireAdmin();const{data}=await client.from("content_entries").select("*").eq("id",id).single();if(!data||data.kind!=="project")notFound();return <><MockupEditor project={data as ContentEntry} aiAvailable={Boolean(process.env.GEMINI_API_KEY)}/></>;}
