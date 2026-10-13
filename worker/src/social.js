// Flip Cars 4.3 social garage. All public actions authenticate through DriverProfile first.
// One Durable Object serializes handle reservations, friendships, conversations and invitations.
const HEADERS={'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'*'};
const reply=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:HEADERS});
const ID=/^[A-HJ-NP-Z2-9]{10}$/;
const CODE=/^[A-HJ-NP-Z2-9]{6}$/;
const norm=s=>String(s||'').trim().toLowerCase();
const cleanHandle=s=>String(s||'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,18);
const present=(s,id,viewer,now=Date.now())=>{const u=s.users[id];if(!u)return null;const friend=!!s.friends[viewer]?.includes(id),isSelf=id===viewer;const blocked=!!s.blocks[viewer]?.includes(id)||!!s.blocks[id]?.includes(viewer);return {id:u.id,tag:u.tag,name:u.name,online:!blocked&&(isSelf||friend)&&u.showOnline!==false&&now-(s.presence[id]?.at||0)<90000,room:friend&&!blocked&&u.showOnline!==false&&now-(s.presence[id]?.at||0)<90000?s.presence[id]?.room||'':undefined,friend,blocked,...(isSelf?{showOnline:u.showOnline!==false,allowInvites:u.allowInvites!==false,allowMessages:u.allowMessages!==false}:{}),requested:!!s.requests[id]?.includes(viewer),incoming:!!s.requests[viewer]?.includes(id)};};
const blank=()=>({users:{},tags:{},friends:{},requests:{},messages:{},read:{},invites:{},blocks:{},presence:{},rates:{}});
const key=(a,b)=>[a,b].sort().join(':');
const unique=(a,id)=>[...new Set([...(a||[]),id])];
const forget=(a,id)=>(a||[]).filter(x=>x!==id);
function throttle(s,id,kind,limit=12,windowMs=60000){const now=Date.now(),k=id+':'+kind,p=s.rates[k]||{t:now,n:0};if(now-p.t>windowMs){p.n=0;p.t=now}p.n++;s.rates[k]=p;return p.n<=limit;}
export class SocialDirectory{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async fetch(req){return this.ctx.blockConcurrencyWhile(()=>this.route(req))}
 async route(req){
  const path=new URL(req.url).pathname;let b;try{b=req.method==='POST'?await req.json():{}}catch{return reply({error:'Invalid request'},400)}
  const id=String(b.id||'');if(!ID.test(id))return reply({error:'Unauthorized'},401);
  const s=await this.ctx.storage.get('social')||blank();let changed=false;
  const save=async()=>{if(changed)await this.ctx.storage.put('social',s)};
  const error=(message,status=400)=>reply({error:message},status);
  const targetId=x=>{const q=String(x||'').trim();return ID.test(q)?q:(s.tags[norm(q)]||'')};
  const ensure=()=>s.users[id]||null;
  const blocked=other=>!!s.blocks[id]?.includes(other)||!!s.blocks[other]?.includes(id);
  const friend=other=>!!s.friends[id]?.includes(other);
  const summary=uid=>present(s,uid,id);
  if(path==='/register'){
   const name=String(b.name||'RACER').slice(0,18);
   if(!ensure()){
    let base=cleanHandle(name);if(base.length<3)base='Racer';
    let tag=base;if(s.tags[norm(tag)]&&s.tags[norm(tag)]!==id)tag=base.slice(0,13)+'_'+id.slice(-4);
    for(let i=0;s.tags[norm(tag)]&&s.tags[norm(tag)]!==id&&i<100;i++)tag='Racer_'+id.slice(-4)+(i||'');
    s.users[id]={id,name,tag,showOnline:true,allowMessages:true,allowInvites:true};s.tags[norm(tag)]=id;changed=true;
    for(const f of (Array.isArray(b.legacyFriends)?b.legacyFriends:[]).slice(0,100)){
     if(!ID.test(f)||f===id)continue;
     s.requests[f]=unique(s.requests[f],id);changed=true;
    }
   }else if(name&&s.users[id].name!==name){s.users[id].name=name;changed=true;}
   await save();return reply({profile:summary(id)});
  }
  if(!ensure())return error('Open Friends once to activate your player tag.',409);
  if(path==='/handle'&&req.method==='POST'){
   const tag=cleanHandle(b.tag);if(tag.length<3)return error('Tag must be 3–18 letters, numbers, _ or -.');
   if(s.tags[norm(tag)]&&s.tags[norm(tag)]!==id)return error('That driver tag is already taken.',409);
   delete s.tags[norm(s.users[id].tag)];s.tags[norm(tag)]=id;s.users[id].tag=tag;changed=true;await save();return reply({profile:summary(id)});
  }
  if(path==='/search'){
   const q=norm(b.query);if(q.length<2)return reply({results:[]});
   const results=Object.values(s.users).filter(u=>u.id!==id&&!blocked(u.id)&&(norm(u.tag).includes(q)||norm(u.name).includes(q))).sort((a,b)=>Number(norm(b.tag)===q)-Number(norm(a.tag)===q)||Number(norm(b.tag).startsWith(q))-Number(norm(a.tag).startsWith(q))).slice(0,12).map(u=>summary(u.id));
   return reply({results});
  }
  if(path==='/profile'){
   const to=targetId(b.target);if(!to||!s.users[to]||blocked(to))return error('Driver not found.',404);return reply({profile:summary(to)});
  }
  if(path==='/presence'){
   const room=CODE.test(b.room||'')?b.room:'';s.presence[id]={at:Date.now(),room:room||''};changed=true;await save();return reply({ok:true});
  }
  if(path==='/privacy'){
   for(const k of ['showOnline','allowInvites','allowMessages'])if(typeof b[k]==='boolean')s.users[id][k]=b[k];changed=true;await save();return reply({profile:summary(id)});
  }
  if(path==='/state'){
   // Read-only snapshot. No automatic registration, no raw tokens, no public presence for strangers.
   const friends=(s.friends[id]||[]).map(summary).filter(Boolean).filter(x=>!x.blocked);
   const incoming=(s.requests[id]||[]).map(summary).filter(Boolean).filter(x=>!x.blocked);
   const outgoing=Object.keys(s.requests).filter(target=>s.requests[target]?.includes(id)).map(summary).filter(Boolean).filter(x=>!x.blocked);
   const now=Date.now(),invites=(s.invites[id]||[]).filter(x=>now-x.at<7200000&&x.status==='pending'&&!blocked(x.from)).map(x=>({...x,from:summary(x.from)}));
   const unread=friends.reduce((n,f)=>{const k=key(id,f.id),last=s.read[id]?.[k]||0;return n+(s.messages[k]||[]).filter(m=>m.from!==id&&m.at>last).length},0);
   return reply({self:summary(id),friends,incoming,outgoing,invites,unread});
  }
  const to=targetId(b.target);
  if(['request','accept','decline','remove','block','message','thread','invite'].includes(path.slice(1))&&(!to||to===id||!s.users[to]))return error('Player not found.',404);
  if(path==='/request'){
   if(blocked(to))return error('This driver cannot receive requests.',403);
   if(friend(to))return reply({ok:true,status:'friends'});
   if(!throttle(s,id,'requests',20,3600000))return error('Please wait before sending more requests.',429);
   if(s.requests[id]?.includes(to)){
    s.requests[id]=forget(s.requests[id],to);s.friends[id]=unique(s.friends[id],to);s.friends[to]=unique(s.friends[to],id);
    changed=true;await save();return reply({ok:true,status:'friends'});
   }
   s.requests[to]=unique(s.requests[to],id);changed=true;await save();return reply({ok:true,status:'pending'});
  }
  if(path==='/accept'){
   if(!s.requests[id]?.includes(to)||blocked(to))return error('No pending request.',404);
   s.requests[id]=forget(s.requests[id],to);s.requests[to]=forget(s.requests[to],id);s.friends[id]=unique(s.friends[id],to);s.friends[to]=unique(s.friends[to],id);changed=true;await save();return reply({ok:true});
  }
  if(path==='/decline'){
   s.requests[id]=forget(s.requests[id],to);changed=true;await save();return reply({ok:true});
  }
  if(path==='/remove'||path==='/block'){
   s.friends[id]=forget(s.friends[id],to);s.friends[to]=forget(s.friends[to],id);
   s.requests[id]=forget(s.requests[id],to);s.requests[to]=forget(s.requests[to],id);
   if(path==='/block')s.blocks[id]=unique(s.blocks[id],to);
   changed=true;await save();return reply({ok:true});
  }
  if(path==='/thread'){
   if(!friend(to)||blocked(to))return error('Messages are for friends only.',403);
   const k=key(id,to),msgs=(s.messages[k]||[]).slice(-60);s.read[id]??={};s.read[id][k]=msgs.at(-1)?.at||Date.now();changed=true;await save();return reply({messages:msgs,friend:summary(to)});
  }
  if(path==='/message'){
   if(!friend(to)||blocked(to)||s.users[to].allowMessages===false)return error('Messages are unavailable for this driver.',403);
   if(!throttle(s,id,'messages',12,60000))return error('Sending too quickly. Try again shortly.',429);
   const text=String(b.text||'').replace(/[\x00-\x1F\x7F]/g,' ').trim().slice(0,320);
   if(!text)return error('Write a message first.');
   const k=key(id,to);s.messages[k]??=[];const last=s.messages[k].at(-1)?.at||0;s.messages[k].push({from:id,text,at:Math.max(Date.now(),last+1)});s.messages[k]=s.messages[k].slice(-100);changed=true;await save();return reply({ok:true});
  }
  if(path==='/invite'){
   if(!friend(to)||blocked(to)||s.users[to].allowInvites===false)return error('Invites are unavailable for this driver.',403);
   if(!CODE.test(String(b.room||'')))return error('Open a party lobby before inviting friends.');
   if(!throttle(s,id,'invites',12,3600000))return error('Too many invitations. Please wait.',429);
   const now=Date.now();s.invites[to]??=[];s.invites[to].push({id:crypto.randomUUID(),from:id,room:b.room,at:now,status:'pending'});s.invites[to]=s.invites[to].filter(x=>now-x.at<7200000).slice(-30);changed=true;await save();return reply({ok:true});
  }
  if(path==='/dismiss'){
   const match=(s.invites[id]||[]).find(x=>x.id===b.inviteId);if(match){match.status='dismissed';changed=true;await save()}return reply({ok:true});
  }
  return error('Unsupported social action.',404);
 }
}

export async function socialApi(req,env,verify){
 const url=new URL(req.url),op=url.pathname.slice('/api/social/'.length);
 if(!env.SOCIAL)return reply({error:'Social system is not deployed yet.'},503);
 const callerId=req.headers.get('x-driver-id')||'';
 const authorization=req.headers.get('authorization')||'';
 if(!ID.test(callerId)||!authorization.startsWith('Bearer '))return reply({error:'Sign into a driver profile first.'},401);
 const id=await verify(env,{profileId:callerId,profileToken:authorization.slice(7)});
 if(!id)return reply({error:'Your profile session needs to be restored.'},401);
 let data={};try{data=req.method==='POST'?await req.json():Object.fromEntries(url.searchParams)}catch{return reply({error:'Invalid JSON'},400)}
 if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'Invalid request'},400);
 if(op==='register'){
  const d=await env.PROFILES.get(env.PROFILES.idFromName(id)).fetch(new Request('https://profile.internal/view',{headers:{Authorization:authorization}}));
  if(!d.ok)return reply({error:'Profile cannot be loaded.'},401);
  const p=await d.json();data.name=p.name;data.legacyFriends=p.friends?.map(f=>f.id)||[];
 }
 if(op==='invite'){
  const room=String(data.room||'');if(!CODE.test(room))return reply({error:'Start a party lobby before inviting.'},400);
  const check=await env.ROOMS.get(env.ROOMS.idFromName(room)).fetch(new Request('https://room.internal/invite-authorize',{headers:{'x-profile-id':id}}));
  if(!check.ok)return reply({error:'Only the host can invite friends to an open lobby.'},403);
 }
 const supported=['register','handle','search','profile','presence','privacy','state','request','accept','decline','remove','block','thread','message','invite','dismiss'];
 if(!supported.includes(op))return reply({error:'Not found'},404);
 const stub=env.SOCIAL.get(env.SOCIAL.idFromName('flipcars-main-social'));
 const result=await stub.fetch(new Request('https://social.internal/'+op,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...data,id})}));
 if(op==='profile'&&result.ok){const d=await result.json();if(d.profile){try{const p=await env.PROFILES.get(env.PROFILES.idFromName(d.profile.id)).fetch(new Request('https://profile.internal/view'));if(p.ok){const profile=await p.json();d.profile.stats={wins:profile.wins,races:profile.races,placements:profile.placements,level:profile.level};}}catch{}}return reply(d)}
 return result;
}
