import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
import {initialPublications} from "../src/lib/cms/initial";
import {contentFromRows} from "../src/lib/cms/content";
import {payloadSchema,emptyPayload,localized,mediaIds} from "../src/lib/cms/model";
import {makeDesign,designSchema,applySuggestion,addScreenshot,changeTemplate,changePresentation} from "../src/lib/mockup/model";
import {localAdminAllowed} from "../src/lib/admin/local-access";

test("direct local admin access is opt-in, loopback-only, and never enabled in production",()=>{
 const allowed={enabled:"true",nodeEnv:"development",host:"127.0.0.1:3000"};assert(localAdminAllowed(allowed));assert(localAdminAllowed({...allowed,host:"localhost:3000"}));assert(localAdminAllowed({...allowed,host:"[::1]:3000"}));
 for(const nodeEnv of ["production","test",undefined])assert(!localAdminAllowed({...allowed,nodeEnv}));
 for(const host of ["example.com","localhost.example.com","192.168.1.2:3000","example.com@localhost:3000",null])assert(!localAdminAllowed({...allowed,host}));
 assert(!localAdminAllowed({...allowed,enabled:"false"}));assert(!localAdminAllowed({...allowed,forwardedHost:"example.com"}));assert(!localAdminAllowed({...allowed,forwardedFor:"203.0.113.10"}));
});

test("seed preserves existing content, captions and crop, with schema-valid bilingual payloads",()=>{
 const rows=initialPublications();assert.equal(rows.length,32);rows.forEach(r=>assert.doesNotThrow(()=>payloadSchema(r.kind).parse(r.payload)));
 const id=contentFromRows(rows,"id"),en=contentFromRows(rows,"en");assert.equal(id.profile.name,"Alvin");assert.equal(id.experiences.length,3);assert.equal(id.experiences[2].cropY,72);assert(id.experiences[0].caption.length>0);assert.notEqual(id.experiences[0].caption,en.experiences[0].caption);assert.equal(id.techItems.length,16);
 const reordered=contentFromRows(rows.map(r=>r.id==="experience-03"?{...r,position:-1}:r),"id");assert.equal(reordered.experiences[0].cropY,72);assert.equal(reordered.experiences[0].photos[0],"/images/experience/asprak-alpro.jpeg");
});
test("empty database stays empty and English falls back by field",()=>{
 const empty=contentFromRows([],"id");assert.equal(empty.profilePresent,false);assert.equal(empty.profile.name,"");assert.equal(empty.experiences.length,0);assert.equal(empty.softwareProjects.length,0);assert.equal(empty.credentials.length,0);
 assert.deepEqual(localized({id:{title:"Judul",description:"Deskripsi"},en:{title:"",description:"English"}},"en"),{title:"Judul",description:"English"});
});
test("payload validation rejects unsafe links, malformed media and invalid crop",()=>{
 const p=emptyPayload("project");assert(!payloadSchema("project").safeParse(p).success);Object.assign(p.id,{title:"Proyek",year:"2026",role:"Developer",description:"Sistem"});assert(payloadSchema("project").safeParse(p).success);
 p.id.url="javascript:alert(1)";assert(!payloadSchema("project").safeParse(p).success);p.id.url="https://example.com";p.id.logo="https://evil.invalid/image.png";assert(!payloadSchema("project").safeParse(p).success);
 const e=initialPublications().find(r=>r.kind==="experience")!.payload;e.id.cropY=101;assert(!payloadSchema("experience").safeParse(e).success);
 assert.deepEqual(mediaIds({photos:["media:11111111-1111-4111-a111-111111111111","media:11111111-1111-4111-a111-111111111111"]}),["11111111-1111-4111-a111-111111111111"]);
});
test("AI suggestions preserve locked elements and original assets; invalid code-like output rejected",()=>{
 const design=makeDesign("browser","Waspadai","Deskripsi","media:11111111-1111-4111-a111-111111111111",["media:22222222-2222-4222-a222-222222222222"]);design.nodes[1].locked=true;
 const suggestion=structuredClone(design);suggestion.nodes[1].x=1200;suggestion.nodes[4].asset="/images/other.png";suggestion.nodes[2].fontSize=65;
 const applied=applySuggestion(design,suggestion);assert.deepEqual(applied.nodes[1],design.nodes[1]);assert.equal(applied.nodes[4].asset,design.nodes[4].asset);assert.equal(applied.nodes[2].fontSize,65);
 assert.throws(()=>designSchema.parse({...design,background:"url(javascript:bad)"}));assert.throws(()=>applySuggestion(design,{...design,nodes:design.nodes.slice(1)}));
});
test("mockup screenshots keep names, assets and stable IDs through removal, addition and template changes",()=>{
 const design=makeDesign("browser","Judul","Deskripsi","",["/images/one.png","/images/two.png","/images/three.png"]);
 design.nodes.find(node=>node.id==="screen-2")!.label="Layar penting";design.nodes.find(node=>node.id==="screen-2")!.locked=true;
 const removed={...design,nodes:design.nodes.filter(node=>node.id!=="screen-1")};const added=addScreenshot(removed);
 assert.equal(added.nodes.filter(node=>node.type==="screenshot").length,3);assert.equal(new Set(added.nodes.map(node=>node.id)).size,added.nodes.length);
 assert.equal(added.nodes.find(node=>node.id==="screen-2")!.asset,"/images/three.png");
 const mobile=changeTemplate(added,"phone");assert.deepEqual(mobile.nodes.find(node=>node.id==="screen-2"),design.nodes.find(node=>node.id==="screen-2"));assert.equal(mobile.nodes.find(node=>node.id==="screen-0")!.frame,"phone");assert.equal(mobile.nodes.find(node=>node.id==="screen-0")!.asset,"/images/one.png");
 assert.doesNotThrow(()=>designSchema.parse(mobile));
});
test("legacy designs receive an empty overlay; selected overlays and names survive AI suggestions and validation",()=>{
 const design=makeDesign("browser","Judul","Deskripsi","",["/images/one.png"]);const{overlay:unused,...legacy}=design;void unused;
 assert.deepEqual(designSchema.parse(legacy).overlay,{preset:"none",opacity:0});
 design.overlay={preset:"city",opacity:.12};design.nodes[4].label="Dashboard";const proposal=structuredClone(design);proposal.overlay={preset:"dots",opacity:.3};proposal.nodes[4].label="AI rename";
 const applied=applySuggestion(design,proposal);assert.deepEqual(applied.overlay,design.overlay);assert.equal(applied.nodes[4].label,"Dashboard");
 assert.throws(()=>designSchema.parse({...design,overlay:{preset:"city",opacity:.31}}));assert.throws(()=>designSchema.parse({...design,overlay:{preset:"javascript",opacity:.1}}));
});
test("portrait showcase uses fixed reference proportions and retains source files through template changes",()=>{
 const original=makeDesign("phone","Nama aplikasi","Deskripsi aplikasi","/images/logo.png",["/images/screen.png"],"#D78019","showcase");
 assert.equal(original.width,1200);assert.equal(original.height,1712);assert.equal(original.presentation,"showcase");assert.equal(original.nodes.filter(node=>node.type==="screenshot").length,1);assert.equal(original.nodes.find(node=>node.id==="accent")!.locked,true);assert.doesNotThrow(()=>designSchema.parse(original));
 const desktop=changeTemplate(original,"browser");assert.equal(desktop.nodes.find(node=>node.id==="screen-0")!.asset,"/images/screen.png");assert.deepEqual(desktop.showcase,original.showcase);
 const classic=changePresentation(original,"classic");assert.equal(classic.width,1600);assert.equal(classic.height,1000);assert.doesNotThrow(()=>designSchema.parse(classic));
 const next=structuredClone(original);next.showcase.headline="AI changed copy";assert.deepEqual(applySuggestion(original,next).showcase,original.showcase);
 assert.throws(()=>designSchema.parse({...original,height:1000}));assert.throws(()=>designSchema.parse({...original,showcase:{...original.showcase,prototypeUrl:"javascript:alert(1)"}}));
});
test("PostgreSQL policies isolate drafts, protect admin membership, and publish snapshots atomically",async()=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;grant all on storage.objects to authenticated;
 insert into auth.users values ('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb');`);
 const sql=await readFile(new URL("../supabase/migrations/001_portfolio.sql",import.meta.url),"utf8");await db.exec(sql);
 await db.exec(`insert into public.portfolio_admins(user_id) values('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa');insert into public.content_entries(id,kind,position,draft) values('test-project','project',0,'{"id":{"title":"Old"},"en":{}}');`);
 await db.exec("set role anon");assert.equal((await db.query<{ok:boolean}>("select public.is_portfolio_admin() ok")).rows[0].ok,false);
 await assert.rejects(()=>db.query("select * from public.content_entries"));assert.equal((await db.query("select * from public.content_publications")).rows.length,0);await assert.rejects(()=>db.query("insert into public.content_entries(id,kind,draft) values('bad','project','{}')"));
 await db.exec("reset role;set role authenticated;select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',false)");assert.equal((await db.query("select * from public.content_entries")).rows.length,0);await assert.rejects(()=>db.query("insert into public.portfolio_admins(user_id) values('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb')"));await assert.rejects(()=>db.query("insert into storage.objects(bucket_id,name) values('portfolio-media','bad')"));
 await db.exec("reset role;set role authenticated;select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false)");assert.equal((await db.query("select * from public.content_entries")).rows.length,1);
 let stamp=(await db.query<{stamp:string}>("select updated_at::text stamp from public.content_entries where id='test-project'")).rows[0].stamp;
 await db.query("select public.publish_portfolio_entry('test-project',$1::timestamptz)",[stamp]);
 await db.exec(`update public.content_entries set draft='{"id":{"title":"Draft new"},"en":{}}' where id='test-project'`);
 await db.exec("reset role;set role anon");const pub=await db.query<{payload:{id:{title:string}}}>("select payload from public.content_publications");assert.equal(pub.rows[0].payload.id.title,"Old");
 await db.exec("reset role;set role authenticated;select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false)");await assert.rejects(()=>db.query("select public.publish_portfolio_entry('test-project',$1::timestamptz)",[stamp]));stamp=(await db.query<{stamp:string}>("select updated_at::text stamp from public.content_entries")).rows[0].stamp;await db.query("select public.publish_portfolio_entry('test-project',$1::timestamptz)",[stamp]);
 await db.exec("reset role;set role anon");assert.equal((await db.query<{payload:{id:{title:string}}}>("select payload from public.content_publications")).rows[0].payload.id.title,"Draft new");
 await db.exec("reset role");await db.exec(sql);assert.equal((await db.query("select * from public.content_entries")).rows.length,1);
  await db.exec(`insert into public.content_entries(id,kind,position,draft) values('second','project',1,'{"id":{"title":"Second"},"en":{}}');insert into public.portfolio_media(id,name,mime,size,private_path) values('11111111-1111-4111-a111-111111111111','private.png','image/png',10,'private.png');`);
  await db.exec("set role anon");assert.equal((await db.query("select * from public.portfolio_media")).rows.length,0);await db.exec("reset role;set role authenticated;select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false)");
  await db.query("select public.reorder_portfolio_entries($1::text[],'project',false)",[["second","test-project"]]);assert.equal((await db.query<{id:string}>("select id from public.content_entries order by position")).rows[0].id,"second");
  await assert.rejects(()=>db.query("select public.reorder_portfolio_entries($1::text[],'project',true)",[["second","second"]]));
 await db.exec("set role authenticated;select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',false)");await db.query("delete from public.content_publications where id='test-project'");await db.exec("reset role;set role anon");assert.equal((await db.query("select * from public.content_publications")).rows.length,0);
 }finally{await db.close();}
});
