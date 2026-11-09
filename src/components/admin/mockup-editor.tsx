"use client";
import dynamic from "next/dynamic";
import {useCallback,useEffect,useRef,useState} from "react";
import type Konva from "konva";
import {makeDesign,designSchema,applySuggestion,normalizeDesign,type MockupDesign} from "@/lib/mockup/model";
import {mockupExportPixelRatio} from "@/lib/mockup/quality";
import {mediaIds,type ContentEntry} from "@/lib/cms/model";
import {api,assetUrl} from "./api";
import {MockupSettings} from "./mockup-settings";
import {imageAccent,useMockupAsset} from "./mockup-assets";
const Canvas=dynamic(()=>import("./mockup-canvas"),{ssr:false,loading:()=> <div className="admin-empty">Menyiapkan kanvas…</div>});
type Saved={id:string;project_id:string;design:MockupDesign;updated_at:string};
export function MockupEditor({project,aiAvailable,embedded=false,onAttach,onBusyChange,onDirtyChange}:{project:ContentEntry;aiAvailable:boolean;embedded?:boolean;onAttach?:(ref:string,slot:number)=>Promise<void>;onBusyChange?:(busy:boolean)=>void;onDirtyChange?:(dirty:boolean)=>void}){
 const initialScreens=(project.draft.id.photos as (string|null)[]||[]).filter(Boolean).slice(0,2) as string[];
 const[design,setDesign]=useState(()=>{const value=makeDesign("phone",String(project.draft.id.title||""),String(project.draft.id.description||""),String(project.draft.id.logo||""),initialScreens.length?initialScreens:[""],"#0074B5");value.showcase.subtitle=(project.draft.id.category?`${String(project.draft.id.category)} Application`:value.showcase.subtitle).slice(0,100);value.showcase.prototypeUrl=String(project.draft.id.url||"");return value;});
 const[loadingSaved,setLoadingSaved]=useState(true);
 const[selected,setSelected]=useState<string|null>(null),[saved,setSaved]=useState<Saved|null>(null),[prompt,setPrompt]=useState(""),[suggestion,setSuggestion]=useState<MockupDesign|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const stage=useRef<Konva.Stage|null>(null),current=useRef(design);current.current=design;
 const initialDesign=useRef(design);
 const logo=design.nodes.find(node=>node.type==="logo")?.asset||"";
 const logoImage=useMockupAsset(logo);
 useEffect(()=>{if(loadingSaved||saved||!logoImage||JSON.stringify(current.current)!==JSON.stringify(initialDesign.current))return;const accent=imageAccent(logoImage),next={...current.current,accent,nodes:current.current.nodes.map(node=>node.type==="decoration"?{...node,color:accent}:node)};initialDesign.current=next;setDesign(next);},[logoImage,loadingSaved,saved]);
 const ready=useCallback((value:Konva.Stage|null)=>{stage.current=value;},[]);
 useEffect(()=>{if(selected&&!design.nodes.some(node=>node.id===selected))setSelected(null);},[design.nodes,selected]);
 const dirty=JSON.stringify(design)!==JSON.stringify(saved?.design||initialDesign.current);
 useEffect(()=>{onBusyChange?.(busy);},[busy,onBusyChange]);
 useEffect(()=>{onDirtyChange?.(dirty);},[dirty,onDirtyChange]);
 useEffect(()=>()=>{onBusyChange?.(false);onDirtyChange?.(false);},[onBusyChange,onDirtyChange]);
 function openSaved(value:Saved){const parsed=normalizeDesign(value.design);setSaved({...value,design:parsed});setDesign(parsed);setSuggestion(null);setSelected(null);}
 useEffect(()=>{let active=true;api<{designs:Saved[]}>(`/mockups?project=${encodeURIComponent(project.id)}`).then(r=>{if(active){if(r.designs[0])openSaved(r.designs[0]);}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoadingSaved(false);});return()=>{active=false;};},[project.id]);
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>e.preventDefault();window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);},[dirty]);
 async function save(){setError("");const value=designSchema.parse(design);const r=await api<{design:Saved}>("/mockups",{method:"POST",body:JSON.stringify({...(saved?{id:saved.id,expected:saved.updated_at}:{}),projectId:project.id,design:value})});setSaved(r.design);return r.design;}
 async function perform(fn:()=>Promise<unknown>){setBusy(true);setError("");setNotice("");try{await fn();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function ai(){const snapshot=design;const r=await api<{design:MockupDesign}>("/mockups/suggest",{method:"POST",body:JSON.stringify({prompt,design:snapshot})});if(JSON.stringify(current.current)!==JSON.stringify(snapshot))throw new Error("Desain berubah saat AI bekerja. Minta usulan baru agar revisi manualmu tetap aman.");setSuggestion(applySuggestion(snapshot,r.design));setNotice("Usulan siap. Lihat preview sebelum menerapkannya.");}
 async function exportPng(){if(!stage.current)throw new Error("Kanvas belum siap.");if(suggestion)throw new Error("Terapkan atau batalkan usulan AI sebelum ekspor.");const shots=design.nodes.filter(n=>n.type==="screenshot");if(shots.length!==2||shots.some(n=>!n.asset))throw new Error("Pilih gambar untuk kedua mockup dari pustaka.");await document.fonts.ready;
  const ids=mediaIds(design);await Promise.all(ids.map(id=>new Promise<void>((resolve,reject)=>{const image=new Image();image.crossOrigin="anonymous";image.onload=()=>resolve();image.onerror=()=>reject(new Error("Ada gambar yang belum termuat. Coba kembali setelah preview lengkap."));image.src=assetUrl(`media:${id}`);})));
  const canvas=stage.current;
  for(let attempt=0;attempt<50;attempt++){const ready=design.nodes.filter(n=>n.asset).every(n=>Boolean(((canvas.findOne(`#${n.id}`) as Konva.Group|undefined)?.findOne("Image") as Konva.Image|undefined)?.image()));const rendered=canvas.find((node:Konva.Node)=>node.getAttr("deviceRenderReady")===false||node.getAttr("qrReady")===false||node.getAttr("cityPhotoReady")===false).length===0;if(ready&&rendered)break;if(attempt===49)throw new Error("Preview gambar belum selesai dimuat.");await new Promise(resolve=>setTimeout(resolve,100));}
  const transform=canvas.find("Transformer");const emptyLogos=design.nodes.filter(n=>n.type==="logo"&&!n.asset).map(n=>canvas.findOne(`#${n.id}`)).filter(Boolean) as Konva.Node[];
  const previous={width:canvas.width(),height:canvas.height(),scaleX:canvas.scaleX(),scaleY:canvas.scaleY()};
  [...transform,...emptyLogos].forEach(node=>node.hide());
  let blob:Blob;
  try{canvas.size({width:design.width,height:design.height});canvas.scale({x:1,y:1});canvas.draw();blob=await canvas.toBlob({width:design.width,height:design.height,pixelRatio:mockupExportPixelRatio,mimeType:"image/png",imageSmoothingEnabled:true});}
  finally{canvas.size({width:previous.width,height:previous.height});canvas.scale({x:previous.scaleX,y:previous.scaleY});[...transform,...emptyLogos].forEach(node=>node.show());canvas.draw();}
  return {blob};}
 async function attach(){const slot=0;await save();const{blob}=await exportPng();const file=new File([blob],"cover-mockup.png",{type:"image/png"});const form=new FormData();form.set("file",file);const uploaded=await api<{ref:string}>("/media",{method:"POST",body:form});if(onAttach){await onAttach(uploaded.ref,slot);setNotice("Mockup disimpan ke galeri draft. Kembali ke data proyek untuk mempublikasikan proyek.");return;}const{entries}=await api<{entries:ContentEntry[]}>("/entries?kind=project");const fresh=entries.find(e=>e.id===project.id);if(!fresh)throw new Error("Proyek tidak ditemukan.");const photos=Array.from({length:4},(_,i)=>(fresh.draft.id.photos as (string|null)[])[i]||null);photos[slot]=uploaded.ref;await api(`/entries/${project.id}`,{method:"PATCH",body:JSON.stringify({draft:{...fresh.draft,id:{...fresh.draft.id,photos}},expected:fresh.updated_at})});setNotice("Mockup disimpan ke galeri draft. Publikasikan proyek saat sudah siap.");}
 return <><header className={embedded?"admin-mockup-heading":"admin-page-heading"}>{embedded?<h2>Editor mockup</h2>:<h1>Editor mockup</h1>}</header>
 {error&&<p className="admin-error" role="alert">{error}</p>}{notice&&<p className="admin-success" role="status">{notice}</p>}
 <div className="admin-mockup-workspace"><section className="admin-mockup-stage"><Canvas design={suggestion||design} onChange={d=>{if(!suggestion&&!loadingSaved)setDesign(d);}} selected={suggestion?null:selected} onSelect={suggestion?()=>{}:setSelected} onReady={ready}/>{suggestion&&<div className="admin-ai-review"><strong>Preview usulan AI</strong><button className="admin-button" onClick={()=>{setDesign(applySuggestion(design,suggestion));setSuggestion(null);}}>Terapkan</button><button className="admin-button secondary" onClick={()=>setSuggestion(null)}>Batal</button></div>}<p className="admin-help">Klik elemen pada kanvas untuk menggeser atau mengubah ukurannya. Unggah foto atau pilih dari galeri melalui Mockup 1 dan Mockup 2. Atur perangkat melalui Jenis tampilan.</p>
 <div className="admin-ai-panel"><h2>Bantu susun dengan Gemini</h2><p>Contoh: “Buat perangkat lebih dominan, judul di kiri, dan dekorasi sederhana.”</p><textarea aria-label="Arahan Gemini" maxLength={3000} rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Apa yang ingin kamu ubah?"/><button className="admin-button" disabled={busy||loadingSaved||!aiAvailable||!prompt.trim()||Boolean(suggestion)} onClick={()=>perform(ai)}>{busy?"Memproses…":"Minta usulan"}</button>{!aiAvailable&&<small>Isi GEMINI_API_KEY dan restart server untuk mengaktifkan. Editor manual tetap berfungsi.</small>}</div></section>
 <MockupSettings design={design} onChange={setDesign} busy={busy||loadingSaved||Boolean(suggestion)}/></div>
 <div className="admin-form-actions admin-mockup-actions"><button type="button" className="admin-button publish" disabled={busy||loadingSaved||Boolean(suggestion)} onClick={()=>void perform(attach)}>{busy?"Memproses...":"Pasang ke proyek"}</button></div></>;
}
