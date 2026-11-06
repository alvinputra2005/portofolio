"use client";
import Link, {useLinkStatus} from "next/link";
import {useState,type ComponentProps} from "react";

// Prefetch the shell on sight and the authenticated page on intent.
// Drafts stay in this browser's router cache, never a shared server cache.
export function AdminLink({children,onMouseEnter,onFocus,prefetch,...props}:ComponentProps<typeof Link>){
 const[intent,setIntent]=useState(false);
 return <Link {...props} prefetch={prefetch??(intent?true:null)} onMouseEnter={e=>{setIntent(true);onMouseEnter?.(e);}} onFocus={e=>{setIntent(true);onFocus?.(e);}}>{children}<PendingHint/></Link>;
}
function PendingHint(){
 const{pending}=useLinkStatus();
 return <span className="admin-link-pending" data-pending={pending} aria-hidden="true"/>;
}
