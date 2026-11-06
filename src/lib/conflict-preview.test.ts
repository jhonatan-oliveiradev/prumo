import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyData,type FinanceData} from './finance';
import {countWorkspaceEntries,describeWorkspaceConflict} from './conflict-preview';

test('conflict previews count every collection without changing either version',()=>{
  const device:FinanceData={
    ...emptyData,
    accounts:[{id:'a',name:'Conta principal',openingBalance:0}],
    transactions:[{id:'t',description:'Aluguel',amount:150000,type:'expense',category:'Moradia',date:'2026-11-15',accountId:'a',status:'pending',space:'personal'}],
    goals:[{id:'g',name:'Emergência',target:500000,saved:0}],
  };
  const cloud:FinanceData={...emptyData,creditCards:[{id:'c',name:'Cartão',limit:100000,color:'forest',closingDay:10,dueDay:18,space:'personal'}]};
  const beforeDevice=JSON.stringify(device),beforeCloud=JSON.stringify(cloud);
  assert.deepEqual(describeWorkspaceConflict(device,cloud,17),{
    device:{accounts:1,transactions:1,goals:1,cards:0,recurrences:0,transfers:0},
    cloud:{accounts:0,transactions:0,goals:0,cards:1,recurrences:0,transfers:0},
    cloudRevision:17,
  });
  assert.equal(JSON.stringify(device),beforeDevice);
  assert.equal(JSON.stringify(cloud),beforeCloud);
});

test('empty workspaces produce safe zero-count previews',()=>{
  assert.deepEqual(countWorkspaceEntries(emptyData),{accounts:0,transactions:0,goals:0,cards:0,recurrences:0,transfers:0});
});
