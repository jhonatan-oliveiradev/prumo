import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Figma landscapes ship as complete WebP files, not empty or truncated downloads',()=>{
 for(const name of ['canyon','ridge','lake','river']){
  const file=readFileSync(`public/images/prumo-${name}.webp`);
  assert.ok(file.length>1024,`${name}: missing image bytes`);
  assert.equal(file.toString('ascii',0,4),'RIFF');
  assert.equal(file.toString('ascii',8,12),'WEBP');
  assert.equal(file.readUInt32LE(4)+8,file.length,`${name}: incomplete WebP container`);
 }
});
