export const CHALLENGES=[{id:'email-overload',name:'Email Overload',lives:3}];
export const CHALLENGE_FAILURE_DURATION=1.25;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function normalizeChallengeRecords(raw){
 return Object.fromEntries(CHALLENGES.map(({id})=>{const n=raw?.[id];return [id,Number.isFinite(n)?Math.floor(clamp(n,0,604800)*1000)/1000:0];}));
}
export function formatDuration(seconds,precise=false){
 const ticks=Math.floor(Math.max(0,Number.isFinite(seconds)?seconds:0)*10+1e-7),whole=Math.floor(ticks/10);
 return `${String(Math.floor(whole/60)).padStart(2,'0')}:${String(whole%60).padStart(2,'0')}${precise?'.'+ticks%10:''}`;
}
export function emailDifficulty(seconds){
 const t=Math.max(0,seconds);
 return {speed:235+465*(1-Math.exp(-t/100)),interval:.29+.76*Math.exp(-t/75),windup:.18+.16*Math.exp(-t/90)};
}
// Sweep relative to the moving employee, so fast emails cannot skip their body.
export function emailHitsPlayer(x0,y0,x1,y1,top,bottom){
 let enter=0,leave=1;
 for(const [from,to,min,max] of [[x0,x1,-31,31],[y0,y1,top,bottom]]){
  const delta=to-from;if(Math.abs(delta)<1e-9){if(from<min||from>max)return false;continue;}
  let a=(min-from)/delta,b=(max-from)/delta;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);leave=Math.min(leave,b);if(enter>leave)return false;
 }
 return true;
}
export function updateEmailChallenge(g,dt,oldPlayerX,width){
 if(g.challengeReady>0){const before=Math.ceil(g.challengeReady);g.challengeReady=Math.max(0,g.challengeReady-dt);if(g.challengeReady===0)g.event('challengeGo');else if(Math.ceil(g.challengeReady)<before)g.event('challengeTick');return;}
 g.elapsed+=dt;const difficulty=emailDifficulty(g.elapsed);
 const before=g.bossX;
 if(!g.pendingDrop)g.bossX=width/2+Math.sin(g.time*1.2)*165+Math.sin(g.time*2.4)*28;
 g.bossWalk=g.bossX-before;g.spawnClock-=dt;
 if(g.spawnClock<=0&&!g.pendingDrop&&g.release<=.04){
  // Aim often enough that staying at either edge is never a permanent refuge.
  const aimed=g.spawnCount%3!==1,target=aimed?g.x:35+g.random()*(width-70);
  const count=g.elapsed>=90&&g.spawnCount%4===3?3:g.elapsed>=30&&g.spawnCount%3===2?2:1;
  g.pendingDrop={type:'email',target,count,speed:difficulty.speed};g.windup=difficulty.windup;g.challengeWindup=difficulty.windup;g.spawnClock=difficulty.interval;
 }
 if(g.pendingDrop){g.windup=Math.max(0,g.windup-dt);if(g.windup===0){
  const p=g.pendingDrop,x=clamp(g.bossX+28,24,width-24),y=100,vy=p.speed*g.flightScale,flight=(g.catchY-y)/vy;
  for(let i=0;i<p.count;i++){const target=clamp(p.target+(i-(p.count-1)/2)*96,30,width-30);g.drops.push({type:'email',x,y,vx:(target-x)/flight,vy,rotation:(i-(p.count-1)/2)*.18,phase:g.random()*Math.PI*2});}
  g.pendingDrop=null;g.releaseType='email';g.release=.20;g.spawnCount++;g.event('release','',{itemType:'email',x,y});
 }}
 for(let i=g.drops.length-1;i>=0;i--){
  const d=g.drops[i],ox=d.x,oy=d.y;d.x+=d.vx*dt;d.y+=d.vy*dt;
  if(emailHitsPlayer(ox-oldPlayerX,oy,d.x-g.x,d.y,g.catchY-24,g.height-12)){
   g.drops.splice(i,1);g.damage(d.x,d.y,'email');if(g.state!=='playing')break;
  }else if(d.y>g.height+24){g.drops.splice(i,1);g.dodged++;}
 }
}
