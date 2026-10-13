import test from 'node:test';
import assert from 'node:assert/strict';
import {DriverProfile} from '../worker/src/index.js';
function mockProfile(){const mem=new Map();const ctx={storage:{get:async k=>mem.get(k),put:async (k,v)=>mem.set(k,v)},blockConcurrencyWhile:fn=>fn()};return new DriverProfile(ctx,{})}
const mk=(path,method='GET',body,token)=>new Request('https://profile.internal'+path,{method,headers:token?{Authorization:'Bearer '+token}:undefined,body:body===undefined?undefined:JSON.stringify(body)});
test('guest profile bearer protects private friend list and identity',async()=>{
 const p=mockProfile();const t='this-is-a-long-private-test-token';const c=await p.fetch(mk('/create','POST',{id:'ABCDEFGHJK',secret:t,name:'SPEEDSTER'}));assert.equal(c.status,200);
 const bad=await p.fetch(mk('/verify'));assert.equal(bad.status,401);
 const good=await p.fetch(mk('/verify','GET',undefined,t));assert.equal(good.status,200);
 const publicView=await (await p.fetch(mk('/view'))).json();assert.equal(publicView.name,'SPEEDSTER');assert.equal(publicView.friends,undefined);
 const ownView=await (await p.fetch(mk('/view','GET',undefined,t))).json();assert.deepEqual(ownView.friends,[])
});
test('server-awarded race XP is idempotent and updates online level and wins',async()=>{
 const p=mockProfile();const t='another-long-private-test-token';await p.fetch(mk('/create','POST',{id:'ABCDEFGHJK',secret:t,name:'DRIVER'}));
 const a={race:'ABCDEF',win:true,flips:30,combat:2};
 await p.fetch(mk('/award','POST',a));await p.fetch(mk('/award','POST',a));
 const stats=await (await p.fetch(mk('/view','GET',undefined,t))).json();
 assert.equal(stats.races,1);assert.equal(stats.wins,1);assert.equal(stats.xp,25+100+30+10);assert.equal(stats.level,1);
});
