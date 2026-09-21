import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../../static/play/eat-the-boss/engine.js';
import {MANAGER_TIMING,MANAGER_RIGS,managerPose,managerHand} from '../../static/play/eat-the-boss/manager-animation.js';

test('each manager releases cash and files from the animated hand and plants their feet for release',()=>{
 for(const [sprite,floor] of [4,9,14].entries())for(const type of ['money','file']){
  const g=new Game();g.start(floor);g.review.phase='open';g.review.timer=20;g.managerX=270;g.spawnClock=99;
  g.pendingDrop={type,vx:0,speed:250};g.windup=0;
  const before=managerPose(g),width=MANAGER_RIGS[sprite].height*[374/746,379/728,660/702][sprite],hand=managerHand(sprite,width,before);
  g.releaseThrow();const drop=g.drops.at(-1),after=managerPose(g);
  assert.ok(Math.abs(drop.x-g.managerX-hand.x)<.001);assert.ok(Math.abs(drop.y-101-hand.y)<.001);
  for(const k of ['arm','torso','crouch'])assert.ok(Math.abs(before[k]-after[k])<.001,`${k} must not jump when the item leaves the hand`);
  for(let n=0;n<5;n++)g.update(.02);assert.equal(g.managerX,270);
  for(let n=0;n<5;n++)g.update(.02);assert.notEqual(g.managerX,270);
 }
});

test('recovery finishes before another throw, and managers keep moving between throws',()=>{
 const g=new Game(()=>.6);g.start(14);g.review.phase='open';g.review.timer=30;g.invincible=99;const origins=[];
 for(let n=0;n<400;n++){g.update(.02);const events=g.events.splice(0);for(const e of events)if(e.type==='release')origins.push(e.x);if(g.release>0)assert.equal(g.pendingDrop,null,'next throw must not cut off follow-through');}
 assert.ok(origins.length>=5);assert.ok(Math.max(...origins)-Math.min(...origins)>100,'manager must not become a stationary turret');
});

test('crouching and overhand throws use distinct poses and settle back to idle',()=>{
 const g=new Game();g.start(4);g.review.phase='open';g.pendingDrop={type:'file'};g.windup=MANAGER_TIMING.throwWindup*.32;
 const raised=managerPose(g);assert.ok(raised.arm<-2);assert.equal(raised.held,'file');
 g.pendingDrop={type:'poop'};g.windup=0;const crouch=managerPose(g);assert.ok(crouch.crouch>=14);assert.equal(crouch.held,null);assert.ok(crouch.torso<-.3);
 g.pendingDrop=null;g.releaseType='poop';g.release=MANAGER_TIMING.poopRelease;const released=managerPose(g);assert.deepEqual(released.crouch,crouch.crouch);
 g.release=0;const idle=managerPose(g);assert.equal(idle.arm,0);assert.equal(idle.crouch,0);assert.equal(idle.torso,0);
 g.review.phase='warning';g.review.timer=g.review.warningTime*.32;const warning=managerPose(g);assert.ok(warning.arm<-2);assert.equal(warning.held,'file');
 const reduced=managerPose(g,true);assert.ok(Math.abs(reduced.arm)<Math.abs(warning.arm));
});
