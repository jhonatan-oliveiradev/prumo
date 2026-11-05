import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampProgress,timelineProgress,timelineStage,timelineFrame,followProgress} from './timeline';
test('timeline enters at the header offset and completes at the end of its sticky range',()=>{assert.equal(timelineProgress(60,2400,800),0);assert.equal(timelineProgress(-740,2400,800),.5);assert.equal(timelineProgress(-1540,2400,800),1);});
test('reverse scroll restores the same pose and stage without accumulated state',()=>{for(const p of [0,.25,.5,.75,1,.75,.5,.25,0]){assert.equal(timelineFrame(p,61),Math.round(p*60));assert.equal(timelineStage(p),Math.min(2,Math.floor(p*3)));}});
test('out-of-range and degenerate geometry never produce invalid frames',()=>{assert.equal(clampProgress(NaN),0);assert.equal(timelineFrame(-1,61),0);assert.equal(timelineFrame(2,61),60);assert.equal(timelineProgress(-100,0,800),1);});

test('four narrative stages include every boundary and clamp the final stage',()=>{
 assert.deepEqual([0,.2499,.25,.4999,.5,.7499,.75,1,2].map(p=>timelineStage(p,4)),[0,0,1,1,2,2,3,3,3]);
});

test('scroll following converges consistently at different refresh rates and reverses without overshoot',()=>{
 const at30=followProgress(0,1,1000/30);
 const at60=followProgress(followProgress(0,1,1000/60),1,1000/60);
 assert.ok(Math.abs(at30-at60)<1e-10);
 let p=0;for(let n=0;n<100;n++)p=followProgress(p,1,16.7);assert.equal(p,1);
 for(let n=0;n<100;n++){const next=followProgress(p,0,16.7);assert.ok(next<=p&&next>=0);p=next;}assert.equal(p,0);
 assert.equal(followProgress(.5,1,NaN),.5);
});
