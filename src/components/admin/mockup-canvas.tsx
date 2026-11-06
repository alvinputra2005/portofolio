"use client";
import {useEffect,useRef,useState} from "react";
import {Stage,Layer,Rect,Text,Group,Image as CanvasImage,Circle,Transformer} from "react-konva";
import type Konva from "konva";
import type {MockupDesign,MockupNode} from "@/lib/mockup/model";
import {ShowcaseBackground,ShowcaseCopy,ShowcasePopups} from "./showcase-graphics";
import {useMockupAsset,useDeviceImage} from "./mockup-assets";

export default function MockupCanvas({design,onChange,selected,onSelect,onReady}:{design:MockupDesign;onChange:(design:MockupDesign)=>void;selected:string|null;onSelect:(id:string|null)=>void;onReady:(stage:Konva.Stage|null)=>void}){
 const stage=useRef<Konva.Stage>(null),transformer=useRef<Konva.Transformer>(null),wrap=useRef<HTMLDivElement>(null);const[scale,setScale]=useState(.5);
 useEffect(()=>{onReady(stage.current);return()=>onReady(null);},[onReady]);
 useEffect(()=>{let active=true;Promise.all(['700 88px "Outfit Variable"','700 48px "Montserrat Variable"','400 26px "Poppins"'].map(font=>document.fonts.load(font))).then(()=>{if(!active)return;stage.current?.find("Text").forEach(node=>{const text=node as Konva.Text,font=text.fontFamily();text.fontFamily("Arial");text.fontFamily(font);});stage.current?.draw();});return()=>{active=false;};},[]);
 useEffect(()=>{const observer=new ResizeObserver(([entry])=>setScale(Math.min(1,entry.contentRect.width/design.width)));if(wrap.current)observer.observe(wrap.current);return()=>observer.disconnect();},[design.width]);
 useEffect(()=>{const node=stage.current?.findOne(`#${selected}`);const model=design.nodes.find(n=>n.id===selected);transformer.current?.nodes(node&&!model?.locked?[node]:[]);transformer.current?.getLayer()?.batchDraw();},[selected,design]);
 function update(id:string,change:Partial<MockupNode>){onChange({...design,nodes:design.nodes.map(n=>n.id===id?{...n,...change}:n)});}
 const showcase=true,shots=design.nodes.filter(node=>node.type==="screenshot"),nodes=showcase?[...design.nodes.filter(node=>node.type!=="screenshot"&&node.type!=="decoration"&&node.type!=="description"),...shots.slice(1),...shots.slice(0,1)]:design.nodes;
 return <div ref={wrap} className="admin-canvas-wrap" data-presentation={design.presentation}><Stage width={design.width*scale} height={design.height*scale} scaleX={scale} scaleY={scale} ref={stage} onMouseDown={e=>{if(e.target===e.target.getStage())onSelect(null);}} onTouchStart={e=>{if(e.target===e.target.getStage())onSelect(null);}}><Layer>
 <ShowcaseBackground design={design}/>
 {nodes.map(node=><Artwork key={node.id} node={node} showcase={showcase} select={()=>onSelect(node.id)} update={change=>update(node.id,change)}/>)}
 {showcase&&<><ShowcasePopups design={design}/><ShowcaseCopy design={design}/></>}
 <Transformer ref={transformer} keepRatio={showcase} flipEnabled={false} boundBoxFunc={(old,next)=>next.width<20||next.height<20?old:next}/></Layer></Stage></div>;
}
function Artwork({node:n,select,update,showcase=false,interactive=true}:{node:MockupNode;select:()=>void;update:(change:Partial<MockupNode>)=>void;showcase?:boolean;interactive?:boolean}){
 const group=useRef<Konva.Group>(null),image=useMockupAsset(n.asset),use3d=showcase&&n.type==="screenshot"&&n.frame!=="none",device=useDeviceImage(image,n,use3d);
 useEffect(()=>{if(use3d)group.current?.getStage()?.container().setAttribute("data-device-engine",device.engine);},[use3d,device.engine]);
 const top=n.type==="screenshot"?(n.frame==="browser"?36:n.frame==="phone"?32:0):0;const inset=n.frame==="phone"?12:showcase&&n.type==="logo"?9:0;
 const boxW=Math.max(1,n.width-inset*2),boxH=Math.max(1,n.height-top-inset*2);let ix=inset,iy=top+(showcase&&n.type==="logo"?inset:0),iw=boxW,ih=boxH;let crop;
 if(image){if(n.fit==="contain"||n.type==="logo"){const s=Math.min(boxW/image.width,boxH/image.height);iw=image.width*s;ih=image.height*s;ix+=(boxW-iw)/2;iy+=(boxH-ih)/2;}else{const s=Math.max(boxW/image.width,boxH/image.height);const cw=boxW/s,ch=boxH/s;crop={x:(image.width-cw)/2,y:(image.height-ch)*n.cropY/100,width:cw,height:ch};}}
 const text=n.type==="title"||n.type==="description";
 return <Group ref={group} id={n.id} {...{deviceRenderReady:!use3d||device.engine!=="loading",deviceEngine:use3d?device.engine:"canvas"}} x={n.x} y={n.y} width={n.width} height={n.height} rotation={n.rotation} listening={interactive} draggable={interactive&&!n.locked} onClick={select} onTap={select} onDragEnd={e=>update({x:e.target.x(),y:e.target.y()})} onTransformEnd={e=>{const el=e.target;update({x:el.x(),y:el.y(),rotation:el.rotation(),width:Math.max(20,el.width()*el.scaleX()),height:Math.max(20,el.height()*el.scaleY())});el.scaleX(1);el.scaleY(1);}}>
 {n.type==="decoration"?<Rect width={n.width} height={n.height} fill={n.color} cornerRadius={Math.min(n.width,n.height)*.24}/>:text?<Text width={n.width} height={n.height} text={n.text} fontFamily={n.type==="title"?"Montserrat Variable":"Poppins"} fontSize={n.fontSize} fontStyle={n.type==="title"?"bold":"normal"} lineHeight={1.22} fill={n.color}/>:use3d&&device.image?<CanvasImage name="three-device-image" image={device.image} width={n.width} height={n.height} shadowColor="#243749" shadowBlur={24} shadowOpacity={.18} shadowOffsetY={14}/>:<>
 {showcase&&n.type==="logo"&&<Rect width={n.width} height={n.height} fill="#FFFFFF" cornerRadius={16} shadowColor="#25435B" shadowBlur={12} shadowOpacity={.08} shadowOffsetY={4}/>}
 {n.type==="screenshot"&&<Rect width={n.width} height={n.height} fill={n.frame==="phone"?"#15232D":"#FFFFFF"} cornerRadius={n.frame==="phone"?38:12} shadowColor="#153F56" shadowBlur={32} shadowOpacity={.18} shadowOffsetY={18}/>}
 {n.type==="screenshot"&&n.frame==="browser"&&<><Rect width={n.width} height={36} fill="#E5EDF3" cornerRadius={[12,12,0,0]}/>{["#F38A82","#EAC96A","#7CCBA2"].map((color,i)=><Circle key={color} x={18+i*18} y={18} radius={5} fill={color}/>)}</>}
 {image?<CanvasImage image={image} x={ix} y={iy} width={iw} height={ih} crop={crop}/>:<><Rect x={inset} y={top} width={boxW} height={boxH} fill="#E6EEF4"/><Text text={n.type==="logo"?"LOGO":"MOCKUP"} x={inset} y={top+boxH/2-12} width={boxW} align="center" fontSize={20} fill="#7C99AD"/></>}
 {n.type==="screenshot"&&n.frame==="phone"&&<Rect x={n.width/2-45} y={8} width={90} height={16} fill="#070F16" cornerRadius={12}/>}
 </>}
 </Group>;
}
