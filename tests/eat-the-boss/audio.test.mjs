import test from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio} from '../../static/play/eat-the-boss/audio.js';
test('music waits for a gesture, effects differ, and mute/pause stop scheduled music',async()=>{
 let starts=0,contexts=0;
 const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
 const node=()=>({frequency:param(),gain:param(),Q:param(),connect(){},disconnect(){},start(){starts++;},stop(){}});
 class Context{constructor(){contexts++;this.state='suspended';this.currentTime=0;this.sampleRate=8000;this.destination={};}async resume(){this.state='running';}createGain(){return node();}createOscillator(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}createBuffer(_channels,n){return {getChannelData:()=>new Float32Array(n)};}}
 const a=new GameAudio({Context});a.setPlaying(true);a.effect('catch');assert.equal(contexts,0);assert.equal(starts,0);
 try{await a.unlock();assert.ok(a.timer!==null);assert.ok(a.musicNodes.size>0);const before=starts;a.effect('poop');assert.equal(starts-before,3);a.effect('file');assert.equal(starts-before,4);a.setMuted(true);assert.equal(a.timer,null);assert.equal(a.musicNodes.size,0);assert.equal(a.effectNodes.size,0);const mutedStarts=starts;a.effect('warning');assert.equal(starts,mutedStarts);a.setMuted(false);assert.ok(a.timer!==null);a.setPlaying(false);assert.equal(a.timer,null);assert.equal(a.musicNodes.size,0);a.setPlaying(true,true);assert.ok(a.timer!==null);a.silence();assert.equal(a.timer,null);}finally{a.silence();}
});
test('unavailable sound never prevents starting a game',async()=>{const a=new GameAudio({Context:null});a.setPlaying(true);await a.unlock();a.effect('victory');a.setMuted(true);a.silence();assert.equal(a.ctx,null);});
