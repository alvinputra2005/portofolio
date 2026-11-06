import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite} from "@electric-sql/pglite";
import {initialPublications} from "../src/lib/cms/initial";
import {contentFromRows} from "../src/lib/cms/content";
import {payloadSchema,emptyPayload,localized,mediaIds} from "../src/lib/cms/model";
import {makeDesign,designSchema,applySuggestion,changeTemplate,normalizeDesign} from "../src/lib/mockup/model";
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
test("square mockups have exactly two stable slots and keep locked files through device changes",()=>{
 const design=makeDesign("phone","Judul","Deskripsi","",["/images/one.png","/images/two.png"]);design.nodes[5].label="Layar penting";design.nodes[5].locked=true;
 assert.equal(design.width,1200);assert.equal(design.height,1200);assert.equal(design.nodes.filter(node=>node.type==="screenshot").length,2);
 const desktop=changeTemplate(design,"browser");assert.deepEqual(desktop.nodes[5],design.nodes[5]);assert.equal(desktop.nodes[4].asset,"/images/one.png");assert.equal(desktop.nodes[4].frame,"browser");assert.doesNotThrow(()=>designSchema.parse(desktop));
 assert.throws(()=>designSchema.parse({...design,nodes:design.nodes.filter(node=>node.id!=="screen-1")}));assert.throws(()=>designSchema.parse({...design,nodes:[...design.nodes,{...design.nodes[4],id:"screen-2"}]}));
});
test("legacy portrait and classic designs migrate to square without losing source references",()=>{
 const current=makeDesign("browser","Nama aplikasi","Deskripsi","/images/logo.png",["/images/one.png","/images/two.png"]);
 const third={...current.nodes[4],id:"screen-2",asset:"/images/three.png"};
 for(const [width,height,presentation]of [[1600,1000,"classic"],[1200,1712,"showcase"]]){
  const old={...current,width,height,presentation,showcase:{...current.showcase,headline:"Legacy headline",tagline:"Legacy handwriting"},nodes:[...current.nodes,third]};
  const migrated=normalizeDesign(old);assert.equal(migrated.width,1200);assert.equal(migrated.height,1200);assert.equal(migrated.nodes.filter(node=>node.type==="screenshot").length,2);assert.deepEqual(migrated.archivedAssets,["/images/three.png"]);assert.equal(migrated.showcase.footer,"Deskripsi");assert(!("headline"in migrated.showcase));assert(!("tagline"in migrated.showcase));assert.doesNotThrow(()=>designSchema.parse(migrated));
 }
});
test("city photo remains subtle and user overlays and names survive AI revisions",()=>{
 const design=makeDesign("phone","Judul","Deskripsi","",["/images/one.png"]);assert.equal(design.cityPhoto.opacity,.1);assert.equal(design.cityPhoto.cropY,70);assert.equal(design.nodes[5].asset,"/images/one.png");
 design.overlay={preset:"city",opacity:.12};design.nodes[4].label="Dashboard";const proposal=structuredClone(design);proposal.cityPhoto.opacity=.2;proposal.overlay={preset:"dots",opacity:.3};proposal.nodes[4].label="AI rename";proposal.showcase.footer="AI changed footer";
 const applied=applySuggestion(design,proposal);assert.deepEqual(applied.cityPhoto,design.cityPhoto);assert.deepEqual(applied.overlay,design.overlay);assert.deepEqual(applied.showcase,design.showcase);assert.equal(applied.nodes[4].label,"Dashboard");
 assert.throws(()=>designSchema.parse({...design,cityPhoto:{...design.cityPhoto,opacity:.21}}));assert.throws(()=>designSchema.parse({...design,overlay:{preset:"city",opacity:.31}}));assert.throws(()=>designSchema.parse({...design,showcase:{...design.showcase,prototypeUrl:"javascript:alert(1)"}}));
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
