import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameRoom} from '../worker/src/index.js';
const asJson=async response=>await response.json();
const makeRoom=()=>{
 const data=new Map(); const sockets=[];
 const ctx={getWebSockets:()=>sockets,
   storage:{get:async k=>data.get(k),put:async(k,v)=>{data.set(k,structuredClone(v))},setAlarm:async()=>{},deleteAll:async()=>data.clear()},
   blockConcurrencyWhile:async fn=>fn()};
 return {room:new GameRoom(ctx,{}),ctx,data,sockets};
};
test('room initializes, joins, hides cards, and synchronizes two drivers',async()=>{
 const {room,data,sockets}=makeRoom();
 const host=await asJson(await room.fetch(new Request('https://game.local/init',{method:'POST',body:JSON.stringify({name:'HOST',code:'ABC234'})})));
 assert.equal(host.playerId,0);assert.ok(host.token.length>60);
 const guest=await asJson(await room.fetch(new Request('https://game.local/join',{method:'POST',body:JSON.stringify({name:'GUEST'})})));
 assert.equal(guest.playerId,1);assert.ok(guest.token!==host.token);
 const out=[];const a={deserializeAttachment:()=>({id:0}),send:s=>out.push(JSON.parse(s))};
 const b={deserializeAttachment:()=>({id:1}),send:s=>out.push(JSON.parse(s))};sockets.push(a,b);
 await room.webSocketMessage(a,JSON.stringify({type:'start',cpu:2}));
 let r=data.get('room');assert.equal(r.game.players.length,4);assert.equal(r.started,true);
 await room.webSocketMessage(a,JSON.stringify({type:'action',op:'flip'}));
 r=data.get('room');assert.equal(r.game.phase,'flip');assert.equal(r.game.players[0].ready,true);assert.equal(out.at(-1).game.players[0].card,null);
 await room.webSocketMessage(b,JSON.stringify({type:'action',op:'flip'}));
 r=data.get('room');assert.ok(['flip','choice','done'].includes(r.game.phase));assert.ok(r.game.round>=1);
});
test('non-host cannot start the room',async()=>{
 const {room,data}=makeRoom();
 await room.fetch(new Request('https://game.local/init',{method:'POST',body:JSON.stringify({name:'Host',code:'ABC234'})}));
 await room.fetch(new Request('https://game.local/join',{method:'POST',body:JSON.stringify({name:'Guest'})}));
 await room.webSocketMessage({deserializeAttachment:()=>({id:1}),send:()=>{}},JSON.stringify({type:'start',cpu:2}));
 assert.equal(data.get('room').started,false);
});
test('snapshot requires a seat bearer token and never leaks credentials or decks',async()=>{
 const {room}=makeRoom();
 const host=await asJson(await room.fetch(new Request('https://game.local/init',{method:'POST',body:JSON.stringify({name:'Host',code:'ABC234'})})));
 for(const headers of [{},{Authorization:'Bearer wrong'}])assert.equal((await room.fetch(new Request('https://game.local/snapshot',{headers}))).status,401);
 const response=await room.fetch(new Request('https://game.local/snapshot',{headers:{Authorization:'Bearer '+host.token}}));
 assert.equal(response.status,200);const body=await response.text();assert.ok(!body.includes(host.token));assert.ok(!body.includes('deck'));
});
test('missing or invalid websocket credentials are rejected',async()=>{
 const {room}=makeRoom();
 await room.fetch(new Request('https://game.local/init',{method:'POST',body:JSON.stringify({name:'Host',code:'ABC234'})}));
 const response=await room.fetch(new Request('https://game.local/ws?token=bad',{headers:{Upgrade:'websocket','Sec-WebSocket-Protocol':'flipcars, seat.bad'}}));assert.equal(response.status,401);
});
test('malformed websocket commands do not mutate the room or throw',async()=>{
 const {room,data}=makeRoom();
 await room.fetch(new Request('https://game.local/init',{method:'POST',body:JSON.stringify({name:'Host',code:'ABC234'})}));
 const ws={deserializeAttachment:()=>({id:0}),send:()=>{}};
 for(const msg of ['null','[]','{','x'.repeat(1025)])await room.webSocketMessage(ws,msg);
 assert.equal(data.get('room').started,false);
});
