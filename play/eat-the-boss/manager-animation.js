// The arm masks and shoulder pivots use the existing character artwork.
export const MANAGER_RIGS = [
 {height:108,hip:.65,shoulder:[.70,.43],grip:[.71,.55],arm:[[.70,.39],[1,.39],[1,.65],[.60,.65],[.66,.51]],fill:'#be263e',shade:'#811e35'},
 {height:108,hip:.65,shoulder:[.69,.39],grip:[.87,.46],arm:[[.69,.32],[1,.29],[1,.59],[.67,.61],[.64,.48]],fill:'#286542',shade:'#194436'},
 {height:103,hip:.65,swing:.8,shoulder:[.79,.32],grip:[.74,.58],arm:[[.76,.25],[1,.25],[1,.71],[.57,.71],[.57,.42],[.70,.39]],fill:'#344f83',shade:'#22375e'}
];
export const MANAGER_TIMING = {throwWindup:.52,poopWindup:.62,throwRelease:.4,poopRelease:.48};
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
const rigPose=(sprite,pose)=>({...pose,arm:pose.arm*(MANAGER_RIGS[sprite]?.swing??1)});

function throwing(progress){
 const pull=ease(progress/.68),swing=ease((progress-.68)/.32);
 return {arm:-2.45*pull+1.3*swing,torso:-.18*pull+.39*swing,crouch:3*pull-2*swing};
}
function followThrough(progress){
 const swing=ease(progress/.3),settle=ease((progress-.3)/.7);
 return {arm:-1.15+1.55*swing-.4*settle,torso:.21*(1-settle),crouch:1+3*swing-4*settle};
}
export function managerPose(game,reduced=false){
 const b=game.review,type=game.pendingDrop?.type??game.releaseType,poop=type==='poop'||type==='gold';
 let pose={arm:0,torso:0,crouch:0},held=null,action='idle';
 if(b.phase==='warning'){
  pose=throwing(clamp(1-b.timer/b.warningTime));held='file';action='warning';
 }else if(b.phase==='attack'){
  pose=followThrough(clamp((b.attack-b.timer)/.46));action='attack';
 }else if(game.pendingDrop){
  const progress=clamp(1-game.windup/(poop?MANAGER_TIMING.poopWindup:MANAGER_TIMING.throwWindup));
  if(poop){const bend=ease(progress/.7);pose={arm:.55*bend,torso:-.34*bend,crouch:14*bend};action='strain';}
  else {pose=throwing(progress);held=type;action='throw';}
 }else if(game.release>0){
  const progress=clamp(1-game.release/(poop?MANAGER_TIMING.poopRelease:MANAGER_TIMING.throwRelease));
  if(poop){const bend=1-ease((progress-.18)/.82);pose={arm:.55*bend,torso:-.34*bend,crouch:14*bend};action='relief';}
  else {pose=followThrough(progress);action='release';}
 }
 // Reduced motion retains readable action silhouettes without the full swing.
 if(reduced){pose.arm*=.35;pose.torso*=.35;pose.crouch*=.4;}
 return {...rigPose(b.sprite,pose),held,action};
}
export function managerHand(sprite,width,pose){
 const r=MANAGER_RIGS[sprite],h=r.height,hipY=-h*(1-r.hip)+pose.crouch;
 const arm=rotate((r.grip[0]-r.shoulder[0])*width,(r.grip[1]-r.shoulder[1])*h,pose.arm);
 const hand=rotate((r.shoulder[0]-.5)*width+arm.x,(r.shoulder[1]-r.hip)*h+arm.y,pose.torso);
 return {x:hand.x,y:hipY+hand.y};
}
export function managerReleasePoint(sprite,type){
 if(type==='poop'||type==='gold')return {x:20,y:-8};
 const widths=[374/746,379/728,660/702],r=MANAGER_RIGS[sprite];
 return managerHand(sprite,r.height*widths[sprite],rigPose(sprite,followThrough(0)));
}
