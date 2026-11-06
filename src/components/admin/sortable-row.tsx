"use client";
import {useEffect,type ReactNode} from "react";
import {Reorder,useDragControls,useMotionValue,useReducedMotion} from "motion/react";
import {Menu} from "lucide-react";

type Props={id:string;title:string;children:ReactNode;sortable:boolean;disabled:boolean;active:boolean;instructions:string;onStart:()=>void;onEnd:()=>void;onCancel:()=>void;onMove:(direction:number)=>void};
export function SortableRow({id,title,children,sortable,disabled,active,instructions,onStart,onEnd,onCancel,onMove}:Props){
 const controls=useDragControls(),y=useMotionValue(0),reducedMotion=useReducedMotion();
 function cancelDrag(){controls.cancel();y.stop();y.set(0);onCancel();}
 useEffect(()=>{
  if(!active)return;
  function cancel(event:KeyboardEvent){if(event.key==="Escape"){event.preventDefault();controls.cancel();y.stop();y.set(0);onCancel();}}
  window.addEventListener("keydown",cancel);
  return()=>window.removeEventListener("keydown",cancel);
 },[active,controls,onCancel,y]);
 return <Reorder.Item as="article" value={id} style={{y}} drag={sortable&&!disabled?"y":false} dragListener={false} dragControls={controls} dragMomentum={false} onDragStart={onStart} onDragEnd={onEnd} className={active?"admin-row-dragging":undefined} transition={reducedMotion?{duration:0}:{duration:.18}}>
  {sortable&&<button type="button" className="admin-drag-handle" aria-disabled={disabled} aria-label={`Geser urutan ${title}`} aria-describedby={instructions} title="Geser untuk mengatur urutan. Keyboard: panah atas/bawah." onPointerDown={event=>{if(disabled||event.button!==0)return;event.currentTarget.focus({preventScroll:true});controls.start(event);}} onPointerCancel={cancelDrag} onKeyDown={event=>{if(event.key==="ArrowUp"||event.key==="ArrowDown"){event.preventDefault();if(!disabled&&!active)onMove(event.key==="ArrowUp"?-1:1);}}}><Menu size={19}/></button>}
  {children}
 </Reorder.Item>;
}
