import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authNetworkFailure,authSessionFailure,describeAuthFailure} from './auth-feedback';

test('credential failures never reveal whether an email address exists',()=>{
 const a=describeAuthFailure({status:401,code:'USER_NOT_FOUND',message:'user joe@example.com not found'},'signin');
 const b=describeAuthFailure({status:401,code:'INVALID_PASSWORD',message:'user password differs'},'signin');
 const c=describeAuthFailure({status:401,code:'INVALID_EMAIL_OR_PASSWORD'},'signin');
 assert.deepEqual(a,b);
 assert.deepEqual(b,c);
 assert.equal(c.category,'credentials');
 assert.ok(!JSON.stringify(c).includes('joe@example.com'));
 assert.ok(!JSON.stringify(c).includes('user password differs'));
});
test('a database/server failure is not blamed on the password',()=>{
 for(const status of [500,501,502,503,504]){
  const info=describeAuthFailure({status,message:'DATABASE_URL=private-connection'},'signin');
  assert.equal(info.category,'service');
  assert.ok(!JSON.stringify(info).includes('DATABASE_URL'));
  assert.ok(info.reference.includes(String(status)));
 }
});
test('rate limits, unsupported origins and verification are actionable',()=>{
 assert.equal(describeAuthFailure({status:429},'signin').reference,'AUTH_RATE_LIMIT');
 assert.equal(describeAuthFailure({status:403,code:'INVALID_ORIGIN'},'signin').reference,'AUTH_ORIGIN');
 assert.equal(describeAuthFailure({status:403,code:'EMAIL_NOT_VERIFIED'},'signin').reference,'AUTH_EMAIL_VERIFICATION');
 assert.equal(describeAuthFailure({status:404},'signin').reference,'AUTH_ENDPOINT_MISSING');
});
test('sign-up handles existing accounts and invalid passwords without leaking raw text',()=>{
 assert.equal(describeAuthFailure({status:422,code:'USER_ALREADY_EXISTS'},'signup').reference,'AUTH_SIGNUP_CONFLICT');
 assert.equal(describeAuthFailure({status:400,code:'PASSWORD_TOO_SHORT'},'signup').reference,'AUTH_PASSWORD_LENGTH');
 assert.equal(describeAuthFailure({status:422,code:'INVALID_EMAIL'},'signup').reference,'AUTH_EMAIL_FORMAT');
});
test('network and unconfirmed session errors have different explanations',()=>{
 assert.equal(authNetworkFailure().category,'network');
 assert.equal(describeAuthFailure({status:0,code:'FETCH_ERROR'},'signin').category,'network');
 assert.equal(authSessionFailure().reference,'AUTH_SESSION');
 assert.notEqual(authNetworkFailure().title,authSessionFailure().title);
});
