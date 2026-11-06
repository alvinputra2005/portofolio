import { z } from "zod";
import {assetSchema} from "../cms/model";
const color=z.string().regex(/^#[\da-f]{6}$/i,"Warna harus berupa hex enam digit.");
export const overlayPresets=[{id:"none",label:"Tanpa overlay",opacity:0},{id:"city",label:"Kota",opacity:.12},{id:"grid",label:"Grid",opacity:.08},{id:"diagonal",label:"Garis diagonal",opacity:.07},{id:"dots",label:"Titik",opacity:.14}] as const;
const overlaySchema=z.object({preset:z.enum(["none","city","grid","diagonal","dots"]),opacity:z.number().finite().min(0).max(.3)}).strict();
const link=z.string().max(2000).refine(value=>!value||/^https?:\/\//i.test(value),"Gunakan tautan http/https.");
const showcaseSchema=z.object({subtitle:z.string().max(100),headline:z.string().max(100),tagline:z.string().max(100),footer:z.string().max(600),popups:z.boolean(),prototypeUrl:link,caseStudyUrl:link}).strict();
export const showcaseDefaults={subtitle:"Digital Product Experience",headline:"See It. Snap It.",tagline:"Get Creative!",footer:"",popups:true,prototypeUrl:"",caseStudyUrl:""};
export const nodeSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,60}$/),label:z.string().trim().max(80).optional(),type:z.enum(["title","description","logo","screenshot","decoration"]),x:z.number().finite().min(-1600).max(3200),y:z.number().finite().min(-1000).max(2000),width:z.number().finite().min(10).max(3200),height:z.number().finite().min(10).max(2000),rotation:z.number().finite().min(-180).max(180),locked:z.boolean(),text:z.string().max(3000),fontSize:z.number().min(10).max(180),color,asset:assetSchema,frame:z.enum(["none","browser","phone"]),fit:z.enum(["contain","cover"]),cropY:z.number().min(0).max(100)}).strict();
export const designSchema=z.object({version:z.literal(1),width:z.union([z.literal(1600),z.literal(1200)]),height:z.union([z.literal(1000),z.literal(1712)]),presentation:z.enum(["classic","showcase"]).default("classic"),showcase:showcaseSchema.default(showcaseDefaults),layout:z.enum(["browser","phone","combined"]),background:color,accent:color,overlay:overlaySchema.default({preset:"none",opacity:0}),nodes:z.array(nodeSchema).min(2).max(12)}).strict().superRefine((d,ctx)=>{if(d.presentation==="showcase"?(d.width!==1200||d.height!==1712):(d.width!==1600||d.height!==1000))ctx.addIssue({code:"custom",message:"Ukuran kanvas tidak sesuai template."});if(new Set(d.nodes.map(n=>n.id)).size!==d.nodes.length)ctx.addIssue({code:"custom",message:"ID elemen harus unik."});if(d.nodes.filter(n=>n.type==="screenshot").length>3)ctx.addIssue({code:"custom",message:"Maksimal 3 screenshot."});});
export type MockupDesign=z.infer<typeof designSchema>;
export type MockupNode=z.infer<typeof nodeSchema>;
export function showcaseSlot(layout:MockupDesign["layout"],index:number){
 if(index===2)return {x:720,y:650,width:230,height:300,rotation:15,frame:"none" as const};
 if(layout==="browser")return index===0?{x:130,y:735,width:800,height:500,rotation:-6,frame:"browser" as const}:{x:380,y:510,width:690,height:450,rotation:8,frame:"browser" as const};
 if(layout==="combined"&&index===0)return {x:150,y:740,width:760,height:480,rotation:-6,frame:"browser" as const};
 return index===0?{x:275,y:650,width:330,height:600,rotation:-7,frame:"phone" as const}:{x:570,y:470,width:300,height:600,rotation:7,frame:"phone" as const};
}
export function makeDesign(layout:MockupDesign["layout"],title:string,description:string,logo:string,screens:string[],accent="#0074B5",presentation:MockupDesign["presentation"]="classic"):MockupDesign{
 const node=(id:string,type:MockupNode["type"],x:number,y:number,width:number,height:number,extra:Partial<MockupNode>={}):MockupNode=>({id,type,x,y,width,height,rotation:0,locked:false,text:"",fontSize:36,color:"#133347",asset:"",frame:"none",fit:"contain",cropY:50,...extra});
 const nodes=[node("accent","decoration",900,100,580,740,{color:accent,rotation:10}),node("logo","logo",90,80,180,100,{asset:logo}),node("title","title",90,320,620,260,{text:title||"Nama proyek",fontSize:76}),node("description","description",95,640,530,200,{text:description,fontSize:27,color:"#5C7282"})];
 if(presentation==="showcase"){
  Object.assign(nodes[0],{x:0,y:410,width:1200,height:440,rotation:0,locked:true});
  Object.assign(nodes[1],{x:54,y:64,width:68,height:68});Object.assign(nodes[2],{x:136,y:58,width:650,height:70,fontSize:title.length>24?36:48,color:"#FFFFFF"});Object.assign(nodes[3],{x:54,y:158,width:465,height:135,text:description.slice(0,210),fontSize:21,color:"#FFFFFF"});
 }
 screens.slice(0,3).forEach((asset,i)=>{
  if(presentation==="showcase"){nodes.push(node(`screen-${i}`,"screenshot",0,0,330,600,{asset,...showcaseSlot(layout,i)}));return;}
  if(layout==="browser")nodes.push(node(`screen-${i}`,"screenshot",740+i*30,245+i*55,760,490,{asset,frame:"browser",rotation:i?2:0}));
  else if(layout==="phone")nodes.push(node(`screen-${i}`,"screenshot",1000-i*150,100+i*65,350,760,{asset,frame:"phone",rotation:i?-7:5}));
  else nodes.push(node(`screen-${i}`,"screenshot",i===0?640:1100-(i-1)*210,i===0?220:350,i===0?800:280,i===0?520:590,{asset,frame:i===0?"browser":"phone",rotation:i===0?-3:5}));
 });
 return {version:1,width:presentation==="showcase"?1200:1600,height:presentation==="showcase"?1712:1000,presentation,showcase:{...showcaseDefaults,footer:description.slice(0,600)},layout,background:presentation==="showcase"?"#FFFFFF":"#F5F8FC",accent,overlay:presentation==="showcase"?{preset:"dots",opacity:.09}:{preset:"none",opacity:0},nodes};
}
export function applySuggestion(current:MockupDesign,suggestion:unknown):MockupDesign{
 const next=designSchema.parse(suggestion);
 if(current.nodes.length!==next.nodes.length||current.nodes.some(n=>!next.nodes.some(s=>s.id===n.id&&s.type===n.type)))throw new Error("AI mengubah daftar elemen.");
 return {...next,width:current.width,height:current.height,presentation:current.presentation,showcase:current.showcase,overlay:current.overlay,nodes:current.nodes.map(n=>{const candidate=next.nodes.find(s=>s.id===n.id)!;return n.locked?n:{...candidate,label:n.label,asset:n.asset,type:n.type,locked:n.locked};})};
}
export function changeTemplate(design:MockupDesign,layout:MockupDesign["layout"]):MockupDesign{
 const shots=design.nodes.filter(node=>node.type==="screenshot");
 const fresh=makeDesign(layout,"","","",shots.map(node=>node.asset),design.accent,design.presentation).nodes.filter(node=>node.type==="screenshot");
 return {...design,layout,nodes:design.nodes.map(node=>{const index=shots.findIndex(shot=>shot.id===node.id);return index<0||node.locked?node:{...fresh[index],id:node.id,label:node.label,fit:node.fit,cropY:node.cropY};})};
}
export function addScreenshot(design:MockupDesign):MockupDesign{
 const shots=design.nodes.filter(node=>node.type==="screenshot");if(shots.length>=3)return design;
 let number=0;while(design.nodes.some(node=>node.id===`screen-${number}`))number++;
 const fresh=makeDesign(design.layout,"","","",Array(shots.length+1).fill(""),design.accent,design.presentation).nodes.filter(node=>node.type==="screenshot").at(-1)!;
 return {...design,nodes:[...design.nodes,{...fresh,id:`screen-${number}`,label:`Screenshot ${number+1}`}]};
}
export function changePresentation(design:MockupDesign,presentation:MockupDesign["presentation"]):MockupDesign{
 const shots=design.nodes.filter(node=>node.type==="screenshot"),title=design.nodes.find(node=>node.type==="title")?.text||"",description=design.nodes.find(node=>node.type==="description")?.text||"",logo=design.nodes.find(node=>node.type==="logo")?.asset||"";
 const fresh=makeDesign(design.layout,title,description,logo,shots.map(node=>node.asset),design.accent,presentation);
 let index=0;return {...fresh,showcase:{...design.showcase,footer:design.showcase.footer||description.slice(0,600)},overlay:design.overlay,nodes:fresh.nodes.map(node=>{if(node.type!=="screenshot")return node;const old=shots[index++];return old.locked?old:{...node,id:old.id,label:old.label,asset:old.asset,fit:old.fit,cropY:old.cropY};})};
}
