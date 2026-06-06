import test from 'node:test';
import assert from 'node:assert/strict';

import { buildProviderReadinessSnapshot } from '../packages/core/src/index.js';

test('provider readiness reports admin gate and live-write gate states', () => {
  const snapshot = buildProviderReadinessSnapshot({});
  const adminGate = snapshot.items.find((item) => item.key === 'admin_api');
  const liveWrites = snapshot.items.find((item) => item.key === 'live_writes');

  assert.equal(adminGate?.status, 'missing');
  assert.match(adminGate?.note || '', /ADMIN_API_SHARED_SECRET/);
  assert.equal(liveWrites?.status, 'ready');
  assert.match(liveWrites?.note || '', /disabled by default/);
});

test('provider readiness marks live writes as partial when enabled', () => {
  const snapshot = buildProviderReadinessSnapshot({
    ADMIN_API_SHARED_SECRET: 'secret',
    LIVE_WRITES_ENABLED: 'true'
  });
  const adminGate = snapshot.items.find((item) => item.key === 'admin_api');
  const liveWrites = snapshot.items.find((item) => item.key === 'live_writes');

  assert.equal(adminGate?.status, 'ready');
  assert.equal(liveWrites?.status, 'partial');
  assert.match(liveWrites?.note || '', /LIVE_WRITES_ENABLED=true/);
});
