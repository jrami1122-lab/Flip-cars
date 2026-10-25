import test from 'node:test';
import assert from 'node:assert/strict';
import {GameRoom,MOVEMENT_COUNTS,raceChatDeviceCount,raceChatAvailable,raceChatOnlineGroups,raceVoiceAvailable,cleanRaceChat,startRace} from '../worker/src/index.js';
import {readFileSync} from 'node:fs';
const client=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const mk=(id,group,isBot=false)=>({id,name:`Driver${id}`,isBot,deviceGroup:group,color:'RED'});
function fakeRoom(members){
 const storage=new Map([['room',{code:'ABC234',members,started:false,hostId:0,settings:{},updated:Date.now()}]]);
 const sockets=members.filter(m=>!m.isBot).map(m=>({readyState:1,received:[],deserializeAttachment(){return {id:m.id}},send(message){this.received.push(JSON.parse(message))}}));
 const room=new GameRoom({storage:{get:async k=>storage.get(k),put:async(k,v)=>storage.set(k,structuredClone(v))},blockConcurrencyWhile:fn=>fn(),getWebSockets:()=>sockets},{});
 return {room,storage,sockets};
}
test('weighted 27-card deck favors threes, then twos, ones, fours, and fives in local and online',()=>{
 assert.deepEqual(MOVEMENT_COUNTS,{1:5,2:7,3:8,4:4,5:3});
 assert.equal(Object.values(MOVEMENT_COUNTS).reduce((x,y)=>x+y,0),27);
 const race=startRace([mk(0,'A'),mk(1,'B')],{laps:3});
 for(const p of race.players){const counts=Object.fromEntries([1,2,3,4,5].map(n=>[n,p.deck.filter(x=>x===n).length]));assert.deepEqual(counts,MOVEMENT_COUNTS)}
 assert.match(client,/Array\(5\)\.fill\(1\).*Array\(7\)\.fill\(2\).*Array\(8\)\.fill\(3\).*Array\(4\)\.fill\(4\).*Array\(3\)\.fill\(5\)/);
 assert.match(client,/1 × 5, 2 × 7, 3 × 8, 4 × 4, 5 × 3/);
});
test('race chat groups duos by device; never counts AI as a connected device',()=>{
 const twoDuos=[mk(0,'A'),mk(1,'A'),mk(2,'B'),mk(3,'B')];
 assert.equal(raceChatDeviceCount(twoDuos),2);assert.equal(raceChatAvailable(twoDuos),true);
 assert.equal(raceChatAvailable([mk(0,'A'),mk(1,'B'),mk(2,'C')]),true);
 assert.equal(raceChatAvailable([mk(0,'A'),mk(1,'B'),mk(2,'AI',true)]),true);
 assert.equal(raceChatAvailable([mk(0,'A'),mk(1,'A')]),false);
 assert.equal(raceChatAvailable([mk(0,'A'),mk(1,'B'),mk(2,'C'),mk(3,'D')]),true);
});
test('online device count excludes the extra racing seat of a duo',()=>{const members=[mk(0,'A'),mk(1,'A'),mk(2,'B')],websockets=members.map(m=>({readyState:1,deserializeAttachment:()=>({id:m.id})}));assert.equal(raceChatOnlineGroups(members,websockets),2);assert.equal(raceChatOnlineGroups(members,websockets.slice(0,2)),1)});
test('messages reach the two devices in one party and are not stored as chat history',async()=>{
 const members=[mk(0,'A'),mk(1,'A'),mk(2,'B'),mk(3,'B')];const {room,storage,sockets}=fakeRoom(members);
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'roomChat',text:'Hello across devices'}));
 for(const ws of sockets)assert.deepEqual(ws.received.map(x=>x.type),['roomChatMessage']);
 assert.equal(sockets[2].received[0].text,'Hello across devices');
 assert.equal(sockets[0].received[0].id,sockets[3].received[0].id,'both seats get same event ID for deduping');
 assert.equal(storage.get('room').chatRate.A>0,true);
 assert.equal(JSON.stringify(storage.get('room')).includes('Hello across devices'),false,'no message content persisted');
});
test('three-device room broadcasts text chat to every device',async()=>{
 const {room,sockets}=fakeRoom([mk(0,'A'),mk(1,'B'),mk(2,'C')]);
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'roomChat',text:'hello everybody'}));
 for(const s of sockets)assert.equal(s.received[0].text,'hello everybody');
});
test('chat filters control characters and rejects empty messages',async()=>{
 assert.equal(cleanRaceChat(' Hello\n  world\x00 '),'Hello world');
 assert.equal(cleanRaceChat('x'.repeat(250)).length,180);
 const {room,sockets}=fakeRoom([mk(0,'A'),mk(1,'B')]);
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'roomChat',text:'\n\t'}));
 assert.equal(sockets[0].received[0].type,'roomChatError');
 assert.equal(sockets[1].received.length,0);
});
test('race chat UI has a responsive, fullscreen-safe panel and keyboard guard',()=>{
 assert.match(client,/id="raceChatBtn"/);
 assert.match(client,/id="raceChatPanel"/);
 assert.match(client,/id="raceChatForm"/);
 assert.match(client,/fullscreenRoot\.appendChild/);
 assert.match(client,/\!\$\('raceChatPanel'\)\.hidden/);
});

test('voice only allows exactly two connected device groups, not two racing seats',()=>{
 const twoDuos=[mk(0,'A'),mk(1,'A'),mk(2,'B'),mk(3,'B')];
 const twoOnline=twoDuos.map(m=>({readyState:1,deserializeAttachment:()=>({id:m.id})}));
 assert.equal(raceVoiceAvailable(twoDuos,twoOnline),true);
 assert.equal(raceVoiceAvailable(twoDuos,twoOnline.slice(0,2)),false);
 const three=[mk(0,'A'),mk(1,'B'),mk(2,'C')];
 assert.equal(raceVoiceAvailable(three,three.map(m=>({readyState:1,deserializeAttachment:()=>({id:m.id})}))),false);
});
test('voice cannot signal until both devices explicitly join and is delivered only to a peer socket',async()=>{
 const {room,storage,sockets}=fakeRoom([mk(0,'A'),mk(1,'A'),mk(2,'B'),mk(3,'B')]);
 const offer=JSON.stringify({type:'voiceSignal',kind:'offer',description:{type:'offer',sdp:'v=0\\ntesting'}});
 await room.webSocketMessage(sockets[0],offer);
 assert.ok(sockets.every(s=>s.received.length===0));
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'voicePresence',join:true}));
 assert.deepEqual(Object.keys(storage.get('room').voiceReady),['A']);
 await room.webSocketMessage(sockets[2],JSON.stringify({type:'voicePresence',join:true}));
 for(const s of sockets)s.received.length=0;
 await room.webSocketMessage(sockets[0],offer);
 assert.equal(sockets[2].received.length,1);
 assert.equal(sockets[2].received[0].type,'voiceSignal');
 assert.equal(sockets[2].received[0].fromGroup,'A');
 assert.equal(sockets[0].received.length,0);
 assert.equal(sockets[1].received.length,0);
 assert.equal(sockets[3].received.length,0);
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'voicePresence',join:false}));
 assert.equal(storage.get('room').voiceReady.A,undefined);
 for(const s of sockets)s.received.length=0;
 await room.webSocketMessage(sockets[2],JSON.stringify({type:'voiceSignal',kind:'ice',candidate:{candidate:'candidate:1 1 udp 1 0.0.0.0 9 typ host'}}));
 assert.ok(sockets.every(s=>s.received.length===0));
});
test('voice signaling rejects malformatted SDP and non-opted-in seats on a duo',async()=>{
 const {room,sockets}=fakeRoom([mk(0,'A'),mk(1,'A'),mk(2,'B')]);
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'voicePresence',join:true}));
 await room.webSocketMessage(sockets[2],JSON.stringify({type:'voicePresence',join:true}));
 for(const s of sockets)s.received.length=0;
 await room.webSocketMessage(sockets[1],JSON.stringify({type:'voiceSignal',kind:'offer',description:{type:'offer',sdp:'v=0'}}));
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'voiceSignal',kind:'offer',description:{type:'answer',sdp:'v=0'}}));
 assert.ok(sockets.every(s=>s.received.length===0));
});
test('4 devices can exchange text but voice is rejected',async()=>{
 const {room,sockets}=fakeRoom([mk(0,'A'),mk(1,'B'),mk(2,'C'),mk(3,'D')]);
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'voicePresence',join:true}));
 assert.equal(sockets[0].received[0].type,'voiceError');
 for(const s of sockets)s.received.length=0;
 await room.webSocketMessage(sockets[0],JSON.stringify({type:'roomChat',text:'four racer radio check'}));
 for(const s of sockets)assert.equal(s.received[0].text,'four racer radio check');
});
test('voice UI is opt-in, fullscreen-safe and never calls getUserMedia until a click',()=>{
 assert.match(client,/id="voiceOpenBtn"/);
 assert.match(client,/id="voicePanel"/);
 assert.ok(client.includes("'raceChatPanel','voicePanel'")); // fullscreen root move
 assert.match(client,/voiceJoin'\)\.onclick=voiceStart/);
 assert.match(client,/navigator\.mediaDevices\.getUserMedia/);
 assert.match(client,/voiceStop\("",true\);resetRaceChat/);
});
