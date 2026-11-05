import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teardownCenterLift,teardownParts,assembledLayers} from './generated/teardown';

test('teardown keeps four complete, local plates with finite projection anchors',()=>{
 assert.deepEqual(teardownParts.map(part=>part.id),['records','commitments','planning','decisions']);
 const ids=new Set<string>();
 for(const part of teardownParts){
  assert.ok(part.markup.includes(`data-item="${part.id}"`));
  assert.ok(part.markup.includes(`data-fill="${part.id}"`));
  assert.doesNotMatch(part.markup,/<script|<image|<foreignObject|https?:|NaN|Infinity/i);
  for(const [,id] of part.markup.matchAll(/\bid="([^"]+)"/g)){assert.ok(!ids.has(id));ids.add(id);}
  assert.ok(part.anchor.every(Number.isFinite));assert.ok(Number.isFinite(part.lift));
  assert.ok(assembledLayers.includes(`data-layer="${part.id}"`));
 }
 assert.equal(teardownParts[0].lift,0);
 assert.equal(teardownParts.at(-1)!.lift/2,teardownCenterLift);
 for(let i=1;i<teardownParts.length;i++)assert.ok(teardownParts[i].lift<teardownParts[i-1].lift);
});

test('annotation anchors stay within the drawing at intermediate and reverse-scroll positions',()=>{
 for(const p of [0,.001,.2317,.5,.876,1,.876,.5,.2317,.001,0]){
  for(const part of teardownParts){
   const x=part.anchor[0],y=part.anchor[1]+part.lift*p+teardownCenterLift*(1-p);
   assert.ok(Number.isFinite(y));assert.ok(x>=50&&x<=370);assert.ok(y>=0&&y<=297);
  }
 }
});
