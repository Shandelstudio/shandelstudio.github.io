import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../../static/play/eat-the-boss/engine.js';
test('Play enters an immersive touch surface, renders bosses/outfits, and menu restores start screen',async()=>{
 const html=fs.readFileSync('static/play/eat-the-boss/index.html','utf8'),css=fs.readFileSync('static/play/eat-the-boss/style.css','utf8');assert.doesNotMatch(html,/id="(?:leftBtn|rightBtn|throwBtn)"/);assert.match(css,/\.playfield > :not\(canvas\):not\(\.overlay\)\{pointer-events:none\}/);assert.match(css,/body\[data-immersive="true"\] \.topbar/);
 let draws=0,raf,fullscreenCalls=0;
 const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:(_x,_y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),drawImage(_image,...args){assert.ok(args.every(Number.isFinite),'draw coordinates are finite');draws++;}},{get:(target,key)=>target[key]??(()=>{})});
 class Element {
  constructor(id=''){this.id=id;this.width=540;this.height=660;this.handlers=new Map();this.style={setProperty(){}};this.dataset={};this.classList={add(){},remove(){},toggle(){}};this.hidden=false;this.textContent='';this.innerHTML='';this.parentElement={classList:{toggle(){}}};}
  addEventListener(k,f){this.handlers.set(k,f);}setAttribute(){}focus(){}setPointerCapture(){}getBoundingClientRect(){if(this.id==='touchPad')return {left:0,top:740,width:360,height:110};return document.body.dataset.immersive==='true'?{left:0,top:60,width:360,height:680}:{left:0,top:0,width:540,height:660};}getContext(){return context;}querySelector(){return new Element();}querySelectorAll(){return [];}showModal(){}close(){}
 }
 const elements=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
 globalThis.document={body:new Element(),documentElement:{requestFullscreen(){fullscreenCalls++;return Promise.resolve();}},exitFullscreen:()=>Promise.resolve(),getElementById:id=>elements.get(id),createElement:()=>new Element(),querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}};
 globalThis.window={devicePixelRatio:2,addEventListener(){}};globalThis.matchMedia=()=>({matches:false});globalThis.requestAnimationFrame=fn=>{raf=fn;};globalThis.localStorage={getItem:()=>JSON.stringify({level:0,score:0,best:0,won:false}),setItem(){}};
 globalThis.Image=class {constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024;}decode(){return Promise.resolve();}};
 let active;const start=Game.prototype.start;Game.prototype.start=function(...args){active=this;return start.apply(this,args);};
 try{
  await import('../../static/play/eat-the-boss/game.js');await new Promise(resolve=>setImmediate(resolve));assert.equal(elements.get('primaryBtn').disabled,false);assert.equal(elements.get('overlayTitle').innerHTML.replace(/<[^>]+>/g,''),"Eat the Boss's shit to promote");assert.doesNotMatch(elements.get('overlayTitle').innerHTML,/<small>/);
  assert.equal(elements.get('primaryBtn').textContent,'PLAY');assert.doesNotMatch(html,/Bad Company home|class="brand"|PLAY <span>/);
  elements.get('primaryBtn').onclick();assert.equal(active.state,'playing');assert.equal(document.body.dataset.immersive,'true');assert.equal(fullscreenCalls,1);assert.equal(active.height,836);assert.equal(elements.get('overlayText').hidden,true);
  let time=0;const tick=()=>raf(time+=16.667);
  for(let floor=0;floor<20;floor++){active.start(floor);active.spawnClock=999;tick();assert.ok(elements.get('floor').innerHTML.length);assert.equal(elements.get('reviewHud').hidden,![4,9,14,19].includes(floor));}
  active.review.phase='open';active.review.timer=100;const canvas=elements.get('game');canvas.handlers.get('pointerdown')({pointerId:1,clientX:70,preventDefault(){}});canvas.handlers.get('pointermove')({pointerId:1,clientX:270});for(let i=0;i<25;i++)tick();assert.ok(active.x>400);
  for(let n=0;n<5;n++){active.drops.push({type:'poop',x:active.x,y:active.catchY-1,vx:0,vy:200,rotation:0,phase:0});tick();}assert.equal(active.shots.length,1);
  canvas.handlers.get('pointermove')({pointerId:1,clientX:50});for(let i=0;i<40;i++)tick();assert.ok(active.x<100);assert.equal(active.hitCount,1);assert.ok(draws>200);assert.equal(elements.get('overlay').hidden,true);
  canvas.handlers.get('pointerup')({pointerId:1});
  const pad=canvas,before=active.x;pad.handlers.get('pointerdown')({pointerId:2,clientX:250,clientY:780,preventDefault(){}});tick();assert.equal(active.x,before,'touch starts without jumping underneath the thumb');pad.handlers.get('pointermove')({pointerId:2,clientX:330,clientY:780});for(let i=0;i<20;i++)tick();assert.ok(active.x>before+100,'relative pad drag moves the employee');pad.handlers.get('pointercancel')({pointerId:2});const stopped=active.x;for(let i=0;i<10;i++)tick();assert.equal(active.x,stopped,'cancelled touch cannot leave movement stuck');assert.equal(elements.has('touchPad'),false);assert.equal(elements.has('touchMarker'),false);
  active.start(4,200,1);tick();assert.equal(elements.get('entryInstruction').textContent,'Dodge red zones.\nCatch poop to hit back.');active.review.phase='warning';active.review.timer=1;active.event('warning');tick();assert.equal(elements.get('stageBadge').hidden,true);assert.equal(elements.get('bossEntry').hidden,true);
  active.promote();tick();assert.equal(elements.get('overlay').hidden,true);assert.equal(active.level,4);for(let i=0;i<282;i++)tick();assert.equal(active.level,5);assert.equal(active.lives,2);assert.equal(active.score,550);assert.equal(active.state,'playing');
  active.start(3,420);active.soilFloor({x:200,type:'poop'});active.fail('miss');tick();assert.equal(elements.get('overlay').hidden,true);for(let i=0;i<180;i++)tick();assert.equal(elements.get('overlay').hidden,false);assert.match(elements.get('overlayTitle').innerHTML,/FIRED/);elements.get('primaryBtn').onclick();assert.equal(active.level,3);assert.equal(active.score,420);assert.equal(active.messes.length,0);
  active.start(19);active.state='victory';active.victoryTime=0;active.event('victory');for(let i=0;i<490;i++)tick();assert.equal(elements.get('overlay').hidden,false);assert.match(elements.get('overlayTitle').innerHTML,/THE BOSS/);elements.get('primaryBtn').onclick();assert.equal(active.level,0);elements.get('pauseBtn').onclick();assert.equal(active.state,'paused');assert.equal(document.body.dataset.immersive,'true');assert.equal(elements.get('menuBtn').hidden,false);
  elements.get('menuBtn').onclick();assert.equal(active.state,'ready');assert.equal(document.body.dataset.immersive,'false');assert.equal(active.height,660);
 }finally{Game.prototype.start=start;}
});
