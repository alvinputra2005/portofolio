import {redirect} from "next/navigation";
import {ApiError,requireAdmin,supabaseConfigured} from "@/lib/supabase/server";
import {Setup} from "@/components/admin/setup";
import {AdminShell} from "@/components/admin/shell";
export default async function Layout({children}:{children:React.ReactNode}){
 if(!supabaseConfigured())return <div className="admin-login-page"><Setup/></div>;
 let email:string|undefined;
 try{email=(await requireAdmin()).user.email;}catch(e){if(e instanceof ApiError&&e.status===401)redirect("/alvin-ganteng/login");return <div className="admin-login-page"><Setup message={e instanceof ApiError?e.message:"Koneksi belum tersedia."}/></div>;}
 return <AdminShell email={email}>{children}</AdminShell>;
}
