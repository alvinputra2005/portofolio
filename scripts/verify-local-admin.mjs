// Explicit local smoke test. Creates its own temporary entry/media, then removes only those IDs.
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import sharp from "sharp";
import {chromium} from "@playwright/test";
import nextEnv from "@next/env";
import {createClient} from "@supabase/supabase-js";
nextEnv.loadEnvConfig(process.cwd());
const origin=process.env.LOCAL_TEST_URL||"http://127.0.0.1:3000";
assert(["localhost","127.0.0.1"].includes(new URL(origin).hostname),"Only test a loopback dev server");
const publicClient=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function request(path,method="GET",body){const response=await fetch(`${origin}/api/alvin-ganteng${path}/`,{method,headers:{Origin:origin,...(body instanceof FormData?{}:{"Content-Type":"application/json"})},body:body?body instanceof FormData?body:JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw new Error(`${method} ${path}: ${response.status} ${data.error||"failed"}`);return data;}
let entryId,mediaId,browser;
try{
 const {entries}=await request("/entries");assert(entries.length>=32,"Initial migration should be complete");
 const title=`Local verification ${randomUUID()}`;
 const draft={id:{title,category:"Web",year:"2026",role:"Pemeriksaan lokal",description:"Entri sementara milik smoke test lokal.",logo:"",url:"",repository:"",photos:[],isPlaceholder:true},en:{}};
 const created=await request("/entries","POST",{kind:"project",draft});entryId=created.entry.id;
 let {data:published,error:pubError}=await publicClient.from("content_publications").select("id").eq("id",entryId);assert(!pubError);assert.equal(published.length,0);
 const png=await sharp({create:{width:64,height:40,channels:3,background:"#006aa5"}}).png().toBuffer();const form=new FormData();form.set("file",new File([png],"local-verification.png",{type:"image/png"}));const upload=await request("/media","POST",form);mediaId=upload.id;
 draft.id.photos=[upload.ref];const updated=await request(`/entries/${entryId}`,"PATCH",{draft,expected:created.entry.updated_at});
 await request(`/entries/${entryId}`,"POST",{action:"publish",expected:updated.entry.updated_at});
 assert((await(await fetch(origin)).text()).includes(title),"Public cache invalidates immediately after publication");
 ({data:published,error:pubError}=await publicClient.from("content_publications").select("id,payload").eq("id",entryId));assert(!pubError);assert.equal(published.length,1);
 const {data:visibleMedia,error:mediaError}=await publicClient.from("portfolio_media").select("public_path").eq("id",mediaId).single();assert(!mediaError);const mediaUrl=publicClient.storage.from("portfolio-public").getPublicUrl(visibleMedia.public_path).data.publicUrl;assert.equal((await fetch(mediaUrl)).status,200);
 draft.id.title="Private revision";const revision=await request(`/entries/${entryId}`,"PATCH",{draft,expected:updated.entry.updated_at});
 const{data:snapshot}=await publicClient.from("content_publications").select("payload").eq("id",entryId).single();assert.equal(snapshot.payload.id.title,title);
 assert((await(await fetch(origin)).text()).includes(title),"Draft does not replace cached publication");
 const {data:privateRows,error:privateError}=await publicClient.from("content_entries").select("id").eq("id",entryId);assert(privateError||privateRows.length===0);
 await request(`/entries/${entryId}`,"POST",{action:"unpublish",expected:revision.entry.updated_at});
 ({data:published}=await publicClient.from("content_publications").select("id").eq("id",entryId));assert.equal(published.length,0);
 assert(!(await(await fetch(origin)).text()).includes(title),"Public cache invalidates immediately after unpublish");
 console.log("PASS live Supabase: direct local CRUD, upload, publication, private revision isolation, anonymous draft denial, unpublish");
 await request(`/entries/${entryId}`,"DELETE");entryId=undefined;await request(`/media/${mediaId}`,"DELETE");mediaId=undefined;
 const blocked=await fetch(`${origin}/api/alvin-ganteng/entries/`,{headers:{"x-forwarded-for":"203.0.113.10"}});assert.equal(blocked.status,401);
 const crossOrigin=await fetch(`${origin}/api/alvin-ganteng/entries/`,{method:"POST",headers:{Origin:"https://example.com","Content-Type":"application/json"},body:"{}"});assert.equal(crossOrigin.status,403);
 browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto(`${origin}/alvin-ganteng/`,{waitUntil:"networkidle"});assert(!page.url().includes("/login"));await page.getByRole("heading",{name:"Ruang untuk karya berikutnya."}).waitFor();assert.equal(await page.getByRole("button",{name:"Keluar",exact:true}).count(),0);await mkdir("artifacts",{recursive:true});await page.screenshot({path:"artifacts/admin-local-live.png"});
 await page.goto(`${origin}/alvin-ganteng/login/`,{waitUntil:"networkidle"});assert(!page.url().includes("/login"));assert.deepEqual(errors,[]);
 console.log("PASS live browser: opens dashboard without login, login URL redirects, no logout button, forwarded external traffic and cross-origin writes rejected");
}finally{
 if(browser)await browser.close();
 if(entryId)await request(`/entries/${entryId}`,"DELETE");
 if(mediaId)await request(`/media/${mediaId}`,"DELETE");
}
