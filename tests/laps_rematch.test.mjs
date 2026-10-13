import test from 'node:test';
import assert from 'node:assert/strict';
import {startRace,action,sanitizeSettings,publicGame,TRACK,GameRoom} from '../worker/src/index.js';
const players=()=>[{name:'Host',color:'RED',isBot:false},{name:'Guest',color:'BLUE',isBot:false}];
for(const count of [3,5,10])test(`server honors ${count}-lap race`,()=>{
 const game=startRace(players(),{laps:count,combat:false,flags:false,turbos:false});
 assert.equal(game.settings.laps,count);assert.equal(publicGame(game,0).settings.laps,count);
 game.players[0].laps=count-1;game.players[0].node=TRACK.pit.approach;game.players[0].deck=[5];game.players[1].deck=[1];
 assert.equal(action(game,0,'flip'),true);assert.equal(action(game,1,'flip'),true);
 assert.equal(game.players[0].finished,true);assert.equal(game.players[1].finished,false);
});
test('invalid lengths normalize to 3 laps',()=>{
 for(const laps of [0,-1,4,9,100,'oops'])assert.equal(sanitizeSettings({laps}).laps,3);
 assert.equal(sanitizeSettings({laps:'10'}).laps,10);
});
test('host can rematch within same room; guest cannot reset race',async()=>{
 let record={code:'ABCD23',hostId:0,started:true,awarded:true,
  settings:{combat:false,flags:false,turbos:false,laps:5},
  members:[{id:0,name:'Host',isBot:false,token:'h'},{id:1,name:'Guest',isBot:false,token:'g'},{id:2,name:'CPU',isBot:true,token:null}],
  game:{phase:'done',placements:[],players:[]}};
 const sockets=[];
 const ctx={storage:{get:async()=>record,put:async(k,v)=>{record=structuredClone(v)}},getWebSockets:()=>sockets,
  blockConcurrencyWhile:async fn=>await fn()};
 const env={};const room=new GameRoom(ctx,env);
 function sock(id){return {deserializeAttachment:()=>({id}),sent:[],send(message){this.sent.push(JSON.parse(message))}}}
 const host=sock(0),guest=sock(1);sockets.push(host,guest);
 await room.webSocketMessage(guest,JSON.stringify({type:'rematch'}));assert.equal(record.started,true);
 await room.webSocketMessage(host,JSON.stringify({type:'rematch'}));
 assert.equal(record.started,false);assert.equal(record.game,null);assert.equal(record.awarded,false);
 assert.equal(record.settings.laps,5);assert.deepEqual(record.members.map(m=>m.id),[0,1]);
 assert.equal(host.sent.at(-1)?.type,'snapshot');assert.equal(guest.sent.at(-1)?.started,false);
});
