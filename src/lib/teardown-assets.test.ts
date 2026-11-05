import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('teardown poses retain named inventory and contain only local finite SVG geometry',()=>{
 const frames=JSON.parse(readFileSync('public/illustrations/prumo-layers-frames.json','utf8')) as string[];
 assert.equal(frames.length,61);
 for(const svg of frames){for(const id of ['records','planning','decisions'])assert.ok(svg.includes(`data-item="${id}"`));assert.doesNotMatch(svg,/<script|<image|<foreignObject|https?:|NaN|Infinity/i);}
 assert.notEqual(frames[0],frames[60]);
});
