import {W,LEVELS} from './engine.js';
const unit=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=unit(n);return n*n*(3-2*n);};

export function drawElevator(r,dt,t){
 const g=r.game,c=r.ctx,p=unit(g.promotionTime/g.promotionDuration),travel=ease((p-.38)/.28),h=g.height,vh=r.viewHeight;
 const old=r.scene(g.level),next=r.scene(g.level+1),cabin=r.textures.get('liftOpen'),doors=r.textures.get('liftDoors');if(!old||!next||!cabin||!doors)return;
 // The cabin stays with the camera while the two office floors pass behind it.
 if(r.reduced)c.drawImage(p<.55?old:next,0,0);
 else {c.drawImage(old,0,travel*vh);c.drawImage(next,0,(travel-1)*vh);}
 if(p<.38)r.floorMess();
 const cx=W/2,ground=h-9,scale=.30,cw=cabin.width*scale,ch=cabin.height*scale,left=cx-cw/2,top=ground+6-ch;
 const fade=ease(p/.09)*(1-ease((p-.91)/.09)),enter=ease(p/.22),exit=ease((p-.83)/.17),closed=p<.38?ease((p-.22)/.16):1-ease((p-.66)/.17);
 c.save();c.globalAlpha=fade;
 const shadow=c.createRadialGradient(cx,ground,5,cx,ground,135);shadow.addColorStop(0,'#05080ec0');shadow.addColorStop(1,'#05080e00');c.fillStyle=shadow;c.fillRect(cx-135,ground-60,270,110);
 c.drawImage(cabin,left,top,cw,ch);
 // Light from the open cabin falls onto the office floor in perspective.
 c.globalAlpha=fade*(1-closed);const spill=c.createLinearGradient(0,ground-2,0,ground+40);spill.addColorStop(0,'#e8bc7048');spill.addColorStop(1,'#e8bc7000');c.fillStyle=spill;c.beginPath();c.moveTo(cx-49,ground-2);c.lineTo(cx+49,ground-2);c.lineTo(cx+82,ground+40);c.lineTo(cx-82,ground+40);c.closePath();c.fill();c.restore();
 const x=g.x+(cx-g.x)*enter,depth=p<.66?enter:1-exit,heroScale=1-depth*.1;
 c.save();c.translate(x,ground-depth*15);c.scale(heroScale,heroScale);r.employee(0,-56,t,false,{level:p<.66?g.level:g.level+1,moving:p<.22||p>.83});c.restore();
 // Slide whole, textured leaves behind the jambs; never squash a door to close it.
 const dx=left+150*scale,dy=top+105*scale,dw=354*scale,dh=727*scale;
 c.save();c.globalAlpha=fade;c.beginPath();c.rect(dx,dy,dw,dh);c.clip();
 if(closed>0){const half=dw/2,shift=half*(1-closed);c.drawImage(doors,0,0,doors.width/2,doors.height,dx-shift,dy,half,dh);c.drawImage(doors,doors.width/2,0,doors.width/2,doors.height,dx+half+shift,dy,half,dh);}
 c.restore();
 // A lit chevron lives in the elevator's own brass-framed indicator.
 c.save();c.globalAlpha=fade;c.strokeStyle='#f0cc80';c.lineWidth=2;c.beginPath();c.moveTo(cx-5,top+16);c.lineTo(cx,top+11);c.lineTo(cx+5,top+16);c.stroke();
 if(p>.38&&p<.66){c.globalAlpha=fade*(.45+Math.sin(t*9)*.25);c.beginPath();c.moveTo(cx-5,top+21);c.lineTo(cx,top+16);c.lineTo(cx+5,top+21);c.stroke();}c.restore();
 const labelY=Math.max(72,Math.min(h*.31,top-78));c.save();c.globalAlpha=Math.min(1,p*15,(1-p)*15);c.textAlign='center';c.shadowColor='#080c16';c.shadowBlur=12;c.shadowOffsetY=3;c.fillStyle='#f2d394';c.font='800 42px "Barlow Condensed",sans-serif';c.fillText(p<.66?'PROMOTED':`FLOOR ${String(g.level+2).padStart(2,'0')}`,cx,labelY);c.fillStyle='#f5eedf';c.font='600 21px "DM Sans",sans-serif';c.fillText(LEVELS[g.level+1].title,cx,labelY+32,W-52);c.restore();
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
