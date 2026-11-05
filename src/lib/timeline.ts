export const clampProgress=(value:number)=>Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
export function timelineProgress(top:number,height:number,viewport:number,offset=68){return clampProgress((offset-top)/Math.max(1,height-viewport));}
export function timelineStage(progress:number,count=3){const stages=Math.max(1,Math.floor(Number.isFinite(count)?count:3));return Math.min(stages-1,Math.floor(clampProgress(progress)*stages));}
export function timelineFrame(progress:number,count:number){return Math.round(clampProgress(progress)*Math.max(0,count-1));}
/** Exponential convergence keeps the same response at 30, 60 or 120Hz. */
export function followProgress(current:number,target:number,elapsedMs:number){
 const from=clampProgress(current),to=clampProgress(target);
 if(!Number.isFinite(elapsedMs)||elapsedMs<=0)return from;
 const next=from+(to-from)*(1-Math.exp(-elapsedMs/85));
 return Math.abs(to-next)<.0001?to:next;
}
