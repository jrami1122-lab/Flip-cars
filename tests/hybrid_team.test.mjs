import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK,action,startRace,assignRelayTeams,validGearSequence,shiftAction,publicGame,sanitizeSettings,expireHandoff} from '../worker/src/index.js';
const members=()=>[
 {id:0,name:'Lead',color:'RED',deviceGroup:'A',isBot:false},
 {id:1,name:'Reserve',color:'BLUE',deviceGroup:'B',isBot:false},
 {id:2,name:'Rival',color:'GREEN',deviceGroup:'C',isBot:false},
 {id:3,name:'RivalPit',color:'YELLOW',deviceGroup:'D',isBot:false}
];
function race(){const m=members();assignRelayTeams(m);return startRace(m,{mode:'team',laps:10,combat:false,flags:false,turbos:false})}
test('team mode mandates two laps; standard mode retains other lap counts',()=>{assert.equal(sanitizeSettings({mode:'team',laps:10}).laps,2);assert.equal(sanitizeSettings({mode:'classic',laps:10}).laps,10);assert.equal(sanitizeSettings({mode:'team'}).mode,'team')});
test('keep a duo together even when joining between two solo players',()=>{const m=members();m[1].deviceGroup='same';m[2].deviceGroup='same';assignRelayTeams(m);assert.equal(m[1].team,m[2].team);assert.notEqual(m[0].team,m[1].team);assert.equal(m[1].relayRole,'lead');assert.equal(m[2].relayRole,'reserve')});
test('gear sequence has all four distinct positions',()=>{assert.equal(validGearSequence('2413'),true);for(const x of ['1123','123','1235',1234,'4444'])assert.equal(validGearSequence(x),false)});
test('reserve car waits in pit, and cannot flip before checkered line handoff',()=>{const s=race();assert.equal(s.players[1].node,TRACK.pit.two);assert.equal(s.players[1].relayWaiting,true);assert.equal(action(s,1,'flip'),false);assert.equal(s.settings.laps,2)});
test('lead crossing start line opens async shift; teammate starts at Pit 2',()=>{const s=race();s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];assert.ok(action(s,0,'flip'));assert.ok(action(s,2,'flip'));assert.notEqual(s.phase,'handoff');assert.equal(s.handoffs.length,1);assert.equal(s.handoff.lead,0);assert.equal(s.handoff.reserve,1);assert.equal(s.players[1].node,TRACK.pit.two);assert.equal(shiftAction(s,0,'set','2413'),true);assert.equal(shiftAction(s,1,'guess','2413'),true);assert.equal(s.handoff,null);assert.equal(s.players[1].node,TRACK.pit.two);assert.equal(s.players[0].node,TRACK.pit.wait);assert.equal(s.players[1].laps,1);assert.equal(s.players[0].relayRetired,true);assert.equal(s.players[1].skips,0)});
test('rival pit racer intercepts correct sequence ahead of teammate',()=>{const s=race();s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');shiftAction(s,0,'set','2413');assert.equal(shiftAction(s,3,'guess','2413'),true);shiftAction(s,1,'guess','2413');assert.equal(s.players[1].skips,1)});
test('wrong reserve guess causes one-turn delay; repeat code fails next relay',()=>{const s=race();s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');shiftAction(s,0,'set','2413');shiftAction(s,1,'guess','4321');assert.equal(s.players[1].skips,1);const m=members();assignRelayTeams(m);const next=startRace(m,{mode:'team',lastShifts:s.lastShifts});assert.equal(next.lastShifts[0],'2413');next.players[0].node=TRACK.pit.approach;next.players[0].deck=[1];next.players[2].deck=[1];action(next,0,'flip');action(next,2,'flip');shiftAction(next,0,'set','2413');shiftAction(next,1,'guess','2413');assert.equal(next.players[1].skips,1)});
test('shared-device teammates switch automatically and stage at Pit 2',()=>{const m=members();m[1].deviceGroup=m[0].deviceGroup;assignRelayTeams(m);const s=startRace(m,{mode:'team',combat:false,flags:false,turbos:false});s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');assert.equal(s.handoff,null);assert.equal(s.players[1].node,TRACK.pit.two);assert.equal(s.players[0].node,TRACK.pit.wait);assert.equal(s.players[1].relayWaiting,false)});
test('an AI reserve never competes in gear guessing',()=>{const m=members();m[1].isBot=true;assignRelayTeams(m);const s=startRace(m,{mode:'team',combat:false,flags:false,turbos:false});s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');assert.equal(s.handoff,null);assert.equal(s.players[1].node,TRACK.pit.two)});
test('private shift code is not leaked into public snapshots',()=>{const s=race();s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');shiftAction(s,0,'set','2413');let published=JSON.stringify(publicGame(s,3));assert.equal(published.includes('2413'),false);assert.equal(publicGame(s,1).handoff.stage,'guess')});

test('rival team keeps flipping while first team has an unresolved gear shift',()=>{
 const s=race();s.players[0].node=TRACK.pit.approach;
 s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');
 assert.equal(s.handoffs.length,1);assert.equal(s.players[0].node,TRACK.pit.wait);
 const round=s.round;
 assert.equal(s.phase,'flip');assert.equal(action(s,2,'flip'),true);
 assert.ok(s.players[2].flipCount>=2);assert.equal(s.handoffs.length,1);
 assert.ok(s.round>=round);
});
test('handoff completion at Pit 2 makes the first movement step enter pit exit, without extra lap',()=>{
 const m=members();m[1].deviceGroup=m[0].deviceGroup;assignRelayTeams(m);
 const s=startRace(m,{mode:'team',combat:false,flags:false,turbos:false});
 s.players[0].node=TRACK.pit.approach;s.players[0].deck=[1];s.players[2].deck=[1];
 action(s,0,'flip');action(s,2,'flip');
 assert.equal(s.players[1].node,TRACK.pit.two);
 s.players[1].deck=[1];action(s,1,'flip');action(s,2,'flip');
 assert.equal(s.players[1].node,TRACK.pit.exit);assert.equal(s.players[1].laps,1);
});
test('two teams can have separate handoff deadlines without one blocking the other',()=>{
 const s=race();s.players[0].node=TRACK.pit.approach;s.players[2].node=TRACK.pit.approach;
 s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');
 assert.equal(s.handoffs.length,2);
 assert.deepEqual(s.handoffs.map(h=>h.team).sort(),[0,1]);
 assert.equal(shiftAction(s,0,'set','2413',0),true);
 assert.equal(shiftAction(s,1,'guess','2413',0),true);
 assert.equal(s.handoffs.length,1);assert.equal(s.handoffs[0].team,1);
});
test('simultaneous wrong shifts resolve to turn penalties without deadlocking either team',()=>{
 const s=race();s.players[0].node=TRACK.pit.approach;s.players[2].node=TRACK.pit.approach;
 s.players[0].deck=[1];s.players[2].deck=[1];action(s,0,'flip');action(s,2,'flip');
 assert.equal(s.handoffs.length,2);
 shiftAction(s,0,'set','2413',0);shiftAction(s,2,'set','1324',1);
 shiftAction(s,1,'guess','1234',0);
 shiftAction(s,3,'guess','1234',1);
 assert.equal(s.handoffs.length,0);
 assert.equal(s.players[1].relayWaiting,false);
 assert.equal(s.players[3].relayWaiting,false);
 assert.equal(s.players[1].node,TRACK.pit.two);
 assert.equal(s.players[3].node,TRACK.pit.two);
 assert.notEqual(s.phase,'handoff');
});
