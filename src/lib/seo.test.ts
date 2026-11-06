import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
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

test('the uploaded static social image is a valid PNG at the advertised resolution', () => {
  const bytes = readFileSync(join(process.cwd(), 'public', 'opengraph-image.png'));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), SOCIAL_IMAGE_WIDTH);
  assert.equal(bytes.readUInt32BE(20), SOCIAL_IMAGE_HEIGHT);
  assert.ok(bytes.byteLength > 100_000 && bytes.byteLength < 5_000_000);
});
