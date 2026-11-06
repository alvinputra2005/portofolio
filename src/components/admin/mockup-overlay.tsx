"use client";
import {Shape} from "react-konva";
import type {MockupDesign} from "@/lib/mockup/model";

// Lightweight vector patterns, drawn behind all project content and included in PNG exports.
export function MockupOverlay({design}:{design:MockupDesign}){
 const{preset,opacity}=design.overlay;
 if(preset==="none"||opacity===0)return null;
 return <Shape name="background-overlay" listening={false} stroke={design.accent} fill={design.accent} strokeWidth={2} opacity={opacity} sceneFunc={(context,shape)=>{
  context.beginPath();
  if(preset==="city"){
   for(let index=0;index<15;index++){
    const x=index*116-28,height=115+(index*83)%280,top=1000-height;
    context.rect(x,top,94,height);
    for(let row=0;row<Math.floor((height-36)/42);row++)for(let col=0;col<3;col++)context.rect(x+15+col*23,top+19+row*42,9,15);
   }
  }else if(preset==="grid"){
   for(let x=0;x<=1600;x+=80){context.moveTo(x,0);context.lineTo(x,1000);}
   for(let y=0;y<=1000;y+=80){context.moveTo(0,y);context.lineTo(1600,y);}
  }else if(preset==="diagonal"){
   for(let x=-1000;x<=1600;x+=100){context.moveTo(x,0);context.lineTo(x+1000,1000);}
  }else{
   for(let x=40;x<1600;x+=80)for(let y=40;y<1000;y+=80){context.moveTo(x+2,y);context.arc(x,y,2,0,Math.PI*2,false);}
   context.fillShape(shape);return;
  }
  context.strokeShape(shape);
 }}/>;
}
