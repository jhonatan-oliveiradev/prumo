import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dateFromInput,dateLabel,isAllowedDate} from './date-input';
test('Brazilian dates round-trip to ISO without timezone shifts',()=>{assert.equal(dateFromInput('29/02/2028'),'2028-02-29');assert.equal(dateLabel('2026-11-05'),'05/11/2026');});
test('calendar rejects impossible dates and incomplete keyboard input',()=>{for(const input of ['29/02/2026','31/04/2026','00/11/2026','05/13/2026','5/11/26','05/11/','abc'])assert.equal(dateFromInput(input),'');});
test('minimum dates are inclusive for recurrence start and end constraints',()=>{assert.equal(isAllowedDate('2026-11-05','2026-11-05'),true);assert.equal(isAllowedDate('2026-11-04','2026-11-05'),false);assert.equal(isAllowedDate(''),false);});
