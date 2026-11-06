import {supabaseConfigured,localAdminRequest} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import {LoginForm} from "@/components/admin/login";
import {Setup} from "@/components/admin/setup";
export default async function Page(){if(supabaseConfigured()&&await localAdminRequest())redirect("/alvin-ganteng");return <div className="admin-login-page">{supabaseConfigured()?<LoginForm/>:<Setup/>}</div>;}
