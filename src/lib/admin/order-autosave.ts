export type OrderEntry={id:string;position:number;updated_at:string};
type Task={ids:string[];publish:boolean};
type State={order:string[];entries:OrderEntry[];pending:boolean;error:string;published:boolean;completed:number};

// One request at a time; intermediate draft orders are replaced by the latest.
// Publication is a barrier: a later drag never changes what was explicitly published.
export class OrderAutosave {
 private tasks:Task[]=[];
 private listeners=new Set<(state:State)=>void>();
 private waiters:{resolve:()=>void;reject:(error:Error)=>void}[]=[];
 private confirmed:string[];
 private state:State;
 constructor(ids:string[],private write:(ids:string[],publish:boolean)=>Promise<{entries:OrderEntry[]}>){
  this.confirmed=[...ids];this.state={order:[...ids],entries:[],pending:false,error:"",published:false,completed:0};
 }
 get snapshot(){return this.state;}
 subscribe(listener:(state:State)=>void){this.listeners.add(listener);listener(this.state);return()=>{this.listeners.delete(listener);};}
 private emit(patch:Partial<State>){this.state={...this.state,...patch};for(const listener of this.listeners)listener(this.state);}
 enqueue(ids:string[],publish=false){
  const task={ids:[...ids],publish},last=this.tasks.at(-1);
  if(last&&!last.publish&&!publish)this.tasks[this.tasks.length-1]=task;else this.tasks.push(task);
  const running=this.state.pending;
  this.emit({order:[...ids],pending:true,error:""});
  if(!running)void this.drain();
 }
 flush(){if(!this.state.pending)return Promise.resolve();return new Promise<void>((resolve,reject)=>this.waiters.push({resolve,reject}));}
 // Refresh an idle browser cache when a newer server snapshot or changed list arrives.
 reconcile(entries:OrderEntry[]){
  if(this.state.pending)return;
  const ids=entries.map(e=>e.id),changed=ids.length!==this.confirmed.length||ids.some(id=>!this.confirmed.includes(id));
  const newer=entries.some(e=>{const saved=this.state.entries.find(row=>row.id===e.id);return saved&&e.updated_at>saved.updated_at;});
  if(changed||newer){this.confirmed=ids;this.emit({order:ids,entries,error:""});}
 }
 private async drain(){
  let publicationError="";
  while(this.tasks.length){
   const task=this.tasks.shift()!;
   try{
    const result=await this.write(task.ids,task.publish);this.confirmed=[...task.ids];
    this.emit({entries:result.entries,published:task.publish,completed:this.state.completed+1});
   }catch(error){
    const message=error instanceof Error?error.message:"Urutan belum dapat disimpan.";
    if(task.publish)publicationError=message;
    // A newer full order can still succeed after an older draft request failed.
    if(this.tasks.length)continue;
    this.emit({order:[...this.confirmed],pending:false,error:message});
    for(const waiter of this.waiters.splice(0))waiter.reject(new Error(message));
    return;
   }
  }
  this.emit({pending:false,error:publicationError});
  for(const waiter of this.waiters.splice(0))waiter.resolve();
 }
}

// Browser memory only: queued writes survive changing admin routes. No draft payloads.
const queues=new Map<string,OrderAutosave>();
export function browserOrderAutosave(kind:string,entries:OrderEntry[],write:(ids:string[],publish:boolean)=>Promise<{entries:OrderEntry[]}>){
 if(typeof window==="undefined")throw new Error("Order autosave is browser-only.");
 let queue=queues.get(kind);
 if(!queue){queue=new OrderAutosave(entries.map(e=>e.id),write);queues.set(kind,queue);}else queue.reconcile(entries);
 return queue;
}
