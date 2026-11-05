export const clampProgress=(value:number)=>Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
export function timelineProgress(top:number,height:number,viewport:number,offset=60){return clampProgress((offset-top)/Math.max(1,height-viewport));}
export function timelineStage(progress:number,count=3){const stages=Math.max(1,Math.floor(Number.isFinite(count)?count:3));return Math.min(stages-1,Math.floor(clampProgress(progress)*stages));}
export function timelineFrame(progress:number,count:number){return Math.round(clampProgress(progress)*Math.max(0,count-1));}
/** Exponential convergence keeps the same response at 30, 60 or 120Hz. */
export function followProgress(current:number,target:number,elapsedMs:number){
 const from=clampProgress(current),to=clampProgress(target);
 if(!Number.isFinite(elapsedMs)||elapsedMs<=0)return from;
 const next=from+(to-from)*(1-Math.exp(-elapsedMs/85));
 return Math.abs(to-next)<.0001?to:next;
}

/** Open the joint bordering the subject, leaving the other plates as one assembly. */
export function timelineComposition(progress:number){
 const p=clampProgress(progress),position=clampProgress((p-.2)/.8)*3;
 const mix=clampProgress((p-.16)/.1),offsets=[0];
 for(let joint=0;joint<3;joint++){
  const attention=Math.max(0,1-Math.min(Math.abs(position-joint),Math.abs(position-joint-1)));
  offsets.push(offsets[joint]+.82*(1-mix)+(.28+1.1*attention)*mix);
 }
 return {intro:p<.16,position,active:Math.round(position),offsets};
}
