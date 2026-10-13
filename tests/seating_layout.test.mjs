import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
const html=readFileSync(join(dirname(fileURLToPath(import.meta.url)),'..','index.html'),'utf8');
const seatHelper=html.match(/function physicalSeatMap\(ids\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(seatHelper,'Seat assignment helper is present in deployable HTML');
function positions(ids){return JSON.parse(JSON.stringify(runInNewContext(seatHelper+';physicalSeatMap('+JSON.stringify(ids)+')')))}
test('single user is seated at the base/start line regardless of server id',()=>{
 assert.deepEqual(positions([0]),{'0':'bottom'});
 assert.deepEqual(positions([3]),{'3':'bottom'});
});
test('two players share opposite sides of the table',()=>{
 assert.deepEqual(positions([0,1]),{'0':'bottom','1':'top'});
 assert.deepEqual(positions([2,3]),{'2':'bottom','3':'top'});
});
test('three or four couch players get stable clockwise positions',()=>{
 assert.deepEqual(positions([0,1,2]),{'0':'bottom','1':'left','2':'top'});
 assert.deepEqual(positions([0,1,2,3]),{'0':'bottom','1':'left','2':'top','3':'right'});
});
test('camera begins in start-line FIT view rather than color-dependent FOLLOW',()=>{
 assert.match(html,/viewMode='fit';setTabletopMode\(humans>1\)/);
 assert.match(html,/viewMode='fit';setTabletopMode\(onlineSeats\.length>1\)/);
});
