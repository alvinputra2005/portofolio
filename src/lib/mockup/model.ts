import {z} from "zod";
import {assetSchema} from "../cms/model";
const color=z.string().regex(/^#[\da-f]{6}$/i,"Warna harus berupa hex enam digit.");
const link=z.string().max(2000).refine(value=>!value||/^https?:\/\//i.test(value),"Gunakan tautan http/https.");
export const overlayPresets=[{id:"none",label:"Tanpa pola",opacity:0},{id:"city",label:"Garis kota",opacity:.12},{id:"grid",label:"Grid",opacity:.08},{id:"diagonal",label:"Garis diagonal",opacity:.07},{id:"dots",label:"Titik",opacity:.14}] as const;
const overlaySchema=z.object({preset:z.enum(["none","city","grid","diagonal","dots"]),opacity:z.number().finite().min(0).max(.3)}).strict();
export const showcaseDefaults={subtitle:"Digital Product Experience",footer:"",popups:false,prototypeUrl:"",caseStudyUrl:""};
const showcaseSchema=z.object({subtitle:z.string().max(100),footer:z.string().max(600),popups:z.boolean(),prototypeUrl:link,caseStudyUrl:link}).strict();
const cityPhotoSchema=z.object({enabled:z.boolean(),opacity:z.number().finite().min(0).max(.2),cropY:z.number().finite().min(0).max(100)}).strict();
export const nodeSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,60}$/),label:z.string().trim().max(80).optional(),type:z.enum(["title","description","logo","screenshot","decoration"]),x:z.number().finite().min(-1600).max(3200),y:z.number().finite().min(-1000).max(2000),width:z.number().finite().min(10).max(3200),height:z.number().finite().min(10).max(2000),rotation:z.number().finite().min(-180).max(180),locked:z.boolean(),text:z.string().max(3000),fontSize:z.number().min(10).max(180),color,asset:assetSchema,frame:z.enum(["none","browser","phone"]),fit:z.enum(["contain","cover"]),cropY:z.number().min(0).max(100)}).strict();
const common={version:z.literal(1),layout:z.enum(["browser","phone","combined"]),background:color,accent:color,overlay:overlaySchema.default({preset:"none",opacity:0}),cityPhoto:cityPhotoSchema.default({enabled:true,opacity:.1,cropY:70}),archivedAssets:z.array(assetSchema).max(12).default([]),nodes:z.array(nodeSchema).min(2).max(12)};
export const designSchema=z.object({...common,width:z.literal(1200),height:z.literal(1200),presentation:z.literal("showcase"),showcase:showcaseSchema.default(showcaseDefaults)}).strict().superRefine((design,ctx)=>{
 if(new Set(design.nodes.map(node=>node.id)).size!==design.nodes.length)ctx.addIssue({code:"custom",message:"ID elemen harus unik."});
 if(design.nodes.filter(node=>node.type==="screenshot").length!==2)ctx.addIssue({code:"custom",message:"Gunakan tepat dua slot mockup."});
});
export type MockupDesign=z.infer<typeof designSchema>;
export type MockupNode=z.infer<typeof nodeSchema>;
export function showcaseSlot(layout:MockupDesign["layout"],index:number){
 if(layout==="browser")return index===0?{x:175,y:590,width:730,height:440,rotation:-6,frame:"browser" as const}:{x:400,y:365,width:620,height:410,rotation:7,frame:"browser" as const};
 if(layout==="combined"&&index===0)return {x:155,y:585,width:720,height:440,rotation:-6,frame:"browser" as const};
 if(layout==="combined")return {x:760,y:320,width:320,height:588,rotation:7,frame:"phone" as const};
 return index===0?{x:205,y:360,width:370,height:680,rotation:-7,frame:"phone" as const}:{x:650,y:300,width:350,height:643,rotation:7,frame:"phone" as const};
}
export function makeDesign(layout:MockupDesign["layout"],title:string,description:string,logo:string,screens:string[],accent="#0074B5"):MockupDesign{
 const node=(id:string,type:MockupNode["type"],x:number,y:number,width:number,height:number,extra:Partial<MockupNode>={}):MockupNode=>({id,type,x,y,width,height,rotation:0,locked:false,text:"",fontSize:36,color:"#133347",asset:"",frame:"none",fit:"contain",cropY:50,...extra});
 const nodes=[node("accent","decoration",0,239,1200,255,{color:accent,locked:true}),node("logo","logo",54,64,68,68,{asset:logo}),node("title","title",136,58,850,70,{text:title||"Nama proyek",fontSize:title.length>28?38:48,color:"#FFFFFF"}),node("description","description",150,1060,900,120,{text:description.slice(0,600),fontSize:24,color:"#596774"})];
 for(let index=0;index<2;index++)nodes.push(node(`screen-${index}`,"screenshot",0,0,270,495,{asset:screens[index]||screens[0]||"",label:`Mockup ${index+1}`,...showcaseSlot(layout,index)}));
 return {version:1,width:1200,height:1200,presentation:"showcase",showcase:{...showcaseDefaults,footer:description.slice(0,600)},layout,background:"#FFFFFF",accent,overlay:{preset:"dots",opacity:.09},cityPhoto:{enabled:true,opacity:.1,cropY:70},archivedAssets:screens.slice(2),nodes};
}
// Read former portrait/classic JSON without exposing those templates in the editor.
// Additional source files stay referenced, even though the new layout has two slots.
const legacySchema=z.object({...common,width:z.union([z.literal(1200),z.literal(1600)]),height:z.union([z.literal(1000),z.literal(1200),z.literal(1712)]),presentation:z.enum(["classic","showcase"]).default("classic"),showcase:showcaseSchema.extend({headline:z.string().max(100).optional(),tagline:z.string().max(100).optional()}).default(showcaseDefaults)}).strict();
export function normalizeDesign(input:unknown):MockupDesign{
 const current=designSchema.safeParse(input);if(current.success){
  let index=0;
  return {...current.data,showcase:{...current.data.showcase,popups:false},nodes:current.data.nodes.map(node=>{
   if(node.type!=="screenshot")return node;
   const slot=index++,former=slot===0?{x:300,y:450,width:270,height:495,rotation:-7}:{x:570,y:310,width:250,height:500,rotation:7};
   const unchanged=!node.locked&&node.frame==="phone"&&(current.data.layout==="phone"||current.data.layout==="combined"&&slot===1)&&(Object.keys(former) as (keyof typeof former)[]).every(key=>node[key]===former[key]);
   return unchanged?{...node,...showcaseSlot(current.data.layout,slot)}:node;
  })};
 }
 const old=legacySchema.parse(input),shots=old.nodes.filter(node=>node.type==="screenshot"),title=old.nodes.find(node=>node.type==="title")?.text||"",description=old.showcase.footer||old.nodes.find(node=>node.type==="description")?.text||"",logo=old.nodes.find(node=>node.type==="logo")?.asset||"";
 const next=makeDesign(old.layout,title,description,logo,shots.map(node=>node.asset),old.accent);
 next.showcase={subtitle:old.showcase.subtitle,footer:description.slice(0,600),popups:false,prototypeUrl:old.showcase.prototypeUrl,caseStudyUrl:old.showcase.caseStudyUrl};next.overlay=old.overlay;next.cityPhoto=old.cityPhoto;
 next.archivedAssets=[...new Set([...old.archivedAssets,...shots.slice(2).map(node=>node.asset).filter(Boolean)])];
 next.nodes=next.nodes.map(node=>{if(node.type!=="screenshot")return node;const index=Number(node.id.slice(-1)),source=shots[index]||shots[0];return source?{...node,asset:source.asset,label:source.label?.replace(/^Screenshot/i,"Mockup")||node.label,locked:source.locked,fit:source.fit,cropY:source.cropY}:node;});
 return designSchema.parse(next);
}
export function changeTemplate(design:MockupDesign,layout:MockupDesign["layout"]):MockupDesign{
 const shots=design.nodes.filter(node=>node.type==="screenshot");
 return {...design,layout,nodes:design.nodes.map(node=>{const index=shots.findIndex(shot=>shot.id===node.id);return index<0||node.locked?node:{...node,...showcaseSlot(layout,index)};})};
}
export function applySuggestion(current:MockupDesign,suggestion:unknown):MockupDesign{
 const next=designSchema.parse(suggestion);
 if(current.nodes.length!==next.nodes.length||current.nodes.some(node=>!next.nodes.some(candidate=>candidate.id===node.id&&candidate.type===node.type)))throw new Error("AI mengubah daftar elemen.");
 return {...next,showcase:current.showcase,cityPhoto:current.cityPhoto,archivedAssets:current.archivedAssets,overlay:current.overlay,nodes:current.nodes.map(node=>{const candidate=next.nodes.find(item=>item.id===node.id)!;return node.locked?node:{...candidate,label:node.label,asset:node.asset,type:node.type,locked:node.locked};})};
}
