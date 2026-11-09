"use client";
import {useState} from "react";
import {api,assetUrl,renewMediaImage} from "./api";
import {useMediaUrl} from "./media-urls";
import {X} from "lucide-react";
type MediaOption={id:string;name:string;mime:string;url?:string};
export function MediaField({value,onChange,pdf=false,label="Berkas",removeIcon=false,disabled=false,uploadLabel="Unggah berkas",libraryLabel="Pilih dari pustaka"}:{value:string;onChange:(value:string)=>void;pdf?:boolean;label?:string;removeIcon?:boolean;disabled?:boolean;uploadLabel?:string;libraryLabel?:string}){
 const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[options,setOptions]=useState<MediaOption[]|null>(null);
 const url=useMediaUrl();
 async function upload(file?:File){if(!file)return;setBusy(true);setError("");try{if(pdf?file.type!=="application/pdf":!["image/jpeg","image/png","image/webp"].includes(file.type))throw new Error(pdf?"Pilih PDF.":"Pilih JPEG, PNG, atau WebP.");const form=new FormData();form.set("file",file);const r=await api<{ref:string}>("/media",{method:"POST",body:form});onChange(r.ref);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function library(){try{const r=await api<{media:MediaOption[]}>("/media");setOptions(r.media.filter(m=>pdf?m.mime==="application/pdf":m.mime.startsWith("image/")));}catch(e){setError((e as Error).message);}}
 return <div className="admin-media-field">{value&&<div className="admin-media-preview">{pdf?<a href={assetUrl(value)} target="_blank" rel="noreferrer">Buka PDF ↗</a>:<img key={value} src={options?.find(o=>`media:${o.id}`===value)?.url||url(value)} alt={label} onError={e=>renewMediaImage(e.currentTarget,value)}/>}<button type="button" disabled={disabled||busy} className={removeIcon?"admin-remove-image":"admin-text-button"} aria-label={removeIcon?`Hapus gambar ${label}`:undefined} title={removeIcon?"Hapus gambar":undefined} onClick={()=>onChange("")}>{removeIcon?<X size={17}/>:"Lepaskan"}</button></div>}
 <div className="admin-inline"><label className="admin-upload">{busy?"Mengunggah…":uploadLabel}<input aria-label={`Unggah ${label}`} type="file" accept={pdf?"application/pdf":"image/jpeg,image/png,image/webp"} disabled={busy||disabled} onChange={e=>{void upload(e.target.files?.[0]);e.target.value="";}}/></label><button className="admin-button secondary small" type="button" disabled={disabled||busy} onClick={library}>{libraryLabel}</button></div>
 {options&&<select disabled={disabled||busy} aria-label={`Pilih ${label} dari pustaka`} value={value.startsWith("media:")?value:""} onChange={e=>onChange(e.target.value)}><option value="">Pilih berkas…</option>{options.map(m=><option key={m.id} value={`media:${m.id}`}>{m.name}</option>)}</select>}{error&&<p className="admin-error" role="alert">{error}</p>}</div>;
}
