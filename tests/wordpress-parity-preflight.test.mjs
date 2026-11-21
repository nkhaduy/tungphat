import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { inspectAsset } from '../scripts/wordpress/parity-preflight.mjs';

test('rejects a missing asset even when its exact URL is approved', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wp-parity-'));
  try {
    const result = await inspectAsset(root, '/sanpham-media/a.webp', 'https://mdftungphat.com/sanpham-media/a.webp,source,evidence,usage,notes,APPROVED\n');
    assert.equal(result.ok, false);
    assert.match(result.reason, /missing/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('requires the exact asset URL to be approved and the image to decode', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wp-parity-'));
  try {
    await mkdir(path.join(root, 'sanpham-media'));
    await sharp({create:{width:2,height:3,channels:3,background:'#33aa55'}}).webp().toFile(path.join(root,'sanpham-media/a.webp'));
    const wrong = await inspectAsset(root, '/sanpham-media/a.webp', 'https://mdftungphat.com/sanpham-media/a-400.webp,source,evidence,usage,notes,APPROVED\n');
    assert.equal(wrong.ok, false);
    const good = await inspectAsset(root, '/sanpham-media/a.webp', 'https://mdftungphat.com/sanpham-media/a.webp,source,evidence,usage,notes,APPROVED\n');
    assert.equal(good.ok, true);
    assert.equal(good.width, 2);
    assert.equal(good.height, 3);
    await writeFile(path.join(root,'sanpham-media/a.webp'), 'not an image');
    const invalid = await inspectAsset(root, '/sanpham-media/a.webp', 'https://mdftungphat.com/sanpham-media/a.webp,source,evidence,usage,notes,APPROVED\n');
    assert.equal(invalid.ok, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('refuses an apply request before contacting WordPress', async () => {
  const { spawnSync } = await import('node:child_process');
  const run = spawnSync(process.execPath, ['scripts/wordpress/parity-preflight.mjs', '--apply'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /Read-only preflight only/);
});
