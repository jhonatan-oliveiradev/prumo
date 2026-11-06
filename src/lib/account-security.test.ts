import assert from 'node:assert/strict';
import {test} from 'node:test';
import {describeSessionDevice,humanSessionDate,securityFailure} from './account-security';

test('device labels are recognizable without exposing raw user agents',()=>{
 assert.equal(describeSessionDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Vivaldi/7.0'),'Vivaldi · Windows');
 assert.equal(describeSessionDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1 Mobile/15E148 Safari/604'),'Safari · iOS');
 assert.equal(describeSessionDevice('Mozilla/5.0 (Linux; Android 15) Chrome/130.0'),'Chrome · Android');
 assert.equal(describeSessionDevice(null),'Dispositivo não identificado');
});

test('security errors are actionable and do not echo sensitive provider messages',()=>{
 assert.match(securityFailure({code:'INVALID_PASSWORD',status:400},'password'),/senha atual/i);
 assert.match(securityFailure({code:'SESSION_NOT_FRESH',status:403},'sessions'),/entre novamente/i);
 assert.match(securityFailure({status:401},'sessions'),/sessão expirou/i);
 assert.match(securityFailure({status:429},'password'),/aguarde/i);
 assert.match(securityFailure({status:500},'sessions'),/serviço de contas/i);
 assert.ok(!securityFailure({status:500,code:'DATABASE_URL=secret'},'password').includes('secret'));
});

test('session dates render safely in pt-BR',()=>{
 assert.equal(humanSessionDate(null),'Data indisponível');
 assert.equal(humanSessionDate('garbage'),'Data indisponível');
 assert.ok(humanSessionDate('2026-11-06T12:00:00.000Z').includes('2026'));
});
