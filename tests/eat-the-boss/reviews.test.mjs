import test from 'node:test';
import assert from 'node:assert/strict';
import {Game,REVIEWS,LEVELS,CATCH_Y} from '../../static/play/eat-the-boss/engine.js';
import {clearSpriteMatte} from '../../static/play/eat-the-boss/texture.js';
const quiet=level=>{const g=new Game(()=>.6);g.start(level);if(g.review){g.review.phase='open';g.review.timer=g.review.open+1;}g.spawnClock=9999;return g;};
function feed(g){g.drops.push({type:'poop',x:g.x,y:g.catchY-1,vx:0,vy:200,phase:0,rotation:0});g.update(.02);}
test('all four reviews require damage to the manager and finish exactly once',()=>{
 assert.deepEqual(Object.keys(REVIEWS).map(Number),[4,9,14,19]);
 for(const level of [4,9,14,19]){
  const g=quiet(level),b=g.review;
  for(let hit=1;hit<=b.hp;hit++){
   b.phase='open';b.timer=5;g.zones=[];
   for(let n=0;n<b.charge;n++)feed(g);
   assert.equal(g.shots.length,1);assert.equal(g.quota,0);assert.equal(g.state,'playing');
   const before=g.x;for(let f=0;f<34;f++)g.update(.02,{targetX:hit%2?460:80});assert.notEqual(g.x,before);assert.equal(g.hitCount,hit);
  }
  for(let i=0;i<70;i++)g.update(.02);
  assert.equal(g.state,level===19?'victory':'promoted');assert.equal(g.events.filter(e=>e.type===(level===19?'victory':'promoted')).length,1);
 }
});
test('warning is harmless, attack damages once, and a charged counter waits for exposure',()=>{
 const g=quiet(4);g.warnReview();g.quota=g.review.charge;g.update(.02);assert.equal(g.lives,3);assert.equal(g.shots.length,0);assert.equal(g.throwBack(),false);
 g.review.timer=.01;g.update(.02);assert.equal(g.lives,2);
 for(let i=0;i<35;i++)g.update(.02);assert.equal(g.lives,2);
 g.review.timer=.01;g.update(.02);assert.equal(g.review.phase,'open');assert.equal(g.shots.length,1);
});
test('manager patterns offer reachable safe lanes and the sweep moves its gap',()=>{
 for(const level of [4,9,14]){const g=quiet(level);g.warnReview();const safe=[];for(let x=30;x<=510;x+=5)if(g.zones.every(z=>Math.abs(x-z.x)>=z.width/2+13))safe.push(x);assert.ok(safe.length>0);const target=level===14?g.review.safeX:safe.reduce((a,b)=>Math.abs(a-g.x)<Math.abs(b-g.x)?a:b);for(let f=0;f<76;f++)g.update(.02,{targetX:target});assert.equal(g.lives,3,`warning on floor ${level+1} can be escaped`);if(level===14){const start=g.review.safeX;for(let f=0;f<25;f++)g.update(.02,{targetX:g.review.safeX});assert.notEqual(g.review.safeX,start);assert.equal(g.lives,3);}}
});
test('fullscreen resizing preserves travel time, mouth collision, and sprite proportions',()=>{
 const g=quiet(0);g.drops.push({type:'poop',x:270,y:200,vy:230,vx:0});const seconds=(g.catchY-200)/230;g.resize(1100);assert.equal(g.catchY,1004);assert.ok(Math.abs((g.catchY-g.drops[0].y)/g.drops[0].vy-seconds)<1e-9);g.drops=[];feed(g);assert.equal(g.quota,1);g.resize(460);g.drops=[];feed(g);assert.equal(g.quota,2);
});
test('throw anticipation precedes the projectile and a missed deadline ends a run',()=>{
 const g=quiet(0);g.spawn();assert.equal(g.drops.length,0);assert.ok(g.windup>0);for(let i=0;i<24;i++)g.update(.02);assert.equal(g.drops.length,1);assert.ok(g.release>0);assert.equal(g.events.find(e=>e.type==='release').itemType,'poop');g.timeLeft=.01;g.update(.02);assert.equal(g.state,'gameover');assert.equal(g.lives,0);assert.equal(g.events.at(-1).text,'DEADLINE MISSED');
});
test('texture matte clears edge checkerboard while preserving enclosed pale clothing',()=>{
 const size=9,data=new Uint8ClampedArray(size*size*4);for(let p=0;p<size*size;p++){const shade=p%2?160:210;data.set([shade,shade,shade,255],p*4);}
 for(let y=2;y<=6;y++)for(let x=2;x<=6;x++)data.set(x===2||x===6||y===2||y===6?[15,24,53,255]:[245,242,236,255],(y*size+x)*4);
 clearSpriteMatte(data,size,size);assert.equal(data[3],0);assert.equal(data[(4*size+4)*4+3],255);assert.equal(data[(2*size+4)*4+3],255);
});

test('boss entrances pause the deadline and attacks while movement remains available',()=>{for(const level of [4,9,14,19]){const g=new Game(()=>.6);g.start(level);const deadline=g.timeLeft;for(let i=0;i<150;i++)g.update(.02,{targetX:420});assert.equal(g.review.phase,'intro');assert.equal(g.timeLeft,deadline);assert.equal(g.drops.length,0);assert.equal(g.lives,3);assert.equal(g.x,420);for(let i=0;i<201;i++)g.update(.02);assert.equal(g.review.phase,'open');}});
test('final boss has eight hits, a protected second-round transition and faster attacks',()=>{const g=quiet(19),b=g.review;assert.equal(b.hp,8);assert.equal(g.timeLeft,180);for(let hit=0;hit<4;hit++){b.phase='open';b.timer=9;for(let n=0;n<b.charge;n++)feed(g);for(let i=0;i<32;i++)g.update(.02);}assert.equal(g.hitCount,4);assert.equal(b.rage,true);assert.equal(b.phase,'phaseChange');assert.equal(g.drops.length,0);const deadline=g.timeLeft;g.update(.04);assert.equal(g.timeLeft,deadline);assert.ok(b.open<REVIEWS[19].open);assert.ok(b.warningTime<1.5);assert.equal(g.events.filter(e=>e.type==='enrage').length,1);g.state='victory';g.victoryTime=0;for(let i=0;i<220;i++)g.update(.04);assert.equal(g.events.filter(e=>e.type==='crowned').length,1);});
