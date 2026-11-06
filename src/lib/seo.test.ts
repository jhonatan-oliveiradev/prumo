import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PRIVATE_ROBOTS, SITE_DESCRIPTION, SITE_TITLE, SITE_URL} from './seo';

test('SEO points to a single HTTPS production origin', () => {
  const canonical = new URL(SITE_URL);
  assert.equal(canonical.protocol, 'https:');
  assert.equal(canonical.hostname, 'www.prumo-finance.online');
  assert.equal(canonical.pathname, '/');
  assert.ok(!canonical.search && !canonical.hash);
});

test('titles and descriptions are concise and nonempty', () => {
  assert.ok(SITE_TITLE.length > 20 && SITE_TITLE.length < 65);
  assert.ok(SITE_DESCRIPTION.length > 90 && SITE_DESCRIPTION.length < 170);
});

test('financial workspace and authentication routes share a noindex policy', () => {
  assert.equal(PRIVATE_ROBOTS.index, false);
  assert.equal(PRIVATE_ROBOTS.follow, false);
  assert.equal(PRIVATE_ROBOTS.googleBot.index, false);
  assert.equal(PRIVATE_ROBOTS.googleBot.follow, false);
});
