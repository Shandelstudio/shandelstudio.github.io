// Edge-connected neutral matte extraction for RGB sprite textures.
// Dark outlines protect enclosed whites, eyes, teeth, and clothing.
export function clearSpriteMatte(data,width,height){
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;
 const visit=p=>{if(seen[p])return;seen[p]=1;const o=p*4,r=data[o],g=data[o+1],b=data[o+2];if(data[o+3]===0||(Math.max(r,g,b)-Math.min(r,g,b)<22&&Math.min(r,g,b)>112)){queue[tail++]=p;data[o+3]=0;}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=1;y<height-1;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);if(x)visit(p-1);if(x<width-1)visit(p+1);if(y)visit(p-width);if(y<height-1)visit(p+width);}
 return data;
}
