import {test} from 'node:test';
import assert from 'node:assert/strict';
import {startRace,action,publicGame,sanitizeSettings,COMBAT_COUNTS,TRACK} from '../worker/src/index.js';

const members=n=>Array.from({length:n},(_,i)=>({name:`Guest ${i+1}`,color:['RED','BLUE','YELLOW','GREEN'][i],isBot:i!==0}));
function finishGame(n,settings={combat:false,flags:false,turbos:false}){
 const s=startRace(members(n),settings);
 let checks=0,firstSeen=null,continued=false;
 while(s.phase!=='done'&&checks++<2500){
   if(s.placements.length&&s.placements.length<n){firstSeen ??=s.round;continued=true}
   if(s.phase==='choice'){
    assert.equal(s.choice,0);assert.equal(action(s,0,'flip'),true);
   }else if(s.phase==='flip'){
    assert.equal(action(s,0,'flip'),true);
   }else assert.fail(`Unexpected phase ${s.phase}`);
 }
 assert.equal(s.phase,'done','race should complete');
 assert.deepEqual(s.placements.map(x=>x.place),Array.from({length:n},(_,i)=>i+1));
 assert.deepEqual(new Set(s.placements.map(x=>x.id)).size,n);
 assert.deepEqual(s.winner,[s.placements[0].id]);
 return s;
}
for(const n of [2,3,4])test(`${n} racers complete with server-authoritative placement`,()=>{const s=finishGame(n);assert.equal(publicGame(s,0).placements.length,n)});
test('disabled combat, flags and turbos stay off for entire race',()=>{
 const s=finishGame(4);for(const p of s.players){assert.equal(p.flags,0);assert.equal(p.combat.length,0);assert.equal(p.bonuses,0)}
 assert.equal(s.eventDeck.some(x=>x==='turbo'||x==='nitro'),false);
});
test('host settings are sanitized, not trusted blindly',()=>{
 assert.deepEqual(sanitizeSettings({combat:false,flags:0,turbos:false,admin:true}),{combat:false,flags:true,turbos:false});
 assert.ok(COMBAT_COUNTS.bubble<COMBAT_COUNTS.oil);
});

test('race stays open for remaining drivers after first racer finishes',()=>{
 const s=startRace([{name:'Leader',isBot:false,color:'RED'},{name:'Chaser',isBot:false,color:'BLUE'}],{combat:false,flags:false,turbos:false});
 s.players[0].laps=2;s.players[0].node=TRACK.pit.approach;s.players[0].deck=[5];s.players[1].deck=[1];
 assert.equal(action(s,0,'flip'),true);assert.equal(action(s,1,'flip'),true);
 assert.equal(s.players[0].finished,true);assert.equal(s.players[1].finished,false);
 assert.notEqual(s.phase,'done');assert.deepEqual(s.placements.map(p=>p.id),[0]);
 assert.equal(s.winner[0],0);
 assert.equal(s.players[0].overshoot,4,'finishing movement saved for same-round tiebreak');
 assert.equal(action(s,1,'flip'),true);
 assert.equal(s.players[0].overshoot,4,'finished racer keeps overshoot in later rounds');
});
