import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyData} from './finance';
import {hydrateWorkspace,cloudStateForRevision,profileInitials,sameFinanceData} from './cloud-state';
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

test('acknowledges identical snapshots despite database order and optional defaults',()=>{
 const accounts=[{id:'a',name:'Conta A',openingBalance:100},{id:'b',name:'Conta B',openingBalance:200}];
 const goal={id:'g',name:'Reserva',target:1000,saved:300};
 const local={...emptyData,accounts,goals:[{...goal,featured:false,cover:'abstract' as const}]};
 const remote={...emptyData,recurringRules:[],creditCards:[],creditPurchases:[],goals:[goal],accounts:[...accounts].reverse()};
 assert.ok(sameFinanceData(local,remote));
 assert.equal(sameFinanceData(local,{...remote,goals:[{...goal,saved:301}]}),false);
 assert.equal(sameFinanceData(local,{...remote,goals:[{...goal,featured:true}]}),false);
});
