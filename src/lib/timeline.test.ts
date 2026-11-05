import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampProgress,timelineProgress,timelineStage,timelineFrame} from './timeline';
test('timeline enters at the header offset and completes at the end of its sticky range',()=>{assert.equal(timelineProgress(92,2400,800),0);assert.equal(timelineProgress(-708,2400,800),.5);assert.equal(timelineProgress(-1508,2400,800),1);});
test('reverse scroll restores the same pose and stage without accumulated state',()=>{for(const p of [0,.25,.5,.75,1,.75,.5,.25,0]){assert.equal(timelineFrame(p,61),Math.round(p*60));assert.equal(timelineStage(p),Math.min(2,Math.floor(p*3)));}});
test('out-of-range and degenerate geometry never produce invalid frames',()=>{assert.equal(clampProgress(NaN),0);assert.equal(timelineFrame(-1,61),0);assert.equal(timelineFrame(2,61),60);assert.equal(timelineProgress(-100,0,800),1);});
