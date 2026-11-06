"use client";
import {Shape} from "react-konva";
import type {MockupDesign} from "@/lib/mockup/model";

// Lightweight vector patterns, drawn behind all project content and included in PNG exports.
export function MockupOverlay({design}:{design:MockupDesign}){
 const{preset,opacity}=design.overlay;
 if(preset==="none"||opacity===0)return null;
 const width=design.width,height=design.height;
 return <Shape name="background-overlay" listening={false} stroke={design.presentation==="showcase"?"#8D979F":design.accent} fill={design.presentation==="showcase"?"#8D979F":design.accent} strokeWidth={2} opacity={opacity} sceneFunc={(context,shape)=>{
  context.beginPath();
  if(preset==="city"){
   for(let index=0;index<Math.ceil(width/116)+1;index++){
    const x=index*116-28,buildingHeight=115+(index*83)%280,top=height-buildingHeight;
    context.rect(x,top,94,buildingHeight);
    for(let row=0;row<Math.floor((buildingHeight-36)/42);row++)for(let col=0;col<3;col++)context.rect(x+15+col*23,top+19+row*42,9,15);
   }
  }else if(preset==="grid"){
   for(let x=0;x<=width;x+=80){context.moveTo(x,0);context.lineTo(x,height);}
   for(let y=0;y<=height;y+=80){context.moveTo(0,y);context.lineTo(width,y);}
  }else if(preset==="diagonal"){
   for(let x=-height;x<=width;x+=100){context.moveTo(x,0);context.lineTo(x+height,height);}
  }else{
   const spacing=design.presentation==="showcase"?24:80;
   for(let x=12;x<width;x+=spacing)for(let y=12;y<height;y+=spacing){context.moveTo(x+1.5,y);context.arc(x,y,1.5,0,Math.PI*2,false);}
   context.fillShape(shape);return;
  }
  context.strokeShape(shape);
 }}/>;
}
