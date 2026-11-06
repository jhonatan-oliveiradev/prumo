import assert from 'node:assert/strict';
import {test} from 'node:test';
import {appSections,appSectionSlugs,sectionFromPath,sectionPath,validSectionSlug} from './app-navigation';

test('all app sections have stable, unique, reversible URLs',()=>{
 const routes=appSections.map(section=>sectionPath(section.label));
 assert.equal(new Set(routes).size,appSections.length);
 assert.equal(sectionFromPath('/app'),'Visão geral');
 for(const section of appSections){
  const route=sectionPath(section.label);
  assert.equal(sectionFromPath(route),section.label);
  assert.equal(sectionFromPath(route+'/'),section.label);
 }
 assert.equal(appSectionSlugs.length,10);
});

test('unrecognized deep links are not treated as the dashboard',()=>{
 assert.equal(sectionFromPath('/app/inexistente'),null);
 assert.equal(sectionFromPath('/login'),null);
 assert.equal(sectionFromPath('/app/transacoes/123'),null);
 assert.equal(validSectionSlug('transacoes'),true);
 assert.equal(validSectionSlug('segredos'),false);
});
