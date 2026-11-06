"use client";
import {FileText,PanelsTopLeft} from "lucide-react";
export type ProjectTab="data"|"mockup";
export function ProjectEditorTabs({active,onChange,disabled,id}:{active:ProjectTab;onChange:(tab:ProjectTab)=>void;disabled:boolean;id:string}){
 const tabs=[{key:"data",label:"Form Data",Icon:FileText},{key:"mockup",label:"Mockup",Icon:PanelsTopLeft}] as const;
 return <div className="admin-editor-tabs" role="tablist" aria-label="Editor proyek">{tabs.map(({key,label,Icon},index)=><button key={key} type="button" role="tab" id={`${id}-${key}-tab`} aria-controls={`${id}-${key}-panel`} aria-selected={active===key} tabIndex={active===key?0:-1} disabled={disabled} onClick={()=>onChange(key)} onKeyDown={event=>{const next=event.key==="ArrowRight"?(index+1)%2:event.key==="ArrowLeft"?(index+1)%2:event.key==="Home"?0:event.key==="End"?1:null;if(next===null)return;event.preventDefault();onChange(tabs[next].key);event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();}}><Icon size={17}/>{label}</button>)}</div>;
}
