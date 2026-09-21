// Remove edge-connected matte and detached specks. Closed dark outlines protect
// white clothing, eyes and teeth; never key every light pixel in a character.
export function clearSpriteMatte(data,width,height){
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;
 const visit=p=>{if(seen[p])return;seen[p]=1;const o=p*4,r=data[o],g=data[o+1],b=data[o+2];if(data[o+3]<32||(Math.max(r,g,b)-Math.min(r,g,b)<52&&Math.min(r,g,b)>78)){queue[tail++]=p;data[o+3]=0;}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=1;y<height-1;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);if(x)visit(p-1);if(x<width-1)visit(p+1);if(y)visit(p-width);if(y<height-1)visit(p+width);}
 // Matte noise can be cut off from the border by antialiased color pixels.
 // Keep actual sprite components, including larger separate action effects.
 seen.fill(0);const minimum=Math.max(6,Math.floor(width*height*.00015));
 for(let start=0;start<seen.length;start++){
  if(seen[start]||data[start*4+3]===0)continue;head=0;tail=1;queue[0]=start;seen[start]=1;
  while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx<0||nx>=width||ny<0||ny>=height)continue;const q=ny*width+nx;if(!seen[q]&&data[q*4+3]>0){seen[q]=1;queue[tail++]=q;}}}
  if(tail<=minimum)for(let i=0;i<tail;i++)data[queue[i]*4+3]=0;
 }
 return data;
}
