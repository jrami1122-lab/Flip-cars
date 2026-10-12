import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,startRace,action,publicGame} from '../worker/src/index.js';
const mk=(bots=3)=>[{name:'Host',isBot:false},...Array.from({length:bots},(_,i)=>({name:'CPU'+i,isBot:true}))];
test('network graph has complete expected paths',()=>{
  assert.equal(Object.keys(TRACK.forks).length,3);
  assert.deepEqual(Object.values(TRACK.forks).map(x=>x.length).sort(),[2,2,3]);
  assert.ok(Object.keys(TRACK.nodes).length>=55);
  assert.equal(TRACK.nodes[TRACK.pit.exit].type,'normal');
});
test('all players have fair identical starting movement decks',()=>{
  const s=startRace(mk());
  assert.equal(s.players.length,4);
  for(const p of s.players){assert.deepEqual(p.deck.concat(p.card==null?[]:[p.card]).sort((a,b)=>a-b),[...Array(8).fill(1),...Array(7).fill(2),...Array(5).fill(3),...Array(4).fill(4),...Array(3).fill(5)])}
});
test('bot + human completes multiple full 3-lap races',()=>{
 for(let game=0;game<100;game++){
  let s=startRace(mk()); let commands=0;
  while(s.phase!=='done'&&commands++<800){
   if(s.phase==='flip')assert.equal(action(s,0,'flip'),true);
   else if(s.phase==='choice'){
    if(s.choice===0){if(game%2===0)action(s,0,'route');assert.equal(action(s,0,'flip'),true)}
    else assert.fail('bot should automatically choose');
   }else assert.fail('unexpected phase '+s.phase);
  }
  assert.equal(s.phase,'done','race '+game+' finished in '+commands+' commands');
  assert.ok(s.winner.length>=1);
  assert.ok(s.players.some(p=>p.laps>=3));
  assert.ok(s.round<250);
 }
});
test('online actions cannot control another player or an invalid action',()=>{
 const s=startRace([{name:'A',isBot:false},{name:'B',isBot:false}]);
 assert.equal(action(s,0,'route'),false);
 assert.equal(action(s,0,'flip'),true);
 assert.equal(action(s,0,'flip'),false);
 assert.equal(s.phase,'flip');
 assert.equal(publicGame(s).players[0].card,null,'card is hidden before reveal');
 assert.equal(action(s,1,'flip'),true);
 assert.ok(['flip','choice','done'].includes(s.phase));
});
