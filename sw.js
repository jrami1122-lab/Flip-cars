/* Flip Cars 4.5: local-play resilience; live multiplayer is never cached. */
const VERSION='flipcars-v4.5.2-static-1';
const STATIC=['./','./index.html','./manifest.webmanifest',
'./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png',
'./audio/flip.mp3','./audio/crash.mp3','./audio/engine.mp3','./audio/boost.mp3','./audio/burnout.mp3',
'./music/lofi.ogg','./music/rock.ogg','./music/cruise.ogg','./music/relax.ogg','./music/retro.ogg'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(VERSION);
  await Promise.allSettled(STATIC.map(url=>cache.add(new Request(url,{cache:'reload'}))));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('flipcars-')&&k!==VERSION).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.headers.has('range'))return;
 const url=new URL(req.url);
 // Browser online state, Cloudflare APIs and live profile data always use the network.
 if(url.origin!==self.location.origin || url.pathname.includes('/api/') || url.pathname.endsWith('/server-config.json'))return;
 // Only handle files inside this application's own installation scope.
 if(!url.href.startsWith(self.registration.scope))return;
 const navigation=req.mode==='navigate'||url.pathname.endsWith('/index.html')||url.href===self.registration.scope;
 if(navigation){
  event.respondWith((async()=>{
   try{const response=await fetch(req);
    if(response.ok){const cache=await caches.open(VERSION);await cache.put(req,response.clone())}
    return response;
   }catch{const cache=await caches.open(VERSION);return (await cache.match(req))||(await cache.match('./index.html'))||Response.error()}
  })());
  return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  const found=await cache.match(req);
  if(found)return found;
  const response=await fetch(req);
  if(response.ok && response.type==='basic')await cache.put(req,response.clone());
  return response;
 })());
});
