import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advisorSignals} from './advisor-signals';
import {buildAdvisorContext} from './advisor';
import {emptyData} from './finance';
test('missing income stays informational instead of implying healthy spending',()=>{
 const signals=advisorSignals(buildAdvisorContext(emptyData,'2026-11','2026-11-05'));
 assert.equal(signals[1].tone,'info');assert.match(signals[1].title,/não registrada/);
});
test('deficit and committed balance produce labeled actionable warnings',()=>{
 const context=buildAdvisorContext(emptyData,'2026-11','2026-11-05');
 const signals=advisorSignals({...context,freeBalance:'negative',futureDeficit:true});
 assert.equal(signals[0].tone,'negative');assert.equal(signals[2].tone,'warning');
 assert.equal(signals[0].destination,'Compromissos');
});
