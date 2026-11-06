"use client";
import {useEffect,useState} from "react";
import {Group,Rect,Shape,Text,Image as CanvasImage,Path} from "react-konva";
import type {Context} from "konva/lib/Context";
import type {MockupDesign} from "@/lib/mockup/model";
import {MockupOverlay} from "./mockup-overlay";
import {useMockupAsset} from "./mockup-assets";

export function tint(hex:string,white:number){const rgb=[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16));return "#"+rgb.map(value=>Math.round(value+(255-value)*white).toString(16).padStart(2,"0")).join("");}
export function whiteArea(context:Context){context.moveTo(0,701);context.bezierCurveTo(180,671,285,593,430,531);context.bezierCurveTo(600,454,757,450,880,540);context.bezierCurveTo(1008,628,1035,758,1200,846);context.lineTo(1200,1712);context.lineTo(0,1712);context.closePath();}
export function ShowcaseBackground({design}:{design:MockupDesign}){
 return <Group listening={false} name="showcase-graphics">
  <Rect width={1200} height={1712} fill={design.background}/>
  <Shape fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:1200,y:800}} fillLinearGradientColorStops={[0,design.accent,1,tint(design.accent,.46)]} sceneFunc={(context,shape)=>{context.beginPath();context.moveTo(0,0);context.lineTo(1200,0);context.lineTo(1200,704);context.bezierCurveTo(1155,699,1120,681,1060,618);context.bezierCurveTo(961,516,850,414,650,432);context.bezierCurveTo(430,444,210,550,0,536);context.closePath();context.fillShape(shape);}}/>
  <Shape name="white-area" fill={design.background} sceneFunc={(context,shape)=>{context.beginPath();whiteArea(context);context.fillShape(shape);}}/>
  <Group name="white-overlay-clip" clipFunc={context=>{context.beginPath();whiteArea(context);}}><MockupOverlay design={design}/></Group>
  <Shape name="reference-wave" fill={tint(design.accent,.81)} sceneFunc={(context,shape)=>{context.beginPath();context.moveTo(0,516);context.bezierCurveTo(210,530,430,424,650,412);context.bezierCurveTo(850,394,961,496,1060,598);context.bezierCurveTo(1120,661,1155,679,1200,684);context.lineTo(1200,846);context.bezierCurveTo(1035,758,1008,628,880,540);context.bezierCurveTo(757,450,600,454,430,531);context.bezierCurveTo(285,593,180,671,0,701);context.closePath();context.fillShape(shape);}}/>
 </Group>;
}
function QrTile({url,label,x}:{url:string;label:string;x:number}){
 const[image,setImage]=useState<{url:string;canvas:HTMLCanvasElement}|null>(null);
 useEffect(()=>{if(!url)return;let active=true;import("qrcode").then(async module=>{const canvas=document.createElement("canvas");await module.default.toCanvas(canvas,url,{width:256,margin:2,errorCorrectionLevel:"M",color:{dark:"#111111",light:"#FFFFFF"}});if(active)setImage({url,canvas});}).catch(()=>{});return()=>{active=false;};},[url]);
 if(!url)return null;
 const ready=image?.url===url;
 return <Group x={x} y={310} listening={false} {...{qrReady:ready}}><Rect width={118} height={118} fill="#FFFFFF" cornerRadius={5}/>{ready&&<CanvasImage image={image.canvas} width={118} height={118}/>}<Text text={label} y={128} width={118} align="center" fontFamily="Poppins" fontSize={16} fill="#FFFFFF"/></Group>;
}
export function ShowcaseCopy({design}:{design:MockupDesign}){
 const footer=design.showcase.footer;
 return <Group listening={false}>
  <Text text={design.showcase.subtitle} x={136} y={113} width={650} height={44} fontFamily="Poppins" fontSize={22} fontStyle="bold" fill="#FFFFFF"/>
  <QrTile url={design.showcase.prototypeUrl} label="Prototype" x={54}/><QrTile url={design.showcase.caseStudyUrl} label="Case study" x={218}/>
  <Text text={design.showcase.headline} x={110} y={1300} width={980} height={110} align="center" fontFamily="Outfit Variable" fontStyle="bold" fontSize={88} fill="#202832"/>
  <Text text={design.showcase.tagline} x={240} y={1402} width={720} height={85} align="center" fontFamily="Kalam" fontStyle="bold" fontSize={54} fill={design.accent}/>
  <Shape stroke={design.accent} strokeWidth={5} lineCap="round" sceneFunc={(context,shape)=>{context.beginPath();context.moveTo(465,1465);context.bezierCurveTo(550,1418,650,1488,735,1458);context.strokeShape(shape);}}/>
  <Text text={footer} x={250} y={1510} width={700} height={180} align="center" fontFamily="Poppins" fontSize={footer.length>360?18:footer.length>230?22:26} lineHeight={1.25} fill="#596774"/>
 </Group>;
}
export function ShowcasePopups({design}:{design:MockupDesign}){
 const shots=design.nodes.filter(node=>node.type==="screenshot"),image=useMockupAsset(shots[0]?.asset||"");
 if(!design.showcase.popups)return null;
 return <Group listening={false} name="showcase-popups">
  {image&&[-12,2,18].map((rotation,index)=><Group key={index} x={580+index*76} y={650-index*8} rotation={rotation}><Rect width={215} height={250} fill="#FFFFFF" cornerRadius={12} shadowColor="#263542" shadowBlur={24} shadowOpacity={.19} shadowOffsetY={10}/><Rect width={215} height={12} fill={index===1?tint(design.accent,.25):design.accent} cornerRadius={[12,12,0,0]}/><CanvasImage image={image} x={12} y={24} width={191} height={139} crop={{x:0,y:0,width:image.naturalWidth,height:Math.min(image.naturalHeight,image.naturalWidth*.73)}}/><Text text={shots[index]?.label||["Product preview","Screen detail","Interface"][index]} x={16} y={182} width={183} align="center" fontFamily="Poppins" fontStyle="bold" fontSize={17} fill="#273540"/><Text text="Designed with care" x={16} y={216} width={183} align="center" fontFamily="Poppins" fontSize={12} fill="#8A969F"/></Group>)}
  {[{x:160,y:730,w:242,text:"Interface Preview"},{x:755,y:960,w:230,text:"Project Details"},{x:165,y:1130,w:226,text:"Made for You"}].map((pill,index)=><Group key={pill.text} x={pill.x} y={pill.y}><Rect width={pill.w} height={46} fill="#FFFFFF" cornerRadius={23} shadowColor="#2C4253" shadowBlur={16} shadowOpacity={.14} shadowOffsetY={6}/><Path data={index===0?"M18 10 C8 0 0 8 0 15 C0 23 18 34 18 34 C18 34 36 23 36 15 C36 8 28 0 18 10Z":"M18 0 L23 12 L36 18 L23 23 L18 36 L12 23 L0 18 L12 12Z"} x={16} y={10} scaleX={.7} scaleY={.7} fill={design.accent}/><Text text={pill.text} x={52} y={14} width={pill.w-64} height={26} fontFamily="Poppins" fontStyle="bold" fontSize={17} fill="#80909C"/></Group>)}
 </Group>;
}
