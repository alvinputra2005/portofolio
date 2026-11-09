"use client";
import {useId,useState,type Dispatch,type ReactNode,type SetStateAction} from "react";
import {changeTemplate,overlayPresets,type MockupDesign,type MockupNode} from "@/lib/mockup/model";
import {MediaField} from "./media-field";
type SettingsSection = "identity" | "template" | "overlay";
function SettingsAccordion({id,label,open,onToggle,children}:{id:string;label:string;open:boolean;onToggle:()=>void;children:ReactNode}){
 return <section className="admin-settings-section">
  <h3 className="admin-settings-heading"><button type="button" id={`${id}-heading`} className="admin-settings-toggle" aria-expanded={open} aria-controls={`${id}-panel`} onClick={onToggle}>{label}<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></button></h3>
  <div className="admin-settings-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-heading`} hidden={!open}>{children}</div>
 </section>;
}
export function MockupSettings({design,onChange,busy}:{design:MockupDesign;onChange:Dispatch<SetStateAction<MockupDesign>>;busy:boolean}){
 const accordionId=useId(),[openSection,setOpenSection]=useState<SettingsSection|null>("identity");
 function toggle(section:SettingsSection){setOpenSection(current=>current===section?null:section);}
 const shots=design.nodes.filter(node=>node.type==="screenshot"),title=design.nodes.find(node=>node.type==="title"),logo=design.nodes.find(node=>node.type==="logo");
 function update(id:string,change:Partial<MockupNode>){onChange(current=>({...current,nodes:current.nodes.map(node=>node.id!==id||node.locked&&!("locked"in change)&&!("label"in change)?node:{...node,...change})}));}
 function image(id:string,asset:string,index:number){onChange(current=>({...current,nodes:current.nodes.map(node=>node.type!=="screenshot"||node.locked?node:node.id===id||index===0&&asset&&!node.asset?{...node,asset}:node)}));}
 return <aside className="admin-mockup-properties"><fieldset className="admin-mockup-controls" disabled={busy}>
  <SettingsAccordion id={`${accordionId}-identity`} label="Identitas proyek" open={openSection==="identity"} onToggle={()=>toggle("identity")}>
   <label>Judul<input value={title?.text||""} disabled={title?.locked} onChange={event=>title&&update(title.id,{text:event.target.value})}/></label>
   {title?.locked&&<button type="button" className="admin-text-button" onClick={()=>update(title.id,{locked:false})}>Buka kunci judul</button>}
   <label>Subjudul<input maxLength={100} value={design.showcase.subtitle} onChange={event=>{const subtitle=event.target.value;onChange(current=>({...current,showcase:{...current.showcase,subtitle}}));}}/></label>
   <label>Deskripsi<textarea aria-label="Deskripsi" rows={4} maxLength={600} value={design.showcase.footer} onChange={event=>{const footer=event.target.value;onChange(current=>({...current,showcase:{...current.showcase,footer},nodes:current.nodes.map(node=>node.type==="description"?{...node,text:footer}:node)}));}}/></label>
   <p className="admin-help">Deskripsi tampil di bawah mockup.</p>
   <label>Logo</label><MediaField label="logo mockup" value={logo?.asset||""} removeIcon disabled={!logo||logo.locked} onChange={asset=>logo&&update(logo.id,{asset})}/>
   {logo?.locked&&<button type="button" className="admin-text-button" onClick={()=>update(logo.id,{locked:false})}>Buka kunci logo</button>}
  </SettingsAccordion>
  <SettingsAccordion id={`${accordionId}-template`} label="Template mockup" open={openSection==="template"} onToggle={()=>toggle("template")}>
   <label>Jenis tampilan<select aria-label="Template mockup" value={design.layout} onChange={event=>{const layout=event.target.value as MockupDesign["layout"];onChange(current=>changeTemplate(current,layout));}}><option value="browser">Desktop</option><option value="phone">Mobile</option><option value="combined">Desktop + Mobile</option></select></label>
   <label>Latar<input type="color" value={design.background} onChange={event=>{const background=event.target.value;onChange(current=>({...current,background}));}}/></label>
   <label>Aksen<input type="color" value={design.accent} onChange={event=>{const accent=event.target.value;onChange(current=>({...current,accent,nodes:current.nodes.map(node=>node.type==="decoration"?{...node,color:accent}:node)}));}}/></label>
   <label className="admin-checkbox"><input type="checkbox" checked={design.showcase.popups} onChange={event=>{const popups=event.target.checked;onChange(current=>({...current,showcase:{...current.showcase,popups}}));}}/>Tampilkan kartu pop-up</label>
   <details><summary>Tautan QR (opsional)</summary>
    <label>QR Prototype<input type="url" value={design.showcase.prototypeUrl} placeholder="https://…" onChange={event=>{const prototypeUrl=event.target.value;onChange(current=>({...current,showcase:{...current.showcase,prototypeUrl}}));}}/></label>
    <label>QR Case study<input type="url" value={design.showcase.caseStudyUrl} placeholder="https://…" onChange={event=>{const caseStudyUrl=event.target.value;onChange(current=>({...current,showcase:{...current.showcase,caseStudyUrl}}));}}/></label>
   </details>
  <section className="admin-screenshot-settings"><h3>Mockup</h3>
   {shots.map((node,index)=>{const name=`Mockup ${index+1}`;return <details className="admin-screenshot-card" key={node.id} open={index===0} data-screen-id={node.id}><summary><span className="admin-screen-name">{name}</span></summary><div className="admin-screenshot-fields">
    <MediaField label={name} value={node.asset} uploadLabel="Unggah foto" libraryLabel="Pilih dari galeri" removeIcon disabled={node.locked} onChange={asset=>image(node.id,asset,index)}/>
    <label className="admin-checkbox"><input type="checkbox" checked={node.locked} onChange={event=>update(node.id,{locked:event.target.checked})}/>Kunci mockup</label>
   </div></details>;})}
  </section>
  </SettingsAccordion>
  <SettingsAccordion id={`${accordionId}-overlay`} label="Overlay" open={openSection==="overlay"} onToggle={()=>toggle("overlay")}>
   <label className="admin-checkbox"><input type="checkbox" checked={design.cityPhoto.enabled} onChange={event=>{const enabled=event.target.checked;onChange(current=>({...current,cityPhoto:{...current.cityPhoto,enabled}}));}}/>Foto kota di area berwarna</label>
   <label>Opasitas foto kota: {Math.round(design.cityPhoto.opacity*100)}%<input aria-label="Opasitas foto kota" type="range" min="0" max="20" disabled={!design.cityPhoto.enabled} value={Math.round(design.cityPhoto.opacity*100)} onChange={event=>{const opacity=Number(event.target.value)/100;onChange(current=>({...current,cityPhoto:{...current.cityPhoto,opacity}}));}}/></label>
   <label>Posisi foto kota<input aria-label="Posisi foto kota" type="range" min="0" max="100" disabled={!design.cityPhoto.enabled} value={design.cityPhoto.cropY} onChange={event=>{const cropY=Number(event.target.value);onChange(current=>({...current,cityPhoto:{...current.cityPhoto,cropY}}));}}/></label>
   <label>Pola area putih<select aria-label="Pola overlay" value={design.overlay.preset} onChange={event=>{const preset=overlayPresets.find(item=>item.id===event.target.value)!;onChange(current=>({...current,overlay:{preset:preset.id,opacity:preset.opacity}}));}}>{overlayPresets.map(preset=><option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
   <label>Opasitas pola: {Math.round(design.overlay.opacity*100)}%<input aria-label="Opasitas overlay" type="range" min="0" max="30" disabled={design.overlay.preset==="none"} value={Math.round(design.overlay.opacity*100)} onChange={event=>{const opacity=Number(event.target.value)/100;onChange(current=>({...current,overlay:{...current.overlay,opacity}}));}}/></label>
  </SettingsAccordion>
 </fieldset></aside>;
}
