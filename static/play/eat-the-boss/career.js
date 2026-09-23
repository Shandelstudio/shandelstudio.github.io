export const PROMOTION_DURATION=4.6,FAILURE_DURATION=2.9;
export const careerBulk=(level,crowned=false)=>crowned?4:Math.min(3,Math.floor(level/5));
// Keep the face recognisable while the jacket, belly and legs grow at each promotion tier.
export function bodyWidthAt(y,bulk){
 const points=[[0,0],[.34,0],[.43,.25],[.54,.44],[.64,.32],[.75,.18],[.86,.1],[1,.06]];
 for(let i=1;i<points.length;i++)if(y<=points[i][0]){const [a,av]=points[i-1],[b,bv]=points[i],p=(y-a)/(b-a),smooth=p*p*(3-2*p);return 1+bulk*(av+(bv-av)*smooth);}
 return 1+bulk*.06;
}
