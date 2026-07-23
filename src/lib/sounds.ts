'use client';
export function playTone(kind:'click'|'scan'|'success'|'fail'|'tick'='click'){
  if(typeof window==='undefined'||localStorage.getItem('rl-sounds')==='off')return;
  try{const AudioCtx=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;const ctx=new AudioCtx();const osc=ctx.createOscillator();const gain=ctx.createGain();const map={click:[520,.06],scan:[740,.18],success:[880,.28],fail:[160,.24],tick:[340,.04]} as const;osc.frequency.value=map[kind][0];osc.type=kind==='fail'?'sawtooth':'sine';gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.09,ctx.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+map[kind][1]);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+map[kind][1]+.02);osc.onended=()=>ctx.close();}catch{}
}
