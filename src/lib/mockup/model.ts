import { z } from "zod";
import {assetSchema} from "../cms/model";
const color=z.string().regex(/^#[\da-f]{6}$/i,"Warna harus berupa hex enam digit.");
export const nodeSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,60}$/),type:z.enum(["title","description","logo","screenshot","decoration"]),x:z.number().finite().min(-1600).max(3200),y:z.number().finite().min(-1000).max(2000),width:z.number().finite().min(10).max(3200),height:z.number().finite().min(10).max(2000),rotation:z.number().finite().min(-180).max(180),locked:z.boolean(),text:z.string().max(3000),fontSize:z.number().min(10).max(180),color,asset:assetSchema,frame:z.enum(["none","browser","phone"]),fit:z.enum(["contain","cover"]),cropY:z.number().min(0).max(100)}).strict();
export const designSchema=z.object({version:z.literal(1),width:z.literal(1600),height:z.literal(1000),layout:z.enum(["browser","phone","combined"]),background:color,accent:color,nodes:z.array(nodeSchema).min(2).max(12)}).strict().superRefine((d,ctx)=>{if(new Set(d.nodes.map(n=>n.id)).size!==d.nodes.length)ctx.addIssue({code:"custom",message:"ID elemen harus unik."});if(d.nodes.filter(n=>n.type==="screenshot").length>3)ctx.addIssue({code:"custom",message:"Maksimal 3 screenshot."});});
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
 return {version:1,width:1600,height:1000,layout,background:"#F5F8FC",accent,nodes};
}
export function applySuggestion(current:MockupDesign,suggestion:unknown):MockupDesign{
 const next=designSchema.parse(suggestion);
 if(current.nodes.length!==next.nodes.length||current.nodes.some(n=>!next.nodes.some(s=>s.id===n.id&&s.type===n.type)))throw new Error("AI mengubah daftar elemen.");
 return {...next,nodes:current.nodes.map(n=>{const candidate=next.nodes.find(s=>s.id===n.id)!;return n.locked?n:{...candidate,asset:n.asset,type:n.type,locked:n.locked};})};
}
