"use client";
import {useEffect,useId,useRef,useState,type FormEvent} from "react";
import {Reorder} from "motion/react";
import dynamic from "next/dynamic";
import {useRouter} from "next/navigation";
import {Plus,Search,Trash2} from "lucide-react";
import {definitions,emptyPayload,entryTitle,type ContentKind,type ContentEntry,type Payload,type Field} from "@/lib/cms/model";
import {api,assetUrl,renewMediaImage} from "./api";
import {MediaField} from "./media-field";
import {AdminMediaProvider} from "./media-urls";
import {SortableRow} from "./sortable-row";
import {browserOrderAutosave,type OrderAutosave,type OrderEntry} from "@/lib/admin/order-autosave";
import {ProjectEditorTabs,type ProjectTab} from "./project-editor-tabs";
const MockupEditor=dynamic(()=>import("./mockup-editor").then(module=>module.MockupEditor),{ssr:false,loading:()=> <div className="admin-empty" role="status">Menyiapkan editor mockup…</div>});

export function ContentManager({kind,initialEntries,initialMediaUrls={},aiAvailable=false}:{kind:ContentKind;initialEntries?:ContentEntry[];initialMediaUrls?:Record<string,string>;aiAvailable?:boolean}){
 const router=useRouter();
 const sortInstructions=useId(),dragSnapshot=useRef<ContentEntry[]|null>(null),dragOrder=useRef<string[]>([]);
 const[dragging,setDragging]=useState<string|null>(null);
 const orderQueue=useRef<OrderAutosave|null>(null),initialOrder=useRef(initialEntries||[]);
 const[orderSaving,setOrderSaving]=useState(false),[orderStatus,setOrderStatus]=useState("");
 const tabsId=useId(),formRef=useRef<HTMLFormElement>(null);
 const[editorTab,setEditorTab]=useState<ProjectTab>("data"),[mockupVisited,setMockupVisited]=useState(false),[mockupBusy,setMockupBusy]=useState(false),[mockupDirty,setMockupDirty]=useState(false);
 const[entries,setEntries]=useState<ContentEntry[]>(initialEntries||[]);const[mediaUrls,setMediaUrls]=useState(initialMediaUrls);const[selected,setSelected]=useState<ContentEntry|null>(null);const[draft,setDraft]=useState<Payload|null>(null);const[search,setSearch]=useState("");const[loading,setLoading]=useState(!initialEntries);const[busy,setBusy]=useState(false);const[error,setError]=useState("");const[notice,setNotice]=useState("");
 const displayUrl=(ref:string)=>mediaUrls[ref]||assetUrl(ref);
 const def=definitions[kind];const items=entries.filter(e=>e.kind===kind).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 const visibleItems=items.filter(e=>entryTitle(e).toLowerCase().includes(search.toLowerCase())),blocked=busy||Boolean(dragging);
 const dirty=Boolean(draft&&JSON.stringify(draft)!==JSON.stringify(selected?.draft))||mockupDirty;
 const editing=useRef({selected,draft});editing.current={selected,draft};
 useEffect(()=>{
  const initial=[...initialOrder.current].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
  const queue=browserOrderAutosave(kind,initial,(ids,publish)=>api<{entries:OrderEntry[]}>("/order",{method:"POST",body:JSON.stringify({kind,ids,publish}),keepalive:true}));orderQueue.current=queue;
  return queue.subscribe(state=>{
   setOrderSaving(state.pending);
   setOrderStatus(state.pending?"Menyinkronkan urutan…":state.error?"Urutan belum tersimpan.":state.completed?state.published?"Urutan publik diperbarui.":"Urutan draft disimpan.":"");
   if(state.error)setError(state.error);
   setEntries(current=>{
    const ids=dragSnapshot.current?dragOrder.current:state.order;
    const ranked=new Map(ids.map((id,position)=>[id,position]));
    return current.map((entry,index)=>{const saved=state.entries.find(e=>e.id===entry.id);return {...entry,position:ranked.get(entry.id)??ids.length+index,updated_at:saved&&saved.updated_at>entry.updated_at?saved.updated_at:entry.updated_at};});
   });
  });
 },[kind]);
 useEffect(()=>{if(initialEntries)return;let active=true;setLoading(true);api<{entries:ContentEntry[];mediaUrls:Record<string,string>}>(`/entries?kind=${kind}`).then(r=>{if(active){setEntries(r.entries);setMediaUrls(r.mediaUrls||{});}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[kind,initialEntries]);
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
 function edit(e:ContentEntry|null){if(dirty&&!confirm("Perubahan belum disimpan. Tinggalkan formulir?"))return;setEditorTab("data");setMockupVisited(false);setMockupDirty(false);setSelected(e);setDraft(structuredClone(e?.draft||emptyPayload(kind)));setError("");setNotice("");}
 function close(){if(dirty&&!confirm("Tutup tanpa menyimpan perubahan?"))return;setMockupVisited(false);setMockupDirty(false);setDraft(null);setSelected(null);}
 async function save(){if(!draft)throw new Error("Tidak ada konten.");await orderQueue.current?.flush();const r=await api<{entry:ContentEntry}>(selected?`/entries/${selected.id}`:"/entries",{method:selected?"PATCH":"POST",body:JSON.stringify(selected?{draft,expected:selected.updated_at}:{kind,draft})});setSelected({...r.entry,published_at:selected?.published_at});setDraft(r.entry.draft);return r.entry;}
 async function publish(){if(busy)return;setBusy(true);setError("");setNotice("");try{await orderQueue.current?.flush();const e=selected||await save();const reordered=orderQueue.current?.snapshot.entries.find(row=>row.id===e.id);const expected=reordered&&reordered.updated_at>e.updated_at?reordered.updated_at:e.updated_at;const{entry}=await api<{entry:ContentEntry}>(`/entries/${e.id}`,{method:"POST",body:JSON.stringify({action:"publish",expected,draft})});setEntries(current=>[...current.filter(x=>x.id!==entry.id),entry]);setSelected(entry);setDraft(entry.draft);setNotice("Versi terbaru sudah dipublikasikan.");router.refresh();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function remove(e:ContentEntry){
  if(busy||!confirm(`Hapus "${entryTitle(e)}" beserta versi publiknya? Media tetap disimpan di pustaka.`))return;
  const previous=entries,previousSelected=selected,previousDraft=draft;
  setBusy(true);setError("");setNotice("");setEntries(current=>current.filter(x=>x.id!==e.id));
  if(selected?.id===e.id){setSelected(null);setDraft(null);}
  try{await orderQueue.current?.flush();await api(`/entries/${e.id}`,{method:"DELETE"});setNotice("Konten dihapus.");router.refresh();}
  catch(error){setEntries(previous);setSelected(previousSelected);setDraft(previousDraft);setError((error as Error).message);}
  finally{setBusy(false);}
 }
 function reorder(ids:string[],publish=false){
  if(busy)return;
  const ordered=ids.map(id=>items.find(e=>e.id===id)!);
  setError("");setNotice("");setEntries(ordered.map((e,position)=>({...e,position})));
  orderQueue.current?.enqueue(ids,publish);
 }
 function startDrag(id:string){if(busy||dragSnapshot.current)return;dragSnapshot.current=entries;dragOrder.current=items.map(e=>e.id);setDragging(id);setNotice("");setError("");}
 function previewOrder(ids:string[]){if(!dragSnapshot.current)return;dragOrder.current=ids;setEntries(ids.map((id,position)=>({...items.find(e=>e.id===id)!,position})));}
 function cancelDrag(){const previous=dragSnapshot.current;dragSnapshot.current=null;setDragging(null);if(previous){const ids=orderQueue.current?.snapshot.order;setEntries(current=>previous.map(entry=>({...entry,position:ids?.includes(entry.id)?ids.indexOf(entry.id):entry.position,updated_at:current.find(row=>row.id===entry.id)?.updated_at||entry.updated_at})));setNotice("Perubahan urutan dibatalkan.");}}
 function finishDrag(){const previous=dragSnapshot.current;dragSnapshot.current=null;setDragging(null);if(!previous)return;const ids=dragOrder.current;const original=[...previous].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id)).map(e=>e.id);if(ids.some((id,index)=>id!==original[index]))reorder(ids);}
 function moveWithKeyboard(id:string,direction:number){const index=visibleItems.findIndex(e=>e.id===id),other=visibleItems[index+direction];if(!other)return;const ids=items.map(e=>e.id),from=ids.indexOf(id),to=ids.indexOf(other.id);[ids[from],ids[to]]=[ids[to],ids[from]];void reorder(ids);}
 function setField(key:string,value:unknown,locale:"id"|"en"){setDraft(d=>d?{...d,[locale]:{...d[locale],[key]:value}}:null);}
 function submit(e:FormEvent){e.preventDefault();void publish();}
 async function changeTab(tab:ProjectTab){
  if(busy||mockupBusy)return;
  if(tab==="mockup"&&!selected){
   if(!formRef.current?.reportValidity())return;
   setEditorTab(tab);setBusy(true);setError("");
   try{const entry=await save();setEntries(current=>[...current.filter(row=>row.id!==entry.id),entry]);setMockupVisited(true);setNotice("Proyek disiapkan sebagai draft. Belum tampil di publik.");}catch(error){setError((error as Error).message);setEditorTab("data");}finally{setBusy(false);}
   return;
  }
  setEditorTab(tab);if(tab==="mockup")setMockupVisited(true);
 }
 async function attachMockup(ref:string,slot:number){
  await orderQueue.current?.flush();const{selected:entry,draft:payload}=editing.current;
  if(!entry||!payload)throw new Error("Buka data proyek terlebih dahulu.");
  const photos=Array.from({length:4},(_,index)=>(payload.id.photos as (string|null)[])[index]||null);photos[slot]=ref;
  const next={...payload,id:{...payload.id,photos}};setDraft(next);
  const reordered=orderQueue.current?.snapshot.entries.find(row=>row.id===entry.id),expected=reordered&&reordered.updated_at>entry.updated_at?reordered.updated_at:entry.updated_at;
  const{entry:saved}=await api<{entry:ContentEntry}>(`/entries/${entry.id}`,{method:"PATCH",body:JSON.stringify({draft:next,expected})});
  const updated={...saved,published_at:entry.published_at};setSelected(updated);setEntries(current=>current.map(row=>row.id===saved.id?updated:row));setDraft(current=>current===next?saved.draft:current);
 }
 return <AdminMediaProvider urls={mediaUrls}><header className="admin-page-heading"><div className="admin-heading-row"><div><h1>{def.label}</h1><p>{def.singleton?"Perbarui identitas dan informasi portofoliomu.":"Kelola kontenmu, lalu publikasikan perubahan saat sudah siap."}</p></div>{(!def.singleton||!items.length)&&<button className="admin-button" disabled={blocked} onClick={()=>edit(null)}><Plus size={17}/>{def.singleton?"Isi data":"Tambah data"}</button>}</div></header>
 {error&&<p className="admin-error" role="alert">{error}</p>}{notice&&<p className="admin-success" role="status">{notice}</p>}
 {draft?<section className="admin-editor"><div className="admin-editor-top"><h2>{selected?"Edit konten":"Konten baru"}</h2><button className="admin-button secondary small" type="button" disabled={busy||mockupBusy} onClick={close}>Tutup formulir</button></div>
 {kind==="project"&&<ProjectEditorTabs id={tabsId} active={editorTab} onChange={tab=>void changeTab(tab)} disabled={busy||mockupBusy}/>}
 <div className="admin-editor-tabpanel" id={`${tabsId}-data-panel`} role={kind==="project"?"tabpanel":undefined} aria-labelledby={kind==="project"?`${tabsId}-data-tab`:undefined} hidden={editorTab!=="data"}>
 <form ref={formRef} onSubmit={submit} aria-busy={busy}>
 <div className="admin-form-columns"><section><h3>Bahasa Indonesia <small>utama</small></h3>{def.fields.map(field=><FieldInput key={field.key} field={field} value={draft.id[field.key]} onChange={v=>setField(field.key,v,"id")}/>)}</section>
 <section><h3>English <small>opsional</small></h3><p className="admin-help">Kosongkan untuk memakai isi bahasa Indonesia.</p>{def.fields.filter(f=>f.translate).map(field=><FieldInput key={field.key} field={{...field,required:false}} value={draft.en[field.key]} onChange={v=>setField(field.key,v,"en")}/>)}</section></div>
 {kind==="experience"&&Boolean(draft.id.photo)&&<div className="admin-crop-preview"><h3>Preview crop foto</h3><img src={displayUrl(String(draft.id.photo))} alt="Preview crop" style={{objectPosition:`center ${draft.id.cropY??50}%`}}/></div>}
 <div className="admin-form-actions"><button className="admin-button publish" disabled={busy||mockupBusy} type="submit">{busy?"Memproses…":"Publikasikan"}</button><button className="admin-button secondary danger" disabled={busy||mockupBusy||!selected||Boolean(def.singleton)} type="button" title={def.singleton?"Profil dan pengaturan hanya dapat diperbarui.":undefined} onClick={()=>{if(selected)void remove(selected);}}><Trash2 size={16}/>Delete</button></div>
 </form></div>
 {kind==="project"&&<div className="admin-editor-tabpanel" id={`${tabsId}-mockup-panel`} role="tabpanel" aria-labelledby={`${tabsId}-mockup-tab`} hidden={editorTab!=="mockup"}>{mockupVisited&&selected?<MockupEditor key={selected.id} project={{...selected,draft}} aiAvailable={aiAvailable} embedded onAttach={attachMockup} onBusyChange={setMockupBusy} onDirtyChange={setMockupDirty}/>:<div className="admin-empty" role="status">Menyiapkan proyek untuk mockup…</div>}</div>}
 </section>:<><div className="admin-list-toolbar"><label className="admin-search"><Search size={17}/><input placeholder="Cari konten…" aria-label="Cari konten" value={search} disabled={blocked} onChange={e=>setSearch(e.target.value)}/></label>{items.length>1&&!def.singleton&&<button className="admin-button secondary small" disabled={blocked} onClick={()=>reorder(items.map(e=>e.id),true)}>Terbitkan urutan</button>}</div>
 {loading?<div className="admin-empty">Memuat konten…</div>:!items.length?<div className="admin-empty"><h2>Halaman baru dimulai di sini.</h2><p>Tambahkan data pertama atau jalankan migrasi untuk mengambil konten lama.</p></div>:<><p id={sortInstructions} className="admin-sort-help">{!def.singleton&&"Geser pegangan tiga garis untuk mengatur urutan. Gunakan panah atas/bawah saat pegangan difokuskan."}</p>
 {!def.singleton&&<p className="admin-order-status" role="status" aria-live="polite" data-pending={orderSaving}>{orderStatus}</p>}
 <div className="admin-sr-only" role="status" aria-live="polite">{dragging&&`Memindahkan ${entryTitle(items.find(e=>e.id===dragging)!)}. Posisi ${items.findIndex(e=>e.id===dragging)+1} dari ${items.length}. Escape untuk membatalkan.`}</div>
 <Reorder.Group as="div" axis="y" values={items.map(e=>e.id)} onReorder={previewOrder} className="admin-content-list" aria-label={`Daftar ${def.label}`}>
 {visibleItems.map(e=>{const image=String(e.draft.id.photo||e.draft.id.logo||e.draft.id.heroPortrait||e.draft.id.icon||"");return <SortableRow key={e.id} id={e.id} title={entryTitle(e)} sortable={!def.singleton} disabled={busy||items.length<2||Boolean(dragging&&dragging!==e.id)} active={dragging===e.id} instructions={sortInstructions} onStart={()=>startDrag(e.id)} onEnd={finishDrag} onCancel={cancelDrag} onMove={direction=>moveWithKeyboard(e.id,direction)}>
 {image&&image!=="frontend"&&image!=="backend"&&image!=="aiml"&&<img className="admin-list-thumb" src={displayUrl(image)} loading="lazy" draggable={false} onError={event=>renewMediaImage(event.currentTarget,image)} alt=""/>}
 <div className="admin-list-info"><h2>{entryTitle(e)}</h2><span className={`admin-badge ${e.published_at?"published":""}`}>{e.published_at?new Date(e.updated_at)>new Date(e.published_at)?"Terbit · ada revisi draft":"Terbit":"Draft"}</span></div>
 <div className="admin-list-controls"><button className="admin-button secondary small" disabled={blocked} onClick={()=>edit(e)}>Edit</button>{!def.singleton&&<button className="danger" disabled={blocked} aria-label={`Hapus ${entryTitle(e)}`} onClick={()=>remove(e)}><Trash2 size={16}/></button>}</div>
 </SortableRow>;})}
 </Reorder.Group>{!visibleItems.length&&<div className="admin-empty">Tidak ada konten yang cocok dengan pencarian.</div>}</>}</>}
 </AdminMediaProvider>;
}

function FieldInput({field,value,onChange}:{field:Field;value:unknown;onChange:(value:unknown)=>void}){
 const label=<span>{field.label}{field.required&&<b className="admin-required"> *</b>}</span>;
 if(field.type==="boolean")return <label className="admin-checkbox"><input type="checkbox" checked={Boolean(value)} onChange={e=>onChange(e.target.checked)}/>{label}</label>;
 if(field.type==="image"||field.type==="pdf")return <div className="admin-field">{label}<MediaField label={field.label} pdf={field.type==="pdf"} value={String(value||"")} onChange={onChange}/></div>;
 if(field.type==="gallery"){const photos=(value||[]) as (string|null)[];return <div className="admin-field">{label}<div className="admin-gallery-fields">{[0,1,2,3].map(i=><div key={i}><small>Slot {i+1}</small><MediaField label={`foto slot ${i+1}`} value={photos[i]||""} onChange={v=>{const next=Array.from({length:4},(_,n)=>photos[n]||null);next[i]=v||null;onChange(next);}}/></div>)}</div></div>;}
 if(field.type==="socials"){const links=(value||[]) as {label:string;href:string;icon:string}[];return <div className="admin-field">{label}{links.map((link,i)=><div key={i} className="admin-repeat-row"><input aria-label="Nama sosial" value={link.label} placeholder="Nama" onChange={e=>onChange(links.map((l,n)=>n===i?{...l,label:e.target.value}:l))}/><select aria-label="Ikon sosial" value={link.icon} onChange={e=>onChange(links.map((l,n)=>n===i?{...l,icon:e.target.value}:l))}>{["whatsapp","instagram","email","github","linkedin"].map(v=><option key={v}>{v}</option>)}</select><input aria-label="Tautan sosial" placeholder="https://…" value={link.href||""} onChange={e=>onChange(links.map((l,n)=>n===i?{...l,href:e.target.value}:l))}/><button type="button" className="admin-text-button danger" onClick={()=>onChange(links.filter((_,n)=>n!==i))}>Hapus</button></div>)}<button type="button" className="admin-button secondary small" onClick={()=>onChange([...links,{label:"",icon:"github",href:""}])}>Tambah tautan</button></div>;}
 if(field.type==="skills"){const skills=(value||[]) as {name:string;icon:string;months:number}[];return <div className="admin-field">{label}{skills.map((s,i)=><div className="admin-repeat-row" key={i}><input aria-label="Nama teknologi" placeholder="Nama teknologi" value={s.name} onChange={e=>onChange(skills.map((v,n)=>n===i?{...v,name:e.target.value}:v))}/><label>Durasi bulan<input type="number" min="0" max="1200" value={s.months} onChange={e=>onChange(skills.map((v,n)=>n===i?{...v,months:Number(e.target.value)}:v))}/></label><MediaField label="ikon teknologi" value={s.icon} onChange={icon=>onChange(skills.map((v,n)=>n===i?{...v,icon}:v))}/><button type="button" className="admin-text-button danger" onClick={()=>onChange(skills.filter((_,n)=>n!==i))}>Hapus teknologi</button></div>)}<button type="button" className="admin-button secondary small" onClick={()=>onChange([...skills,{name:"",icon:"",months:0}])}>Tambah teknologi</button></div>;}
 if(field.type==="lines")return <label className="admin-field">{label}<textarea rows={5} required={field.required} value={Array.isArray(value)?value.join("\n"):""} onChange={e=>onChange(e.target.value.split("\n"))}/></label>;
 if(field.type==="textarea")return <label className="admin-field">{label}<textarea rows={5} required={field.required} value={String(value||"")} onChange={e=>onChange(e.target.value)}/></label>;
 if(field.type==="select")return <label className="admin-field">{label}<select value={String(value||field.options?.[0]||"")} onChange={e=>onChange(e.target.value)}>{field.options?.map(v=><option key={v}>{v}</option>)}</select></label>;
 return <label className="admin-field">{label}<input type={field.type==="number"?"number":"text"} min={field.type==="number"?0:undefined} max={field.key==="cropY"?100:undefined} step={field.type==="number"?"any":undefined} required={field.required} value={value==null?"":String(value)} onChange={e=>onChange(field.type==="number"?(e.target.value===""?null:Number(e.target.value)):e.target.value)}/></label>;
}
