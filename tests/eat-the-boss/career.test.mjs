import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,LEVELS} from '../../static/play/eat-the-boss/engine.js';
import {careerBulk,PROMOTION_DURATION,FAILURE_DURATION} from '../../static/play/eat-the-boss/career.js';
const tick=(g,seconds)=>{for(let n=0;n<Math.ceil(seconds/.02);n++)g.update(.02);};

test('promotion freezes combat and dispatches one arrival after the lift ride',()=>{
 const g=new Game();g.start(3,500,2);g.drops=[{x:100,y:200,vy:200,type:'file'}];g.promote();const deadline=g.timeLeft,score=g.score;
 tick(g,1);assert.equal(g.level,3);assert.equal(g.timeLeft,deadline);assert.equal(g.drops[0].y,200);assert.equal(g.lives,2);assert.equal(g.events.some(e=>e.type==='arrived'),false);
 tick(g,PROMOTION_DURATION+2);assert.equal(g.events.filter(e=>e.type==='arrived').length,1);assert.equal(g.events.filter(e=>e.type==='elevatorClose').length,1);assert.equal(g.events.filter(e=>e.type==='elevatorDing').length,1);assert.equal(g.score,score);
});

test('missed poop lands as persistent dirt; cash and files never dirty the floor',()=>{
 const g=new Game(()=>.6);g.start(4);g.review.phase='open';g.review.timer=99;g.spawnClock=999;g.quota=2;
 g.drops=[{x:80,y:g.height-16,vy:200,vx:0,type:'poop'}];g.update(.02);assert.equal(g.messes.length,1);assert.equal(g.drops.length,0);assert.equal(g.quota,1);
 const first=g.messes[0];tick(g,2);assert.equal(g.messes[0],first);assert.ok(first.age>1);g.resize(900);assert.equal(g.messes[0],first);
 g.drops=['gold','file','money'].map((type,i)=>({x:200+i*100,y:930,vy:200,vx:0,type}));g.update(.02);assert.equal(g.messes.length,2);assert.equal(g.missedCount,2);
 for(let n=0;n<300;n++)g.soilFloor({x:(n*73)%540,type:'poop'});assert.ok(g.messes.length<=48);assert.ok(g.messes.some(m=>m.size>42));
 g.start(5);assert.equal(g.messes.length,0);assert.equal(g.missedCount,0);
});

test('all failure causes freeze combat and delay the fired screen until sinking finishes',()=>{
 for(const reason of ['miss','file','deadline']){const g=new Game();g.start(2,750);g.fail(reason);const deadline=g.timeLeft;tick(g,1);assert.equal(g.state,'gameover');assert.equal(g.fired,false);assert.equal(g.timeLeft,deadline);tick(g,FAILURE_DURATION);assert.equal(g.fired,true);assert.equal(g.events.filter(e=>e.type==='fired').length,1);tick(g,3);assert.equal(g.events.filter(e=>e.type==='fired').length,1);g.start(g.level,g.startScore);assert.equal(g.score,750);assert.equal(g.failureTime,0);assert.equal(g.fired,false);}
});

test('outfit promotions select the next body tier and the final CEO is largest',()=>{
 const stages=[0,5,10,15].map(level=>careerBulk(level));assert.deepEqual(stages,[0,1,2,3]);
 for(let level=0;level<20;level++)assert.equal(careerBulk(level),LEVELS[level].outfit);
 assert.equal(careerBulk(19,true),4);
});

test('catch effects match the drop color and keep points without floating score text',()=>{
 const g=new Game(()=>.5);g.start();g.catchDrop({type:'poop',x:270,y:g.catchY});assert.equal(g.score,25);assert.ok(g.particles.every(p=>p.color==='#9e6a37'));assert.equal(g.gulpColor,'#9e6a37');assert.equal(g.events.at(-1).text,'');
 g.particles=[];g.catchDrop({type:'gold',x:270,y:g.catchY});assert.equal(g.score,100);assert.ok(g.particles.every(p=>p.color==='#c09b45'));assert.equal(g.gulpColor,'#c09b45');
 g.lives=2;g.particles=[];g.catchDrop({type:'money',x:270,y:g.catchY});assert.equal(g.lives,3);assert.ok(g.particles.every(p=>p.color==='#8ee696'));
});
