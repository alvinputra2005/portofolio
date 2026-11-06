"use client";
import {AdminLink as Link} from "./link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard,ExternalLink,LogOut,Menu } from "lucide-react";
import { definitions } from "@/lib/cms/model";
import {adminMenuKinds} from "@/lib/admin/navigation";
import { api } from "./api";
export function AdminShell({children,email}:{children:React.ReactNode;email?:string}) {
 const path=usePathname();const[open,setOpen]=useState(false);const[error,setError]=useState("");
 async function logout(){try{await api("/auth",{method:"DELETE"});window.location.assign("/alvin-ganteng/login");}catch(e){setError((e as Error).message);}}
 if(path.replace(/\/$/,"")==="/alvin-ganteng/preview")return children;
 return <div className="admin-shell"><button className="admin-menu" onClick={()=>setOpen(!open)} aria-label="Menu panel"><Menu size={22}/></button><aside className={`admin-sidebar${open?" is-open":""}`}>
 <Link prefetch={true} className="admin-brand" href="/alvin-ganteng">alvin<span>.</span><small>STUDIO PORTOFOLIO</small></Link>
 <nav aria-label="Menu pengelolaan"><Link prefetch={true} className={path==="/alvin-ganteng/"||path==="/alvin-ganteng"?"active":""} href="/alvin-ganteng"><LayoutDashboard size={17}/>Ringkasan</Link>
 {adminMenuKinds.map(kind=><Link prefetch={true} onClick={()=>setOpen(false)} key={kind} href={`/alvin-ganteng/konten/${kind}`} className={path.includes(`/konten/${kind}`)?"active":""}>{definitions[kind].label}</Link>)}</nav>
 <div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noreferrer"><ExternalLink size={16}/>Lihat portofolio</a><small>{email||"Mode lokal · langsung masuk"}</small>{email&&<button onClick={logout}><LogOut size={16}/>Keluar</button>}{error&&<p role="alert">{error}</p>}</div></aside>
 <main className="admin-main">{children}</main></div>;
}
