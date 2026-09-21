import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,W} from '../../static/play/eat-the-boss/engine.js';
import {Renderer} from '../../static/play/eat-the-boss/renderer.js';
import {clearSpriteMatte} from '../../static/play/eat-the-boss/texture.js';

test('cash pickups heal up to three hearts and emit a payday event',()=>{
 const g=new Game();g.start(2);g.lives=1;g.catchDrop({type:'money',x:g.x,y:g.catchY});assert.equal(g.lives,2);assert.equal(g.quota,0);assert.equal(g.events.at(-1).type,'money');assert.match(g.events.at(-1).text,/PAYDAY/);g.catchDrop({type:'money',x:g.x,y:g.catchY});g.catchDrop({type:'money',x:g.x,y:g.catchY});assert.equal(g.lives,3);
 const spawned=new Set();for(let n=0;n<1000;n++){g.random=()=>n/1000;g.pendingDrop=null;g.spawn();spawned.add(g.pendingDrop.type);}assert.deepEqual([...spawned].sort(),['file','gold','money','poop']);
});

test('the sole middle manager supplies every drop and receives the counterattack',()=>{
 for(const floor of [4,9,14]){
  const g=new Game(()=>.6);g.start(floor);g.review.phase='open';g.review.timer=50;g.bossX=470;g.managerX=180;
  for(const type of ['poop','gold','money','file']){g.pendingDrop={type,vx:0,speed:250};g.releaseThrow();assert.equal(g.drops.at(-1).x,208);}
  g.drops=[];g.pendingDrop={type:'poop',vx:0,speed:250};g.windup=.4;g.update(.02);assert.equal(g.managerX,180,'thrower stays planted during anticipation');
  let managerCalls=0;Renderer.prototype.boss.call({game:g,manager(){managerCalls++;},sprite(){assert.fail('Main boss must not be rendered during a middle-manager fight');}},0);assert.equal(managerCalls,1);
  g.quota=g.review.charge;g.throwBack();g.update(.04);assert.ok(g.shots[0].x<W/2,'counterattack heads toward the manager on the left');
 }
 const final=new Game();final.start(19);assert.equal(final.throwerX,final.bossX);
});

test('matte cleanup removes pale edge residue and detached dust, but keeps enclosed shirt white',()=>{
 const size=20,data=new Uint8ClampedArray(size*size*4);
 for(let p=0;p<size*size;p++)data.set([112,130,154,255],p*4);
 for(let y=6;y<=13;y++)for(let x=6;x<=13;x++)data.set(x===6||x===13||y===6||y===13?[15,24,53,255]:[245,242,236,255],(y*size+x)*4);
 data.set([50,60,79,255],(3*size+3)*4);clearSpriteMatte(data,size,size);
 assert.equal(data[3],0);assert.equal(data[(3*size+3)*4+3],0);assert.equal(data[(9*size+9)*4+3],255);assert.equal(data[(6*size+9)*4+3],255);
});
