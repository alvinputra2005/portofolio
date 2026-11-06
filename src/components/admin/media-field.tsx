"use client";
import {useState} from "react";
import {api,assetUrl,renewMediaImage} from "./api";
import {useMediaUrl} from "./media-urls";
type MediaOption={id:string;name:string;mime:string;url?:string};
export function MediaField({value,onChange,pdf=false,label="Berkas"}:{value:string;onChange:(value:string)=>void;pdf?:boolean;label?:string}){
 const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[options,setOptions]=useState<MediaOption[]|null>(null);
 const url=useMediaUrl();
 async function upload(file?:File){if(!file)return;setBusy(true);setError("");try{if(pdf?file.type!=="application/pdf":!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error(pdf?"Pilih PDF.":"Pilih JPEG, PNG, atau WebP.");const form=new FormData();form.set("file",file);const r=await api<{ref:string}>("/media",{method:"POST",body:form});onChange(r.ref);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function library(){try{const r=await api<{media:MediaOption[]}>("/media");setOptions(r.media.filter(m=>pdf?m.mime==="application/pdf":m.mime.startsWith("image/")));}catch(e){setError((e as Error).message);}}
 return <div className="admin-media-field">{value&&<div className="admin-media-preview">{pdf?<a href={assetUrl(value)} target="_blank" rel="noreferrer">Buka PDF ↗</a>:<img key={value} src={options?.find(o=>`media:${o.id}`===value)?.url||url(value)} alt={label} onError={e=>renewMediaImage(e.currentTarget,value)}/>}<button type="button" className="admin-text-button" onClick={()=>onChange("")}>Lepaskan</button></div>}
 <div className="admin-inline"><label className="admin-upload">{busy?"Mengunggah…":"Unggah berkas"}<input aria-label={`Unggah ${label}`} type="file" accept={pdf?"application/pdf":"image/jpeg,image/png,image/webp"} disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value="";}}/></label><button className="admin-button secondary small" type="button" onClick={library}>Pilih dari pustaka</button></div>
 {options&&<select aria-label={`Pilih ${label} dari pustaka`} value={value.startsWith("media:")?value:""} onChange={e=>onChange(e.target.value)}><option value="">Pilih berkas…</option>{options.map(m=><option key={m.id} value={`media:${m.id}`}>{m.name}</option>)}</select>}{error&&<p className="admin-error" role="alert">{error}</p>}</div>;
}
