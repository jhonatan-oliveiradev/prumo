import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData} from './finance';
import {hydrateWorkspace,cloudStateForRevision,profileInitials} from './cloud-state';
test('empty cloud response keeps session identity when refreshing a new account',()=>{
 const hydrated=hydrateWorkspace(null,'Jhonatan Oliveira');
 assert.equal(hydrated.data.name,'Jhonatan Oliveira');
 assert.equal(hydrated.revision,0);
 assert.equal(cloudStateForRevision(hydrated.revision),'connected');
 assert.equal(emptyData.name,'');
});
test('cloud financial data and custom display name survive hydration',()=>{
 const data={...emptyData,name:'Meu nome',accounts:[{id:'a',name:'Conta',openingBalance:100}]};
 const hydrated=hydrateWorkspace({data,revision:4,updatedAt:'2026-11-04T00:00:00Z'},'Nome da sessão');
 assert.deepEqual(hydrated.data,data);
 assert.equal(cloudStateForRevision(hydrated.revision),'ready');
 assert.equal(hydrateWorkspace({data:{...data,name:'  '},revision:4,updatedAt:''},'Nome da sessão').data.name,'Nome da sessão');
});
test('avatar uses initials from authenticated or custom name',()=>{
 assert.equal(profileInitials(' Jhonatan de Oliveira '),'JO');
 assert.equal(profileInitials('Jhonatan'),'J');
 assert.equal(profileInitials(''),'P');
});
