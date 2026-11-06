// Integration fixture only: binds to loopback and uses no actual Supabase/Gemini credentials.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {mkdir,readFile} from "node:fs/promises";
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
  if(req.method==="POST"||req.method==="PUT"){blobs.set(raw,{bytes,mime:String(req.headers["content-type"]||"image/png")});return send({Key:raw});}
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
 await mkdir("artifacts",{recursive:true});browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});
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
 const uploaded=await page.evaluate(async()=>{const canvas=document.createElement("canvas");canvas.width=800;canvas.height=500;const ctx=canvas.getContext("2d")!;ctx.fillStyle="#1267c8";ctx.fillRect(0,0,800,500);ctx.fillStyle="#fff";ctx.font="42px sans-serif";ctx.fillText("SCREENSHOT ASLI",60,100);const blob=await new Promise<Blob>(r=>canvas.toBlob(v=>r(v!),"image/png"));const form=new FormData();form.set("file",new File([blob],"screenshot-uji.png",{type:"image/png"}));const response=await fetch("/api/alvin-ganteng/media",{method:"POST",body:form});return response.json();});assert(uploaded.ref);
 const badFile=await context.request.post(`${origin}/api/alvin-ganteng/media`,{headers:{Origin:origin},multipart:{file:{name:"bad.png",mimeType:"image/png",buffer:Buffer.from("not an image")}}});assert.equal(badFile.status(),400);
 const current=entries.find(e=>e.id===created.id)!;const payload=structuredClone(current.draft);payload.id.photos=[uploaded.ref];await context.request.patch(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{draft:payload,expected:current.updated_at}});
 await page.goto(`${origin}/alvin-ganteng/mockup/${created.id}`);await page.locator(".konvajs-content canvas").waitFor();await page.getByRole("button",{name:"Simpan desain",exact:true}).click();await page.getByRole("status").filter({hasText:"Desain tersimpan"}).waitFor();assert.equal(designs.length,1);
 const deleteInUse=await context.request.delete(`${origin}/api/alvin-ganteng/media/${uploaded.id}`,{headers:{Origin:origin}});assert.equal(deleteInUse.status(),409);
 const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Unduh PNG"}).click();const download=await downloadPromise;const path=await download.path();assert(path);const metadata=await sharp(await readFile(path)).metadata();assert.equal(metadata.width,1600);assert.equal(metadata.height,1000);
 await page.reload();await page.locator(".konvajs-content canvas").waitFor();await page.getByRole("button",{name:"Simpan desain",exact:true}).waitFor();assert.equal(designs.length,1);
 await page.waitForFunction(()=>{const canvas=document.querySelector(".konvajs-content canvas") as HTMLCanvasElement;const pixel=canvas.getContext("2d")!.getImageData(Math.floor(canvas.width*.7),Math.floor(canvas.height*.5),1,1).data;return pixel[0]===18&&pixel[1]===103&&pixel[2]===200;});
 await page.screenshot({path:"artifacts/admin-mockup.png"});
 page.once("dialog",d=>d.accept());await page.getByRole("button",{name:"Pasang ke proyek",exact:true}).click();await page.getByRole("status").filter({hasText:"galeri draft"}).waitFor();assert.notEqual((entries.find(e=>e.id===created.id)!.draft.id.photos as string[])[0],uploaded.ref);
 console.log("PASS simulated: upload validates bytes, referenced media protected, Konva saves/reopens, PNG 1600x1000 exports and attaches to draft");
 const unavailableAI=await context.request.post(`${origin}/api/alvin-ganteng/mockups/suggest`,{headers:{Origin:origin},data:{prompt:"Tata ulang",design:designs[0].design}});assert.equal(unavailableAI.status(),503);
 const conflict=await context.request.patch(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{draft:payload,expected:"2000-01-01T00:00:00Z"}});assert.equal(conflict.status(),409);
 const after=entries.find(e=>e.id===created.id)!;assert.equal((await context.request.post(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin},data:{action:"unpublish",expected:after.updated_at}})).status(),200);assert(!publications.some(p=>p.id===created.id));
 assert.equal((await context.request.delete(`${origin}/api/alvin-ganteng/entries/${created.id}`,{headers:{Origin:origin}})).status(),200);assert(!entries.some(e=>e.id===created.id));
 console.log("PASS simulated: missing Gemini key keeps design safe, stale updates rejected, unpublish and delete persist");
 await page.goto(`${origin}/alvin-ganteng/konten/experience`);await page.locator(".admin-content-list article").first().waitFor();
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
