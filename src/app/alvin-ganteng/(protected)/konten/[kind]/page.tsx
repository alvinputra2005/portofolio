import {notFound} from "next/navigation";
import {requireAdmin} from "@/lib/supabase/server";
import {ContentManager} from "@/components/admin/content-manager";
import {kinds,type ContentKind} from "@/lib/cms/model";
import {readAdminEntries} from "@/lib/cms/admin-queries";
export default async function Page({params}:{params:Promise<{kind:string}>}){const{kind}=await params;if(!kinds.includes(kind as ContentKind))notFound();const{client}=await requireAdmin();const{entries,mediaUrls}=await readAdminEntries(client,kind as ContentKind);return <><ContentManager key={kind} kind={kind as ContentKind} initialEntries={entries} initialMediaUrls={mediaUrls}/></>;}
