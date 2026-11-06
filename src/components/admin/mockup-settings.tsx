"use client";
import type {Dispatch,SetStateAction} from "react";
import {X,Plus} from "lucide-react";
import {addScreenshot,changeTemplate,overlayPresets,type MockupDesign,type MockupNode} from "@/lib/mockup/model";
import {MediaField} from "./media-field";

export function MockupSettings({design,onChange,busy,onPalette}:{design:MockupDesign;onChange:Dispatch<SetStateAction<MockupDesign>>;busy:boolean;onPalette:()=>void}){
 const shots=design.nodes.filter(node=>node.type==="screenshot"),title=design.nodes.find(node=>node.type==="title"),description=design.nodes.find(node=>node.type==="description"),logo=design.nodes.find(node=>node.type==="logo");
 function update(id:string,change:Partial<MockupNode>){onChange(current=>({...current,nodes:current.nodes.map(node=>node.id!==id||node.locked&&!("locked"in change)&&!("label"in change)?node:{...node,...change})}));}
 function remove(node:MockupNode){if(node.locked&&!confirm("Screenshot ini terkunci. Tetap hapus dari mockup?"))return;onChange(current=>({...current,nodes:current.nodes.filter(item=>item.id!==node.id)}));}
 function device(node:MockupNode,frame:MockupNode["frame"]){if(frame==="none"){update(node.id,{frame});return;}const width=frame==="phone"?350:760,height=frame==="phone"?760:490;update(node.id,{frame,width,height,x:Math.max(0,Math.min(1600-width,node.x+node.width/2-width/2)),y:Math.max(0,Math.min(1000-height,node.y+node.height/2-height/2))});}
 return <aside className="admin-mockup-properties"><fieldset className="admin-mockup-controls" disabled={busy}>
  <details open><summary>Identitas proyek</summary>
   <label>Judul<input value={title?.text||""} disabled={title?.locked} onChange={event=>title&&update(title.id,{text:event.target.value})}/></label>
   {title?.locked&&<button type="button" className="admin-text-button" onClick={()=>update(title.id,{locked:false})}>Buka kunci judul</button>}
   <label>Deskripsi<textarea rows={3} value={description?.text||""} disabled={description?.locked} onChange={event=>description&&update(description.id,{text:event.target.value})}/></label>
   {description?.locked&&<button type="button" className="admin-text-button" onClick={()=>update(description.id,{locked:false})}>Buka kunci deskripsi</button>}
   <label>Logo</label><MediaField label="logo mockup" value={logo?.asset||""} removeIcon disabled={!logo||logo.locked} onChange={asset=>logo&&update(logo.id,{asset})}/>
   {logo?.locked&&<button type="button" className="admin-text-button" onClick={()=>update(logo.id,{locked:false})}>Buka kunci logo</button>}
  </details>
  <details open><summary>Template mockup</summary>
   <label>Jenis tampilan<select aria-label="Template mockup" value={design.layout} onChange={event=>onChange(current=>changeTemplate(current,event.target.value as MockupDesign["layout"]))}><option value="browser">Desktop</option><option value="phone">Mobile</option><option value="combined">Desktop + Mobile</option></select></label>
   <p className="admin-help">Template menata ulang screenshot yang tidak dikunci.</p>
   <label>Latar<input type="color" value={design.background} onChange={event=>onChange(current=>({...current,background:event.target.value}))}/></label>
   <label>Aksen<input type="color" value={design.accent} onChange={event=>{const color=event.target.value;onChange(current=>({...current,accent:color,nodes:current.nodes.map(node=>node.type==="decoration"&&!node.locked?{...node,color}:node)}));}}/></label>
   <button type="button" className="admin-button secondary small" onClick={onPalette}>Ambil warna logo</button>
  </details>
  <section className="admin-screenshot-settings"><div className="admin-screenshot-heading"><h3>Screenshot</h3><small>{shots.length}/3</small></div>
   {shots.map((node,index)=>{const name=node.label||`Screenshot ${index+1}`;return <details key={node.id} className="admin-screenshot-card" open={index===0} data-screen-id={node.id}><summary><span className="admin-screen-name">{name}</span><button type="button" className="admin-remove-image" aria-label={`Hapus screenshot ${name}`} title="Hapus screenshot dari mockup" onClick={event=>{event.preventDefault();event.stopPropagation();remove(node);}}><X size={17}/></button></summary>
    <div className="admin-screenshot-fields"><label>Nama screenshot<input aria-label={`Nama screenshot ${index+1}`} maxLength={80} value={node.label??`Screenshot ${index+1}`} onChange={event=>update(node.id,{label:event.target.value})}/></label>
     <MediaField value={node.asset} label={name} removeIcon disabled={node.locked} onChange={asset=>update(node.id,{asset})}/>
     <label>Perangkat<select aria-label={`Perangkat ${name}`} disabled={node.locked} value={node.frame} onChange={event=>device(node,event.target.value as MockupNode["frame"])}><option value="browser">Desktop</option><option value="phone">Mobile</option><option value="none">Tanpa frame</option></select></label>
     <label>Isi gambar<select aria-label={`Isi gambar ${name}`} disabled={node.locked} value={node.fit} onChange={event=>update(node.id,{fit:event.target.value as MockupNode["fit"]})}><option value="contain">Tampilkan seluruh gambar</option><option value="cover">Penuhi frame (crop)</option></select></label>
     {node.fit==="cover"&&<label>Posisi crop: {Math.round(node.cropY)}%<input type="range" min="0" max="100" disabled={node.locked} value={node.cropY} onChange={event=>update(node.id,{cropY:Number(event.target.value)})}/></label>}
     <label className="admin-checkbox"><input type="checkbox" checked={node.locked} onChange={event=>update(node.id,{locked:event.target.checked})}/>Kunci screenshot</label>
    </div>
   </details>;})}
   {!shots.length&&<p className="admin-help">Tambahkan screenshot untuk mulai menyusun mockup.</p>}
   <button type="button" className="admin-button secondary small" disabled={shots.length>=3} onClick={()=>onChange(addScreenshot)}><Plus size={15}/>Tambah screenshot</button>
  </section>
  <details open><summary>Overlay</summary>
   <label>Pola overlay<select aria-label="Pola overlay" value={design.overlay.preset} onChange={event=>{const preset=overlayPresets.find(item=>item.id===event.target.value)!;onChange(current=>({...current,overlay:{preset:preset.id,opacity:preset.opacity}}));}}>{overlayPresets.map(preset=><option value={preset.id} key={preset.id}>{preset.label}</option>)}</select></label>
   <label className="admin-overlay-opacity">Opasitas <output>{Math.round(design.overlay.opacity*100)}%</output><input aria-label="Opasitas overlay" type="range" min="0" max="30" step="1" disabled={design.overlay.preset==="none"} value={Math.round(design.overlay.opacity*100)} onChange={event=>onChange(current=>({...current,overlay:{...current.overlay,opacity:Number(event.target.value)/100}}))}/></label>
   <p className="admin-help">Pola berada di belakang teks dan screenshot. Opasitas awal dibuat halus agar isi tetap jelas.</p>
  </details>
 </fieldset></aside>;
}
