import { z } from "zod";
import {assetSchema} from "../cms/model";
const color=z.string().regex(/^#[\da-f]{6}$/i,"Warna harus berupa hex enam digit.");
export const overlayPresets=[{id:"none",label:"Tanpa overlay",opacity:0},{id:"city",label:"Kota",opacity:.12},{id:"grid",label:"Grid",opacity:.08},{id:"diagonal",label:"Garis diagonal",opacity:.07},{id:"dots",label:"Titik",opacity:.14}] as const;
const overlaySchema=z.object({preset:z.enum(["none","city","grid","diagonal","dots"]),opacity:z.number().finite().min(0).max(.3)}).strict();
export const nodeSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,60}$/),label:z.string().trim().max(80).optional(),type:z.enum(["title","description","logo","screenshot","decoration"]),x:z.number().finite().min(-1600).max(3200),y:z.number().finite().min(-1000).max(2000),width:z.number().finite().min(10).max(3200),height:z.number().finite().min(10).max(2000),rotation:z.number().finite().min(-180).max(180),locked:z.boolean(),text:z.string().max(3000),fontSize:z.number().min(10).max(180),color,asset:assetSchema,frame:z.enum(["none","browser","phone"]),fit:z.enum(["contain","cover"]),cropY:z.number().min(0).max(100)}).strict();
export const designSchema=z.object({version:z.literal(1),width:z.literal(1600),height:z.literal(1000),layout:z.enum(["browser","phone","combined"]),background:color,accent:color,overlay:overlaySchema.default({preset:"none",opacity:0}),nodes:z.array(nodeSchema).min(2).max(12)}).strict().superRefine((d,ctx)=>{if(new Set(d.nodes.map(n=>n.id)).size!==d.nodes.length)ctx.addIssue({code:"custom",message:"ID elemen harus unik."});if(d.nodes.filter(n=>n.type==="screenshot").length>3)ctx.addIssue({code:"custom",message:"Maksimal 3 screenshot."});});
export type MockupDesign=z.infer<typeof designSchema>;
export type MockupNode=z.infer<typeof nodeSchema>;
export function makeDesign(layout:MockupDesign["layout"],title:string,description:string,logo:string,screens:string[],accent="#0074B5"):MockupDesign{
 const node=(id:string,type:MockupNode["type"],x:number,y:number,width:number,height:number,extra:Partial<MockupNode>={}):MockupNode=>({id,type,x,y,width,height,rotation:0,locked:false,text:"",fontSize:36,color:"#133347",asset:"",frame:"none",fit:"contain",cropY:50,...extra});
 const nodes=[node("accent","decoration",900,100,580,740,{color:accent,rotation:10}),node("logo","logo",90,80,180,100,{asset:logo}),node("title","title",90,320,620,260,{text:title||"Nama proyek",fontSize:76}),node("description","description",95,640,530,200,{text:description,fontSize:27,color:"#5C7282"})];
 screens.slice(0,3).forEach((asset,i)=>{
  if(layout==="browser")nodes.push(node(`screen-${i}`,"screenshot",740+i*30,245+i*55,760,490,{asset,frame:"browser",rotation:i?2:0}));
  else if(layout==="phone")nodes.push(node(`screen-${i}`,"screenshot",1000-i*150,100+i*65,350,760,{asset,frame:"phone",rotation:i?-7:5}));
  else nodes.push(node(`screen-${i}`,"screenshot",i===0?640:1100-(i-1)*210,i===0?220:350,i===0?800:280,i===0?520:590,{asset,frame:i===0?"browser":"phone",rotation:i===0?-3:5}));
 });
 return {version:1,width:1600,height:1000,layout,background:"#F5F8FC",accent,overlay:{preset:"none",opacity:0},nodes};
}
export function applySuggestion(current:MockupDesign,suggestion:unknown):MockupDesign{
 const next=designSchema.parse(suggestion);
 if(current.nodes.length!==next.nodes.length||current.nodes.some(n=>!next.nodes.some(s=>s.id===n.id&&s.type===n.type)))throw new Error("AI mengubah daftar elemen.");
 return {...next,overlay:current.overlay,nodes:current.nodes.map(n=>{const candidate=next.nodes.find(s=>s.id===n.id)!;return n.locked?n:{...candidate,label:n.label,asset:n.asset,type:n.type,locked:n.locked};})};
}
export function changeTemplate(design:MockupDesign,layout:MockupDesign["layout"]):MockupDesign{
 const shots=design.nodes.filter(node=>node.type==="screenshot");
 const fresh=makeDesign(layout,"","","",shots.map(node=>node.asset),design.accent).nodes.filter(node=>node.type==="screenshot");
 return {...design,layout,nodes:design.nodes.map(node=>{const index=shots.findIndex(shot=>shot.id===node.id);return index<0||node.locked?node:{...fresh[index],id:node.id,label:node.label,fit:node.fit,cropY:node.cropY};})};
}
export function addScreenshot(design:MockupDesign):MockupDesign{
 const shots=design.nodes.filter(node=>node.type==="screenshot");if(shots.length>=3)return design;
 let number=0;while(design.nodes.some(node=>node.id===`screen-${number}`))number++;
 const fresh=makeDesign(design.layout,"","","",Array(shots.length+1).fill(""),design.accent).nodes.filter(node=>node.type==="screenshot").at(-1)!;
 return {...design,nodes:[...design.nodes,{...fresh,id:`screen-${number}`,label:`Screenshot ${number+1}`}]};
}
