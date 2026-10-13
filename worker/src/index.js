import {socialApi,SocialDirectory} from './social.js';
export {SocialDirectory};
// Flip Cars 4 — server-authoritative Cloudflare Durable Object racing and combat.
// Room and profile tokens are secrets; they never appear in invitations or public snapshots.
const COLORS=['RED','BLUE','YELLOW','GREEN'];
const DEFAULT_SETTINGS={combat:true,flags:true,turbos:true,laps:3,mode:'classic'};
// Match rules are authoritative; preserve boolean rules and validate the race length.
export const sanitizeSettings=x=>({combat:x?.combat!==false,flags:x?.flags!==false,turbos:x?.turbos!==false,laps:x?.mode==='team'?2:([3,5,10].includes(Number(x?.laps))?Number(x.laps):3),mode:x?.mode==='team'?'team':'classic'});
const MOVEMENT=[...Array(8).fill(1),...Array(7).fill(2),...Array(5).fill(3),...Array(4).fill(4),...Array(3).fill(5)];
const EVENTS={lowfuel:3,fuel:3,turbo:4,spin:3,repair:2,guard:2,cones:3,cheat:2,catch:2,nitro:2,flat:2};
export const COMBAT_COUNTS={oil:9,spikes:7,missile:7,sniper:4,stall:1,bubble:3};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const deck=()=>shuffle(MOVEMENT); const eventDeck=(cfg=DEFAULT_SETTINGS)=>shuffle(Object.entries(EVENTS).filter(([x])=>cfg.turbos||!['turbo','nitro'].includes(x)).flatMap(([x,n])=>Array(n).fill(x)));
const combatDeck=()=>shuffle(Object.entries(COMBAT_COUNTS).flatMap(([x,n])=>Array(n).fill(x)));
function trackGraph(){
 const nodes={},forks={};let num=0;
 const node=(x,y,type='normal')=>{let id='s'+num++;nodes[id]={id,x,y,type,next:null};return id};
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function resample(points,spacing=65){let len=[],sum=0;for(let i=1;i<points.length;i++){sum+=dist(points[i-1],points[i]);len.push(sum)}let count=Math.max(2,Math.round(sum/spacing)),arr=[];for(let k=0;k<=count;k++){let target=sum*k/count,idx=len.findIndex(x=>x>=target);if(idx<0)idx=len.length-1;let prev=idx?len[idx-1]:0,t=(target-prev)/Math.max(1,len[idx]-prev);arr.push([points[idx][0]+t*(points[idx+1][0]-points[idx][0]),points[idx][1]+t*(points[idx+1][1]-points[idx][1])])}return arr}
 function road(from,to,via,risk=0){let coords=resample([[nodes[from].x,nodes[from].y],...via,[nodes[to].x,nodes[to].y]]),prev=from,ids=[];for(let i=1;i<coords.length-1;i++){let flag=(i+Math.round(risk))%(risk?3:6)===0,boost=(i+(risk?1:2))%(risk?8:11)===0,id=node(coords[i][0],coords[i][1],flag?'flag':boost?'boost':'normal');if(!nodes[prev].next)nodes[prev].next=id;prev=id;ids.push(id)}if(!nodes[prev].next)nodes[prev].next=to;return {first:ids[0]||to,ids}}
 const start=node(565,665,'start'),fork1=node(885,595,'fork'),merge1=node(900,235,'merge'),fork2=node(805,153,'fork'),merge2=node(385,155,'merge'),fork3=node(220,276,'fork'),merge3=node(260,590,'merge');
 road(start,fork1,[[700,665],[790,639]]);
 forks[fork1]=[{name:'INSIDE SPRINT',...road(fork1,merge1,[[768,540],[767,410],[809,310]])},{name:'OUTER THRILL',...road(fork1,merge1,[[1055,570],[1093,465],[1058,342]],1)}];
 road(merge1,fork2,[[862,186]]);
 forks[fork2]=[{name:'SKYLINE',...road(fork2,merge2,[[689,65],[507,65]],1)},{name:'EXPRESS',...road(fork2,merge2,[[645,154],[535,154]])},{name:'RIVERSIDE',...road(fork2,merge2,[[690,285],[514,285]],1)}];
 road(merge2,fork3,[[279,204]]);
 forks[fork3]=[{name:'FOREST LOOP',...road(fork3,merge3,[[110,315],[88,470],[133,556]],1)},{name:'TUNNEL CUT',...road(fork3,merge3,[[351,352],[351,513]])}];
 const approach=road(merge3,start,[[367,650],[468,665]]),beforeStart=approach.ids.at(-1),afterStart=nodes[start].next;
 for(const id of Object.keys(forks))nodes[id].next=null;
 const pitWait=node(450,739,'pit'),pitOne=node(515,739,'pit'),pitTwo=node(581,739,'pit');
 const combat=new Set(Object.values(nodes).filter(n=>n.type==='normal'&&parseInt(n.id.slice(1),10)%13===6).map(n=>n.id));
 return {nodes,forks,start,combat,pit:{wait:pitWait,one:pitOne,two:pitTwo,approach:beforeStart,exit:afterStart}};
}
export const TRACK=trackGraph();
export function distanceForward(from,to,max=10){if(from===to)return -1;let queue=[[from,0]],seen=new Set([from]);while(queue.length){let [id,d]=queue.shift();if(d>=max)continue;const next=[TRACK.nodes[id]?.next,...(TRACK.forks[id]||[]).map(o=>o.first)].filter(Boolean);for(let k of next){if(k===to)return d+1;if(!seen.has(k)){seen.add(k);queue.push([k,d+1])}}}return -1}
const log=(s,t)=>{s.logs.unshift(t);s.logs=s.logs.slice(0,9)};
const movement=p=>{if(!p.deck.length)p.deck=deck();p.flipCount++;return p.deck.pop()};
const event=s=>{if(!s.eventDeck.length)s.eventDeck=eventDeck(s.settings);return s.eventDeck.pop()};
const weapon=s=>{if(!s.combatDeck.length)s.combatDeck=combatDeck();return s.combatDeck.pop()};
function makePlayer(id,m){return {id,name:m.name||('AI Racer '+(id+1)),displayName:m.name||('AI Racer '+(id+1)),secondary:m.secondary||'',profileId:m.profileId||null,color:m.color||COLORS[id],isBot:!!m.isBot,cpu:!!m.isBot,node:TRACK.start,laps:0,deck:deck(),card:null,ready:false,remaining:0,skips:0,needsPit:false,pitStage:-1,fuel:0,repair:0,guard:0,cones:0,nitro:false,flat:false,tireDamaged:false,history:[],moved:false,finished:false,finishRound:null,overshoot:0,bonuses:0,flags:0,flipCount:0,selected:0,selectedNode:null,triggeredNode:null,combat:[],pendingCombat:null,combatUses:0,combatHits:0,crashes:0,spinUntil:0,crashUntil:0,bubble:false,team:m.team??-1,relayRole:m.relayRole||'',relayWaiting:!!m.relayWaiting,relayRetired:false,deviceGroup:m.deviceGroup||''}}
function prepare(s){if(s.phase==='done')return;s.phase='flip';s.choice=null;for(const p of s.players){p.ready=false;p.card=null;p.moved=false;p.remaining=0;p.bonuses=0;p.flags=0;if(!p.finished)p.overshoot=0;p.selected=0;p.selectedNode=null;p.triggeredNode=null;if(p.finished||p.relayWaiting||p.pitStage===0||p.pitStage===1||p.skips>0){p.ready=true}else if(p.isBot){p.card=movement(p);p.ready=true}}if(s.players.every(p=>p.ready)&&!activeHandoffs(s).length)reveal(s)}
export function startRace(members,settings=DEFAULT_SETTINGS){const lastShifts=settings.lastShifts||{};settings=sanitizeSettings(settings);const s={version:4,round:1,phase:'lobby',players:members.map((m,i)=>makePlayer(i,m)),settings,placements:[],eventDeck:eventDeck(settings),combatDeck:combatDeck(),traps:[],active:0,choice:null,logs:['🏁 Flip together! The combat deck is live.'],winner:null,handoff:null,handoffs:[],lastShifts:{...lastShifts},lastTaunt:null,tauntCount:0};if(settings.mode==='team'){s.settings.laps=2;for(const p of s.players){if(p.relayRole==='reserve'){p.relayWaiting=true;p.node=TRACK.pit.two;p.pitStage=-1;}else{p.relayWaiting=false;}}s.logs.unshift('🏎️ PIT WARS: reach the checkered line to release your reserve racer.')}prepare(s);return s}
export function validGearSequence(x){return typeof x==='string'&&x.length===4&&new Set(x).size===4&&[...'1234'].every(n=>x.includes(n))}
// Teams are assigned at race start: locally paired racers are kept together, even if seat IDs are nonadjacent.
export function assignRelayTeams(members){
 const groups=[];for(const m of members){let key=m.deviceGroup||'solo-'+m.id;let group=groups.find(g=>g.key===key);if(!group){group={key,members:[]};groups.push(group)}group.members.push(m)}
 if(groups.some(g=>g.members.length>2))throw Error('Maximum two racers per device in online parties.');
 const duos=groups.filter(g=>g.members.length===2),singles=groups.filter(g=>g.members.length===1);const pairs=duos.map(g=>[...g.members]);
 while(singles.length){let open=pairs.find(g=>g.length<2);if(!open){open=[];pairs.push(open)}open.push(singles.shift().members[0])}
 if(pairs.length!==2||pairs.some(g=>g.length!==2))throw Error('Team Racer requires four racers including AI.');
 pairs.forEach((group,team)=>group.forEach((m,i)=>{m.team=team;m.relayRole=i?'reserve':'lead'}));return members;
}
// Every team's relay is independent. Gear challenges never freeze the rival team's movement rounds.
function activeHandoffs(s){return s.handoffs||(s.handoffs=[])}
function relaySwap(s,h,penalty=false){
 const a=s.players[h.lead],b=s.players[h.reserve];
 a.relayRetired=true;a.finished=true;a.remaining=0;a.node=TRACK.pit.wait;a.pitStage=-1;
 b.relayWaiting=false;b.node=TRACK.pit.two;b.laps=1;b.history=[];b.pitStage=-1;
 // The reserve begins at PIT 2. Their FIRST movement step is PIT 2 -> exit merge, not a teleport.
 // No lap increment on that merge: the team has already completed lap one.
 if(penalty)b.skips++;
 if(s.phase==='flip'){
  if(penalty){b.ready=true;b.card=null}
  else if(b.isBot){b.card=movement(b);b.ready=true}
  else {b.ready=false;b.card=null}
 }
 log(s,`🔧 ${a.name} parks at pit entrance. ${b.name} takes over from PIT 2${penalty?' after a one-flip penalty':''}.`);
 s.handoffs=activeHandoffs(s).filter(x=>x!==h);s.handoff=s.handoffs[0]||null;
 if(s.phase==='flip'&&s.handoffs.length===0&&s.players.every(p=>p.ready))reveal(s);
}
function beginRelayHandoff(s,p){
 const b=s.players.find(x=>x.team===p.team&&x.relayRole==='reserve');if(!b)return;
 const shared=!!(p.deviceGroup&&p.deviceGroup===b.deviceGroup);
 p.relayRetired=true;p.finished=true;p.remaining=0;p.node=TRACK.pit.wait;p.pitStage=-1;
 log(s,`🏁 ${p.name} crosses the checkered line! ${b.name} stands by in PIT 2.`);
 const h={team:p.team,lead:p.id,reserve:b.id,stage:'lead',deadline:Date.now()+25000,submitted:{},valid:false,sequence:null};
 if(shared||p.isBot||b.isBot){
  log(s,shared?'🤝 Shared-device handoff: automatic.':'🤖 AI handoff: no guessing or interception.');
  relaySwap(s,h,false);return;
 }
 activeHandoffs(s).push(h);s.handoff=s.handoffs[0];
}
export function shiftAction(s,id,op,code,teamTarget=null){
 if(!validGearSequence(code))return false;
 const h=activeHandoffs(s).find(x=>(teamTarget==null||x.team===Number(teamTarget)) && (op==='set'?x.stage==='lead'&&id===x.lead:x.stage==='guess'&&(id===x.reserve||s.players.some(p=>p.id===id&&p.team!==x.team&&p.relayRole==='reserve'&&p.relayWaiting&&!p.isBot))));
 if(!h)return false;
 if(op==='set'){
  h.sequence=code;h.valid=code!==s.lastShifts[h.team];h.stage='guess';h.deadline=Date.now()+20000;
  log(s,`⚙️ ${s.players[id].name} locks a secret shift. Both pit racers may guess.`);return true;
 }
 if(op==='guess'&&!h.submitted[id]){
  const other=s.players.find(x=>x.team!==h.team&&x.relayRole==='reserve'&&x.relayWaiting&&!x.isBot);
  if(id!==h.reserve&&id!==other?.id)return false;
  h.submitted[id]={match:h.valid&&code===h.sequence,at:Date.now()};
  if(id===h.reserve){
   const intercepted=!!(other&&h.submitted[other.id]?.match),matched=h.submitted[id].match,penalty=!matched||intercepted;
   log(s,`⚙️ ${matched&&!penalty?'PERFECT SHIFT!':intercepted?'SHIFT INTERCEPTED!':'SHIFT MISSED!'} ${penalty?'One-turn delay.':'Seamless handoff.'}`);
   if(h.valid)s.lastShifts[h.team]=h.sequence;
   relaySwap(s,h,penalty);
  }return true;
 }
 return false;
}
export function expireHandoff(s){
 let changed=false;
 for(const h of [...activeHandoffs(s)])if(Date.now()>=h.deadline){
  log(s,'⏱️ Gear challenge timed out — one-turn pit delay.');
  relaySwap(s,h,true);changed=true;
 }
 return changed;
}
function cross(s,p){p.laps++;p.nitro=false;p.flat=false;p.cones=0;p.bubble=false;log(s,`🏁 ${p.name} lap ${p.laps}/${s.settings.laps}!`);if(s.settings.mode==='team'&&p.relayRole==='lead'&&p.laps===1){beginRelayHandoff(s,p);return}if(p.laps>=s.settings.laps){p.finished=true;p.finishRound=s.round;p.overshoot=p.remaining;log(s,`🏆 ${p.name} finishes!`)}}
function step(s,p){const {nodes,forks,pit,start}=TRACK;
 if(s.settings.mode==='team'&&p.relayRole==='reserve'&&!p.relayWaiting&&p.node===pit.two){p.node=pit.exit;p.remaining=Math.max(0,p.remaining-1);p.history.push({node:pit.two,lapCross:false});p.moved=true;log(s,`🏎️ ${p.name} merges from PIT 2 onto the course.`);return 'ok'}
 if(p.pitStage===2&&p.node===pit.two){p.pitStage=-1;p.needsPit=false;p.flat=false;p.tireDamaged=false;p.bubble=false;p.node=pit.exit;p.remaining=Math.max(0,p.remaining-1);p.history.push({node:pit.two,lapCross:true});p.moved=true;cross(s,p);log(s,`🔧 ${p.name} exits pit, repaired.`);return 'ok'}
 if(p.node===pit.approach&&p.needsPit){p.node=pit.wait;p.remaining=0;p.pitStage=0;p.needsPit=false;p.bubble=false;p.moved=true;log(s,`🔧 ${p.name} enters pit lane.`);return 'pit'}
 let next;if(forks[p.node]){if(!p.selectedNode){if(p.isBot){const opts=forks[p.node],short=opts.findIndex(o=>/INSIDE|EXPRESS|TUNNEL/.test(o.name)),ix=Math.random()<.6?Math.max(0,short):Math.floor(Math.random()*opts.length);p.selected=ix;p.selectedNode=opts[ix].first;log(s,`🛣️ ${p.name} takes ${opts[ix].name}.`)}else{s.phase='choice';s.choice=p.id;p.selected=0;return 'choice'}}next=p.selectedNode;p.selectedNode=null}else next=nodes[p.node].next;
 if(!next){p.remaining=0;log(s,'Track routing error.');return 'error'}let old=p.node;p.history.push({node:old,lapCross:next===start});if(p.history.length>360)p.history.shift();p.node=next;p.remaining--;p.moved=true;if(next===start&&old!==start)cross(s,p);return 'ok'}
function reverse(s,p,n){while(n-->0&&p.history.length){const e=p.history.pop();if(p.node===TRACK.start&&e.lapCross&&p.laps>0){p.laps--;p.finished=false}p.node=e.node;p.moved=true}}
function protectedHit(s,p,label){if(p.bubble){p.bubble=false;log(s,`🫧 ${p.name}'s bubble blocks ${label}!`);return true}return false}
function flag(s,p){let id=event(s);p.flags++;log(s,`⚑ ${p.name} draws ${id.toUpperCase()}`);switch(id){case 'lowfuel':if(p.fuel)p.fuel--;else p.needsPit=true;break;case 'fuel':p.fuel++;break;case 'turbo':p.remaining+=2;break;case 'spin':if(!protectedHit(s,p,'a spin-out')){p.skips++;p.spinUntil=s.round+1}break;case 'repair':if(p.tireDamaged){p.tireDamaged=false;p.needsPit=false;log(s,`🔧 ${p.name} repairs a puncture.`)}else p.repair++;break;case 'guard':p.guard++;break;case 'cones':p.cones+=2;break;case 'cheat':reverse(s,p,3);break;case 'catch':p.remaining+=3;break;case 'nitro':p.nitro=true;break;case 'flat':if(!protectedHit(s,p,'a flat tire'))p.flat=true;break}}
function giveCombat(s,p){let c=weapon(s);if(p.combat.length<2){p.combat.push(c);log(s,`🎴 ${p.name} draws a combat card (${p.combat.length}/2).`)}else if(p.isBot){p.combat[Math.floor(Math.random()*2)]=c;log(s,`🎴 ${p.name} swaps a combat card.`)}else{p.pendingCombat=c;log(s,`🎴 ${p.name} must replace a card or pass.`)}}
function resolve(s){while(s.active<s.players.length){const p=s.players[s.active];if(p.finished||p.relayWaiting){p.remaining=0;s.active++;continue}let steps=0;while(p.remaining>0&&steps++<100&&!p.finished){const r=step(s,p);if(r==='choice'||s.phase==='handoff'||r==='handoff')return;if(r==='pit'||r==='error')break}if(p.finished)p.remaining=0;
 if(p.pitStage<0&&p.node!==TRACK.start&&p.moved&&!p.finished&&p.node!==p.triggeredNode){const kind=TRACK.nodes[p.node].type;p.triggeredNode=p.node;if(s.settings.turbos&&kind==='boost'&&p.bonuses<2){p.bonuses++;let extra=movement(p);p.remaining+=extra;log(s,`⚡ ${p.name} boosts +${extra}!`);continue}if(s.settings.flags&&kind==='flag'&&p.flags<2){flag(s,p);if(p.remaining>0)continue}}
 p.remaining=0;s.active++}
 // Cards are awarded only for LANDING on a marked pickup tile.
 if(s.settings.combat)for(const p of s.players)if(p.moved&&!p.finished&&!p.relayWaiting&&p.pitStage<0&&TRACK.combat.has(p.node))giveCombat(s,p);
 for(const trap of [...s.traps]){const victims=s.players.filter(p=>p.node===trap.node&&p.moved&&p.id!==trap.owner&&!p.finished&&!p.relayWaiting);if(victims.length){for(const p of victims){if(!protectedHit(s,p,'an oil slick')){p.skips++;p.spinUntil=s.round+1;log(s,`🛢️ ${p.name} hits an oil slick! Spins out, loses next flip.`)}}s.traps=s.traps.filter(t=>t!==trap)}}
 const spots={};for(const p of s.players){if(TRACK.nodes[p.node].type==='pit')continue;(spots[p.node]??=[]).push(p)}for(const same of Object.values(spots)){if(same.length<2||!same.some(p=>p.moved))continue;for(const p of same){if(p.finished)continue;if(protectedHit(s,p,'a collision')){}else if(p.guard>0){p.guard--;log(s,`🛡️ ${p.name} blocks a collision.`)}else{p.skips++;p.crashes++;p.crashUntil=s.round+1;if(p.repair>0){p.repair--;log(s,`🔧 ${p.name} uses a repair kit.`)}else{p.needsPit=true;log(s,`💥 ${p.name} crashes: skip and pit!`)}}}}
 const finishers=s.players.filter(p=>p.finished&&!p.relayRetired).sort((a,b)=>(a.finishRound??s.round)-(b.finishRound??s.round)||b.overshoot-a.overshoot||a.id-b.id);
 s.placements=finishers.map((p,i)=>({id:p.id,place:i+1,round:p.finishRound??s.round,overshoot:p.overshoot}));
 if(finishers.length&&!s.winner){s.winner=[finishers[0].id]}
 if(finishers.length===(s.settings.mode==='team'?2:s.players.length)){s.phase='done';return}
 if(finishers.length)log(s,`${finishers.length} racers finished · waiting for remaining placements.`);
 s.round++;prepare(s);
}
function reveal(s){if(s.phase!=='flip'||!s.players.every(p=>p.ready))return;s.phase='resolve';log(s,`🃏 ROUND ${s.round}: ${s.players.map(p=>p.name+' '+(p.card??'—')).join(' · ')}`);s.active=0;for(const p of s.players){if(p.pitStage===0){p.pitStage=1;p.node=TRACK.pit.one}else if(p.pitStage===1){p.pitStage=2;p.node=TRACK.pit.two}else if(p.relayWaiting){/* reserve car stays staged in pit */}else if(p.skips>0){p.skips--;log(s,`🌀 ${p.name} misses this flip.`)}else if(p.card!=null){p.remaining=Math.max(0,p.card+(p.nitro?1:0)-(p.flat||p.tireDamaged?1:0)-p.cones);p.cones=0}}resolve(s)}
export function combatTargets(s,attacker,type){if(type==='oil'||type==='stall'||type==='bubble')return [];const max=type==='spikes'?3:type==='missile'?5:10;return s.players.filter(p=>p.id!==attacker.id&&!p.finished&&p.pitStage<0&&(type==='spikes'?distanceForward(p.node,attacker.node,max):distanceForward(attacker.node,p.node,max))>0).map(p=>p.id)}
export function useCombat(s,id,index,target){
 if(!s.settings.combat||s.phase!=='flip')return false;
 const p=s.players[id];if(!p||p.isBot||p.relayWaiting||p.relayRetired||p.ready||p.pendingCombat!=null||!Number.isInteger(index)||index<0||index>=p.combat.length)return false;
 const type=p.combat[index],targets=combatTargets(s,p,type);
 if(!['oil','stall','bubble'].includes(type)&&!targets.includes(target))return false;
 if(type==='oil'&&s.traps.some(t=>t.node===p.node))return false;
 if(type==='bubble'&&p.bubble)return false;
 p.combat.splice(index,1);p.combatUses++;
 if(type==='bubble'){p.bubble=true;log(s,`🫧 ${p.name} activates a bubble until its first hit, next lap, or pit.`);return true}
 if(type==='oil'){s.traps.push({node:p.node,owner:p.id,type:'oil'});log(s,`🛢️ ${p.name} lays oil on the track.`);return true}
 if(type==='stall'){for(const other of s.players)if(other.id!==id&&!other.finished&&!protectedHit(s,other,'engine stall')){other.skips++;other.spinUntil=s.round+1}log(s,`⚡ ${p.name} triggers ENGINE STALL!`);return true}
 const victim=s.players[target];
 if(protectedHit(s,victim,type))return true;
 if(type==='spikes'){victim.tireDamaged=true;victim.needsPit=true;log(s,`🪛 ${p.name} punctures ${victim.name}'s tires: -1 per flip until repair or pit.`)}
 if(type==='missile'||type==='sniper'){
  if(victim.guard>0){victim.guard--;log(s,`🛡️ ${victim.name} blocks a rocket.`)}
  else {victim.crashes++;victim.crashUntil=s.round+1;victim.skips++;
   if(victim.repair>0){victim.repair--;log(s,`🔧 ${victim.name} uses a repair kit to avoid pit.`)}
   else{victim.needsPit=true;log(s,`🚀 ${p.name} hits ${victim.name}: skip and pit!`)}}
  if(type==='sniper')victim.tireDamaged=true;
 }
 p.combatHits++;return true
}
export function action(s,playerId,op,arg={}){const p=s.players[playerId];if(!p||p.isBot||p.relayWaiting||p.relayRetired||s.phase==='done')return false;
 if(op==='discard'&&s.phase==='flip'&&p.pendingCombat){if(arg.index===-1){p.pendingCombat=null;return true}if(Number.isInteger(arg.index)&&arg.index>=0&&arg.index<2){p.combat[arg.index]=p.pendingCombat;p.pendingCombat=null;return true}return false}
 if(op==='combat')return useCombat(s,playerId,arg.index,arg.target);
 if(s.phase==='choice'){if(s.choice!==playerId)return false;if(op==='route'){p.selected=(p.selected+1)%TRACK.forks[p.node].length;return true}if(op==='flip'){p.selectedNode=TRACK.forks[p.node][p.selected].first;s.phase='resolve';s.choice=null;log(s,`🛣️ ${p.name} chooses ${TRACK.forks[p.node][p.selected].name}.`);resolve(s);return true}return false}
 if(s.phase==='flip'&&op==='flip'&&!p.ready&&!p.pendingCombat){p.card=movement(p);p.ready=true;if(s.players.every(q=>q.ready))reveal(s);return true}return false}
export function publicGame(s,viewerId=-1){if(!s)return null;return {version:4,round:s.round,phase:s.phase,handoffs:activeHandoffs(s).map(h=>({team:h.team,lead:h.lead,reserve:h.reserve,stage:h.stage,deadline:h.deadline,submitted:Object.keys(h.submitted||{}),previous:s.lastShifts[h.team]||''})),handoff:s.handoff?{team:s.handoff.team,lead:s.handoff.lead,reserve:s.handoff.reserve,stage:s.handoff.stage,deadline:s.handoff.deadline,submitted:Object.keys(s.handoff.submitted||{}),previous:s.lastShifts[s.handoff.team]||''}:null,lastTaunt:s.lastTaunt,lastSignal:s.lastSignal||null,choice:s.choice,logs:s.logs,winner:s.winner,placements:s.placements||[],settings:s.settings||DEFAULT_SETTINGS,traps:s.traps,humans:1,players:s.players.map(p=>({id:p.id,name:p.name,displayName:p.displayName,profileId:p.profileId||null,color:p.color,secondary:p.secondary||'',isBot:p.isBot,cpu:p.isBot,team:p.team,relayRole:p.relayRole,relayWaiting:p.relayWaiting,relayRetired:p.relayRetired,lastTauntRound:p.lastTauntRound??-2,deviceGroup:p.deviceGroup,node:p.node,laps:p.laps,card:s.phase==='flip'?null:p.card,ready:p.ready,remaining:p.remaining,skips:p.skips,needsPit:p.needsPit,pitStage:p.pitStage,fuel:p.fuel,repair:p.repair,guard:p.guard,cones:p.cones,nitro:p.nitro,flat:p.flat,tireDamaged:p.tireDamaged,moved:p.moved,finished:p.finished,overshoot:p.overshoot,bonuses:p.bonuses,flags:p.flags,flipCount:p.flipCount,selected:p.selected,selectedNode:p.selectedNode,history:[],triggeredNode:p.triggeredNode,combat:p.id===viewerId?p.combat:[],combatCount:p.combat.length,bubble:p.bubble,pendingCombat:p.id===viewerId?p.pendingCombat:null,combatUses:p.combatUses,combatHits:p.combatHits,crashes:p.crashes,spinUntil:p.spinUntil,crashUntil:p.crashUntil}))}}
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store','Access-Control-Allow-Origin':'*'}});
const cleanName=x=>String(x||'RACER').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,18)||'RACER';
const cleanColor=x=>['RED','BLUE','YELLOW','GREEN','PURPLE','ORANGE','WHITE','PINK'].includes(String(x).toUpperCase())?String(x).toUpperCase():'RED';

export const CAR_FINISHES=['BLACK','WHITE','SILVER','GOLD'];
const cleanSecondary=x=>CAR_FINISHES.includes(String(x||'').toUpperCase())?String(x).toUpperCase():'AUTO';
// Race nicknames are case-insensitively unique WITHIN EACH PARTY. Global Friends tags are reserved in SocialDirectory.
export function uniqueRoomName(requested,members=[]){const base=cleanName(requested),used=new Set(members.map(m=>String(m.name||'').toLowerCase()));if(!used.has(base.toLowerCase()))return base;for(let i=2;i<100;i++){const suffix='-'+i;const candidate=base.slice(0,18-suffix.length)+suffix;if(!used.has(candidate.toLowerCase()))return candidate}throw Error('Room name limit reached')}
export function uniqueSecondary(primary,requested,members=[]){const same=members.filter(m=>m.color===primary);const preferred=cleanSecondary(requested);const used=new Set(same.map(m=>m.secondary||''));if(preferred!=='AUTO'&&!used.has(preferred))return preferred;if(same.length===0&&preferred==='AUTO')return '';return CAR_FINISHES.find(c=>!used.has(c))||''}

const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code=(len=6)=>Array.from(crypto.getRandomValues(new Uint8Array(len)),x=>alphabet[x%alphabet.length]).join('');
const token=()=>crypto.randomUUID()+'.'+crypto.randomUUID();
async function verifiedProfile(env,b){try{const id=String(b?.profileId||'');if(!env.PROFILES||!/^[A-HJ-NP-Z2-9]{10}$/.test(id))return null;const res=await env.PROFILES.get(env.PROFILES.idFromName(id)).fetch(new Request('https://profile.internal/verify',{headers:{Authorization:'Bearer '+String(b.profileToken||'')}}));return res.ok?id:null}catch{return null}}

export default {async fetch(req,env){const url=new URL(req.url),path=url.pathname;
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-driver-id','Access-Control-Allow-Methods':'GET,POST,OPTIONS'}});
 if(path==='/api/health')return json({ok:true,game:'Flip Cars',version:'4.5',hybrid:true,teamRelay:true,combat:true,placements:true,matchOptions:true,social:!!env.PROFILES,socialV2:!!env.SOCIAL});
 if(path.startsWith('/api/social/'))return socialApi(req,env,verifiedProfile);
 if(path==='/api/profile/create'&&req.method==='POST'){let b;try{b=await req.json()}catch{return json({error:'Bad JSON'},400)}const id=code(10),secret=token(),stub=env.PROFILES?.get(env.PROFILES.idFromName(id));if(!stub)return json({error:'Profiles not configured'},503);return stub.fetch(new Request('https://profile.internal/create',{method:'POST',body:JSON.stringify({id,secret,name:cleanName(b.name)})}))}
 const pm=path.match(/^\/api\/profile\/([A-HJ-NP-Z2-9]{10})\/(view|friend|remove|stats|update)$/);if(pm){if(!env.PROFILES)return json({error:'Profiles unavailable'},503);let auth=req.headers.get('authorization')||'',stub=env.PROFILES.get(env.PROFILES.idFromName(pm[1]));return stub.fetch(new Request('https://profile.internal/'+pm[2],{method:req.method,headers:{Authorization:auth},body:req.method==='POST'?await req.text():undefined}))}
 if(path==='/api/rooms'&&req.method==='POST'){let b;try{b=await req.json()}catch{return json({error:'Bad JSON'},400)}
 const additional=b.plusOne?{name:cleanName(b.plusOne.name),color:cleanColor(b.plusOne.color),secondary:cleanSecondary(b.plusOne.secondary)}:null;
 for(let i=0;i<5;i++){let c=code(),stub=env.ROOMS.get(env.ROOMS.idFromName(c));const result=await stub.fetch(new Request('https://room.internal/init',{method:'POST',body:JSON.stringify({name:cleanName(b.name),color:cleanColor(b.color),secondary:cleanSecondary(b.secondary),profileId:await verifiedProfile(env,b),plusOne:additional,code:c})}));if(result.ok)return result}return json({error:'Could not create room'},503)}
 const m=path.match(/^\/api\/rooms\/([A-HJ-NP-Z2-9]{6})\/(join|ws|snapshot)$/);if(!m)return json({error:'Not found'},404);const stub=env.ROOMS.get(env.ROOMS.idFromName(m[1]));if(m[2]==='join'&&req.method==='POST'){let b;try{b=await req.json()}catch{return json({error:'Bad JSON'},400)}return stub.fetch(new Request('https://room.internal/join',{method:'POST',body:JSON.stringify({name:cleanName(b.name),color:cleanColor(b.color),secondary:cleanSecondary(b.secondary),profileId:await verifiedProfile(env,b),plusOne:b.plusOne?{name:cleanName(b.plusOne.name),color:cleanColor(b.plusOne.color),secondary:cleanSecondary(b.plusOne.secondary)}:null})}));}if(m[2]==='ws'&&req.headers.get('upgrade')==='websocket')return stub.fetch(new Request('https://room.internal/ws',{headers:req.headers}));if(m[2]==='snapshot'&&req.method==='GET')return stub.fetch(new Request('https://room.internal/snapshot',{headers:req.headers}));return json({error:'Unsupported'},405)
}};
export class GameRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async data(){return await this.ctx.storage.get('room')||null}
 async save(r){r.updated=Date.now();await this.ctx.storage.put('room',r)}
 async award(r){if(r.awarded||!r.game||r.game.phase!=='done')return;r.awarded=true;for(const member of r.members){if(!member.profileId||member.isBot)continue;try{const profile=this.env.PROFILES.get(this.env.PROFILES.idFromName(member.profileId));await profile.fetch(new Request('https://profile.internal/award',{method:'POST',body:JSON.stringify({race:r.code,win:r.game.winner?.includes(member.id)||!!(r.settings.mode==='team'&&r.game.players[member.id]?.team===r.game.players[r.game.winner?.[0]]?.team),flips:r.game.players[member.id]?.flipCount||0,combat:r.game.players[member.id]?.combatUses||0,place:r.game.placements?.find(x=>x.id===member.id)?.place||(r.settings.mode==='team'?r.game.placements?.find(x=>r.game.players[x.id]?.team===r.game.players[member.id]?.team)?.place||0:0)})}))}catch(e){console.warn('Profile award deferred',String(e))}}}

 present(r,viewer=-1){return {type:'snapshot',code:r.code,started:r.started,host:r.hostId,settings:r.settings||DEFAULT_SETTINGS,members:r.members.map(m=>({id:m.id,name:m.name,color:m.color,secondary:m.secondary||'',isBot:m.isBot,profileId:m.profileId||null,deviceGroup:m.deviceGroup||'',team:m.team??-1,relayRole:m.relayRole||'',online:this.ctx.getWebSockets().some(w=>w.deserializeAttachment()?.id===m.id)})),game:publicGame(r.game,viewer)}}
 broadcast(r){for(const ws of this.ctx.getWebSockets())try{ws.send(JSON.stringify(this.present(r,ws.deserializeAttachment()?.id)))}catch{}}
 async fetch(req){return this.ctx.blockConcurrencyWhile(()=>this.handleFetch(req))}
 async handleFetch(req){const path=new URL(req.url).pathname;
  if(path==='/init'&&req.method==='POST'){if(await this.data())return json({error:'Room already used'},409);const b=await req.json(),secret=token(),group=crypto.randomUUID(),r={code:b.code,hostId:0,started:false,game:null,settings:sanitizeSettings(b.settings),lastShifts:{},members:[{id:0,name:cleanName(b.name),color:cleanColor(b.color),secondary:uniqueSecondary(cleanColor(b.color),b.secondary,[]),profileId:b.profileId||null,token:secret,isBot:false,deviceGroup:group}],updated:Date.now()};
 const seats=[{id:0,token:secret}];if(b.plusOne){const m=b.plusOne,t=token();r.members.push({id:1,name:uniqueRoomName(m.name,r.members),color:cleanColor(m.color),secondary:uniqueSecondary(cleanColor(m.color),m.secondary,r.members),profileId:null,token:t,isBot:false,deviceGroup:group});seats.push({id:1,token:t})}await this.save(r);await this.ctx.storage.setAlarm(Date.now()+24*3600000);return json({code:r.code,token:secret,playerId:0,host:true,seats})}
  const r=await this.data();if(!r)return json({error:'Room expired or not found'},404);
  if(path==='/invite-authorize'){const id=req.headers.get('x-profile-id');return !r.started&&r.members.length<4&&r.members[r.hostId]?.profileId===id?json({ok:true}):json({error:'Host only'},403)}
  if(path==='/join'&&req.method==='POST'){if(r.started)return json({error:'Race already started'},409);const b=await req.json(),wanted=b.plusOne?2:1;if(r.members.length+wanted>4)return json({error:`Only ${4-r.members.length} seat(s) remain. Join as solo. `},409);const group=crypto.randomUUID(),seats=[];for(const [index,m] of [b,b.plusOne].entries()){if(!m)continue;const id=r.members.length,secret=token(),color=cleanColor(m.color);r.members.push({id,name:uniqueRoomName(m.name,r.members),color,secondary:uniqueSecondary(color,m.secondary,r.members),profileId:index===0?b.profileId||null:null,token:secret,isBot:false,deviceGroup:group});seats.push({id,token:secret})}await this.save(r);this.broadcast(r);return json({code:r.code,token:seats[0].token,playerId:seats[0].id,host:false,seats})}
  if(path==='/snapshot'){let m=r.members.find(m=>!m.isBot&&req.headers.get('Authorization')==='Bearer '+m.token);if(!m)return json({error:'Unauthorized'},401);return json(this.present(r,m.id))}
  if(path==='/ws'&&req.headers.get('upgrade')==='websocket'){const protocols=(req.headers.get('Sec-WebSocket-Protocol')||'').split(',').map(s=>s.trim()),t=protocols.find(x=>x.startsWith('seat.'))?.slice(5);if(!protocols.includes('flipcars'))return json({error:'Unauthorized'},401);const m=r.members.find(m=>!m.isBot&&m.token===t);if(!m)return json({error:'Unauthorized'},401);const pair=new WebSocketPair(),[client,server]=Object.values(pair);this.ctx.acceptWebSocket(server);server.serializeAttachment({id:m.id});if(r.game?.players[m.id]){r.game.players[m.id].isBot=false;r.game.players[m.id].cpu=false;await this.save(r)}server.send(JSON.stringify({...this.present(r,m.id),type:'welcome',playerId:m.id}));this.broadcast(r);return new Response(null,{status:101,webSocket:client,headers:{'Sec-WebSocket-Protocol':'flipcars'}})}
  return json({error:'Not found'},404)}
 async webSocketMessage(ws,message){return this.ctx.blockConcurrencyWhile(async()=>{let id=ws.deserializeAttachment()?.id;if(!Number.isInteger(id)||typeof message!=='string'||message.length>1024)return;let msg;try{msg=JSON.parse(message)}catch{return}if(!msg||typeof msg!=='object'||Array.isArray(msg))return;const r=await this.data();if(!r||!r.members.some(m=>m.id===id&&!m.isBot))return;
 if(msg.type==='start'&&!r.started&&id===r.hostId){let cpu=Math.max(0,Math.min(4-r.members.length,Math.floor(Number(msg.cpu)||0)));while(cpu--){let i=r.members.length;r.members.push({id:i,name:uniqueRoomName('AI Racer '+(r.members.filter(m=>m.isBot).length+1),r.members),color:COLORS[i],secondary:uniqueSecondary(COLORS[i],'AUTO',r.members),token:null,isBot:true,deviceGroup:'ai-'+i})}if(r.members.length<2){ws.send(JSON.stringify({type:'error',error:'Add a friend or a CPU racer.'}));return}r.started=true;r.awarded=false;r.settings=sanitizeSettings(msg.settings);if(r.settings.mode==='team'){if(r.members.length!==4){ws.send(JSON.stringify({type:'error',error:'Team Racer needs exactly four racers (AI may fill seats).'}));r.started=false;return}assignRelayTeams(r.members)}else for(const m of r.members){m.team=-1;m.relayRole=''}r.game=startRace(r.members,{...r.settings,lastShifts:r.lastShifts||{}});await this.save(r);this.broadcast(r);return}
 // A rematch opens a fresh lobby under the same room code and guest credentials.
 // Only the host may reset a fully completed race, after rewards were credited.
 if(msg.type==='rematch'&&id===r.hostId&&r.started&&r.game?.phase==='done'){
  await this.award(r);
  r.lastShifts={...(r.game.lastShifts||{})};r.members=r.members.filter(m=>!m.isBot).map(m=>({...m,team:-1,relayRole:''}));
  r.started=false;r.game=null;r.awarded=false;
  await this.save(r);this.broadcast(r);return;
 }
 if(r.started&&r.game&&msg.type==='signal'&&activeHandoffs(r.game).some(h=>h.stage==='lead'&&h.lead===id)&&['up','down','mix','ready'].includes(msg.signal)){r.game.lastSignal={team:activeHandoffs(r.game).find(h=>h.lead===id).team,signal:msg.signal};await this.save(r);this.broadcast(r);return}
 if(r.started&&r.game&&msg.type==='shift'){if(shiftAction(r.game,id,msg.op,msg.code,msg.team)){await this.save(r);this.broadcast(r);if(activeHandoffs(r.game).length)await this.ctx.storage.setAlarm(Math.min(...activeHandoffs(r.game).map(h=>h.deadline)))}return}
 if(r.started&&r.game&&msg.type==='taunt'&&r.settings.mode==='team'){const p=r.game.players[id],target=r.game.players.find(x=>x.team!==p?.team&&x.relayRole==='lead'&&!x.relayRetired);if(p?.relayWaiting&&target&&Number.isInteger(msg.effect)&&msg.effect>=0&&msg.effect<=3&&r.game.round-(p.lastTauntRound||-2)>=2){p.lastTauntRound=r.game.round;r.game.tauntCount++;r.game.lastTaunt={serial:r.game.tauntCount,from:p.name,target:target.id,effect:msg.effect};await this.save(r);this.broadcast(r)}return}
 if(r.started&&r.game&&['action','combat','discard'].includes(msg.type)){let op=msg.type==='action'?msg.op:msg.type,arg=msg.type==='action'?{}:{index:msg.index,target:msg.target};if(action(r.game,id,op,arg)){await this.award(r);await this.save(r);this.broadcast(r);if(activeHandoffs(r.game).length)await this.ctx.storage.setAlarm(Math.min(...activeHandoffs(r.game).map(h=>h.deadline)))}}
 })}
 async webSocketClose(ws){return this.ctx.blockConcurrencyWhile(async()=>{let r=await this.data();if(!r)return;let id=ws.deserializeAttachment()?.id,other=this.ctx.getWebSockets().some(w=>w!==ws&&w.deserializeAttachment()?.id===id);if(r.started&&!other&&Number.isInteger(id)){let p=r.game?.players[id];if(p&&!p.finished){p.isBot=true;p.cpu=true;if(r.game.phase==='flip'&&!p.ready){p.isBot=false;action(r.game,id,'flip');p.isBot=true}if(r.game.phase==='choice'&&r.game.choice===id){p.selectedNode=TRACK.forks[p.node][0].first;r.game.phase='resolve';r.game.choice=null;resolve(r.game)}if(p.pendingCombat!=null){p.combat[0]=p.pendingCombat;p.pendingCombat=null}await this.award(r);await this.save(r)}}this.broadcast(r)})}
 async alarm(){const r=await this.data();if(r?.game&&expireHandoff(r.game)){await this.save(r);this.broadcast(r)}if(r&&Date.now()-r.updated>=24*3600000){for(const ws of this.ctx.getWebSockets())try{ws.close(1000,'Room expired')}catch{}await this.ctx.storage.deleteAll()}else await this.ctx.storage.setAlarm(activeHandoffs(r?.game||{}).length?Math.min(...activeHandoffs(r.game).map(h=>h.deadline)):Date.now()+24*3600000)}
}
// Guest profiles are stored per-browser. A cleared browser loses its bearer secret; no claims of secure identity recovery.
export class DriverProfile{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async fetch(req){return this.ctx.blockConcurrencyWhile(async()=>{let path=new URL(req.url).pathname,p=await this.ctx.storage.get('profile');if(path==='/create'&&req.method==='POST'){if(p)return json({error:'Already exists'},409);let b=await req.json();p={id:b.id,token:b.secret,name:cleanName(b.name),friends:[],wins:0,races:0,placements:[0,0,0,0],xp:0,awardedRaces:[],created:Date.now()};await this.ctx.storage.put('profile',p);return json({id:p.id,token:p.token,name:p.name,friends:[],wins:0,races:0,xp:0,level:1})}if(!p)return json({error:'Profile not found'},404);if(path==='/award'&&req.method==='POST'){let b=await req.json();if(typeof b.race!=='string'||!b.race.match(/^[A-HJ-NP-Z2-9]{6}$/))return json({error:'Bad race code'},400);p.awardedRaces??=[];if(!p.awardedRaces.includes(b.race)){p.races++;if(b.win)p.wins++;const place=Number(b.place)||0;p.placements??=[0,0,0,0];if(place>=1&&place<=4)p.placements[place-1]++;p.xp=(p.xp||0)+25+(b.win?100:0)+Math.max(0,Math.min(500,Number(b.flips)||0))+Math.max(0,Math.min(50,Number(b.combat)||0))*5;p.awardedRaces.push(b.race);if(p.awardedRaces.length>500)p.awardedRaces.shift();await this.ctx.storage.put('profile',p)}return json({ok:true})}
 if(path==='/verify'&&req.method==='GET')return req.headers.get('Authorization')==='Bearer '+p.token?json({ok:true,id:p.id}):json({error:'Unauthorized'},401);
 if(path==='/view'&&req.method==='GET'&&req.headers.get('Authorization')!=='Bearer '+p.token)return json({id:p.id,name:p.name,wins:p.wins,races:p.races,placements:p.placements||[0,0,0,0],level:1+Math.floor((p.xp||0)/250),friendCount:p.friends.length});if(req.headers.get('Authorization')!=='Bearer '+p.token)return json({error:'Unauthorized'},401);
 if(path==='/update'&&req.method==='POST'){let b;try{b=await req.json()}catch{return json({error:'Bad JSON'},400)}p.name=cleanName(b.name);await this.ctx.storage.put('profile',p);return json({ok:true,id:p.id,name:p.name})}
 if(path==='/friend'&&req.method==='POST'){let b;try{b=await req.json()}catch{return json({error:'Bad JSON'},400)}if(!/^[A-HJ-NP-Z2-9]{10}$/.test(b.code)||b.code===p.id)return json({error:'Invalid friend code'},400);let other=await this.env.PROFILES.get(this.env.PROFILES.idFromName(b.code)).fetch(new Request('https://profile.internal/view'));if(!other.ok)return json({error:'Friend not found'},404);let profile=await other.json();p.friends=[...new Set([...p.friends,b.code])].slice(0,100);await this.ctx.storage.put('profile',p);return json({friends:p.friends,added:{id:profile.id,name:profile.name}})}
 if(path==='/remove'&&req.method==='POST'){let b;try{b=await req.json()}catch{return json({error:'Bad JSON'},400)}p.friends=p.friends.filter(f=>f!==b.code);await this.ctx.storage.put('profile',p)}
 if(path==='/stats'&&req.method==='POST')return json({error:'Race statistics are verified locally in this release; server-verified profile results are not enabled.'},501);
 if(path==='/view'&&req.method==='POST')return json({error:'Unsupported'},405);
 if(req.method==='GET'||path==='/remove'){let friends=await Promise.all(p.friends.map(async id=>{let res=await this.env.PROFILES.get(this.env.PROFILES.idFromName(id)).fetch(new Request('https://profile.internal/view'));return res.ok?await res.json():null}));return json({id:p.id,name:p.name,wins:p.wins,races:p.races,placements:p.placements||[0,0,0,0],xp:p.xp||0,level:1+Math.floor((p.xp||0)/250),friends:friends.filter(Boolean)})}
 return json({error:'Unsupported'},405)
 })}
}
