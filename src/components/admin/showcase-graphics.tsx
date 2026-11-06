"use client";
import {useEffect,useState} from "react";
import {Group,Rect,Shape,Text,Image as CanvasImage,Path} from "react-konva";
import type {Context} from "konva/lib/Context";
import type {MockupDesign} from "@/lib/mockup/model";
import {MockupOverlay} from "./mockup-overlay";
import {useMockupAsset} from "./mockup-assets";

export function tint(hex:string,white:number){const rgb=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16));return "#"+rgb.map(value=>Math.round(value+(255-value)*white).toString(16).padStart(2,"0")).join("");}
export function whiteArea(context:Context){context.moveTo(0,406.58);context.bezierCurveTo(180,389.18,285,343.94,430,307.98);context.bezierCurveTo(600,263.32,757,261,880,313.2);context.bezierCurveTo(1008,364.24,1035,439.64,1200,490.68);context.lineTo(1200,1200);context.lineTo(0,1200);context.closePath();}
function coloredArea(context:Context,overlap=0){context.moveTo(0,0);context.lineTo(1200,0);context.lineTo(1200,396.72+overlap);context.bezierCurveTo(1155,393.82+overlap,1120,383.38+overlap,1060,346.84+overlap);context.bezierCurveTo(961,287.68+overlap,850,228.52+overlap,650,238.96+overlap);context.bezierCurveTo(430,245.92+overlap,210,307.4+overlap,0,299.28+overlap);context.closePath();}
export function ShowcaseBackground({design}:{design:MockupDesign}){
 const city=useMockupAsset("/images/mockup/kota.jpeg"),visible=design.cityPhoto.enabled&&design.cityPhoto.opacity>0;
 const sourceHeight=city?Math.min(city.naturalHeight,city.naturalWidth*450/1200):1;
 return <Group listening={false} name="showcase-graphics">
  <Rect width={1200} height={1200} fill={design.background}/>
  <Shape fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:1200,y:500}} fillLinearGradientColorStops={[0,design.accent,1,tint(design.accent,.46)]} sceneFunc={(context,shape)=>{context.beginPath();coloredArea(context,12);context.fillShape(shape);}}/>
  {visible&&<Group name="city-photo" {...{cityPhotoReady:Boolean(city)}} opacity={design.cityPhoto.opacity} clipFunc={context=>{context.beginPath();coloredArea(context);}}>{city&&<CanvasImage image={city} width={1200} height={450} crop={{x:0,y:(city.naturalHeight-sourceHeight)*design.cityPhoto.cropY/100,width:city.naturalWidth,height:sourceHeight}}/>}</Group>}
  <Shape name="white-area" fill={design.background} sceneFunc={(context,shape)=>{context.beginPath();whiteArea(context);context.fillShape(shape);}}/>
  <Group name="white-overlay-clip" clipFunc={context=>{context.beginPath();whiteArea(context);}}><MockupOverlay design={design}/></Group>
  <Shape name="reference-wave" fill={tint(design.accent,.81)} sceneFunc={(context,shape)=>{context.beginPath();context.moveTo(0,299.28);context.bezierCurveTo(210,307.4,430,245.92,650,238.96);context.bezierCurveTo(850,228.52,961,287.68,1060,346.84);context.bezierCurveTo(1120,383.38,1155,393.82,1200,396.72);context.lineTo(1200,490.68);context.bezierCurveTo(1035,439.64,1008,364.24,880,313.2);context.bezierCurveTo(757,261,600,263.32,430,307.98);context.bezierCurveTo(285,343.94,180,389.18,0,406.58);context.closePath();context.fillShape(shape);}}/>
 </Group>;
}
function QrTile({url,label,x}:{url:string;label:string;x:number}){
 const[image,setImage]=useState<{url:string;canvas:HTMLCanvasElement}|null>(null);
 useEffect(()=>{if(!url)return;let active=true;import("qrcode").then(async module=>{const canvas=document.createElement("canvas");await module.default.toCanvas(canvas,url,{width:256,margin:2,errorCorrectionLevel:"M",color:{dark:"#111111",light:"#FFFFFF"}});if(active)setImage({url,canvas});}).catch(()=>{});return()=>{active=false;};},[url]);
 if(!url)return null;
 const ready=image?.url===url;
 return <Group x={x} y={170} listening={false} {...{qrReady:ready}}><Rect width={84} height={84} fill="#FFFFFF" cornerRadius={5}/>{ready&&<CanvasImage image={image.canvas} width={84} height={84}/>}<Text text={label} y={94} width={84} align="center" fontFamily="Poppins" fontSize={13} fill="#FFFFFF"/></Group>;
}
export function ShowcaseCopy({design}:{design:MockupDesign}){
 const footer=design.showcase.footer;
 return <Group listening={false}>
  <Text text={design.showcase.subtitle} x={136} y={113} width={850} height={44} fontFamily="Poppins" fontSize={22} fontStyle="bold" fill="#FFFFFF"/>
  <QrTile url={design.showcase.prototypeUrl} label="Prototype" x={54}/><QrTile url={design.showcase.caseStudyUrl} label="Case study" x={190}/>
  <Text name="footer-description" text={footer} x={150} y={1070} width={900} height={120} align="center" fontFamily="Poppins" fontSize={footer.length>400?16:footer.length>260?20:24} lineHeight={1.22} fill="#596774"/>
 </Group>;
}
export function ShowcasePopups({design}:{design:MockupDesign}){
 const shots=design.nodes.filter(node=>node.type==="screenshot"),image=useMockupAsset(shots[0]?.asset||"");
 if(!design.showcase.popups)return null;
 return <Group listening={false} name="showcase-popups">
  {image&&[-12,2,18].map((rotation,index)=><Group key={index} x={610+index*59} y={470-index*6} rotation={rotation} scaleX={.78} scaleY={.78}><Rect width={215} height={250} fill="#FFFFFF" cornerRadius={12} shadowColor="#263542" shadowBlur={24} shadowOpacity={.19} shadowOffsetY={10}/><Rect width={215} height={12} fill={index===1?tint(design.accent,.25):design.accent} cornerRadius={[12,12,0,0]}/><CanvasImage image={image} x={12} y={24} width={191} height={139} crop={{x:0,y:0,width:image.naturalWidth,height:Math.min(image.naturalHeight,image.naturalWidth*.73)}}/><Text text={shots[index]?.label||["Product preview","Screen detail","Interface"][index]} x={16} y={182} width={183} align="center" fontFamily="Poppins" fontStyle="bold" fontSize={17} fill="#273540"/><Text text="Designed with care" x={16} y={216} width={183} align="center" fontFamily="Poppins" fontSize={12} fill="#8A969F"/></Group>)}
  {[{x:195,y:540,w:242,text:"Interface Preview"},{x:750,y:760,w:230,text:"Project Details"},{x:245,y:930,w:226,text:"Made for You"}].map((pill,index)=><Group key={pill.text} x={pill.x} y={pill.y} scaleX={.8} scaleY={.8}><Rect width={pill.w} height={46} fill="#FFFFFF" cornerRadius={23} shadowColor="#2C4253" shadowBlur={16} shadowOpacity={.14} shadowOffsetY={6}/><Path data={index===0?"M18 10 C8 0 0 8 0 15 C0 23 18 34 18 34 C18 34 36 23 36 15 C36 8 28 0 18 10Z":"M18 0 L23 12 L36 18 L23 23 L18 36 L12 23 L0 18 L12 12Z"} x={16} y={10} scaleX={.7} scaleY={.7} fill={design.accent}/><Text text={pill.text} x={52} y={14} width={pill.w-64} height={26} fontFamily="Poppins" fontStyle="bold" fontSize={17} fill="#80909C"/></Group>)}
 </Group>;
}
