import {test} from "node:test";
import assert from "node:assert/strict";
import {OrderAutosave,type OrderEntry} from "../src/lib/admin/order-autosave";
const initial=["a","b","c"],first=["b","a","c"],second=["b","c","a"],latest=["c","b","a"];
const result=(ids:string[])=>({entries:ids.map((id,position)=>({id,position,updated_at:new Date().toISOString()}))});
function held(){let resolve!:(value:{entries:OrderEntry[]})=>void,reject!:(reason:Error)=>void;const promise=new Promise<{entries:OrderEntry[]}>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const tick=async()=>{await Promise.resolve();await Promise.resolve();};

test("rapid drops are immediate, serialize writes and coalesce to the latest order",async()=>{
 const requests:{ids:string[];gate:ReturnType<typeof held>}[]=[];
 const queue=new OrderAutosave(initial,ids=>{const gate=held();requests.push({ids,gate});return gate.promise;});
 queue.enqueue(first);queue.enqueue(second);queue.enqueue(latest);
 assert.deepEqual(queue.snapshot.order,latest);assert(queue.snapshot.pending);assert.equal(requests.length,1);
 const completed=queue.flush();requests[0].gate.resolve(result(first));await tick();
 assert.equal(requests.length,2);assert.deepEqual(requests[1].ids,latest);assert.deepEqual(queue.snapshot.order,latest);
 requests[1].gate.resolve(result(latest));await completed;assert(!queue.snapshot.pending);assert.deepEqual(queue.snapshot.entries.map(e=>e.id),latest);
});
test("failure of a superseded request does not discard a newer drop; terminal failure restores the last confirmed order",async()=>{
 const requests:ReturnType<typeof held>[]=[];
 const queue=new OrderAutosave(initial,()=>{const gate=held();requests.push(gate);return gate.promise;});
 queue.enqueue(first);queue.enqueue(second);const synced=queue.flush();requests[0].reject(new Error("old request failed"));await tick();
 assert.deepEqual(queue.snapshot.order,second);requests[1].resolve(result(second));await synced;assert.equal(queue.snapshot.error,"");
 queue.enqueue(latest);const failed=assert.rejects(queue.flush(),/offline/);requests[2].reject(new Error("offline"));await failed;
 assert.deepEqual(queue.snapshot.order,second);assert.equal(queue.snapshot.error,"offline");assert(!queue.snapshot.pending);
});
test("explicit publication keeps its captured order while later drafts continue",async()=>{
 const calls:{ids:string[];publish:boolean;gate:ReturnType<typeof held>}[]=[];
 const queue=new OrderAutosave(initial,(ids,publish)=>{const gate=held();calls.push({ids,publish,gate});return gate.promise;});
 queue.enqueue(first);queue.enqueue(second,true);queue.enqueue(latest);const done=queue.flush();
 calls[0].gate.resolve(result(first));await tick();assert(calls[1].publish);assert.deepEqual(calls[1].ids,second);
 calls[1].gate.resolve(result(second));await tick();assert(!calls[2].publish);assert.deepEqual(calls[2].ids,latest);
 calls[2].gate.resolve(result(latest));await done;assert.deepEqual(queue.snapshot.order,latest);
});
test("leaving a view does not stop saving; newer server snapshots can refresh an idle queue",async()=>{
 const gate=held(),queue=new OrderAutosave(initial,()=>gate.promise);let notifications=0;
 const unsubscribe=queue.subscribe(()=>notifications++);queue.enqueue(first);unsubscribe();const seen=notifications;
 gate.resolve(result(first));await queue.flush();assert.equal(notifications,seen);assert.deepEqual(queue.snapshot.order,first);
 let restored:string[]=[];const leave=queue.subscribe(state=>{restored=state.order;});assert.deepEqual(restored,first);leave();
 queue.reconcile(latest.map((id,position)=>({id,position,updated_at:"2099-01-01T00:00:00Z"})));assert.deepEqual(queue.snapshot.order,latest);
});
