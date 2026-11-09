// Integration fixture only: binds to loopback and uses no actual Supabase/Gemini credentials.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {setTimeout as delay} from "node:timers/promises";
import {chromium} from "@playwright/test";
import sharp from "sharp";
import {initialPublications} from "../src/lib/cms/initial";
import type {ContentEntry,Publication} from "../src/lib/cms/model";

const origin="http://127.0.0.1:3195",storage="http://127.0.0.1:4319";
const adminId="aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const visitorId="bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
const initial=initialPublications();
const entries:ContentEntry[]=initial.map(r=>({id:r.id,kind:r.kind,position:r.position,draft:structuredClone(r.payload),updated_at:new Date().toISOString()}));
const publications:Publication[]=structuredClone(initial);
const media:Record<string,unknown>[]=[];const designs:Record<string,unknown>[]=[];const blobs=new Map<string,{bytes:Buffer;mime:string}>();
let stamp=Date.now();const now=()=>new Date(++stamp).toISOString();
function token(email:string){const sub=email==="owner@example.test"?adminId:visitorId;return [Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url"),Buffer.from(JSON.stringify({sub,email,role:"authenticated",aud:"authenticated",exp:Math.floor(Date.now()/1000)+3600,iss:`${storage}/auth/v1`})).toString("base64url"),"fixture-signature"].join(".");}
function getEmail(auth:string){try{return JSON.parse(Buffer.from(auth.replace(/^Bearer /,"").split(".")[1],"base64url").toString()).email||"";}catch{return "";}}
const fixture=createServer(async(req,res)=>{try{
 const url=new URL(req.url!,storage),path=url.pathname;const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));const bytes=Buffer.concat(chunks);let body:Record<string,unknown>={};try{body=JSON.parse(bytes.toString()||"{}");}catch{}
 const email=getEmail(String(req.headers.authorization||"")),isAdmin=email==="owner@example.test";
 const send=(value:unknown,status=200)=>{res.writeHead(status,{"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Cache-Control":"no-store"});res.end(JSON.stringify(value));};
 if(path==="/auth/v1/token"){const e=String(body.email||"");if(body.password!=="test-password")return send({error:"invalid_grant",error_description:"Invalid credentials"},400);const sub=e==="owner@example.test"?adminId:visitorId;return send({access_token:token(e),refresh_token:"fixture-refresh",expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,token_type:"bearer",user:{id:sub,email:e,aud:"authenticated",role:"authenticated",app_metadata:{},user_metadata:{},created_at:now()}});}
 if(path==="/auth/v1/user")return email?send({id:isAdmin?adminId:visitorId,email,aud:"authenticated",role:"authenticated",app_metadata:{},user_metadata:{},created_at:now()}):send({message:"not authenticated"},401);
 if(path==="/auth/v1/logout"){res.writeHead(204);return res.end();}
 if(path==="/rest/v1/rpc/is_portfolio_admin")return send(isAdmin);
 if(path==="/rest/v1/rpc/publish_portfolio_entry"){if(!isAdmin)return send({},403);const e=entries.find(e=>e.id===body.target_id);if(!e||e.updated_at!==body.expected_updated_at)return send({message:"Conflict"},409);const old=publications.findIndex(p=>p.id===e.id);if(old>=0)publications.splice(old,1);publications.push({id:e.id,kind:e.kind,position:e.position,payload:structuredClone(e.draft),published_at:now()});return send(null);}
 if(path==="/rest/v1/rpc/reorder_portfolio_entries"){if(!isAdmin)return send({},403);(body.entry_ids as string[]).forEach((id,i)=>{const e=entries.find(e=>e.id===id);if(e){e.position=i;e.updated_at=now();}if(body.publish_order){const p=publications.find(p=>p.id===id);if(p)p.position=i;}});return send(null);}
 if(path.startsWith("/rest/v1/")){
  const table=path.split("/").pop();let rows:Record<string,unknown>[];
  if(table==="content_entries")rows=entries as unknown as Record<string,unknown>[];else if(table==="content_publications")rows=publications as unknown as Record<string,unknown>[];else if(table==="portfolio_media")rows=media;else if(table==="mockup_designs")rows=designs;else return send([],404);
  if(table!=="content_publications"&&!isAdmin)return send([],req.method==="GET"?200:403);
  const match=(r:Record<string,unknown>)=>[...url.searchParams].every(([key,val])=>["select","order","limit","offset"].includes(key)||val.startsWith("eq.")?(["select","order","limit","offset"].includes(key)||String(r[key])===val.slice(3)):val.startsWith("in.(")?val.slice(4,-1).split(",").includes(String(r[key])):true);
  let selected=rows.filter(match);
  if(req.method==="POST"){const row:Record<string,unknown>={...body,updated_at:now()};if(!row.id)row.id=crypto.randomUUID();rows.push(row);selected=[row];}
  if(req.method==="PATCH"){selected.forEach(r=>Object.assign(r,body,{updated_at:now()}));}
  if(req.method==="DELETE"){selected.forEach(r=>{rows.splice(rows.indexOf(r),1);if(table==="content_entries"){const n=publications.findIndex(p=>p.id===r.id);if(n>=0)publications.splice(n,1);}});}
  const order=url.searchParams.get("order");if(order){const[key,direction]=order.split(".");selected.sort((a,b)=>String(a[key]).localeCompare(String(b[key]))*(direction==="desc"?-1:1));}
  if(String(req.headers.accept||"").includes("vnd.pgrst.object"))return selected.length===1?send(selected[0]):send({code:"PGRST116",details:"The result contains 0 rows",message:"not found"},406);
  return send(selected);
 }
 if(path==="/storage/v1/object/sign/portfolio-media"&&req.method==="POST"&&Array.isArray(body.paths))return send(body.paths.map(p=>({path:p,signedURL:`/object/sign/portfolio-media/${p}?token=fixture`,error:null})));
 if(path.startsWith("/storage/v1/object/sign/")&&req.method==="POST")return send({signedURL:`/object/sign/${path.slice("/storage/v1/object/sign/".length)}?token=fixture`});
 if(path.startsWith("/storage/v1/object/")){
  const raw=path.slice("/storage/v1/object/".length).replace(/^(authenticated|public|sign)\//,"");
  if(req.method==="DELETE"){for(const prefix of body.prefixes as string[]||[])blobs.delete(`${raw}/${prefix}`);return send([]);}
  if(req.method==="POST"||req.method==="PUT"){
   let storedBytes=bytes,mime=String(req.headers["content-type"]||"image/png");
   if(mime.startsWith("multipart/form-data")){const form=await new Request(`${storage}${path}`,{method:"POST",headers:{"Content-Type":mime},body:new Uint8Array(bytes)}).formData();const file=[...form.values()].find(part=>typeof part!=="string");if(!file||typeof file==="string")return send({message:"missing file"},400);storedBytes=Buffer.from(await file.arrayBuffer());mime=file.type;}
   blobs.set(raw,{bytes:storedBytes,mime});return send({Key:raw});
  }
  const blob=blobs.get(raw);if(!blob)return send({message:"missing"},404);res.writeHead(200,{"Content-Type":blob.mime,"Access-Control-Allow-Origin":"*","Cache-Control":"no-store"});return res.end(blob.bytes);
 }
 return send({message:"fixture endpoint missing"},404);
 }catch{res.writeHead(500);res.end("fixture error");}
});

async function main(){
await new Promise<void>(resolve=>fixture.listen(4319,"127.0.0.1",resolve));
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3195"],{stdio:"ignore",windowsHide:true,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:storage,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_fixture_only",SUPABASE_SECRET_KEY:"fixture-secret-never-public",GEMINI_API_KEY:""}});
let browser;
try{
 for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}if(i===79)throw new Error("Next preview did not start");await delay(150);}
await mkdir("artifacts",{recursive:true});browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true,args:["--enable-unsafe-swiftshader"]});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce",acceptDownloads:true});const page=await context.newPage();const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 assert.equal((await context.request.get(`${origin}/api/alvin-ganteng/entries`)).status(),401);
 assert.equal((await context.request.post(`${origin}/api/alvin-ganteng/entries`,{data:{},headers:{Origin:"https://evil.example"}})).status(),403);
 await page.goto(`${origin}/alvin-ganteng`);await page.waitForURL(/\/login\/?$/);
 async function login(email:string){await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Password",{exact:true}).fill("test-password");await page.getByRole("button",{name:"Masuk ke studio"}).click();}
 await login("visitor@example.test");await page.locator(".admin-login-card .admin-error").waitFor();assert.match(await page.locator(".admin-login-card .admin-error").innerText(),/belum ditetapkan/);
 const slowRoute=(url:URL)=>url.pathname==="/alvin-ganteng/konten/experience/"&&url.searchParams.has("_rsc");
 let releaseNavigation!:()=>void;const heldNavigation=new Promise<void>(resolve=>{releaseNavigation=resolve;});
 await page.route(slowRoute,async route=>{await heldNavigation;await delay(850);await route.continue();});
 await login("owner@example.test");await page.waitForURL(/\/alvin-ganteng\/?$/);await page.getByRole("heading",{name:"Ruang untuk karya berikutnya."}).waitFor();await page.screenshot({path:"artifacts/admin-dashboard.png"});
 assert(!(await page.content()).includes("fixture-secret-never-public"));console.log("PASS simulated: anonymous rejected, cross-origin rejected, non-admin rejected, admin login + dashboard");
 // Hold the navigation response to prove feedback does not wait for Supabase/RSC.
 await page.evaluate(()=>{(window as unknown as {sidebar:Element|null;clickStarted:number}).sidebar=document.querySelector(".admin-sidebar");});
 const experienceLink=page.getByRole("navigation",{name:"Menu pengelolaan"}).getByRole("link",{name:"Pengalaman",exact:true});
 await experienceLink.hover();
 await page.evaluate(()=>{(window as unknown as {clickStarted:number}).clickStarted=performance.now();});
 await experienceLink.click();
 await page.locator('.admin-link-pending[data-pending=true],.admin-loading').first().waitFor({state:"visible",timeout:600});
 const feedbackMs=await page.evaluate(()=>performance.now()-(window as unknown as {clickStarted:number}).clickStarted);assert(feedbackMs<600);
 releaseNavigation();
 await page.getByRole("heading",{name:"Pengalaman",exact:true}).waitFor();
 assert(await page.evaluate(()=>(window as unknown as {sidebar:Element|null}).sidebar===document.querySelector(".admin-sidebar")));
 await page.unroute(slowRoute);console.log(`PASS simulated: click feedback ${Math.round(feedbackMs)}ms with 850ms network delay; sidebar DOM preserved`);
 await page.goto(`${origin}/alvin-ganteng/konten/project`);await page.getByRole("button",{name:"Tambah data"}).click();
 const idFields=page.locator(".admin-form-columns>section").first();await idFields.getByLabel("Nama aplikasi").fill("Proyek Uji Admin");await idFields.getByLabel("Tahun").fill("2026");await idFields.getByLabel("Peran").fill("Developer");await idFields.getByLabel("Deskripsi").fill("Draft privat proyek uji.");
 await page.getByRole("button",{name:"Publikasikan",exact:true}).click();await page.getByRole("status").filter({hasText:"dipublikasikan"}).waitFor();const created=entries.find(e=>e.draft.id.title==="Proyek Uji Admin")!;assert(created);
 let html=await(await context.request.get(origin)).text();assert(html.includes("Proyek Uji Admin"));
 assert.deepEqual(await page.locator(".admin-form-actions button").allTextContents(),["Publikasikan","Delete"]);assert.equal(await page.locator(".admin-form-actions a").count(),0);
 const revisionPayload=structuredClone(created.draft);revisionPayload.id.title="Revisi Rahasia";assert.equal((await context.request.patch(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{draft:revisionPayload,expected:created.updated_at}})).status(),200);html=await(await context.request.get(origin)).text();assert(html.includes("Proyek Uji Admin"));assert(!html.includes("Revisi Rahasia"));
 await page.screenshot({path:"artifacts/admin-project-form.png"});console.log("PASS simulated: one-click publish creates public content, only Publish/Delete actions, API draft revision leaves public snapshot unchanged");
 await page.reload();await page.locator(".admin-content-list article").filter({hasText:"Revisi Rahasia"}).getByRole("button",{name:"Edit",exact:true}).click();
 await idFields.getByLabel("Nama aplikasi").fill("Proyek Uji Admin Revisi");
 const writes:string[]=[];const trackWrite=(request:import("@playwright/test").Request)=>{if(request.url().includes("/api/alvin-ganteng/entries"))writes.push(`${request.method()} ${new URL(request.url()).pathname}`);};page.on("request",trackWrite);
 await page.getByRole("button",{name:"Publikasikan",exact:true}).click();await page.getByRole("status").filter({hasText:"dipublikasikan"}).waitFor();page.off("request",trackWrite);
 assert.deepEqual(writes,[`POST /api/alvin-ganteng/entries/${created.id}/`]);
 assert((await(await context.request.get(origin)).text()).includes("Proyek Uji Admin Revisi"));console.log("PASS simulated: existing form saves + publishes in one API call, without a second list fetch");
 await page.getByRole("navigation",{name:"Menu pengelolaan"}).getByRole("link",{name:"Pencapaian",exact:true}).click();await page.getByRole("heading",{name:"Pencapaian",exact:true}).waitFor();
 await page.getByRole("navigation",{name:"Menu pengelolaan"}).getByRole("link",{name:"Proyek",exact:true}).click();await page.locator(".admin-content-list article").filter({hasText:"Proyek Uji Admin Revisi"}).waitFor();console.log("PASS simulated: published revision remains fresh after navigating away and back through prefetched menus");
 const uploaded=await page.evaluate(async()=>{const canvas=document.createElement("canvas");canvas.width=1440;canvas.height=2880;const ctx=canvas.getContext("2d")!;ctx.fillStyle="#1267c8";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#fff";ctx.font="72px sans-serif";ctx.fillText("SCREENSHOT ASLI",100,220);ctx.font="36px sans-serif";for(let row=0;row<32;row++)ctx.fillText(`Detail layar ${row+1} · Kalender dan ruang`,100,400+row*64);const blob=await new Promise<Blob>(r=>canvas.toBlob(v=>r(v!),"image/png"));const form=new FormData();form.set("file",new File([blob],"screenshot-uji.png",{type:"image/png"}));const response=await fetch("/api/alvin-ganteng/media",{method:"POST",body:form});return response.json();});assert(uploaded.ref);
 const badFile=await context.request.post(`${origin}/api/alvin-ganteng/media`,{headers:{Origin:origin},multipart:{file:{name:"bad.png",mimeType:"image/png",buffer:Buffer.from("not an image")}}});assert.equal(badFile.status(),400);
 const thumbnail=await context.request.get(`${origin}/api/alvin-ganteng/media/${uploaded.id}/?thumbnail=1`);assert.equal(thumbnail.status(),200);assert.match(thumbnail.headers()["content-type"],/image\/webp/);const thumbnailSize=await sharp(await thumbnail.body()).metadata();assert(thumbnailSize.width!<=256&&thumbnailSize.height!<=180);
 const original=await context.request.get(`${origin}/api/alvin-ganteng/media/${uploaded.id}/`);assert.equal((await sharp(await original.body()).metadata()).width,1440);
 const current=entries.find(e=>e.id===created.id)!;const payload=structuredClone(current.draft);payload.id.photos=[uploaded.ref];await context.request.patch(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{draft:payload,expected:current.updated_at}});
 await page.goto(`${origin}/alvin-ganteng/konten/project`);await page.locator(".admin-content-list article").filter({hasText:"Proyek Uji Admin Revisi"}).getByRole("button",{name:"Edit",exact:true}).click();
 assert.equal(await page.getByRole("tablist",{name:"Editor proyek"}).count(),0);assert.equal(await page.locator(".admin-mockup-entry").count(),1);assert.equal(await page.locator(".admin-gallery-fields").count(),0);assert.equal(await page.locator(".admin-kicker").count(),0);
 const adminNavigation=page.getByRole("navigation",{name:"Menu pengelolaan"});assert.equal(await adminNavigation.getByRole("link",{name:"Ringkasan",exact:true}).count(),0);
 assert.deepEqual(await adminNavigation.locator('[aria-current="page"]').evaluate(element=>({background:getComputedStyle(element).backgroundColor,color:getComputedStyle(element).color})),{background:"rgb(0, 106, 165)",color:"rgb(255, 255, 255)"});
 assert.equal(await page.locator(".admin-sidebar .admin-brand").evaluate(element=>getComputedStyle(element).textAlign),"center");assert.equal(await page.getByText("Mode lokal · langsung masuk",{exact:true}).count(),0);
 await page.getByRole("button",{name:/Buka editor mockup/}).scrollIntoViewIfNeeded();await page.screenshot({path:"artifacts/admin-documentation-card.png"});
 await idFields.getByLabel("Deskripsi").fill("Catatan form yang belum dipublikasikan.");const formUrl=page.url();
 await page.getByRole("button",{name:/Buka editor mockup/}).click();await page.locator(".konvajs-content canvas").waitFor();assert.equal(page.url(),formUrl);
 for(const name of ["Simpan desain","Simpan salinan","Unduh PNG","Ambil warna logo","Tambah screenshot"]){assert.equal(await page.getByRole("button",{name,exact:true}).count(),0);}
 for(const label of ["Gaya template","Headline penutup","Tagline tulisan tangan","Slot galeri proyek"]){assert.equal(await page.getByLabel(label,{exact:true}).count(),0);}
 assert.equal(await page.locator(".admin-screenshot-card").count(),2);assert.equal(await page.locator('.admin-mockup-properties select[aria-label^="Isi gambar"]').count(),0);
 const properties=page.locator(".admin-mockup-properties");
 async function openSettings(name:string){const toggle=properties.getByRole("button",{name,exact:true});await toggle.waitFor({state:"visible"});await page.waitForFunction(()=>!document.querySelector<HTMLFieldSetElement>(".admin-mockup-controls")?.disabled);if(await toggle.getAttribute("aria-expanded")!=="true")await toggle.click();assert.equal(await properties.locator(".admin-settings-panel:visible").count(),1);assert.equal(await toggle.getAttribute("aria-expanded"),"true");}
 assert.equal(await properties.getByRole("button",{name:"Identitas proyek",exact:true}).getAttribute("aria-expanded"),"true");assert.equal(await properties.getByRole("button",{name:"Template mockup",exact:true}).getAttribute("aria-expanded"),"false");assert.equal(await properties.getByRole("button",{name:"Overlay",exact:true}).getAttribute("aria-expanded"),"false");
 await page.setViewportSize({width:1440,height:640});
 const scrollPanel=properties.locator(".admin-settings-panel:visible"),templateToggle=properties.getByRole("button",{name:"Template mockup",exact:true});
 await page.waitForFunction(()=>{const panel=document.querySelector(".admin-settings-panel:not([hidden])");return panel&&panel.scrollHeight>panel.clientHeight;});
 const templateBefore=await templateToggle.evaluate(element=>element.getBoundingClientRect().top-element.closest(".admin-mockup-properties")!.getBoundingClientRect().top);
 await scrollPanel.evaluate(element=>{element.scrollTop=element.scrollHeight;});
 const templateAfter=await templateToggle.evaluate(element=>element.getBoundingClientRect().top-element.closest(".admin-mockup-properties")!.getBoundingClientRect().top);assert.equal(templateAfter,templateBefore);
 assert.equal(await properties.evaluate(element=>getComputedStyle(element).overflowY),"visible");
 await page.screenshot({path:"artifacts/admin-independent-scroll.png"});await page.setViewportSize({width:1440,height:1000});
 await properties.getByLabel("Judul",{exact:true}).fill("Cover Persegi");await properties.getByLabel("Subjudul",{exact:true}).fill("Aplikasi Digital");await properties.getByLabel("Deskripsi",{exact:true}).fill("Deskripsi hanya di bawah kedua mockup.");
 await openSettings("Template mockup");assert.equal(await properties.getByLabel("Judul",{exact:true}).isVisible(),false);
 assert.equal(await properties.getByLabel("Tampilkan kartu pop-up",{exact:true}).count(),0);
 const firstScreen=page.locator('[data-screen-id="screen-0"]');assert.equal(await properties.getByLabel(/^Nama mockup/).count(),0);assert.equal(await properties.getByLabel(/^Perangkat /).count(),0);
 await firstScreen.getByRole("button",{name:"Hapus gambar Mockup 1",exact:true}).click();assert.equal(await page.locator(".admin-screenshot-card").count(),2);
 assert.equal(await firstScreen.getByRole("button").count(),1);assert.equal(await firstScreen.locator(".admin-upload:visible").count(),0);
 await firstScreen.getByRole("button",{name:"Pilih gambar Mockup 1",exact:true}).click();const firstPicker=page.getByRole("dialog",{name:"Pilih gambar Mockup 1",exact:true});await firstPicker.getByRole("button",{name:"Pilih screenshot-uji.png",exact:true}).click();await firstPicker.waitFor({state:"hidden"});
 const secondScreen=page.locator('[data-screen-id="screen-1"]');await secondScreen.locator("summary").click();
 const photo=await sharp({create:{width:1440,height:2880,channels:3,background:"#1267c8"}}).png().toBuffer();
 await secondScreen.getByRole("button",{name:/^(Pilih|Ganti) gambar Mockup 2$/}).click();const secondPicker=page.getByRole("dialog",{name:"Pilih gambar Mockup 2",exact:true});
 await secondPicker.getByLabel("Unggah Mockup 2",{exact:true}).setInputFiles({name:"foto-mockup-2.png",mimeType:"image/png",buffer:photo});
 await secondPicker.waitFor({state:"hidden"});await secondScreen.getByRole("img",{name:"Mockup 2",exact:true}).waitFor();
 await page.screenshot({path:"artifacts/admin-mockup-photo-import.png"});
 await page.getByRole("combobox",{name:"Template mockup",exact:true}).selectOption("browser");
 await page.waitForFunction(()=>document.querySelector('.admin-canvas-wrap [data-device-engine]')?.getAttribute("data-device-engine")==="three");
 const raster=(await page.locator('.admin-canvas-wrap [data-device-resolution]').getAttribute("data-device-resolution"))!.split("x").map(Number);assert(raster[0]>=3072);
 await page.getByRole("combobox",{name:"Template mockup",exact:true}).selectOption("phone");
 await page.getByText("Tautan QR (opsional)",{exact:true}).click();await page.getByLabel("QR Prototype",{exact:true}).fill("https://example.test/prototype");await page.getByLabel("QR Case study",{exact:true}).fill("https://example.test/case-study");
 await openSettings("Overlay");assert.equal(await firstScreen.isVisible(),false);assert.equal(await page.getByLabel("Opasitas foto kota",{exact:true}).inputValue(),"10");assert.equal(await page.getByLabel("Posisi foto kota",{exact:true}).inputValue(),"70");
 await openSettings("Identitas proyek");assert.equal(await properties.getByLabel("Judul",{exact:true}).inputValue(),"Cover Persegi");assert.equal(await page.getByLabel("Opasitas foto kota",{exact:true}).isVisible(),false);
 const overlayToggle=properties.getByRole("button",{name:"Overlay",exact:true});await overlayToggle.focus();await page.keyboard.press("Enter");assert.equal(await properties.locator(".admin-settings-panel:visible").count(),1);assert.equal(await properties.getByLabel("Judul",{exact:true}).isVisible(),false);await page.keyboard.press("Space");assert.equal(await properties.locator(".admin-settings-panel:visible").count(),0);await openSettings("Identitas proyek");
 console.log("PASS simulated: blue settings accordions open exclusively, support keyboard, and retain inputs when collapsed");
 await page.getByRole("button",{name:"Kembali ke data proyek",exact:true}).click();assert.equal(await idFields.getByLabel("Deskripsi").inputValue(),"Catatan form yang belum dipublikasikan.");
 await page.getByRole("button",{name:/Buka editor mockup/}).click();assert.equal(await properties.getByLabel("Deskripsi",{exact:true}).inputValue(),"Deskripsi hanya di bawah kedua mockup.");
 assert(await page.locator(".admin-mockup-actions").evaluate(element=>Boolean(document.querySelector(".admin-mockup-workspace")!.compareDocumentPosition(element)&Node.DOCUMENT_POSITION_FOLLOWING)));
 await page.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await page.getByRole("status").filter({hasText:"galeri draft"}).waitFor();assert.equal(designs.length,1);
 function coverBytes(projectId:string){const project=entries.find(entry=>entry.id===projectId)!;const ref=(project.draft.id.photos as string[])[0];const row=media.find(item=>item.id===ref.slice(6));assert(row);const file=blobs.get(`portfolio-media/${row.private_path}`);assert(file);return file.bytes;}
 const exported=coverBytes(created.id);const metadata=await sharp(exported).metadata();assert.equal(metadata.width,4800);assert.equal(metadata.height,4800);assert(exported.length<10*1024*1024);await writeFile("artifacts/mockup-high-resolution.png",exported);
 const region=(bytes:Buffer,left:number,top:number,width=1,height=1)=>sharp(bytes).extract({left:left*4,top:top*4,width:width*4,height:height*4});
 const configured=designs[0].design as {nodes:{type:string;label?:string;asset:string;width:number}[];showcase:{footer:string;headline?:string;tagline?:string;popups:boolean};cityPhoto:{opacity:number}};
 const importedPhoto=media.find(item=>item.name==="foto-mockup-2.png");assert(importedPhoto);assert.equal(configured.nodes.filter(node=>node.type==="screenshot")[1].asset,`media:${importedPhoto.id}`);
 assert.equal(configured.nodes.filter(node=>node.type==="screenshot").length,2);assert.equal(configured.showcase.footer,"Deskripsi hanya di bawah kedua mockup.");assert(!("headline"in configured.showcase));assert(!("tagline"in configured.showcase));assert.equal(configured.cityPhoto.opacity,.1);
 assert.equal(configured.showcase.popups,false);assert(configured.nodes.filter(node=>node.type==="screenshot").every(node=>node.width>=350));
 const attached=entries.find(entry=>entry.id===created.id)!;assert.equal(attached.draft.id.description,"Catatan form yang belum dipublikasikan.");assert.notEqual(publications.find(entry=>entry.id===created.id)!.payload.id.description,attached.draft.id.description);
 await page.waitForFunction(()=>document.querySelector('.admin-canvas-wrap [data-device-engine]')?.getAttribute("data-device-engine")==="vector");
 assert(await page.locator(".konvajs-content canvas").first().evaluate(element=>(element as HTMLCanvasElement).width/element.getBoundingClientRect().width>=2.99));
 const pixels=await sharp(exported).removeAlpha().raw().toBuffer();let blue=0;for(let i=0;i<pixels.length;i+=3)if(pixels[i]===18&&pixels[i+1]===103&&pixels[i+2]===200)blue++;assert(blue>1000);
 const qr=await region(exported,60,176,72,72).removeAlpha().raw().toBuffer();let black=0;for(let i=0;i<qr.length;i+=3)if(qr[i]<30&&qr[i+1]<30&&qr[i+2]<30)black++;assert(black>150);
 // The local city photo changes the coloured header, but not the white body or ribbon.
 await openSettings("Overlay");await page.getByLabel("Opasitas foto kota",{exact:true}).focus();await page.keyboard.press("Home");await page.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await page.getByRole("status").filter({hasText:"galeri draft"}).waitFor();const noPhoto=coverBytes(created.id);
 const photoA=await region(exported,1020,65,100,100).removeAlpha().raw().toBuffer(),photoB=await region(noPhoto,1020,65,100,100).removeAlpha().raw().toBuffer();let delta=0;for(let i=0;i<photoA.length;i++)delta+=Math.abs(photoA[i]-photoB[i]);assert(delta>1000,"City photo is visible in the coloured header");
 for(const[left,top]of [[80,900],[620,260]])assert.deepEqual(await region(exported,left,top).raw().toBuffer(),await region(noPhoto,left,top).raw().toBuffer(),"City photo stays outside white body and wave ribbon");
 await page.getByLabel("Opasitas foto kota",{exact:true}).focus();for(let i=0;i<10;i++)await page.keyboard.press("ArrowRight");
 await page.getByLabel("Pola overlay",{exact:true}).selectOption("grid");await page.getByLabel("Opasitas overlay",{exact:true}).focus();await page.keyboard.press("End");await page.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await page.getByRole("status").filter({hasText:"galeri draft"}).waitFor();const grid=coverBytes(created.id);
 for(const[left,top]of [[1150,80],[620,260]])assert.deepEqual(await region(exported,left,top).raw().toBuffer(),await region(grid,left,top).raw().toBuffer(),"White pattern does not alter coloured graphics");
 const whiteA=await region(exported,80,900).raw().toBuffer(),whiteB=await region(grid,80,900).raw().toBuffer();assert(whiteB[0]<whiteA[0]-10);
 await page.getByLabel("Pola overlay",{exact:true}).selectOption("dots");await page.getByLabel("Opasitas overlay",{exact:true}).focus();for(let i=0;i<5;i++)await page.keyboard.press("ArrowLeft");await page.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await page.getByRole("status").filter({hasText:"galeri draft"}).waitFor();await writeFile("artifacts/mockup-square-export.png",coverBytes(created.id));await page.screenshot({path:"artifacts/admin-square-mockup.png"});
 await page.getByRole("button",{name:"Kembali ke data proyek",exact:true}).click();await page.getByRole("button",{name:"Publikasikan",exact:true}).click();await page.getByRole("status").filter({hasText:"dipublikasikan"}).waitFor();assert.equal(publications.find(entry=>entry.id===created.id)!.payload.id.description,"Catatan form yang belum dipublikasikan.");
 await page.goto(`${origin}/alvin-ganteng/mockup/${created.id}`);await openSettings("Template mockup");await firstScreen.getByRole("img",{name:"Mockup 1",exact:true}).waitFor();await secondScreen.locator("summary").click();await secondScreen.getByRole("img",{name:"Mockup 2",exact:true}).waitFor();await openSettings("Identitas proyek");assert.equal(await properties.getByLabel("Deskripsi",{exact:true}).inputValue(),"Deskripsi hanya di bawah kedua mockup.");await openSettings("Overlay");assert.equal(await page.getByLabel("Opasitas foto kota",{exact:true}).inputValue(),"10");assert.equal(await page.locator(".admin-screenshot-card").count(),2);
 const deleteInUse=await context.request.delete(`${origin}/api/alvin-ganteng/media/${uploaded.id}`,{headers:{Origin:origin}});assert.equal(deleteInUse.status(),409);
 console.log("PASS simulated: vector phone frames, native screenshot images, high-resolution desktop render, 4800px PNG below upload limit, import and reload");
 const fallbackContext=await browser.newContext({storageState:await context.storageState(),viewport:{width:1280,height:900}});await fallbackContext.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type==="webgl2")return null;return Reflect.apply(original,this,[type,...args]);} as typeof original;});
 const fallbackPage=await fallbackContext.newPage();const fallbackErrors:string[]=[];fallbackPage.on("pageerror",error=>fallbackErrors.push(error.message));await fallbackPage.goto(`${origin}/alvin-ganteng/mockup/${created.id}`);await fallbackPage.waitForFunction(()=>document.querySelector('.admin-canvas-wrap [data-device-engine]')?.getAttribute("data-device-engine")==="vector");await fallbackPage.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await fallbackPage.getByRole("status").filter({hasText:"galeri draft"}).waitFor();assert.equal((await sharp(coverBytes(created.id)).metadata()).height,4800);assert.deepEqual(fallbackErrors,[]);await fallbackContext.close();console.log("PASS simulated: vector phone quality and high-resolution export also work without WebGL");
 const unavailableAI=await context.request.post(`${origin}/api/alvin-ganteng/mockups/suggest`,{headers:{Origin:origin},data:{prompt:"Tata ulang",design:designs[0].design}});assert.equal(unavailableAI.status(),503);
 const conflict=await context.request.patch(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{draft:payload,expected:"2000-01-01T00:00:00Z"}});assert.equal(conflict.status(),409);
 const after=entries.find(e=>e.id===created.id)!;assert.equal((await context.request.post(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{action:"unpublish",expected:after.updated_at}})).status(),200);assert(!publications.some(p=>p.id===created.id));
 assert.equal((await context.request.delete(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin}})).status(),200);assert(!entries.some(e=>e.id===created.id));
 console.log("PASS simulated: missing Gemini key keeps design safe, stale updates rejected, unpublish and delete persist");
 await page.goto(`${origin}/alvin-ganteng/konten/project`);await page.getByRole("button",{name:"Tambah data",exact:true}).click();
 await idFields.getByLabel("Nama aplikasi").fill("Proyek Draft Tab Baru");await idFields.getByLabel("Tahun").fill("2026");await idFields.getByLabel("Peran").fill("Designer");await idFields.getByLabel("Deskripsi").fill("Proyek baru dengan mockup sebelum publikasi.");
 await page.getByRole("button",{name:/Buka editor mockup/}).click();await page.locator(".konvajs-content canvas").waitFor();const tabDraft=entries.find(entry=>entry.draft.id.title==="Proyek Draft Tab Baru")!;assert(tabDraft);assert(!publications.some(entry=>entry.id===tabDraft.id));
 await page.getByLabel("Pembesaran preview",{exact:true}).selectOption("2");
 await page.waitForFunction(()=>{const canvas=document.querySelector<HTMLCanvasElement>(".konvajs-content canvas");return canvas&&canvas.style.width==="2400px"&&canvas.width>=7200;});
 await page.locator(".admin-canvas-wrap").evaluate(element=>{element.scrollLeft=340;element.scrollTop=600;});
 await page.locator(".admin-canvas-wrap").screenshot({path:"artifacts/admin-empty-phones-200-percent.png"});
 await page.getByLabel("Pembesaran preview",{exact:true}).selectOption("fit");await page.waitForFunction(()=>{const canvas=document.querySelector<HTMLCanvasElement>(".konvajs-content canvas");return canvas&&canvas.getBoundingClientRect().width<1200;});
 await page.locator(".admin-canvas-wrap").screenshot({path:"artifacts/admin-close-phone-layout.png"});
 await openSettings("Template mockup");const emptyFirst=page.locator('[data-screen-id="screen-0"]');await emptyFirst.getByRole("button",{name:"Pilih gambar Mockup 1",exact:true}).click();
 await page.setViewportSize({width:390,height:844});const mobilePicker=page.getByRole("dialog",{name:"Pilih gambar Mockup 1",exact:true});await mobilePicker.getByRole("button",{name:"Pilih screenshot-uji.png",exact:true}).waitFor();await mobilePicker.locator("img").evaluateAll(images=>Promise.all(images.map(element=>{const image=element as HTMLImageElement;image.loading="eager";return image.decode();})));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await mobilePicker.screenshot({path:"artifacts/admin-mockup-picker-mobile.png"});
 await page.keyboard.press("Escape");await mobilePicker.waitFor({state:"hidden"});await page.setViewportSize({width:1440,height:1000});
 await emptyFirst.getByRole("button",{name:"Pilih gambar Mockup 1",exact:true}).click();await page.getByRole("dialog",{name:"Pilih gambar Mockup 1",exact:true}).getByRole("button",{name:"Pilih screenshot-uji.png",exact:true}).click();await page.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await page.getByRole("status").filter({hasText:"galeri draft"}).waitFor();assert(designs.some(item=>item.project_id===tabDraft.id));assert(!publications.some(entry=>entry.id===tabDraft.id));
 await page.setViewportSize({width:390,height:844});await page.getByRole("button",{name:"Kembali ke data proyek",exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:"artifacts/admin-mockup-mobile.png"});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
 await page.getByRole("button",{name:"Kembali ke data proyek",exact:true}).focus();await page.keyboard.press("Enter");assert.equal(await page.getByRole("button",{name:/Buka editor mockup/}).isVisible(),true);assert.equal(await idFields.getByLabel("Nama aplikasi").inputValue(),"Proyek Draft Tab Baru");
 page.once("dialog",d=>d.accept());await page.getByRole("button",{name:"Delete",exact:true}).click();await page.getByRole("status").filter({hasText:"Konten dihapus"}).waitFor();await page.setViewportSize({width:1440,height:1000});
 console.log("PASS simulated: one documentation card opens mockups, form and design edits survive navigation, return supports keyboard and mobile");
 await page.goto(`${origin}/alvin-ganteng/konten/experience`);await page.locator(".admin-content-list article").first().waitFor();
 assert.equal(await page.getByRole("tablist",{name:"Editor proyek"}).count(),0);
 const rows=page.locator(".admin-content-list article"),firstTitle=await rows.first().locator("h2").innerText(),secondTitle=await rows.nth(1).locator("h2").innerText();
 async function dragRow(from:number,to:number,drop=true){
  const handle=rows.nth(from).getByRole("button",{name:/^Geser urutan /});await handle.scrollIntoViewIfNeeded();
  const start=await handle.boundingBox(),end=await rows.nth(to).getByRole("button",{name:/^Geser urutan /}).boundingBox();assert(start&&end);
  await page.mouse.move(start.x+start.width/2,start.y+start.height/2);await page.mouse.down();await page.mouse.move(start.x+start.width/2,start.y+start.height/2+8,{steps:3});
  await page.mouse.move(end.x+end.width/2,end.y+end.height/2+(to>from?12:-12),{steps:15});
  if(drop)await page.mouse.up();
 }
 assert.equal(await page.getByRole("button",{name:/^(Naikkan|Turunkan) /}).count(),0);
 const orderRoute="**/api/alvin-ganteng/order/**";
 await page.route(orderRoute,async route=>{await delay(700);await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Simulasi koneksi terputus."})});});
 await dragRow(0,1);
 await page.waitForFunction(title=>document.querySelector(".admin-content-list article h2")?.textContent===title,secondTitle,{timeout:450});
 await page.getByRole("alert").filter({hasText:"Simulasi koneksi"}).waitFor();assert.equal(await rows.first().locator("h2").innerText(),firstTitle);await page.unroute(orderRoute);
 // Keep the first save pending: further drags, editing and navigation must stay usable.
 const originalIds=entries.filter(e=>e.kind==="experience").sort((a,b)=>a.position-b.position).map(e=>e.id);
 const rapidWrites:{ids:string[];publish:boolean}[]=[];let releaseFirstSave!:()=>void;const firstSaveHeld=new Promise<void>(resolve=>{releaseFirstSave=resolve;});
 await page.route(orderRoute,async route=>{rapidWrites.push(route.request().postDataJSON());if(rapidWrites.length===1)await firstSaveHeld;await route.continue();});
 await dragRow(0,1);
 await page.waitForFunction(()=>document.querySelectorAll('.admin-drag-handle[aria-disabled="false"]').length===3,undefined,{timeout:450});
 assert(await page.getByRole("button",{name:"Tambah data",exact:true}).isEnabled());assert(await page.getByRole("textbox",{name:"Cari konten",exact:true}).isEnabled());
 await dragRow(1,2);await page.waitForFunction(()=>!document.querySelector(".admin-row-dragging"));
 await dragRow(0,1);await page.waitForFunction(()=>!document.querySelector(".admin-row-dragging"));
 const latestTitles=await rows.locator("h2").allTextContents();assert.equal(rapidWrites.length,1);
 await rows.first().getByRole("button",{name:"Edit",exact:true}).click();await page.getByRole("heading",{name:"Edit konten",exact:true}).waitFor();await page.getByRole("button",{name:"Tutup formulir",exact:true}).click();
 await page.getByRole("navigation",{name:"Menu pengelolaan"}).getByRole("link",{name:"Pencapaian",exact:true}).click();await page.getByRole("heading",{name:"Pencapaian",exact:true}).waitFor();
 await page.getByRole("navigation",{name:"Menu pengelolaan"}).getByRole("link",{name:"Pengalaman",exact:true}).click();await page.getByRole("heading",{name:"Pengalaman",exact:true}).waitFor();await page.waitForFunction(title=>document.querySelector(".admin-content-list article h2")?.textContent===title,latestTitles[0]);assert.deepEqual(await rows.locator("h2").allTextContents(),latestTitles);
 releaseFirstSave();await page.getByRole("status").filter({hasText:"Urutan draft disimpan"}).waitFor();assert.equal(rapidWrites.length,2);await page.unroute(orderRoute);
 await page.reload();await rows.first().waitFor();assert.deepEqual(await rows.locator("h2").allTextContents(),latestTitles);
 assert.equal((await context.request.post(`${origin}/api/alvin-ganteng/order/`,{headers:{Origin:origin},data:{kind:"experience",ids:originalIds,publish:false}})).status(),200);await page.reload();await rows.first().waitFor();assert.equal(await rows.first().locator("h2").innerText(),firstTitle);
 console.log("PASS simulated: three rapid drags while first save is held; controls + editing stay enabled, latest order survives navigation and reload, only two serialized writes");
 let orderWrites=0;const countOrders=(request:import("@playwright/test").Request)=>{if(new URL(request.url()).pathname==="/api/alvin-ganteng/order/"&&request.method()==="POST")orderWrites++;};page.on("request",countOrders);
 await dragRow(0,1,false);await page.keyboard.press("Escape");await page.mouse.up();await page.getByRole("status").filter({hasText:"Perubahan urutan dibatalkan"}).waitFor();assert.equal(await rows.first().locator("h2").innerText(),firstTitle);assert.equal(orderWrites,0);page.off("request",countOrders);
 await page.waitForFunction(()=>[...document.querySelectorAll(".admin-content-list article")].every(row=>{const transform=getComputedStyle(row).transform;return !row.classList.contains("admin-row-dragging")&&(transform==="none"||Math.abs(new DOMMatrix(transform).m42)<1);}));
 const deleteRoute="**/api/alvin-ganteng/entries/*/";const previousCount=await rows.count();
 await page.route(deleteRoute,async route=>{if(route.request().method()!=="DELETE")return route.continue();await delay(700);await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Simulasi hapus gagal."})});});
 page.once("dialog",d=>d.accept());await rows.first().getByRole("button",{name:/^Hapus /}).click();
 await page.waitForFunction(count=>document.querySelectorAll(".admin-content-list article").length===count,previousCount-1,{timeout:450});
 await page.getByRole("alert").filter({hasText:"Simulasi hapus gagal"}).waitFor();assert.equal(await rows.count(),previousCount);await page.unroute(deleteRoute);
 console.log("PASS simulated: optimistic reorder and delete respond before delayed server result; both restore on failure");
 await dragRow(0,1);await page.getByRole("status").filter({hasText:"Urutan draft disimpan"}).waitFor();
 await page.reload();await rows.first().waitFor();assert.equal(await rows.first().locator("h2").innerText(),secondTitle);
 const keyboardHandle=page.getByRole("button",{name:`Geser urutan ${secondTitle}`,exact:true});await keyboardHandle.focus();await page.keyboard.press("ArrowDown");await page.getByRole("status").filter({hasText:"Urutan draft disimpan"}).waitFor();assert(await keyboardHandle.evaluate(element=>document.activeElement===element));await page.reload();await rows.first().waitFor();assert.equal(await rows.first().locator("h2").innerText(),firstTitle);
 await page.getByRole("button",{name:"Terbitkan urutan",exact:true}).click();await page.getByRole("status").filter({hasText:"Urutan publik diperbarui"}).waitFor();
 assert.deepEqual(publications.filter(e=>e.kind==="experience").sort((a,b)=>a.position-b.position).map(e=>e.id),entries.filter(e=>e.kind==="experience").sort((a,b)=>a.position-b.position).map(e=>e.id));console.log("PASS simulated: mouse drag, Escape cancel without writes, keyboard reorder, publication and reload persistence");
 await page.setViewportSize({width:390,height:844});await page.reload();await rows.first().waitFor();await rows.first().evaluate(element=>element.scrollIntoView({block:"start"}));
 const touch=await context.newCDPSession(page);await touch.send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:1});
 const touchStart=await rows.first().getByRole("button",{name:/^Geser urutan /}).boundingBox(),touchEnd=await rows.nth(1).getByRole("button",{name:/^Geser urutan /}).boundingBox();assert(touchStart&&touchEnd);
 const tx=touchStart.x+touchStart.width/2,ty=touchStart.y+touchStart.height/2,targetY=touchEnd.y+touchEnd.height/2+12;
 await touch.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:tx,y:ty}]});
 for(let step=1;step<=18;step++){await touch.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:tx,y:ty+(targetY-ty)*step/18}]});await delay(16);}
 await touch.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await page.getByRole("status").filter({hasText:"Urutan draft disimpan"}).waitFor({timeout:5000});
 await page.reload();await rows.first().waitFor();assert.equal(await rows.first().locator("h2").innerText(),secondTitle);await page.screenshot({path:"artifacts/admin-drag-mobile.png"});await touch.detach();console.log("PASS simulated: touch drag saves and survives reload on a 390px screen");
 page.once("dialog",d=>d.accept());await rows.first().getByRole("button",{name:/^Hapus /}).click();await page.getByRole("status").filter({hasText:"Konten dihapus"}).waitFor();
 await page.reload();await rows.first().waitFor();assert.equal(await rows.count(),previousCount-1);console.log("PASS simulated: successful optimistic reorder and delete persist after reload");
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:"artifacts/admin-mobile.png"});
 await page.setViewportSize({width:1440,height:1000});
 for(const kind of ["project","achievement","credential"]){await page.goto(`${origin}/alvin-ganteng/konten/${kind}`);await rows.first().waitFor();assert.equal(await page.getByRole("button",{name:/^Geser urutan /}).count(),await rows.count());}
 await page.goto(`${origin}/alvin-ganteng/konten/project`);await rows.first().waitFor();const hiddenFirst=entries.filter(e=>e.kind==="project").sort((a,b)=>a.position-b.position)[0].id;
 await page.getByRole("textbox",{name:"Cari konten",exact:true}).fill("sistem");assert.equal(await rows.count(),2);await dragRow(0,1);await page.getByRole("status").filter({hasText:"Urutan draft disimpan"}).waitFor();
 assert.equal(entries.filter(e=>e.kind==="project").sort((a,b)=>a.position-b.position)[0].id,hiddenFirst);await page.reload();await rows.first().waitFor();await page.screenshot({path:"artifacts/admin-drag-projects.png"});
 await page.goto(`${origin}/alvin-ganteng/konten/profile`);await rows.first().waitFor();assert.equal(await page.getByRole("button",{name:/^Geser urutan /}).count(),0);assert.equal(await page.getByRole("button",{name:"Terbitkan urutan",exact:true}).count(),0);
 console.log("PASS simulated: handles across content menus, filtered reorder preserves hidden entries, profile has no drag controls");
 await context.request.delete(`${origin}/api/alvin-ganteng/auth`,{headers:{Origin:origin}});assert.equal((await context.request.get(`${origin}/api/alvin-ganteng/entries`)).status(),401);
 assert.deepEqual(errors,[]);console.log("PASS simulated: responsive admin, logout revokes session, no browser runtime errors. Hosted Supabase and live Gemini are not tested.");
}finally{if(browser)await browser.close();server.kill();await new Promise<void>(r=>fixture.close(()=>r()));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
