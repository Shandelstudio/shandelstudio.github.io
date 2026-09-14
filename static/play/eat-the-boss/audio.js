// Original procedural chiptune: no audio downloads and no playback before a gesture.
export class GameAudio {
 constructor({muted=false,Context=globalThis.AudioContext||globalThis.webkitAudioContext}={}){this.Context=Context;this.muted=muted;this.ctx=null;this.playing=false;this.boss=false;this.timer=null;this.step=0;this.musicNodes=new Set();this.effectNodes=new Set();}
 async unlock(){if(this.muted||!this.Context)return;try{if(!this.ctx){this.ctx=new this.Context();this.master=this.ctx.createGain();this.master.gain.value=.65;this.master.connect(this.ctx.destination);this.music=this.ctx.createGain();this.music.gain.value=.48;this.music.connect(this.master);this.effects=this.ctx.createGain();this.effects.gain.value=.8;this.effects.connect(this.master);const n=Math.ceil(this.ctx.sampleRate*.5);this.noise=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;}await this.ctx.resume();this.refresh();}catch{/* Sound availability must never block the game. */}}
 setMuted(value){this.muted=value;if(this.ctx){this.master.gain.setValueAtTime(value?0:.65,this.ctx.currentTime);if(value)this.stopNodes(this.effectNodes);}this.refresh();}
 setPlaying(value,boss=false){if(this.playing===value&&this.boss===boss)return;this.playing=value;this.boss=boss;this.refresh();}
 stopNodes(set){for(const n of set){try{n.stop();n.disconnect();}catch{}}set.clear();}
 refresh(){const active=this.ctx&&this.ctx.state==='running'&&this.playing&&!this.muted;if(!active){if(this.timer!==null)clearInterval(this.timer);this.timer=null;this.stopNodes(this.musicNodes);return;}if(this.timer!==null)return;this.next=this.ctx.currentTime+.04;this.step=0;this.schedule();this.timer=setInterval(()=>this.schedule(),40);}
 tone(freq,at,duration,volume=.06,wave='square',music=false,end=freq){if(!this.ctx||this.muted)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),set=music?this.musicNodes:this.effectNodes;osc.type=wave;osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(volume,at+.007);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(gain);gain.connect(music?this.music:this.effects);set.add(osc);osc.onended=()=>{set.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+duration+.02);}
 hiss(at,duration,volume,frequency=1800,music=false){if(!this.ctx||this.muted)return;const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),set=music?this.musicNodes:this.effectNodes;source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(gain);gain.connect(music?this.music:this.effects);set.add(source);source.onended=()=>{set.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(at);source.stop(at+duration);}
 schedule(){if(this.ctx.state!=='running')return;const beat=60/(this.boss?124:106)/2;if(this.next<this.ctx.currentTime-.1)this.next=this.ctx.currentTime+.02;while(this.next<this.ctx.currentTime+.16){const s=this.step%64,bar=Math.floor(s/16),root=[45,41,48,43][bar],freq=n=>440*2**((n-69)/12),melody=[12,null,19,15,null,19,22,19,12,15,null,19,22,null,19,15],m=melody[s%16],at=this.next;
  if(s%2===0)this.tone(freq(root+(s%8===6?7:0)),at,beat*.85,.095,'triangle',true);
  if(m!==null)this.tone(freq(root+m+(this.boss?12:0)),at,beat*.45,this.boss?.03:.022,'square',true);
  if(s%4===0)this.tone(130,at,.13,.12,'sine',true,42);
  if(s%4===2)this.hiss(at,.075,.065,1600,true);
  this.hiss(at,.026,.022,7500,true);this.next+=beat;this.step++;
 }}
 effect(type){if(!this.ctx||this.ctx.state!=='running'||this.muted)return;const t=this.ctx.currentTime;
  if(type==='poop'||type==='goldRelease'){this.tone(115,t,.13,.075,'sawtooth',false,47);this.tone(78,t+.065,.14,.06,'triangle',false,35);this.hiss(t,.11,.035,260);return;}
  if(type==='file'){this.hiss(t,.18,.1,2800);return;}
  if(type==='coffeeRelease'){this.tone(410,t,.15,.05,'sine',false,180);return;}
  if(type==='catch'){this.tone(160,t,.09,.08,'sine',false,480);this.tone(640,t+.065,.07,.035,'triangle',false,310);return;}
  if(type==='attack'){this.hiss(t,.22,.16,850);this.tone(125,t,.22,.1,'triangle',false,38);return;}
  if(type==='bossHit'){this.hiss(t,.14,.12,1300);this.tone(300,t,.21,.1,'square',false,60);return;}
  const notes={intro:[130,0,130,196,0,262],enrage:[196,147,110,0,110],crowned:[523,659,784,1047,0,784,1047,1318],gold:[660,880,1320],coffee:[523,784,1047],damage:[190,125,72],miss:[190,125],throw:[220,440,880],warning:[392,0,392],open:[523,784],promoted:[392,494,587,784],gameover:[392,330,294,196],victory:[523,659,784,1047,784,1047,1318]}[type];if(!notes)return;notes.forEach((f,i)=>{if(f)this.tone(f,t+i*.09,.16,type==='warning'?.07:.065,type==='damage'?'sawtooth':'square');});
 }
 silence(){this.setPlaying(false);this.stopNodes(this.effectNodes);}
}
