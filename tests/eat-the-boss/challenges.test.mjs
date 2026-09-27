import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../../static/play/eat-the-boss/engine.js';
import {emailDifficulty,emailHitsPlayer,formatDuration,normalizeChallengeRecords} from '../../static/play/eat-the-boss/challenges.js';
const tick=(g,seconds,input={})=>{for(let n=0;n<Math.round(seconds/.02);n++)g.update(.02,input);};
const begin=()=>{const g=new Game(()=>.5);g.startChallenge();return g;};

test('challenge has a protected countdown, only emails, no quota or deadline',()=>{
 const g=begin();tick(g,2);assert.equal(g.elapsed,0);assert.equal(g.drops.length,0);assert.equal(g.review,null);assert.equal(g.lives,3);
 tick(g,1.1);assert.ok(g.elapsed>0);assert.equal(g.events.filter(e=>e.type==='challengeGo').length,1);
 g.invincible=999;tick(g,185,{targetX:35});assert.ok(g.elapsed>180);assert.equal(g.state,'playing');assert.equal(g.lives,3);assert.equal(g.quota,0);assert.equal(g.score,0);assert.equal(g.timeLeft,0);assert.equal(g.messes.length,0);assert.equal(g.shots.length,0);
 const releases=g.events.filter(e=>e.type==='release');assert.ok(releases.length>100);assert.ok(releases.every(e=>e.itemType==='email'));assert.ok(g.drops.every(d=>d.type==='email'));assert.ok(g.drops.length<40);
});
test('challenge gets progressively faster with more emails per release',()=>{
 const ramp=[0,30,60,120,300].map(emailDifficulty);for(let i=1;i<ramp.length;i++){assert.ok(ramp[i].speed>ramp[i-1].speed);assert.ok(ramp[i].interval<ramp[i-1].interval);}
 for(const [elapsed,count,sequence] of [[0,1,0],[40,2,2],[100,3,3]]){const g=begin();g.challengeReady=0;g.elapsed=elapsed;g.spawnCount=sequence;g.spawnClock=0;g.update(.02);tick(g,.38);assert.equal(g.drops.length,count);}
});
test('standing still at the left, center or right eventually loses all three hearts',()=>{
 for(const x of [35,270,505]){const g=begin();g.x=x;for(let n=0;n<6000&&g.state==='playing';n++)g.update(.02,{targetX:x});assert.equal(g.state,'gameover',`camping at ${x}`);assert.equal(g.lives,0);assert.ok(g.elapsed>0);assert.equal(g.failureReason,'email');const elapsed=g.elapsed;tick(g,2);assert.equal(g.elapsed,elapsed);assert.equal(g.events.filter(e=>e.type==='fired').length,1);}
});
test('pause and resize preserve survival time and email flight time',()=>{
 const g=begin();g.challengeReady=0;g.elapsed=23.4;g.drops=[{type:'email',x:160,y:180,vx:10,vy:260}];const flight=(g.catchY-180)/260;
 g.state='paused';tick(g,20,{direction:1});assert.equal(g.elapsed,23.4);assert.equal(g.drops[0].y,180);assert.equal(g.x,270);
 g.resize(1100);assert.ok(Math.abs((g.catchY-g.drops[0].y)/g.drops[0].vy-flight)<1e-9);assert.equal(g.elapsed,23.4);
 g.state='playing';tick(g,.02);assert.ok(g.elapsed>23.4);
});
test('fast and diagonal emails hit the body without tunneling; near misses stay safe',()=>{
 assert.equal(emailHitsPlayer(0,500,0,710,540,650),true);assert.equal(emailHitsPlayer(80,550,-80,600,540,650),true);assert.equal(emailHitsPlayer(35,500,35,710,540,650),false);assert.equal(emailHitsPlayer(0,700,0,720,540,650),false);
 const g=begin();g.challengeReady=0;g.spawnClock=999;g.drops=[{type:'email',x:g.x,y:g.catchY-50,vx:0,vy:10000}];g.update(.02);assert.equal(g.lives,2);assert.equal(g.drops.length,0);
 // A burst grants a brief recovery window, rather than taking all hearts at once.
 g.drops=Array.from({length:3},()=>({type:'email',x:g.x,y:g.catchY-50,vx:0,vy:10000}));g.update(.02);assert.equal(g.lives,2);
});
test('retry resets challenge counters and starting career clears challenge mode',()=>{
 const g=begin();g.elapsed=123;g.dodged=50;g.lives=1;g.startChallenge();assert.equal(g.elapsed,0);assert.equal(g.dodged,0);assert.equal(g.lives,3);assert.equal(g.challengeReady,3);
 g.start(12,420,2);assert.equal(g.mode,'career');assert.equal(g.challengeId,null);assert.equal(g.level,12);assert.equal(g.score,420);assert.equal(g.lives,2);assert.ok(g.timeLeft>0);assert.throws(()=>g.startChallenge('missing'),RangeError);
});
test('survival records reject corrupted data and display minutes, seconds and tenths',()=>{
 for(const raw of [null,{},[],{'email-overload':'20'},{'email-overload':Infinity},{'email-overload':-8}])assert.deepEqual(normalizeChallengeRecords(raw),{'email-overload':0});
 assert.deepEqual(normalizeChallengeRecords({'email-overload':125.6789}),{'email-overload':125.678});assert.equal(formatDuration(125.678,true),'02:05.6');assert.equal(formatDuration(59.999),'00:59');assert.equal(formatDuration(60),'01:00');assert.equal(formatDuration(0,true),'00:00.0');
});
