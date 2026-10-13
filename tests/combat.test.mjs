import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,COMBAT_COUNTS,startRace,useCombat,publicGame,distanceForward,combatTargets,action} from '../worker/src/index.js';
const make=()=>startRace([{name:'One',isBot:false,color:'PURPLE'},{name:'Two',isBot:false,color:'BLUE'}]);
const near=(id,n=1)=>{let node=id;while(n--)node=TRACK.nodes[node]?.next;return node};
test('combat deck includes uncommon bubble and one ultra-rare stall',()=>{
 assert.equal(COMBAT_COUNTS.stall,1);assert.ok(COMBAT_COUNTS.bubble>=1&&COMBAT_COUNTS.bubble<=3);
});
test('a bubble persists, blocks one missile, and is then consumed',()=>{
 const s=make(),a=s.players[0],v=s.players[1];a.node=TRACK.start;v.node=near(a.node,2);a.combat=['missile'];v.combat=['bubble'];
 assert.equal(useCombat(s,1,0,-1),true);assert.equal(v.bubble,true);
 assert.equal(useCombat(s,0,0,1),true);assert.equal(v.bubble,false);assert.equal(v.skips,0);assert.equal(v.needsPit,false);
 a.combat=['missile'];assert.equal(useCombat(s,0,0,1),true);assert.equal(v.skips,1);assert.equal(v.needsPit,true);
});
test('spikes strike a vehicle 1–3 spaces behind and leave puncture',()=>{
 const s=make(),a=s.players[0],v=s.players[1];a.node=near(TRACK.start,2);v.node=TRACK.start;
 assert.ok(distanceForward(v.node,a.node,3)>0);a.combat=['spikes'];assert.equal(combatTargets(s,a,'spikes')[0],1);
 assert.equal(useCombat(s,0,0,1),true);assert.equal(v.tireDamaged,true);assert.equal(v.skips,0);
});
test('missile cannot hit beyond range or behind',()=>{
 const s=make(),a=s.players[0],v=s.players[1];a.node=TRACK.start;v.node=near(a.node,7);a.combat=['missile'];
 assert.equal(useCombat(s,0,0,1),false);assert.deepEqual(a.combat,['missile']);
});
test('oil stays on the chosen tile until somebody hits it',()=>{
 const s=make(),a=s.players[0];a.node=near(TRACK.start,2);a.combat=['oil'];
 assert.equal(useCombat(s,0,0,-1),true);assert.equal(s.traps[0].node,a.node);assert.equal(s.traps[0].owner,a.id);
});
test('engine stall skips rivals unless their bubble absorbs it',()=>{
 const s=make(),a=s.players[0],v=s.players[1];a.combat=['stall'];v.bubble=true;
 assert.equal(useCombat(s,0,0,-1),true);assert.equal(v.skips,0);assert.equal(v.bubble,false);
 a.combat=['stall'];assert.equal(useCombat(s,0,0,-1),true);assert.equal(v.skips,1);
});
test('discarded full-hand pickup replaces selected card or passes',()=>{
 const s=make(),a=s.players[0];a.combat=['oil','bubble'];a.pendingCombat='sniper';
 assert.equal(action(s,0,'discard',{index:0}),true);
 assert.deepEqual(a.combat,['sniper','bubble']);assert.equal(a.pendingCombat,null);
 a.pendingCombat='missile';assert.equal(action(s,0,'discard',{index:-1}),true);assert.equal(a.pendingCombat,null)
});
test('private hand is hidden from other players and public views',()=>{
 const s=make();s.players[0].combat=['sniper','bubble'];s.players[1].combat=['spikes'];
 assert.deepEqual(publicGame(s,0).players[0].combat,['sniper','bubble']);
 assert.deepEqual(publicGame(s,1).players[0].combat,[]);
 assert.deepEqual(publicGame(s).players[0].combat,[]);
 assert.equal(publicGame(s,1).players[0].combatCount,2);
});
test('bubble expires at lap marker even without taking a hit',()=>{
 const s=make(),p=s.players[0];p.node=TRACK.pit.approach;p.bubble=true;p.deck=[1];s.players[1].node=TRACK.start;s.players[1].deck=[1];
 assert.equal(action(s,0,'flip'),true);assert.equal(action(s,1,'flip'),true);
 assert.equal(p.laps,1);assert.equal(p.bubble,false)
});
