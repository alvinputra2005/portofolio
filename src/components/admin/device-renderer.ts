import * as THREE from "three";
import type {MockupNode} from "@/lib/mockup/model";

let renderer:THREE.WebGLRenderer|null|undefined;
const cache=new Map<string,HTMLCanvasElement>();
function getRenderer(){
 if(renderer!==undefined)return renderer;
 const canvas=document.createElement("canvas"),context=canvas.getContext("webgl2",{alpha:true,antialias:true,preserveDrawingBuffer:true});
 if(!context){renderer=null;return null;}
 renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(1);renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 return renderer;
}
function rounded(width:number,height:number,radius:number){
 const shape=new THREE.Shape(),x=-width/2,y=-height/2;
 shape.moveTo(x+radius,y);shape.lineTo(x+width-radius,y);shape.quadraticCurveTo(x+width,y,x+width,y+radius);shape.lineTo(x+width,y+height-radius);shape.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);shape.lineTo(x+radius,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-radius);shape.lineTo(x,y+radius);shape.quadraticCurveTo(x,y,x+radius,y);return shape;
}
function screenTexture(image:HTMLImageElement|null,node:Pick<MockupNode,"frame"|"fit"|"cropY">){
 const phone=node.frame==="phone",canvas=document.createElement("canvas");canvas.width=phone?720:1440;canvas.height=phone?1440:900;
 const context=canvas.getContext("2d")!;context.fillStyle="#FFFFFF";context.fillRect(0,0,canvas.width,canvas.height);
 const top=phone?0:42,w=canvas.width,h=canvas.height-top;
 if(image){
  const scale=node.fit==="cover"?Math.max(w/image.naturalWidth,h/image.naturalHeight):Math.min(w/image.naturalWidth,h/image.naturalHeight),iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
  context.save();context.beginPath();context.rect(0,top,w,h);context.clip();context.drawImage(image,(w-iw)/2,top+(h-ih)*(node.fit==="cover"?node.cropY/100:.5),iw,ih);context.restore();
 }else{context.fillStyle="#F1F5F8";context.fillRect(0,top,w,h);context.fillStyle="#7891A2";context.textAlign="center";context.font=`${phone?30:34}px Arial`;context.fillText("SCREENSHOT",w/2,top+h/2);}
 if(phone){context.fillStyle="#05080D";context.beginPath();context.roundRect(w*.36,18,w*.28,44,22);context.fill();}
 else{context.fillStyle="#EDF0F3";context.fillRect(0,0,w,top);["#F08D81","#EAC875","#85C9A0"].forEach((color,index)=>{context.fillStyle=color;context.beginPath();context.arc(24+index*22,top/2,6,0,Math.PI*2);context.fill();});}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
export function renderDevice(image:HTMLImageElement|null,node:Pick<MockupNode,"frame"|"fit"|"cropY">):HTMLCanvasElement|null{
 const key=`${image?.src||"empty"}|${node.frame}|${node.fit}|${node.cropY}`;const cached=cache.get(key);if(cached)return cached;
 const output=getRenderer();if(!output)return null;
 const phone=node.frame==="phone",w=phone?3.3:7.6,h=phone?6.6:4.9,radius=phone?.36:.16;
 const scene=new THREE.Scene(),device=new THREE.Group();device.rotation.set(phone?.025:.035,phone?-.14:-.1,0);scene.add(device);
 const material=new THREE.MeshPhysicalMaterial({color:0x343B48,metalness:.68,roughness:.26,clearcoat:1,clearcoatRoughness:.14});
 const bodyGeometry=new THREE.ExtrudeGeometry(rounded(w,h,radius),{depth:.12,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.045,bevelThickness:.04,curveSegments:16});bodyGeometry.translate(0,0,-.08);
 const body=new THREE.Mesh(bodyGeometry,material);body.castShadow=true;device.add(body);
 const rimGeometry=new THREE.ExtrudeGeometry(rounded(w+.075,h+.075,radius+.02),{depth:.055,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:16});rimGeometry.translate(0,0,-.13);
 device.add(new THREE.Mesh(rimGeometry,new THREE.MeshStandardMaterial({color:0xA0A6B1,metalness:.85,roughness:.3})));
 const face=new THREE.ShapeGeometry(rounded(w-.16,h-.16,radius-.045),24),positions=face.getAttribute("position"),uv=face.getAttribute("uv");for(let index=0;index<positions.count;index++)uv.setXY(index,(positions.getX(index)+(w-.16)/2)/(w-.16),(positions.getY(index)+(h-.16)/2)/(h-.16));
 const screen=new THREE.Mesh(face,new THREE.MeshBasicMaterial({map:screenTexture(image,node),toneMapped:false}));screen.position.z=.095;device.add(screen);
 if(phone){const side=new THREE.Mesh(new THREE.BoxGeometry(.035,.7,.055),material);side.position.set(w/2+.04,.85,-.025);device.add(side);}
 scene.add(new THREE.AmbientLight(0xffffff,2));const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(-3,6,8);scene.add(light);
 const viewW=w+.55,viewH=h+.48,camera=new THREE.OrthographicCamera(-viewW/2,viewW/2,viewH/2,-viewH/2,.1,30);camera.position.set(0,0,10);camera.lookAt(0,0,0);
 output.setSize(phone?800:1500,phone?1420:1000,false);output.render(scene,camera);
 const rendered=document.createElement("canvas");rendered.width=output.domElement.width;rendered.height=output.domElement.height;rendered.getContext("2d")!.drawImage(output.domElement,0,0);
 scene.traverse(object=>{const mesh=object as THREE.Mesh;if(!mesh.isMesh)return;mesh.geometry.dispose();for(const item of Array.isArray(mesh.material)?mesh.material:[mesh.material]){(item as THREE.MeshBasicMaterial).map?.dispose();item.dispose();}});output.renderLists.dispose();
 cache.set(key,rendered);if(cache.size>8)cache.delete(cache.keys().next().value!);return rendered;
}
