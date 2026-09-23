import {W,LEVELS} from './engine.js';
const unit=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=unit(n);return n*n*(3-2*n);};

export function drawElevator(r,dt,t){
 const g=r.game,c=r.ctx,p=unit(g.promotionTime/g.promotionDuration),travel=ease((p-.38)/.28),h=g.height,vh=r.viewHeight;
 const old=r.scene(g.level),next=r.scene(g.level+1);if(!old||!next)return;
 if(r.reduced)c.drawImage(p<.55?old:next,0,0);
 else {c.drawImage(old,0,travel*vh);c.drawImage(next,0,(travel-1)*vh);}
 if(p<.38)r.floorMess();
 const cx=W/2,ground=h-9,top=ground-172,width=152,frameFade=1-ease((p-.92)/.08);
 c.save();c.globalAlpha=frameFade;
 // The camera follows the cabin: floors and shaft braces travel down behind it.
 c.fillStyle='#090f1ecc';c.fillRect(cx-93,top-22,186,205);
 for(const side of [-1,1]){c.fillStyle='#5d6470';c.fillRect(cx+side*88-3,top-15,6,191);c.fillStyle='#c0b693';c.fillRect(cx+side*88-1,top-15,2,191);}
 if(p>.38&&p<.66&&!r.reduced){c.fillStyle='#8f7b5a';for(let i=0;i<4;i++){const yy=top+((i*66+travel*330)%190);c.fillRect(cx-92,yy,9,6);c.fillRect(cx+83,yy,9,6);}}
 c.fillStyle='#a4906b';c.fillRect(cx-width/2-7,top-7,width+14,186);c.fillStyle='#151d2a';c.fillRect(cx-width/2,top,width,172);
 const inside=c.createLinearGradient(cx-width/2,0,cx+width/2,0);inside.addColorStop(0,'#313842');inside.addColorStop(.5,'#797361');inside.addColorStop(1,'#313842');c.fillStyle=inside;c.fillRect(cx-width/2+3,top+3,width-6,166);
 c.fillStyle='#eadca3';c.fillRect(cx-46,top+7,92,5);c.fillStyle='#b59c66';c.fillRect(cx-67,ground-49,134,3);c.fillStyle='#111824';c.fillRect(cx-70,ground-8,140,8);
 // A small lit floor display is part of the lift, not another game control.
 c.fillStyle='#111b22';c.fillRect(cx-33,top-30,66,20);c.fillStyle='#e7cc86';c.font='bold 13px monospace';c.textAlign='center';c.fillText(`${p>=.58?g.level+2:g.level+1}  ↑`,cx,top-15);
 c.fillStyle='#70634f';c.fillRect(cx+width/2+9,top+89,12,31);c.fillStyle='#edcf82';c.fillRect(cx+width/2+12,top+97,6,6);
 c.restore();
 const walking=p<.22,enter=ease(p/.22),exit=ease((p-.83)/.17),x=g.x+(cx-g.x)*enter,scale=p<.66?1-enter*.07:.93+exit*.07;
 c.save();c.translate(x,ground);c.scale(scale,scale);r.employee(0,-56,t,false,{level:p<.66?g.level:g.level+1,moving:walking||p>.83});c.restore();
 let closed=p<.38?ease((p-.22)/.16):1-ease((p-.66)/.17);closed=unit(closed);
 c.save();c.globalAlpha=frameFade;
 if(closed>0){for(const side of [-1,1]){const doorX=side<0?cx-width/2:cx+width/2-width/2*closed,doorW=width/2*closed;const steel=c.createLinearGradient(doorX,0,doorX+doorW,0);steel.addColorStop(0,'#303a48');steel.addColorStop(.5,'#83909b');steel.addColorStop(1,'#485765');c.fillStyle=steel;c.fillRect(doorX,top,doorW,171);c.strokeStyle='#acb5ad';c.lineWidth=2;c.strokeRect(doorX+2,top+2,Math.max(0,doorW-4),167);c.fillStyle='#ccd1bd33';c.fillRect(doorX+doorW*.32,top+10,4,151);}}
 c.fillStyle='#bba374';c.fillRect(cx-width/2-7,ground,width+14,6);c.fillStyle='#443e34';for(let i=0;i<7;i++)c.fillRect(cx-63+i*21,ground+1,12,2);c.restore();
 const labelY=Math.max(165,Math.min(h*.31,top-88));c.textAlign='center';c.fillStyle='#101727e6';c.fillRect(cx-150,labelY-40,300,85);c.fillStyle='#e6cb8c';c.font='800 32px "Barlow Condensed",sans-serif';c.fillText(p<.38?'PROMOTED':p<.66?'GOING UP':`FLOOR ${String(g.level+2).padStart(2,'0')}`,cx,labelY-6);c.fillStyle='#f3eddb';c.font='15px "DM Sans",sans-serif';c.fillText(LEVELS[g.level+1].title,cx,labelY+23);
}

export function drawFailure(r,dt,t){
 const g=r.game,c=r.ctx,h=g.height,ground=h-8,p=unit(g.failureTime/2.4),sink=ease((p-.18)/.65),spread=ease(p/.65),x=g.x;
 r.office(dt,t);r.boss(t);r.floorMess();
 c.fillStyle='#24160eb0';c.beginPath();c.ellipse(x,ground,45+spread*240,8+spread*21,0,0,Math.PI*2);c.fill();
 c.save();c.beginPath();c.rect(0,0,W,ground-3);c.clip();c.translate(x,ground-56+sink*120);c.rotate(r.reduced?0:Math.sin(p*29)*.13*(1-sink));r.employee(0,0,t,false,{moving:!r.reduced});
 c.fillStyle='#ffb47a';c.beginPath();c.ellipse(0,-26,8,7,0,0,Math.PI*2);c.fill();c.fillStyle='#42232b';c.fillRect(-4,-30,8,8);c.fillRect(-3,-32,6,12);c.fillStyle='#db777b';c.fillRect(-2,-24,4,2);c.restore();
 // Thick, spreading sludge occludes the character as they sink into the floor.
 const left=Math.max(-30,x-48-spread*W),right=Math.min(W+30,x+48+spread*W),surface=ground-4;
 c.fillStyle='#684325';c.beginPath();c.moveTo(left,r.viewHeight);c.lineTo(left,surface+9);for(let xx=left;xx<=right;xx+=12)c.lineTo(xx,surface+Math.sin(xx*.053+p*13)*4);c.lineTo(right,r.viewHeight);c.closePath();c.fill();
 c.strokeStyle='#a97642';c.lineWidth=5;c.beginPath();for(let xx=left;xx<=right;xx+=12)c[xx===left?'moveTo':'lineTo'](xx,surface+Math.sin(xx*.053+p*13)*4+4);c.stroke();
 for(let i=0;i<9;i++){const bx=x+Math.sin(i*2.7)*spread*210,age=(g.failureTime*.9+i*.17)%1,by=surface+8+(i%3)*12;c.fillStyle='#3f2719';c.beginPath();c.ellipse(bx,by,3+age*6,2+age*3,0,0,Math.PI*2);c.fill();c.fillStyle='#b8844b';c.fillRect(bx-2,by-2,3,2);}
}
