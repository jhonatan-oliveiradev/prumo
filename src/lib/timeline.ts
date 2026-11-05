export const clampProgress=(value:number)=>Number.isFinite(value)?Math.min(1,Math.max(0,value)):0;
export function timelineProgress(top:number,height:number,viewport:number,offset=92){return clampProgress((offset-top)/Math.max(1,height-viewport));}
export function timelineStage(progress:number){return Math.min(2,Math.floor(clampProgress(progress)*3));}
export function timelineFrame(progress:number,count:number){return Math.round(clampProgress(progress)*Math.max(0,count-1));}
