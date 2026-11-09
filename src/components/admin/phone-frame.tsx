"use client";
import {Group,Rect,Text,Image as CanvasImage} from "react-konva";
import type {Context} from "konva/lib/Context";
import type {MockupNode} from "@/lib/mockup/model";

// Keep the frame, rounded screen and camera island as paths all the way to export.
// Only the user's original screenshot is a bitmap; it is never flattened into the frame.
export function PhoneFrame({node,image}:{node:MockupNode;image:HTMLImageElement|null}){
 const width=Math.min(node.width,node.height/2),height=Math.min(node.height,node.width*2),unit=width/370,bezel=10*unit,radius=42*unit;
 const screenWidth=width-bezel*2,screenHeight=height-bezel*2,screenRadius=radius-bezel;
 let x=0,y=0,drawWidth=screenWidth,drawHeight=screenHeight,crop;
 if(image){
  if(node.fit==="cover"){
   const scale=Math.max(screenWidth/image.naturalWidth,screenHeight/image.naturalHeight),cropWidth=screenWidth/scale,cropHeight=screenHeight/scale;
   crop={x:(image.naturalWidth-cropWidth)/2,y:(image.naturalHeight-cropHeight)*node.cropY/100,width:cropWidth,height:cropHeight};
  }else{
   const scale=Math.min(screenWidth/image.naturalWidth,screenHeight/image.naturalHeight);
   drawWidth=image.naturalWidth*scale;drawHeight=image.naturalHeight*scale;x=(screenWidth-drawWidth)/2;y=(screenHeight-drawHeight)/2;
  }
 }
 function clipScreen(context:Context){
  const w=screenWidth,h=screenHeight,r=screenRadius;
  context.beginPath();context.moveTo(r,0);context.lineTo(w-r,0);context.quadraticCurveTo(w,0,w,r);context.lineTo(w,h-r);context.quadraticCurveTo(w,h,w-r,h);context.lineTo(r,h);context.quadraticCurveTo(0,h,0,h-r);context.lineTo(0,r);context.quadraticCurveTo(0,0,r,0);context.closePath();
 }
 return <Group name="vector-phone-frame" x={(node.width-width)/2} y={(node.height-height)/2}>
  <Rect x={width-1.5*unit} y={height*.24} width={3.5*unit} height={48*unit} cornerRadius={1.7*unit} fill="#5C626D"/>
  <Rect x={-2*unit} y={height*.22} width={3.5*unit} height={28*unit} cornerRadius={1.7*unit} fill="#5C626D"/>
  <Rect width={width} height={height} cornerRadius={radius} fillLinearGradientStartPoint={{x:0,y:0}} fillLinearGradientEndPoint={{x:width,y:height*.3}} fillLinearGradientColorStops={[0,"#A2A8B1",.07,"#343B46",.48,"#101722",.94,"#606873",1,"#B1B7BF"]} stroke="#747C88" strokeWidth={.8*unit} shadowColor="#15212D" shadowBlur={20*unit} shadowOpacity={.18} shadowOffsetY={12*unit}/>
  <Rect x={2*unit} y={2*unit} width={width-4*unit} height={height-4*unit} cornerRadius={radius-2*unit} fill="#1C2330" stroke="#090D14" strokeWidth={1.5*unit}/>
  <Group x={bezel} y={bezel} clipFunc={clipScreen}>
   <Rect width={screenWidth} height={screenHeight} fill="#F1F5F8"/>
   {image?<CanvasImage name="original-phone-screenshot" image={image} x={x} y={y} width={drawWidth} height={drawHeight} crop={crop}/>:<Text text="MOCKUP" y={screenHeight/2-10*unit} width={screenWidth} align="center" fontFamily="Arial" fontSize={18*unit} fill="#7891A2"/>}
  </Group>
  <Rect x={width/2-49*unit} y={bezel+10*unit} width={98*unit} height={23*unit} cornerRadius={12*unit} fill="#04070B"/>
 </Group>;
}
