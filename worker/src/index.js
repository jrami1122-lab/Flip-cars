// Flip Cars multiplayer backend. Cloudflare Workers + Durable Objects.
// No client controls card values, event draws, positions, collisions or lap counts.
const COLORS = ['RED','BLUE','YELLOW','GREEN'];
const MOVEMENT = [...Array(8).fill(1), ...Array(7).fill(2), ...Array(5).fill(3), ...Array(4).fill(4), ...Array(3).fill(5)];
const EVENT_COUNTS = {lowfuel:3,fuel:3,turbo:4,spin:3,repair:2,guard:2,cones:3,cheat:2,catch:2,nitro:2,flat:2};
const EVENT_TITLES = {lowfuel:'⛽ LOW FUEL',fuel:'⛽ FUEL CANISTER',turbo:'🔥 TURBO +2',spin:'🌀 SPIN OUT',repair:'🔧 REPAIR KIT',guard:'🛡️ GUARD RAIL',cones:'🚧 CONES -2',cheat:'🚨 CAUGHT CHEATING',catch:'👀 CATCH A CHEATER',nitro:'⚡ NITRO',flat:'🛞 FLAT TIRE'};
const copy = x => JSON.parse(JSON.stringify(x));
const shuffle = xs => {const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const makeDeck = () => shuffle(MOVEMENT);
const makeEvents = () => shuffle(Object.entries(EVENT_COUNTS).flatMap(([k,n])=>Array(n).fill(k)));
function trackGraph(){
 const nodes={},forks={};let n=0;
 const node=(x,y,type='normal')=>{let id='s'+(n++);nodes[id]={id,x,y,type,next:null};return id};
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function resample(points,spacing=65){let lengths=[],sum=0;for(let i=1;i<points.length;i++){sum+=distance(points[i-1],points[i]);lengths.push(sum)}let count=Math.max(2,Math.round(sum/spacing));const arr=[];for(let k=0;k<=count;k++){let target=sum*k/count,idx=lengths.findIndex(l=>l>=target);if(idx<0)idx=lengths.length-1;let prev=idx?lengths[idx-1]:0,t=(target-prev)/Math.max(1,lengths[idx]-prev);arr.push([points[idx][0]+t*(points[idx+1][0]-points[idx][0]),points[idx][1]+t*(points[idx+1][1]-points[idx][1])])}return arr}
 function road(from,to,via,risk=0){let coords=resample([[nodes[from].x,nodes[from].y],...via,[nodes[to].x,nodes[to].y]]);let prev=from,ids=[];for(let i=1;i<coords.length-1;i++){let flag=(i+Math.round(risk))%(risk?3:6)===0,boost=(i+(risk?1:2))%(risk?8:11)===0;let id=node(coords[i][0],coords[i][1],flag?'flag':boost?'boost':'normal');if(!nodes[prev].next)nodes[prev].next=id;prev=id;ids.push(id)}if(!nodes[prev].next)nodes[prev].next=to;return {first:ids[0]||to,ids}}
 const start=node(565,665,'start'),fork1=node(885,595,'fork'),merge1=node(900,235,'merge'),fork2=node(805,153,'fork'),merge2=node(385,155,'merge'),fork3=node(220,276,'fork'),merge3=node(260,590,'merge');
 road(start,fork1,[[700,665],[790,639]]);
 forks[fork1]=[{name:'INSIDE SPRINT',...road(fork1,merge1,[[768,540],[767,410],[809,310]])},{name:'OUTER THRILL',...road(fork1,merge1,[[1055,570],[1093,465],[1058,342]],1)}];
 road(merge1,fork2,[[862,186]]);
 forks[fork2]=[{name:'SKYLINE',...road(fork2,merge2,[[689,65],[507,65]],1)},{name:'EXPRESS',...road(fork2,merge2,[[645,154],[535,154]])},{name:'RIVERSIDE',...road(fork2,merge2,[[690,285],[514,285]],1)}];
 road(merge2,fork3,[[279,204]]);
 forks[fork3]=[{name:'FOREST LOOP',...road(fork3,merge3,[[110,315],[88,470],[133,556]],1)},{name:'TUNNEL CUT',...road(fork3,merge3,[[351,352],[351,513]])}];
 const approach=road(merge3,start,[[367,650],[468,665]]);const beforeStart=approach.ids.at(-1),afterStart=nodes[start].next;
 for(const id of Object.keys(forks))nodes[id].next=null;
 const pitWait=node(450,739,'pit'),pitOne=node(515,739,'pit'),pitTwo=node(581,739,'pit');
 return {nodes,forks,start,pit:{wait:pitWait,one:pitOne,two:pitTwo,approach:beforeStart,exit:afterStart}};
}
export const TRACK = trackGraph();
function addLog(s,text){s.logs.unshift(text);s.logs=s.logs.slice(0,7)}
function card(p){if(!p.deck.length)p.deck=makeDeck();p.flipCount++;return p.deck.pop()}
function eventCard(s){if(!s.eventDeck.length)s.eventDeck=makeEvents();return s.eventDeck.pop()}
function makePlayer(id,member){return {id,name:COLORS[id],displayName:member.name,cpu:member.isBot,isBot:member.isBot,node:TRACK.start,laps:0,deck:makeDeck(),card:null,ready:false,remaining:0,skips:0,needsPit:false,pitStage:-1,fuel:0,repair:0,guard:0,cones:0,nitro:false,flat:false,history:[],moved:false,finished:false,overshoot:0,bonuses:0,flags:0,flipCount:0,selected:0,selectedNode:null,triggeredNode:null}}
function prepare(s){if(s.phase==='done')return;s.phase='flip';s.choice=null;for(const p of s.players){p.ready=false;p.card=null;p.moved=false;p.remaining=0;p.bonuses=0;p.flags=0;p.overshoot=0;p.selected=0;p.selectedNode=null;p.triggeredNode=null;if(p.finished||p.pitStage===0||p.pitStage===1||p.skips>0){p.ready=true}else if(p.isBot){p.card=card(p);p.ready=true}}if(s.players.every(p=>p.ready))reveal(s)}
export function startRace(members){const s={round:1,phase:'lobby',players:members.map((m,i)=>makePlayer(i,m)),eventDeck:makeEvents(),active:0,choice:null,logs:['🏁 LIGHTS OUT! Everyone flip to start.'],winner:null};prepare(s);return s}
function cross(s,p){p.laps++;p.nitro=false;p.flat=false;p.cones=0;addLog(s,`🏁 ${p.name} crosses the line: lap ${p.laps}/3`);if(p.laps>=3){p.finished=true;p.overshoot=p.remaining;addLog(s,`🏆 ${p.name} finishes!`)}}
function step(s,p){const {nodes,forks,pit,start}=TRACK;
 if(p.pitStage===2&&p.node===pit.two){p.pitStage=-1;p.needsPit=false;p.node=pit.exit;p.remaining=Math.max(0,p.remaining-1);p.history.push({node:pit.two,lapCross:true});p.moved=true;cross(s,p);addLog(s,`🔧 ${p.name} rejoins the circuit.`);return 'ok'}
 if(p.node===pit.approach&&p.needsPit){p.node=pit.wait;p.remaining=0;p.pitStage=0;p.needsPit=false;p.moved=true;addLog(s,`🔧 ${p.name} enters the pit lane.`);return 'pit'}
 let next;if(forks[p.node]){if(!p.selectedNode){if(p.isBot){const opts=forks[p.node],short=opts.findIndex(o=>/INSIDE|EXPRESS|TUNNEL/.test(o.name));const ix=Math.random()<.6?Math.max(0,short):Math.floor(Math.random()*opts.length);p.selected=ix;p.selectedNode=opts[ix].first;addLog(s,`🛣️ ${p.name} picks ${opts[ix].name}.`)}else{s.phase='choice';s.choice=p.id;p.selected=0;return 'choice'}}next=p.selectedNode;p.selectedNode=null}else next=nodes[p.node].next;
 if(!next){p.remaining=0;addLog(s,'Track routing error.');return 'error'}let old=p.node;p.history.push({node:old,lapCross:next===start});if(p.history.length>360)p.history.shift();p.node=next;p.remaining--;p.moved=true;if(next===start&&old!==start)cross(s,p);return 'ok'}
function reverse(s,p,n){while(n-->0&&p.history.length){const e=p.history.pop();if(p.node===TRACK.start&&e.lapCross&&p.laps>0){p.laps--;p.finished=false}p.node=e.node;p.moved=true}}
function applyFlag(s,p){const id=eventCard(s);p.flags++;addLog(s,`${EVENT_TITLES[id]} — ${p.name}`);switch(id){case 'lowfuel':if(p.fuel)p.fuel--;else p.needsPit=true;break;case 'fuel':p.fuel++;break;case 'turbo':p.remaining+=2;break;case 'spin':p.skips++;break;case 'repair':p.repair++;break;case 'guard':p.guard++;break;case 'cones':p.cones+=2;break;case 'cheat':reverse(s,p,3);break;case 'catch':p.remaining+=3;break;case 'nitro':p.nitro=true;break;case 'flat':p.flat=true;break}}
function resolve(s){while(s.active<s.players.length){const p=s.players[s.active];if(p.finished){p.remaining=0;s.active++;continue}let steps=0;while(p.remaining>0&&steps++<100&&!p.finished){const r=step(s,p);if(r==='choice')return;if(r==='pit'||r==='error')break}if(p.finished)p.remaining=0;
 if(p.pitStage<0&&p.node!==TRACK.start&&p.moved&&!p.finished&&p.node!==p.triggeredNode){const kind=TRACK.nodes[p.node].type;p.triggeredNode=p.node;if(kind==='boost'&&p.bonuses<2){p.bonuses++;const extra=card(p);p.remaining+=extra;addLog(s,`⚡ ${p.name} gets an extra +${extra} card!`);continue}if(kind==='flag'&&p.flags<2){applyFlag(s,p);if(p.remaining>0)continue}}
 p.remaining=0;s.active++}
 // Resolve all end-of-round collisions after simultaneous card movement.
 const spots={};for(const p of s.players){if(TRACK.nodes[p.node].type==='pit')continue;(spots[p.node]??=[]).push(p)}for(const same of Object.values(spots)){if(same.length<2||!same.some(p=>p.moved))continue;for(const p of same){if(p.finished)continue;if(p.guard>0){p.guard--;addLog(s,`🛡️ ${p.name} blocks a crash!`)}else{p.skips++;if(p.repair>0){p.repair--;addLog(s,`🔧 ${p.name} uses a repair kit.`)}else{p.needsPit=true;addLog(s,`💥 ${p.name} crashes — skip a flip and pit!`)}}}}
 const finished=s.players.filter(p=>p.finished);if(finished.length){const best=Math.max(...finished.map(p=>p.overshoot));s.winner=finished.filter(p=>p.overshoot===best).map(p=>p.id);s.phase='done';return}
 s.round++;prepare(s);
}
function reveal(s){if(s.phase!=='flip'||!s.players.every(p=>p.ready))return;s.phase='resolve';addLog(s,`🃏 ROUND ${s.round}: ${s.players.map(p=>p.name+' '+(p.card??'—')).join(' · ')}`);s.active=0;for(const p of s.players){if(p.pitStage===0){p.pitStage=1;p.node=TRACK.pit.one;addLog(s,`🔧 ${p.name} PIT 1.`)}else if(p.pitStage===1){p.pitStage=2;p.node=TRACK.pit.two;addLog(s,`🔧 ${p.name} PIT 2.`)}else if(p.skips>0){p.skips--;addLog(s,`🌀 ${p.name} misses this flip.`)}else if(p.card!=null){p.remaining=Math.max(0,p.card+(p.nitro?1:0)-(p.flat?1:0)-p.cones);p.cones=0}}resolve(s)}
export function action(s,playerId,op){const p=s.players[playerId];if(!p||p.isBot||s.phase==='done')return false;if(s.phase==='choice'){if(s.choice!==playerId)return false;if(op==='route'){p.selected=(p.selected+1)%TRACK.forks[p.node].length;return true}if(op==='flip'){p.selectedNode=TRACK.forks[p.node][p.selected].first;s.phase='resolve';s.choice=null;addLog(s,`🛣️ ${p.name} chooses ${TRACK.forks[p.node][p.selected].name}.`);resolve(s);return true}return false}if(s.phase==='flip'&&op==='flip'&&!p.ready){p.card=card(p);p.ready=true;if(s.players.every(q=>q.ready))reveal(s);return true}return false}
export function publicGame(s){if(!s)return null;return {round:s.round,phase:s.phase,choice:s.choice,logs:s.logs,winner:s.winner,humans:1,players:s.players.map(p=>({id:p.id,name:p.name,displayName:p.displayName,isBot:p.isBot,cpu:p.isBot,node:p.node,laps:p.laps,card:s.phase==='flip'?null:p.card,ready:p.ready,remaining:p.remaining,skips:p.skips,needsPit:p.needsPit,pitStage:p.pitStage,fuel:p.fuel,repair:p.repair,guard:p.guard,cones:p.cones,nitro:p.nitro,flat:p.flat,moved:p.moved,finished:p.finished,overshoot:p.overshoot,bonuses:p.bonuses,flags:p.flags,flipCount:p.flipCount,selected:p.selected,selectedNode:p.selectedNode,history:[],triggeredNode:p.triggeredNode}))}}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','Access-Control-Allow-Origin':'*'}});
const cleanName=x=>String(x||'RACER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,18)||'RACER';
const validCode=x=>/^[A-HJ-NP-Z2-9]{6}$/.test(x);
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>alphabet[x%alphabet.length]).join('');
const token=()=>crypto.randomUUID()+'.'+crypto.randomUUID();
export default {async fetch(request,env){const url=new URL(request.url),path=url.pathname;
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
 if(path==='/api/health')return json({ok:true,game:'Flip Cars',version:3});
 if(request.method==='POST'&&path==='/api/rooms') {let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)};for(let i=0;i<5;i++){let code=roomCode(),id=env.ROOMS.idFromName(code),stub=env.ROOMS.get(id);const result=await stub.fetch(new Request('https://room.internal/init',{method:'POST',body:JSON.stringify({name:cleanName(body?.name),code})}));if(result.ok)return result}return json({error:'Unable to allocate room'},503)}
 const m=path.match(/^\/api\/rooms\/([A-Z0-9]{6})\/(join|ws|snapshot)$/);if(!m||!validCode(m[1]))return json({error:'Not found'},404);const code=m[1],mode=m[2],stub=env.ROOMS.get(env.ROOMS.idFromName(code));
 if(mode==='join'&&request.method==='POST'){let body;try{body=await request.json()}catch{return json({error:'Invalid JSON'},400)};return stub.fetch(new Request('https://room.internal/join',{method:'POST',body:JSON.stringify({name:cleanName(body?.name)})}))}
 if(mode==='ws'&&request.headers.get('Upgrade')==='websocket'){return stub.fetch(new Request('https://room.internal/ws',{headers:request.headers}))}
 if(mode==='snapshot'&&request.method==='GET')return stub.fetch(new Request('https://room.internal/snapshot',{headers:request.headers}));
 return json({error:'Unsupported request'},405)
 }};
export class GameRoom {
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async data(){return await this.ctx.storage.get('room')||null}
 async save(r){r.updated=Date.now();await this.ctx.storage.put('room',r)}
 present(r){return {type:'snapshot',code:r.code,started:r.started,host:r.hostId,members:r.members.map(m=>({id:m.id,name:m.name,isBot:m.isBot,online:this.ctx.getWebSockets().some(w=>w.deserializeAttachment()?.id===m.id)})),game:publicGame(r.game)}}
 broadcast(r){const message=JSON.stringify(this.present(r));for(const ws of this.ctx.getWebSockets()){try{ws.send(message)}catch{}}}
 async fetch(req){return this.ctx.blockConcurrencyWhile(()=>this.handleFetch(req))}
 async handleFetch(req){let url=new URL(req.url),path=url.pathname;
 if(path==='/init'&&req.method==='POST'){if(await this.data())return json({error:'Room already exists'},409);const body=await req.json();const t=token();const r={code:body.code,hostId:0,started:false,game:null,members:[{id:0,name:cleanName(body?.name),token:t,isBot:false}],updated:Date.now()};await this.save(r);await this.ctx.storage.setAlarm(Date.now()+24*3600000);return json({code:r.code,token:t,playerId:0,host:true})}
 const r=await this.data();if(!r)return json({error:'Room not found or expired'},404);
 if(path==='/join'&&req.method==='POST'){if(r.started)return json({error:'Race already started'},409);const actual=r.members.filter(m=>!m.isBot);if(actual.length>=4)return json({error:'Room is full'},409);const data=await req.json();const id=r.members.length,t=token();r.members.push({id,name:cleanName(data.name),token:t,isBot:false});await this.save(r);this.broadcast(r);return json({code:r.code,token:t,playerId:id,host:false})}
 if(path==='/snapshot'){if(!r.members.some(m=>!m.isBot&&req.headers.get('Authorization')==='Bearer '+m.token))return json({error:'Unauthorized'},401);return json({code:r.code,started:r.started,members:r.members.map(m=>({id:m.id,name:m.name,isBot:m.isBot})),game:publicGame(r.game)});}
 if(path==='/ws'&&req.headers.get('Upgrade')==='websocket'){const protocols=(req.headers.get('Sec-WebSocket-Protocol')||'').split(',').map(s=>s.trim());const t=protocols.find(p=>p.startsWith('seat.'))?.slice(5);if(!protocols.includes('flipcars'))return json({error:'Unauthorized'},401);const member=r.members.find(m=>!m.isBot&&m.token===t);if(!member)return json({error:'Unauthorized'},401);const pair=new WebSocketPair(),[client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);server.serializeAttachment({id:member.id});if(r.game?.players[member.id]){r.game.players[member.id].isBot=false;r.game.players[member.id].cpu=false;await this.save(r)}server.send(JSON.stringify({...this.present(r),type:'welcome',playerId:member.id}));this.broadcast(r);return new Response(null,{status:101,webSocket:client,headers:{'Sec-WebSocket-Protocol':'flipcars'}})}
 return json({error:'Not found'},404)
 }
 async webSocketMessage(ws,message){return this.ctx.blockConcurrencyWhile(async()=>{const id=ws.deserializeAttachment()?.id;if(!Number.isInteger(id))return;if(typeof message!=='string'||message.length>1024)return;let data;try{data=JSON.parse(message)}catch{return}if(!data||typeof data!=='object'||Array.isArray(data))return;const r=await this.data();if(!r)return;const m=r.members.find(m=>m.id===id);if(!m||m.isBot)return;
 if(data.type==='start'&&!r.started&&id===r.hostId){let cpu=Math.max(0,Math.min(4-r.members.length,Math.floor(Number(data.cpu)||0)));while(cpu--){const index=r.members.length;r.members.push({id:index,name:'CPU '+COLORS[index],token:null,isBot:true})}if(r.members.length<2){ws.send(JSON.stringify({type:'error',error:'Invite a friend or add at least one CPU racer.'}));return}r.started=true;r.game=startRace(r.members);await this.save(r);this.broadcast(r);return}
 if(data.type==='action'&&r.started&&r.game){let changed=action(r.game,id,data.op);if(changed){await this.save(r);this.broadcast(r)}}
 })}
 async webSocketClose(ws){return this.ctx.blockConcurrencyWhile(async()=>{const r=await this.data();if(!r)return;const id=ws.deserializeAttachment()?.id;const other=this.ctx.getWebSockets().some(w=>w!==ws&&w.deserializeAttachment()?.id===id);if(r.started&&!other&&Number.isInteger(id)){const p=r.game?.players[id];if(p&&!p.finished){p.isBot=true;p.cpu=true;if(r.game.phase==='flip'&&!p.ready){p.isBot=false;action(r.game,id,'flip');p.isBot=true}if(r.game.phase==='choice'&&r.game.choice===id){p.selectedNode=TRACK.forks[p.node][0].first;r.game.phase='resolve';r.game.choice=null;resolve(r.game)}await this.save(r)}}this.broadcast(r)})}
 async alarm(){const r=await this.data();if(r&&Date.now()-r.updated>=24*3600000){for(const ws of this.ctx.getWebSockets())try{ws.close(1000,'Room expired')}catch{}await this.ctx.storage.deleteAll()}else await this.ctx.storage.setAlarm(Date.now()+24*3600000)}
}
