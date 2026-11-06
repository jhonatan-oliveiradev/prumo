import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PRIVATE_ROBOTS, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_URL, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT} from './seo';

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

test('social sharing uses the uploaded image with its real dimensions', () => {
  assert.equal(SOCIAL_IMAGE_PATH, '/opengraph-image.png');
  assert.equal(SOCIAL_IMAGE_WIDTH, 1672);
  assert.equal(SOCIAL_IMAGE_HEIGHT, 941);
  assert.ok(SOCIAL_IMAGE_URL.startsWith('https://'));
  assert.ok(SOCIAL_IMAGE_URL.endsWith(SOCIAL_IMAGE_PATH));
});
