import test from 'node:test';
import assert from 'node:assert/strict';
import {uniqueRoomName,uniqueSecondary,startRace,publicGame,action} from '../worker/src/index.js';

test('nickname conflicts get case insensitive suffixes while preserving 18-char length',()=>{
 const members=[{name:'SpeedRacer'},{name:'SpeedRacer-2'}];
 assert.equal(uniqueRoomName('SpeedRacer',[]),'SpeedRacer');
 assert.equal(uniqueRoomName('speedracer',members),'speedracer-3');
 assert.equal(uniqueRoomName('VeryLongRacerNameX',[{name:'VeryLongRacerNameX'}]),'VeryLongRacerNam-2');
 assert.equal(uniqueRoomName('Other',members),'Other');
});
test('automatic secondary finish lets four same-primary racers look different',()=>{
 const members=[];
 const finishes=['','BLACK','WHITE','SILVER'];
 for(let i=0;i<4;i++){const secondary=uniqueSecondary('RED','AUTO',members);assert.equal(secondary,finishes[i]);members.push({color:'RED',secondary})}
 assert.equal(uniqueSecondary('BLUE','AUTO',members),'');
});
test('manual black/white/silver/gold choices honored unless already used',()=>{
 const members=[{color:'GREEN',secondary:'GOLD'}];
 assert.equal(uniqueSecondary('GREEN','GOLD',members),'BLACK');
 assert.equal(uniqueSecondary('GREEN','SILVER',members),'SILVER');
 assert.equal(uniqueSecondary('BLUE','WHITE',members),'WHITE');
});
test('server narration uses gamer tags, never color names; trim survives public state',()=>{
 const game=startRace([{name:'SpeedRacer',color:'RED',secondary:''},{name:'SpeedRacer-2',color:'RED',secondary:'BLACK'}],{laps:3});
 const view=publicGame(game,0);
 assert.equal(view.players[0].name,'SpeedRacer');
 assert.equal(view.players[1].displayName,'SpeedRacer-2');
 assert.equal(view.players[1].secondary,'BLACK');
 action(game,0,'flip');action(game,1,'flip');
 assert.ok(game.logs.some(x=>x.includes('SpeedRacer')&&!x.includes('RED')));
});
