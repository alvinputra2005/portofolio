"use client";
import {useEffect,useState} from "react";
import type {MockupNode} from "@/lib/mockup/model";
import {deviceRasterSize} from "@/lib/mockup/quality";
import {assetUrl} from "./api";
const assets=new Map<string,Promise<HTMLImageElement>>();
export function imageAccent(image:HTMLImageElement){
 const canvas=document.createElement("canvas");canvas.width=48;canvas.height=48;const context=canvas.getContext("2d")!;context.drawImage(image,0,0,48,48);const pixels=context.getImageData(0,0,48,48).data,counts=new Map<string,number>();
 for(let index=0;index<pixels.length;index+=4){const[r,g,b,a]=pixels.slice(index,index+4);if(a<180||Math.max(r,g,b)-Math.min(r,g,b)<35)continue;const hex="#"+[r,g,b].map(value=>Math.min(255,Math.round(value/24)*24).toString(16).padStart(2,"0")).join("");counts.set(hex,(counts.get(hex)||0)+1);}
 return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||"#0074B5";
}
export function useMockupAsset(asset:string){
 const[state,setState]=useState<{asset:string;image:HTMLImageElement}|null>(null);
 useEffect(()=>{if(!asset)return;let active=true;let promise=assets.get(asset);if(!promise){promise=new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.crossOrigin="anonymous";image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Image unavailable"));image.src=assetUrl(asset);});assets.set(asset,promise);if(assets.size>10)assets.delete(assets.keys().next().value!);}
 promise.then(image=>{if(active)setState({asset,image});}).catch(()=>{assets.delete(asset);});return()=>{active=false;};},[asset]);
 return state?.asset===asset?state.image:null;
}
export function useDeviceImage(image:HTMLImageElement|null,node:MockupNode,enabled:boolean){
 const size=deviceRasterSize(node),key=`${image?.src||"empty"}|${node.frame}|${node.fit}|${node.cropY}|${size.width}x${size.height}|${enabled}`;
 const[state,setState]=useState<{key:string;image:HTMLCanvasElement|null;engine:"three"|"fallback"}|null>(null);
 useEffect(()=>{if(!enabled||node.frame==="none"||node.asset&&!image)return;let active=true;import("./device-renderer").then(module=>{const rendered=module.renderDevice(image,node);if(active)setState({key,image:rendered,engine:rendered?"three":"fallback"});}).catch(()=>{if(active)setState({key,image:null,engine:"fallback"});});return()=>{active=false;};},[key,image,enabled,node.frame,node.asset,node.fit,node.cropY,node.width]);
 return state?.key===key?state:{key,image:null,engine:enabled&&node.frame!=="none"?"loading" as const:"fallback" as const};
}
