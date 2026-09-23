import {W,H,LEVELS,OFFICES} from './engine.js';
import {clearSpriteMatte} from './texture.js';
import {MANAGER_RIGS,managerPose,managerHand,managerReleasePoint} from './manager-animation.js';
import {careerBulk,bodyWidthAt} from './career.js';
import {drawElevator,drawFailure} from './cinematics.js';
const DEFINITIONS={
 employee:['assets/sprites.png',141,60,358,645],boss:['assets/sprites.png',654,80,555,626],poop:['assets/sprites.png',122,783,432,410],gold:['assets/sprites.png',705,783,436,410],
 outfit0:['assets/career-outfits.png',165,13,325,604],outfit1:['assets/career-outfits.png',741,13,323,604],outfit2:['assets/career-outfits.png',161,627,340,607],outfit3:['assets/career-outfits.png',731,627,339,608],
 manager0:['assets/middle-managers.png',110,22,374,746],manager1:['assets/middle-managers.png',755,40,379,728],manager2:['assets/middle-managers.png',1288,66,660,702],
 throw0:['assets/boss-throws.png',92,124,497,498],throw1:['assets/boss-throws.png',714,17,515,613],throw2:['assets/boss-throws.png',42,726,633,457],throw3:['assets/boss-throws.png',726,680,503,506],
 squat:['assets/boss-defecation.png',105,87,448,496],relief:['assets/boss-defecation.png',105,676,548,502],stand:['assets/boss-defecation.png',714,620,432,563],
 cheer:['assets/ceo-finale.png',128,8,400,607],adjust:['assets/ceo-finale.png',738,12,326,607],seated:['assets/ceo-finale.png',106,623,451,589],ceo:['assets/ceo-finale.png',692,632,446,592]
};
export class Renderer {
 constructor(canvas,game){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.game=game;this.images=new Map();this.textures=new Map();this.scenes=new Map();this.ready=false;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.camera=0;this.previousLevel=0;this.transition=0;this.floaters=[];this.dpr=1;this.floorSpace=0;}
 async load(){
  const paths=new Set([...Object.values(DEFINITIONS).map(d=>d[0]),...OFFICES.map(o=>o.asset)]);
  await Promise.all([...paths].map(async src=>{const img=new Image();img.src=src;await img.decode();this.images.set(src,img);}));
  for(const [name,d] of Object.entries(DEFINITIONS)){
   const layer=document.createElement('canvas');layer.width=d[3];layer.height=d[4];const c=layer.getContext('2d',{willReadFrequently:true});c.drawImage(this.images.get(d[0]),...d.slice(1),0,0,d[3],d[4]);
   const pixels=c.getImageData(0,0,layer.width,layer.height);clearSpriteMatte(pixels.data,layer.width,layer.height);c.putImageData(pixels,0,0);
   this.textures.set(name,layer);
  }
  this.managerRigs=MANAGER_RIGS.map((rig,i)=>{
   const source=this.textures.get(`manager${i}`),body=document.createElement('canvas'),arm=document.createElement('canvas');
   body.width=arm.width=source.width;body.height=arm.height=source.height;
   const mask=c=>{c.beginPath();rig.arm.forEach(([x,y],n)=>c[n?'lineTo':'moveTo'](x*source.width,y*source.height));c.closePath();};
   const ac=arm.getContext('2d');mask(ac);ac.clip();ac.drawImage(source,0,0);
   const bc=body.getContext('2d');bc.drawImage(source,0,0);bc.globalCompositeOperation='destination-out';mask(bc);bc.fill();
   // Extend the jacket behind the shoulder so a raised arm never leaves a hole.
   bc.globalCompositeOperation='destination-over';bc.fillStyle=rig.fill;bc.strokeStyle=rig.shade;bc.lineWidth=source.width*.025;
   bc.beginPath();bc.moveTo(source.width*.55,source.height*.43);bc.lineTo(source.width*rig.shoulder[0],source.height*(rig.shoulder[1]-.015));bc.lineTo(source.width*.72,source.height*.66);bc.lineTo(source.width*.52,source.height*.65);bc.closePath();bc.fill();bc.stroke();
   return {body,arm};
  });
  this.ready=true;
 }
 get viewHeight(){return this.game.height+this.floorSpace;}
 resize(height,dpr=1,floorSpace=0){this.game.resize(height);this.floorSpace=Math.max(0,Math.min(400,floorSpace));this.dpr=Math.min(2,dpr||1);this.canvas.width=Math.round(W*this.dpr);this.canvas.height=Math.round(this.viewHeight*this.dpr);this.scenes.clear();}
 scene(level){
  const g=this.game,key=`${level}:${g.height}:${this.floorSpace}`;if(this.scenes.has(key))return this.scenes.get(key);
  const o=OFFICES[LEVELS[level].office],img=this.images.get(o.asset);if(!img)return null;
  const layer=document.createElement('canvas');layer.width=W;layer.height=this.viewHeight;const c=layer.getContext('2d'),pw=img.naturalWidth/2,x=o.panel*pw+1,sw=pw-2,sh=img.naturalHeight;
  // Keep the balcony and floor in perspective while the atrium adapts to the screen.
  c.drawImage(img,x,0,sw,sh*.155,0,0,W,108);
  c.drawImage(img,x,sh*.155,sw,sh*.745,0,108,W,g.height-196);
  c.drawImage(img,x,sh*.9,sw,sh*.1,0,g.height-88,W,88+this.floorSpace);
  const grade=(level-o.first)/Math.max(1,o.last-o.first);c.fillStyle=`rgba(8,13,23,${.13-grade*.09})`;c.fillRect(0,0,W,this.viewHeight);c.globalCompositeOperation='soft-light';c.fillStyle=`hsla(${o.hue+grade*15},65%,${40+grade*18}%,.23)`;c.fillRect(0,0,W,this.viewHeight);
  // Locate existing lit city windows; their animation stays attached to the buildings.
  layer.cityLights=[];
  if(LEVELS[level].office>=3){const pixels=c.getImageData(0,0,W,layer.height).data,candidates=[];for(let y=Math.floor(layer.height*.34);y<layer.height*.83;y+=5)for(let px=78;px<W-78;px+=4){const k=(y*W+px)*4,r=pixels[k],green=pixels[k+1],blue=pixels[k+2];if(r>53&&r>blue*1.32&&green>blue*1.1)candidates.push({x:px,y,brightness:r+green});}candidates.sort((a,b)=>b.brightness-a.brightness);for(const p of candidates){if(layer.cityLights.every(q=>Math.abs(q.x-p.x)+Math.abs(q.y-p.y)>21))layer.cityLights.push(p);if(layer.cityLights.length===18)break;}}
  this.scenes.set(key,layer);if(this.scenes.size>3)this.scenes.delete(this.scenes.keys().next().value);return layer;
 }
 office(dt,t){
  const g=this.game,c=this.ctx,s=this.scene(g.level),height=g.height,o=LEVELS[g.level].office;if(!s)return;c.drawImage(s,0,0);
  this.camera+=(g.x/W-.5-this.camera)*Math.min(1,dt*3);const drift=this.reduced?0:this.camera*5+Math.sin(t*.14)*.5;
  // Only the view through each pane moves. The mullions, balcony and furniture stay fixed.
  const panes=[[.11,.244,.378,.51,.638,.768,.889],[.11,.24,.38,.51,.64,.77,.89],[.14,.244,.415,.581,.719,.867],[.136,.24,.414,.582,.728,.87],[.13,.249,.417,.586,.75,.872],[.13,.247,.419,.587,.75,.871]][o];
  for(let i=0;i<panes.length-1;i++){const left=panes[i]*W+5,right=panes[i+1]*W-5,top=116,bottom=height-91;
   c.save();c.beginPath();c.rect(left,top,right-left,bottom-top);c.clip();c.drawImage(s,left+drift,top+2,right-left,bottom-top-4,left,top,right-left,bottom-top);
   const sheen=c.createLinearGradient(left,top,right,bottom);sheen.addColorStop(0,'#b4d9f108');sheen.addColorStop(.34,'transparent');sheen.addColorStop(1,'#6c9fc50a');c.fillStyle=sheen;c.fillRect(left,top,right-left,bottom-top);
   if(!this.reduced&&o>0){const sweep=(Math.sin(t*.16+i*.09)+1)*.5,shine=c.createLinearGradient(left-120+sweep*230,0,left+sweep*230,0);shine.addColorStop(0,'transparent');shine.addColorStop(.5,o>=4?'#dcc1950d':'#a5c4dd0c');shine.addColorStop(1,'transparent');c.fillStyle=shine;c.fillRect(left,top,right-left,bottom-top);}
   c.restore();
  }
  if(!this.reduced&&s.cityLights?.length){c.save();c.globalCompositeOperation='screen';for(const [i,p] of s.cityLights.entries()){c.globalAlpha=.15+Math.max(0,Math.sin(t*.65+i*1.7))*.6;c.drawImage(s,p.x-2,p.y-3,5,7,p.x-2-drift,p.y-3,5,7);}c.restore();}
  // Light blooms are anchored to lamps already present in the office artwork.
  const glow=(x,y,r,strength,warm=true)=>{const light=c.createRadialGradient(x,y,0,x,y,r);light.addColorStop(0,warm?`rgba(255,184,85,${strength})`:`rgba(172,220,241,${strength})`);light.addColorStop(1,'transparent');c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);};
  const pulse=this.reduced?1:.88+Math.sin(t*.9)*.09;
  if(o===0){const flicker=this.reduced?1:1-(Math.sin(t*1.3)> .992?.45:0);glow(121,22,48,.11*flicker);glow(413,22,46,.10);glow(38,108+(height-196)*.66,56,.075*flicker);glow(508,108+(height-196)*.60,52,.08);}
  else if(o<3){glow(155,25,95,.035*pulse,false);glow(380,25,95,.035*pulse,false);}
  else{glow(28,height*.7,115,.055*pulse);glow(513,height*.32,110,.05*pulse);glow(270,20,95,.04);}
  if(!this.reduced){for(let i=0;i<8;i++){const age=(t*.018+i*.13)%1;c.fillStyle=o===0?'#dda25725':'#c6ddea17';c.fillRect(48+i*61+Math.sin(t*.3+i)*9,120+age*(height-240),2,2);}}
  const depth=c.createLinearGradient(0,0,W,0);depth.addColorStop(0,'#02081790');depth.addColorStop(.13,'#02081725');depth.addColorStop(.38,'transparent');depth.addColorStop(.62,'transparent');depth.addColorStop(.87,'#02081725');depth.addColorStop(1,'#02081790');c.fillStyle=depth;c.fillRect(0,108,W,height-196);
  const balcony=c.createLinearGradient(0,100,0,155);balcony.addColorStop(0,'#02071495');balcony.addColorStop(1,'transparent');c.fillStyle=balcony;c.fillRect(0,106,W,49);
  if(o>=2){c.save();c.beginPath();c.rect(0,height-87,W,87);c.clip();c.globalAlpha=.09;for(let i=0;i<panes.length-1;i++){const x=panes[i]*W;c.fillStyle=o>=4?'#e0bd7c':'#a2c6dc';c.beginPath();c.moveTo(x,height-87);c.lineTo(x+15,height-87);c.lineTo(x+25+(x-W/2)*.17,height);c.lineTo(x+(x-W/2)*.17,height);c.fill();}c.restore();}
  if(this.transition>0){c.globalAlpha=this.transition;const before=this.scene(this.previousLevel);if(before)c.drawImage(before,0,0);c.globalAlpha=1;this.transition=Math.max(0,this.transition-dt*1.6);}
 }
 sprite(name,x,y,w,h,rotation=0,alpha=1,flip=false){const img=this.textures.get(name);if(!img)return;const c=this.ctx;c.save();c.translate(x,y);c.rotate(rotation);c.globalAlpha*=alpha;if(flip)c.scale(-1,1);c.drawImage(img,-w/2,-h/2,w,h);c.restore();}
 careerTexture(key,bulk){
  const source=this.textures.get(key);if(!source||!bulk)return source;
  this.careerTextures??=new Map();const cacheKey=`${key}:${bulk}`;if(this.careerTextures.has(cacheKey))return this.careerTextures.get(cacheKey);
  const shapeBulk=key==='seated'?bulk*.6:bulk,layer=document.createElement('canvas');layer.width=Math.ceil(source.width*(1+shapeBulk*.44*.45));layer.height=source.height;const c=layer.getContext('2d');c.imageSmoothingEnabled=false;
  // Widen the torso; move the arms out with it without stretching their length.
  const side=source.width*.275,center=source.width*.45;
  for(let y=0;y<source.height;y+=3){const height=Math.min(3,source.height-y),belly=center*bodyWidthAt((y+height/2)/source.height,shapeBulk),left=(layer.width-belly)/2;c.drawImage(source,0,y,side,height,left-side,y,side,height);c.drawImage(source,side,y,center,height,left,y,belly,height);c.drawImage(source,side+center,y,side,height,left+belly,y,side,height);}
  this.careerTextures.set(cacheKey,layer);return layer;
 }
 employee(x,y,t,reflection=false,options={}){
  const g=this.game,c=this.ctx,level=options.level??g.level,bulk=careerBulk(level),key=`outfit${LEVELS[level].outfit}`,img=this.careerTexture(key,bulk);if(!img)return;const w=60*img.width/this.textures.get(key).width,h=111,moving=(options.moving??(g.state==='playing'&&Math.abs(g.walk||0)>.1))&&!this.reduced,cycle=t*(23-bulk*2),stride=moving?Math.sin(cycle):0;
  c.save();c.translate(x,y+(moving?-Math.abs(stride)*3:Math.sin(t*2)*.7));if(reflection){c.scale(1,-.26);c.globalAlpha=.1;}
  c.rotate(this.reduced?0:moving?Math.sign(g.walk)*.035:0);const split=.60,upper=img.height*split,hip=-h/2+h*split;
  for(const side of [-1,1]){c.save();c.translate(side*w*.25,hip-1);c.rotate(stride*side*.28/(1+bulk*.2));c.drawImage(img,side===1?img.width/2:0,upper,img.width/2,img.height-upper,-w*.25,0,w/2,h*(1-split)+1);c.restore();}
  c.drawImage(img,0,0,img.width,upper,-w/2,-h/2,w,h*split+1);c.restore();
 }
 boss(t){
  if(this.game.review&&this.game.level!==19){this.manager(t);return;}
  const g=this.game,c=this.ctx,eject=g.state==='victory'?Math.max(0,(g.victoryTime-.65)/1.15):0,entry=g.level===19&&g.review?.phase==='intro'?Math.max(0,1-(g.review.introTotal-g.review.timer)/1.2):0,x=g.bossX+eject*440+entry*entry*340,foot=101-eject*95+eject*eject*150;
  if(eject<1){
   const type=g.pendingDrop?.type??g.releaseType,pooping=type==='poop'||type==='gold';
   if(g.recoil>0&&g.level===19||eject>0)this.sprite('throw3',x,foot-44,87,88,eject*2+(this.reduced?0:Math.sin(t*40)*g.recoil*.12));
   else if(pooping&&(g.pendingDrop||g.release>0)){
    // Feet stay planted: bend, strain, release from the rear, then straighten the jacket.
    const pose=g.pendingDrop?'squat':g.release>.12?'relief':'stand',img=this.textures.get(pose),s=.16;
    if(img){const squeeze=g.pendingDrop&&!this.reduced?Math.sin((1-g.windup/.46)*Math.PI)*.07:0,w=img.width*s*(1+squeeze),h=img.height*s*(1-squeeze),dx=pose==='relief'?8:0;this.sprite(pose,x+dx,foot-h/2,w,h,this.reduced?0:g.pendingDrop?Math.sin(t*43)*.014:0);}
    if(g.pendingDrop&&g.windup<.18){c.fillStyle=type==='gold'?'#ffd76a':'#bd894f';c.fillRect(x+34,82,4,6);}
   }else{
    const pose=g.pendingDrop?(g.windup>.17?'throw0':'throw1'):g.release>0?'throw2':null;
    if(pose){const img=this.textures.get(pose),s=96/613;if(img)this.sprite(pose,x,foot-img.height*s/2,img.width*s,img.height*s,0,1,true);}
    else this.sprite('boss',x,foot-48,85,96,this.reduced?0:Math.sin(t*12)*.012);
    if(g.pendingDrop){const heldX=x+(g.windup>.17?27:23),heldY=g.windup>.17?34:15;if(type==='file')this.file({x:heldX,y:heldY,rotation:-.2});else this.money({x:heldX,y:heldY});}
    if(g.release>0){c.strokeStyle=`rgba(170,221,240,${g.release*2.2})`;c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+27+i*7,96+i*5);c.lineTo(x+30+i*8,117+i*5);c.stroke();}}
   }
  }

 }
 manager(t){
  const g=this.game,b=g.review,c=this.ctx,key=`manager${b.sprite}`,img=this.textures.get(key);if(!img)return;
  const rig=MANAGER_RIGS[b.sprite],parts=this.managerRigs[b.sprite],pose=managerPose(g,this.reduced),defeated=b.phase==='defeated',flight=defeated?b.defeatTime:0,h=rig.height,w=img.width/img.height*h;
  const entrance=b.phase==='intro'?Math.max(0,1-(b.introTotal-b.timer)/1.15):0,x=g.managerX-flight*340-entrance*entrance*245,foot=101-flight*65-(this.reduced?0:entrance>0?Math.abs(Math.sin(t*19))*5:0),warning=b.phase==='warning',attack=b.phase==='attack';
  const lean=this.reduced?0:defeated?-flight*2.5:g.recoil?Math.sin(t*34)*g.recoil*.42:0;
  c.save();c.translate(x,foot);c.rotate(lean);c.fillStyle=warning?'#ffce6940':b.phase==='open'?'#d2f86a24':'#ff625d35';c.beginPath();c.ellipse(0,1,w*.58,5,0,0,Math.PI*2);c.fill();
  const hipY=-h*(1-rig.hip)+pose.crouch,sh=img.height*rig.hip;
  // Feet remain on the balcony while the knees bend and the upper body pivots.
  c.drawImage(parts.body,0,sh,img.width,img.height-sh,-w/2,hipY,w,-hipY+1);
  c.save();c.translate(0,hipY);c.rotate(pose.torso);c.drawImage(parts.body,0,0,img.width,sh,-w/2,-h*rig.hip,w,h*rig.hip+1);
  const sx=(rig.shoulder[0]-.5)*w,sy=(rig.shoulder[1]-rig.hip)*h;
  c.translate(sx,sy);c.rotate(pose.arm);c.drawImage(parts.arm,-rig.shoulder[0]*w,-rig.shoulder[1]*h,w,h);c.restore();
  if(pose.held){const hand=managerHand(b.sprite,w,pose);c.save();c.translate(hand.x,hand.y);c.scale(.68,.68);const item={x:0,y:0,rotation:pose.arm+pose.torso};if(pose.held==='money')this.money(item);else this.file(item);c.restore();}
  c.restore();
  if(warning){c.fillStyle='#ffcf73';c.font='bold 21px monospace';c.textAlign='center';c.fillText('!',x-w*.6,27);}
  if(attack){const elapsed=b.attack-b.timer,origin=managerReleasePoint(b.sprite,'file');for(const z of g.zones){if(z.width<10)continue;const travel=this.reduced?1:Math.min(1,elapsed/.32),tx=x+origin.x+(z.x-x-origin.x)*travel,ty=foot+origin.y+(g.catchY-foot-origin.y)*travel;this.file({x:tx,y:ty,rotation:travel*Math.PI*(b.sprite===2?3:.3)});if(travel===1){c.strokeStyle='#ff807377';c.lineWidth=3;c.beginPath();c.ellipse(z.x,g.catchY+42,Math.min(z.width*.38,68)*(1+(elapsed*3)%1),5,0,0,Math.PI*2);c.stroke();}}}
  if(g.recoil>0&&!this.reduced){for(let i=0;i<3;i++){const a=t*8+i*Math.PI*2/3;c.fillStyle='#ffd66b';c.fillRect(x+Math.cos(a)*30,17+Math.sin(a)*6,4,4);}}
 }
 reviewZones(t){
  const g=this.game,b=g.review,c=this.ctx;if(!b||!['warning','attack'].includes(b.phase))return;const attack=b.phase==='attack',ink=attack?'#f97c69':'#edc078',source=g.level===19?g.bossX:g.managerX;
  for(const z of g.zones){if(z.width<4)continue;const left=z.x-z.width/2,right=left+z.width,top=g.height-78,bottom=g.height-7;
   // A cast shadow connects the manager to floor hazards without covering the office in boxes.
   const fall=c.createLinearGradient(0,120,0,bottom);fall.addColorStop(0,'transparent');fall.addColorStop(.6,attack?'#ed665d08':'transparent');fall.addColorStop(1,attack?'#ed665d37':'#edc07814');c.fillStyle=fall;c.beginPath();c.moveTo(source-8,105);c.lineTo(source+8,105);c.lineTo(right,bottom);c.lineTo(left,bottom);c.closePath();c.fill();
   c.save();c.beginPath();c.rect(left,top,z.width,bottom-top);c.clip();c.fillStyle=attack?'#642c3999':'#45382988';c.fillRect(left,top,z.width,bottom-top);c.strokeStyle=ink;c.lineWidth=3;c.strokeRect(left+2,top+2,Math.max(0,z.width-4),bottom-top-4);
   // Chunky warning tape is painted on the floor, below the employee's face.
   c.fillStyle=ink;for(let x=left-20;x<right+20;x+=22){c.beginPath();c.moveTo(x,top+3);c.lineTo(x+10,top+3);c.lineTo(x+18,top+13);c.lineTo(x+8,top+13);c.fill();c.beginPath();c.moveTo(x,bottom-13);c.lineTo(x+10,bottom-13);c.lineTo(x+18,bottom-3);c.lineTo(x+8,bottom-3);c.fill();}
   if(z.width>44){c.save();c.translate(z.x,top+38);c.rotate(-.07);c.strokeStyle=ink;c.lineWidth=3;c.strokeRect(-14,-12,28,24);c.fillStyle=ink;c.fillRect(-2,-7,4,9);c.fillRect(-2,5,4,4);c.restore();}
   c.restore();
   if(attack){const elapsed=b.attack-b.timer;for(let i=0;i<Math.ceil(z.width/46);i++){const phase=this.reduced?.82:(elapsed*2.1+i*.31)%1,tx=left+20+(i*41)%Math.max(1,z.width-30),y=110+phase*(g.catchY-60);c.save();c.globalAlpha=.78;this.file({x:source+(tx-source)*Math.min(1,phase*3),y,rotation:(i%2?1:-1)*phase*.7});c.restore();}}
  }
  if(b.patternNow==='sweep'){c.strokeStyle='#d2f86a';c.lineWidth=3;c.beginPath();c.moveTo(b.safeX-22,g.height-24);c.lineTo(b.safeX-5,g.height-16);c.lineTo(b.safeX+22,g.height-33);c.stroke();}
 }
 file(d){const c=this.ctx;c.save();c.translate(d.x,d.y);c.rotate(d.rotation||0);c.fillStyle='#733049';c.fillRect(-15,-18,33,41);c.fillStyle='#e5707d';c.fillRect(-18,-21,33,41);c.fillStyle='#ffd2c9';c.fillRect(-12,-14,18,3);c.fillRect(-12,-7,20,2);c.fillStyle='#703040';c.font='bold 8px monospace';c.textAlign='center';c.fillText('FIRED',-1,10);c.restore();}
 money(d){const c=this.ctx;c.save();c.translate(d.x,d.y);c.rotate(d.rotation||-.12);c.fillStyle='#173e32';c.fillRect(-20,-10,40,26);c.fillStyle='#31835a';c.fillRect(-21,-13,40,26);c.fillStyle='#97e58e';c.fillRect(-20,-16,40,25);c.strokeStyle='#215b3b';c.lineWidth=2;c.strokeRect(-17,-13,34,19);c.fillStyle='#c5f4ac';c.beginPath();c.ellipse(0,-3,9,10,0,0,Math.PI*2);c.fill();c.fillStyle='#225638';c.font='bold 19px monospace';c.textAlign='center';c.fillText('$',0,4);c.fillRect(-14,-5,4,4);c.fillRect(10,-5,4,4);c.restore();}
 floorMess(){
  const g=this.game,c=this.ctx;for(const m of g.messes){const spread=this.reduced?1:Math.min(1,m.age*5),width=m.size*(.6+spread*.4),yy=g.height-7+Math.sin(m.seed)*6;c.save();c.translate(m.x,yy);c.fillStyle=m.gold?'#725329':'#382417';c.beginPath();c.ellipse(0,3,width+4,8+spread*3,0,0,Math.PI*2);c.fill();
   for(let i=0;i<6;i++){const a=i*1.8+m.seed,px=Math.cos(a)*width*.7,py=Math.sin(a)*5;c.fillStyle=m.gold?'#b18a42':'#80512c';c.beginPath();c.ellipse(px,py,width*.48,6+(1-spread)*9,0,0,Math.PI*2);c.fill();c.fillStyle=m.gold?'#e4bc60':'#ad7943';c.fillRect(px-4,py-2,7,2);}
   if(m.age<.35&&!this.reduced)for(let i=0;i<5;i++){const p=m.age/.35,px=(i-2)*width*.6*p,py=-Math.sin(p*Math.PI)*(12+i%2*8);c.fillStyle='#966133';c.fillRect(px,py,4,4);}c.restore();
  }
 }
 finale(dt,t){
  const g=this.game,c=this.ctx,h=g.height,v=g.victoryTime,ease=n=>1-Math.pow(1-Math.max(0,Math.min(1,n)),3),rise=ease((v-1.55)/2.4),close=ease((v-3.7)/1.5),zoom=1+close*1.55;
  c.save();c.translate(W/2,close*(h*.40-102*zoom));c.scale(zoom,zoom);c.translate(-W/2,0);this.office(dt,t);
  if(v<1.9)this.boss(t);
  const x=g.x+(W/2-g.x)*rise,ground=h-9-(h-115)*rise,bounce=v<1.5&&!this.reduced?Math.abs(Math.sin(v*8))*9:0;
  if(v>1.4&&v<4.2){const glow=c.createLinearGradient(0,ground-125,0,ground+20);glow.addColorStop(0,'#f8dc8100');glow.addColorStop(.7,'#f8dc8130');glow.addColorStop(1,'#f8dc8100');c.fillStyle=glow;c.fillRect(x-40,ground-125,80,150);if(!this.reduced)for(let i=0;i<9;i++){c.fillStyle='#f9d87a';c.fillRect(x-28+(i*17)%58,ground-((v*90+i*23)%120),3,5);}}
  let key=v<1.55?'cheer':v<4.8?'adjust':'seated';const img=this.careerTexture(key,careerBulk(g.level,true)),heroH=key==='adjust'?110:key==='cheer'?115:108,heroW=img?img.width/img.height*heroH:70;
  if(img){c.save();c.translate(x,ground-heroH/2-bounce);c.rotate(this.reduced?0:v<1.55?Math.sin(v*7)*.04:0);c.drawImage(img,-heroW/2,-heroH/2,heroW,heroH);c.restore();}
  if(v>5.1){c.fillStyle='#252035';c.fillRect(W/2-43,113,86,21);c.fillStyle='#e8c875';c.fillRect(W/2-41,115,82,17);c.fillStyle='#302538';c.font='bold 9px monospace';c.textAlign='center';c.fillText('CHIEF EXECUTIVE',W/2,126);}
  c.restore();
  if(v>.35&&v<.62&&!this.reduced){c.fillStyle=`rgba(255,222,145,${(.62-v)*.7})`;c.fillRect(0,0,W,this.viewHeight);}
  if(v>5.1&&!this.reduced){const age=v-5.1;for(let i=0;i<58;i++){c.fillStyle=['#f7da88','#ff947c','#e8e9dc','#c5ea7c'][i%4];const y=(age*(60+i%5*12)+i*37)%(this.viewHeight+90)-50;c.save();c.translate((i*83+Math.sin(age*2+i)*20)%W,y);c.rotate(age*(i%2?1:-1));c.fillRect(-2,-4,4,8);c.restore();}}
 }
 paint(dt,t){
  const g=this.game,c=this.ctx,h=g.height;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.imageSmoothingEnabled=false;c.clearRect(0,0,W,this.viewHeight);c.fillStyle='#101829';c.fillRect(0,0,W,this.viewHeight);if(!this.ready)return;if(g.state==='victory'){this.finale(dt,t);return;}if(g.state==='promoted'){drawElevator(this,dt,t);return;}if(g.state==='gameover'){drawFailure(this,dt,t);return;}
  this.office(dt,t);this.floorMess();this.reviewZones(t);this.boss(t);
  for(const d of g.drops){if(d.type==='file')this.file({...d,rotation:d.rotation+Math.sin(t*4+d.phase)*.13});else if(d.type==='money')this.money(d);else this.sprite(d.type,d.x,d.y,32,30,d.rotation);}
  for(const shot of g.shots)this.sprite('poop',shot.x,shot.y,42,39,shot.t*9);
  let px=g.x,py=h-65;if(g.state==='victory'){const lift=Math.max(0,Math.min(1,(g.victoryTime-.6)/1.4)),eased=1-Math.pow(1-lift,3);px=g.x+(W/2-g.x)*eased;py=h-65-(h-112)*eased;}
  c.fillStyle='#070b2050';c.beginPath();c.ellipse(px,h-13,30,6,0,0,Math.PI*2);c.fill();
  if(g.level>=6&&g.state!=='victory'){c.save();c.beginPath();c.rect(0,h-20,W,20);c.clip();this.employee(px,h-2,t,true);c.restore();}
  if(g.invincible<=0||Math.floor(t*14)%2===0)this.employee(px,py,t);
  if(g.gulp>0){c.fillStyle='#d2f86a';c.globalAlpha=g.gulp*2.2;c.beginPath();c.arc(px,py-31,11,0,Math.PI*2);c.fill();c.globalAlpha=1;}
  for(const p of g.particles){c.globalAlpha=Math.min(1,p.life*2);c.fillStyle=p.color;c.fillRect(p.x,p.y,4,4);}c.globalAlpha=1;
  if(g.state==='playing')for(let i=this.floaters.length-1;i>=0;i--){const f=this.floaters[i];f.life-=dt;f.y-=dt*28;c.globalAlpha=Math.max(0,f.life);c.fillStyle=f.color;c.font='bold 15px monospace';c.textAlign='center';c.fillText(f.text,f.x,f.y);if(f.life<=0)this.floaters.splice(i,1);}c.globalAlpha=1;
  if(g.state==='victory'&&g.victoryTime>1.5){c.fillStyle='#d2f86a';c.font='bold 14px monospace';c.textAlign='center';c.fillText('NEW CEO',W/2,125);if(!this.reduced)for(let i=0;i<34;i++){c.fillStyle=['#d2f86a','#ff8073','#7ccef1'][i%3];c.fillRect((i*97+Math.sin(t+i)*23)%W,(t*80+i*61)%h,4,8);}}
 }
}
