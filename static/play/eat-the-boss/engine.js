export const W=540,H=660,CATCH_Y=564;
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const titles=['Unpaid Intern','Paid Intern','Office Assistant','Junior Associate','Associate','Senior Associate','Team Lead','Assistant Manager','Manager','Senior Manager','Department Head','Associate Director','Director','Senior Director','Vice President','Senior Vice President','Executive VP','Chief of Staff','Chief Operating Officer','Chief Executive Officer'];
const memos=['Your first job. Bring your own lunch.','A positive attitude makes anything digestible.','Your job description includes “other duties.”','Meet the deadline. Keep the streak.','HR has scheduled your first review.','Dress for the job you are swallowing.','Leadership means catching more of it.','Our crosswinds are a growth opportunity.','Your team is you. Your budget is zero.','Finance has frozen your promotion.','New suit. Same questionable decisions.','Please align on the falling deliverables.','The corner office is getting closer.','Compensation is mostly exposure.','Operations would like to restructure you.','Executive dress code unlocked.','There is no “I” in unpaid overtime.','Think outside the inbox.','One more performance review.','Take the corner office. End the cycle.'];
export const OFFICES=[
 {name:'The Basement',asset:'assets/office-early.png',panel:0,first:0,last:2,hue:29},
 {name:'The Cubicle Farm',asset:'assets/office-early.png',panel:1,first:3,last:5,hue:72},
 {name:'The Open Office',asset:'assets/office-mid.png',panel:0,first:6,last:9,hue:183},
 {name:'Corporate Headquarters',asset:'assets/office-mid.png',panel:1,first:10,last:13,hue:211},
 {name:'The Executive Suite',asset:'assets/office-top.png',panel:0,first:14,last:16,hue:32},
 {name:'The Sky Penthouse',asset:'assets/office-top.png',panel:1,first:17,last:19,hue:45}
];
export const OUTFITS=['Casual Friday','Office Ready','Management Material','Executive Privilege'];
export const REVIEWS={
 4:{name:'The HR Gatekeeper',sprite:0,hp:3,charge:3,pattern:'audit',open:4.2,attack:1.1,intro:'HR REVIEW · DODGE THE MARKED AUDIT LANE'},
 9:{name:'The Budget Controller',sprite:1,hp:4,charge:4,pattern:'budget',open:4.0,attack:1.3,intro:'BUDGET FREEZE · FIND THE OPEN LANE'},
 14:{name:'The Restructurer',sprite:2,hp:4,charge:4,pattern:'sweep',open:3.8,attack:1.8,intro:'RESTRUCTURING · FOLLOW THE SAFE GAP'},
 19:{name:'The Big Boss',sprite:-1,hp:8,charge:5,pattern:'mixed',open:3.6,attack:1.65,intro:'FINAL REVIEW · TAKE THE CORNER OFFICE'}
};
export const LEVELS=titles.map((title,i)=>({title,memo:memos[i],office:OFFICES.findIndex(o=>i>=o.first&&i<=o.last),outfit:Math.min(3,Math.floor(i/5)),review:REVIEWS[i]||null,quota:REVIEWS[i]?.charge??10+Math.floor(i*.72),streak:i>=10?4:i>=3?3:1,speed:225+i*10,interval:Math.max(.44,.86-i*.021),hazard:Math.min(.34,.13+i*.011),wind:i>=3?(i%2?1:-1)*(28+i*2):0,gold:.055,deadline:i===19?180:REVIEWS[i]?110:30-Math.floor(i*.28),twist:REVIEWS[i]?.intro??(i===0?'CATCH THE QUOTA BEFORE TIME RUNS OUT.':i===3?'KEEP A STREAK. BEAT THE DEADLINE.':`FLOOR ${String(i+1).padStart(2,'0')} · ${title.toUpperCase()}`)}));
export function normalizeSave(raw){if(!raw||typeof raw!=='object')return {level:0,score:0,best:0,won:false};const integer=(n,max)=>Number.isFinite(n)?clamp(Math.floor(n),0,max):0;return {level:integer(raw.level,19),score:integer(raw.score,99999999),best:integer(raw.best,99999999),won:raw.won===true};}
export class Game {
 constructor(random=Math.random){this.random=random;this.height=H;this.state='ready';this.level=0;this.score=0;this.lives=3;this.quota=0;this.combo=0;this.x=W/2;this.bossX=W/2;this.time=0;this.drops=[];this.particles=[];this.events=[];this.shots=[];this.hitCount=0;this.invincible=0;this.gulp=0;this.release=0;this.windup=0;this.victoryTime=0;this.review=null;this.zones=[];this.timeLeft=42;this.managerX=W/2;}
 get throwerX(){return this.review&&this.level!==19?this.managerX:this.bossX;}
 get catchY(){return this.height-96;}
 get flightScale(){return (this.catchY-104)/(CATCH_Y-104);}
 resize(height){const next=clamp(Math.round(height),420,1500),ratio=(next-200)/(this.height-200);for(const d of this.drops){d.y=104+(d.y-104)*ratio;d.vy*=ratio;}for(const s of this.shots)s.y=68+(s.y-68)*ratio;for(const p of this.particles)p.y=104+(p.y-104)*ratio;this.height=next;}
 start(level=0,score=0,lives=3){
  this.level=clamp(level,0,19);this.score=score;this.startScore=score;this.lives=lives;this.quota=0;this.combo=0;this.x=W/2;this.bossX=W/2;this.bossWalk=0;this.walk=0;this.time=0;this.drops=[];this.particles=[];this.shots=[];this.hitCount=0;this.invincible=0;this.gulp=0;this.release=0;this.windup=0;this.pendingDrop=null;this.spawnClock=.85;this.spawnCount=0;this.recoil=0;this.state='playing';this.events=[];this.victoryTime=0;this.zones=[];this.managerX=W/2;this.timeLeft=LEVELS[this.level].deadline;
  this.review=LEVELS[this.level].review?{...LEVELS[this.level].review,phase:'intro',timer:7,introTotal:7,warningTime:1.5,rage:false,chained:false,cycle:0,patternNow:'audit',defeatTime:0}:null;
  if(this.review)this.bossX=this.level===19?W/2:400;this.event('start',LEVELS[this.level].twist);
 }
 event(type,text='',extra={}){this.events.push({type,text,...extra});}
 burst(x,y,color,count=10){for(let i=0;i<count;i++){const a=this.random()*Math.PI*2,speed=35+this.random()*125;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,color,life:.5+this.random()*.35});}}
 spawn(){
  if(this.pendingDrop)return;const c=LEVELS[this.level],r=this.random(),hazard=this.review?.phase==='open'?c.hazard*(this.review.rage?.94:.7):c.hazard,money=this.level>=2?.022:0;
  const type=r<hazard?'file':r<hazard+money?'money':r<hazard+money+c.gold?'gold':'poop';
  this.pendingDrop={type,vx:c.wind*(.7+this.random()*.6)*(this.review?.rage?1.25:1)*(this.review?.patternNow==='budget'&&this.review.cycle%2?-1:1),speed:c.speed*(.92+this.random()*.16)*(this.review?.rage?1.14:1)};this.windup=type==='poop'||type==='gold'?.46:.34;
 }
 releaseThrow(){
  const p=this.pendingDrop;if(!p)return;const drop={x:clamp(this.throwerX+28,24,W-24),y:100,vx:p.vx,vy:p.speed*this.flightScale,type:p.type,phase:this.random()*6.28,rotation:(this.random()-.5)*.5};this.spaceHazard(drop);this.drops.push(drop);this.spawnCount++;
  if(!this.review&&this.level>=6&&this.spawnCount%4===0&&p.type!=='file'){const decoy={...drop,type:'file',x:clamp(drop.x+(drop.x<W/2?96:-96),25,W-25),vy:drop.vy*.83};this.spaceHazard(decoy);this.drops.push(decoy);}
  this.pendingDrop=null;this.releaseType=drop.type;this.release=drop.type==='poop'||drop.type==='gold'?.38:.24;this.event('release','',{x:drop.x,y:drop.y,itemType:drop.type});
 }
 spaceHazard(drop){
  const isHazard=d=>d.type==='file',arrival=d=>(this.catchY-d.y)/d.vy;
  const landing=d=>{const span=W-48,raw=d.x-24+d.vx*Math.max(0,arrival(d)),v=((raw%(span*2))+span*2)%(span*2);return 24+(v>span?span*2-v:v);};
  for(let attempt=0;attempt<8;attempt++){const conflict=this.drops.find(d=>isHazard(d)!==isHazard(drop)&&arrival(d)>0&&Math.abs(arrival(d)-arrival(drop))<.24&&Math.abs(landing(d)-landing(drop))<80);if(!conflict)break;drop.vy=(this.catchY-drop.y)/(arrival(conflict)+.28);}
 }
 damage(x,y){if(this.invincible>0||this.state!=='playing')return;this.lives--;this.combo=0;this.invincible=.48;this.burst(x,y,'#ff8073',12);this.event('damage','−1 HEART');if(this.lives<=0){this.state='gameover';this.event('gameover','PERFORMANCE REVIEW: FAILED');}}
 promote(){this.state='promoted';this.score+=this.review?350:100;this.event('promoted',LEVELS[this.level+1].title,{review:!!this.review});}
 catchDrop(d){
  if(d.type==='file'){this.damage(d.x,d.y);return;}if(d.type==='money'){this.lives=Math.min(3,this.lives+1);this.score+=25;this.burst(d.x,d.y,'#8ee696');this.event('money','PAYDAY +1 ♥');return;}
  const value=d.type==='gold'?3:1;this.quota+=value;this.combo++;const multiplier=Math.min(4,1+Math.floor((this.combo-1)/5)),points=(d.type==='gold'?75:25)*multiplier;this.score+=points;this.gulp=.23;this.burst(d.x,d.y,d.type==='gold'?'#ffdc62':'#d2f86a');this.event('catch',`+${points}`,{x:d.x,y:d.y,multiplier,itemType:d.type});
  const c=LEVELS[this.level];if(this.review)this.quota=Math.min(c.quota,this.quota);else if(this.quota>=c.quota&&this.combo>=c.streak)this.promote();
 }
 throwBack(){if(this.state!=='playing'||!this.review||this.review.phase!=='open'||this.quota<this.review.charge||this.shots.length)return false;this.quota=0;this.shots.push({x:this.x,y:this.catchY,t:0,fromX:this.x});this.event('throw','RETURN TO SENDER');return true;}
 warnReview(){
  const b=this.review;b.cycle++;b.phase='warning';b.timer=b.warningTime;b.patternNow=b.pattern==='mixed'?['audit','budget','sweep'][(b.cycle-1)%3]:b.pattern;const p=b.patternNow;
  if(p==='audit'){this.zones=[{x:clamp(this.x,60,W-60),width:this.level===19?(b.rage?164:140):110}];this.event('warning','AUDIT INCOMING · LEAVE THE MARKED LANE');}
  else if(p==='budget'){b.safeLane=(b.cycle+1)%3;this.zones=[0,1,2].filter(i=>i!==b.safeLane).map(i=>({x:90+i*180,width:176}));this.event('warning','BUDGET FREEZE · MOVE INTO THE CLEAR LANE');}
  else {b.sweepDirection=b.cycle%2?1:-1;b.safeX=b.sweepDirection===1?110:430;this.sweepZones();this.event('warning','RESTRUCTURING · FOLLOW THE MOVING GAP');}
  this.drops=this.drops.filter(d=>d.type!=='file');this.pendingDrop=null;this.windup=0;
 }
 sweepZones(){const b=this.review,gap=this.level===19?(b.rage?114:132):152,left=Math.max(0,b.safeX-gap/2),right=Math.min(W,b.safeX+gap/2);this.zones=[{x:left/2,width:left},{x:(W+right)/2,width:W-right}];}
 enrage(){const b=this.review;b.rage=true;b.phase='phaseChange';b.timer=3.5;b.phaseChangeTotal=3.5;b.open=3.15;b.attack=1.7;b.warningTime=1.05;b.chained=false;this.drops=[];this.pendingDrop=null;this.windup=0;this.zones=[];this.event('enrage','FINAL WARNING');}
 updateReview(dt){
  const b=this.review;if(!b)return;
  if(b.phase==='defeated'){b.defeatTime+=dt;if(b.defeatTime>=1.3)this.promote();return;}
  b.timer-=dt;if(b.timer<=0){
   if(b.phase==='intro'||b.phase==='phaseChange'){b.phase='open';b.timer=b.open+1;this.spawnClock=.25;this.event('open','CATCH TO COUNTER');}
   else if(b.phase==='open'){if(this.shots.length){b.timer=.1;return;}this.warnReview();}
   else if(b.phase==='warning'){b.phase='attack';b.timer=b.attack;b.attacked=false;this.event('attack',b.patternNow.toUpperCase());}
   else if(b.rage&&this.hitCount>=6&&!b.chained){b.chained=true;this.warnReview();}
   else {b.chained=false;b.phase='open';b.timer=b.open;this.zones=[];this.spawnClock=.08;this.event('open','COUNTERATTACK · CATCH TO FILL YOUR METER');}
  }
  if(b.phase==='attack'){if(b.patternNow==='sweep'){const progress=1-b.timer/b.attack;b.safeX=b.sweepDirection===1?110+320*progress:430-320*progress;this.sweepZones();}if(!b.attacked&&this.zones.some(z=>Math.abs(this.x-z.x)<z.width/2+13)){const before=this.lives;this.damage(this.x,this.catchY);if(this.lives<before)b.attacked=true;}}
 }
 update(dt,input={}){
  dt=clamp(dt,0,.04);if(this.state==='victory'){const before=this.victoryTime;this.victoryTime+=dt;if(before<5.1&&this.victoryTime>=5.1)this.event('crowned','CHIEF EXECUTIVE OFFICER');this.updateParticles(dt);return;}if(this.state!=='playing')return;
  this.time+=dt;this.invincible=Math.max(0,this.invincible-dt);this.gulp=Math.max(0,this.gulp-dt);this.release=Math.max(0,this.release-dt);this.recoil=Math.max(0,(this.recoil||0)-dt);
  const oldX=this.x;if(input.targetX!==null&&Number.isFinite(input.targetX))this.x+=clamp(input.targetX-this.x,-670*dt,670*dt);if(input.direction)this.x+=input.direction*485*dt;this.x=clamp(this.x,30,W-30);this.walk=this.x-oldX;
  if(['intro','phaseChange','defeated'].includes(this.review?.phase)){this.updateReview(dt);this.updateParticles(dt);return;}
  this.timeLeft=Math.max(0,this.timeLeft-dt);if(this.timeLeft<=0){this.lives=0;this.state='gameover';this.event('gameover','DEADLINE MISSED');return;}
  this.updateReview(dt);if(this.state!=='playing')return;
  const oldBossX=this.throwerX,pace=this.time*(1.2+this.level*.025),position=W/2+Math.sin(pace)*173+Math.sin(pace*2.3+this.level)*27;
  if(!this.pendingDrop){if(this.review&&this.level!==19){if(this.review.phase==='open')this.managerX=position;}else this.bossX=position;}this.bossWalk=this.throwerX-oldBossX;
  if(!this.review||this.review.phase==='open'){this.spawnClock-=dt;if(this.spawnClock<=0&&!this.pendingDrop){this.spawn();this.spawnClock=LEVELS[this.level].interval*(.87+this.random()*.26);}if(this.pendingDrop){this.windup=Math.max(0,this.windup-dt);if(this.windup<=0)this.releaseThrow();}}
  for(let i=this.drops.length-1;i>=0;i--){const d=this.drops[i],oldY=d.y;d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.x<24||d.x>W-24){d.x=clamp(d.x,24,W-24);d.vx*=-1;}
   if(oldY<this.catchY&&d.y>=this.catchY&&Math.abs(d.x-this.x)<(d.type==='file'?35:28)){this.drops.splice(i,1);this.catchDrop(d);if(this.state!=='playing')break;continue;}
   if(d.y>this.height+20){this.drops.splice(i,1);if(d.type==='poop'||d.type==='gold'){if(this.review){this.quota=Math.max(0,this.quota-1);this.combo=0;this.event('miss','−1 POWER');}else this.damage(clamp(d.x,15,W-15),this.height-20);}if(this.state!=='playing')break;}
  }
  if(this.state==='playing'&&this.review&&this.quota>=this.review.charge&&!this.shots.length)this.throwBack();
  if(this.state==='playing')for(let i=this.shots.length-1;i>=0;i--){const s=this.shots[i];s.t+=dt*1.7;const target=this.level===19?this.bossX:this.managerX;s.x=s.fromX+(target-s.fromX)*Math.min(1,s.t);s.y=this.catchY-(this.catchY-68)*Math.min(1,s.t);
   if(s.t>=1){this.shots.splice(i,1);this.hitCount++;this.recoil=.5;this.score+=250;this.burst(target,65,'#ffd365',24);this.event('bossHit',`${this.hitCount} / ${this.review.hp} · DIRECT HIT`);if(this.level===19&&this.hitCount===4)this.enrage();
    if(this.hitCount>=this.review.hp){this.drops=[];this.pendingDrop=null;this.windup=0;this.zones=[];if(this.level===19){this.state='victory';this.victoryTime=0;this.score+=1000;this.event('victory','YOU ARE THE BOSS NOW.');}else {this.review.phase='defeated';this.review.defeatTime=0;this.event('managerDefeated',`${this.review.name.toUpperCase()} · REMOVED`);}}
   }
  }
  this.updateParticles(dt);
 }
 updateParticles(dt){for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;if(p.life<=0)this.particles.splice(i,1);}}
}
