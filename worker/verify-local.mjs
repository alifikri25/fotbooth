import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.ROOMS_TEST_URL ?? 'http://127.0.0.1:8787';
const origin = 'http://127.0.0.1:5173';
const headers = { Origin: origin, 'Content-Type': 'application/json' };
const connections = [];

async function storedRoom(roomId) {
  if (!base.startsWith('http://127.0.0.1:8787')) return null;
  const { DatabaseSync } = await import('node:sqlite');
  const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), '.wrangler/state/v3/do/fotbooth-rooms-PhotoRoom');
  for (const file of (await readdir(directory)).filter(name => name.endsWith('.sqlite'))) {
    const database = new DatabaseSync(path.join(directory, file), { readOnly: true });
    try {
      if (!database.prepare("SELECT name FROM sqlite_master WHERE name = '_cf_KV'").get()) continue;
      const row = database.prepare("SELECT value FROM _cf_KV WHERE key = 'room'").get();
      if (row?.value && Buffer.from(row.value).includes(Buffer.from(roomId))) return Buffer.from(row.value);
    } finally { database.close(); }
  }
  throw new Error('The actual Durable Object room metadata was not found in local SQLite.');
}

function connect(roomId, token, client, name, requestedOrigin = origin) {
  const socket = new WebSocket(`${base.replace(/^http/, 'ws')}/api/rooms/${roomId}/socket?token=${encodeURIComponent(token)}&client=${client}&name=${name}`, { headers: { Origin: requestedOrigin } });
  const messages = [];
  socket.on('message', raw => messages.push(JSON.parse(String(raw))));
  connections.push(socket);
  return { socket, messages };
}

async function waitFor(connection, predicate) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const found = connection.messages.find(predicate);
    if (found) return found;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error(`Expected room event was not received: ${JSON.stringify(connection.messages)}`);
}

async function rejectedStatus(connection) {
  return new Promise((resolve, reject) => {
    connection.socket.on('unexpected-response', (_request, response) => { response.resume(); resolve(response.statusCode); });
    connection.socket.on('error', reject);
  });
}

try {
  const forbidden = await fetch(`${base}/api/rooms`, { method: 'POST', headers: { ...headers, Origin: 'https://evil.test' }, body: '{}' });
  assert.equal(forbidden.status, 403);
  const invalid = await fetch(`${base}/api/rooms`, { method: 'POST', headers, body: '{' });
  assert.equal(invalid.status, 400, 'Malformed room creation must be a client error.');
  const unknownFrame = await fetch(`${base}/api/rooms`, { method: 'POST', headers, body: JSON.stringify({ name: 'Ali', settings: { frameId: 'unknown-valid-looking', scene: 'studio', cutout: true } }) });
  assert.equal(unknownFrame.status, 400, 'Arbitrary frame IDs must be rejected.');
  assert.equal((await unknownFrame.json()).error, 'invalid_settings');
  const createdResponse = await fetch(`${base}/api/rooms`, { method: 'POST', headers, body: JSON.stringify({ name: 'Ali', settings: { frameId: 'online-satu-tempat', scene: 'studio', cutout: true } }) });
  assert.equal(createdResponse.status, 201);
  assert.equal(createdResponse.headers.get('Access-Control-Allow-Origin'), origin);
  const created = await createdResponse.json();
  const invalidIce = await fetch(`${base}/api/ice?roomId=${created.roomId}&token=wrong-token`, { headers: { Origin: origin } });
  assert.equal(invalidIce.status, 401, 'ICE must authenticate the room even when TURN is absent.');
  assert.deepEqual(await invalidIce.json(), { error: 'invalid_invitation', message: 'Undangan room tidak valid.' });
  const validIce = await fetch(`${base}/api/ice?roomId=${created.roomId}&token=${encodeURIComponent(created.hostToken)}`, { headers: { Origin: origin } });
  assert.equal(validIce.status, 200);
  const host = connect(created.roomId, created.hostToken, 'host-device', 'Ali');
  const hostState = await waitFor(host, event => event.type === 'state' && event.self === 'host');
  assert.equal(hostState.inviteToken, created.guestToken);
  host.socket.send(JSON.stringify({ type: 'capture' }));
  await waitFor(host, event => event.type === 'error' && event.code === 'not_ready');
  const guest = connect(created.roomId, created.guestToken, 'guest-device', 'Aya');
  const guestState = await waitFor(guest, event => event.type === 'state' && event.self === 'guest');
  assert.equal(guestState.inviteToken, undefined);
  assert.equal(JSON.stringify(guestState).includes(created.hostToken), false);
  assert.equal(await rejectedStatus(connect(created.roomId, created.guestToken, 'third-device', 'Third')), 409);
  assert.equal(await rejectedStatus(connect(created.roomId, 'wrong-token', 'bad-device', 'Bad')), 401);
  assert.equal(await rejectedStatus(connect(created.roomId, created.hostToken, 'host-device', 'Ali', 'https://evil.test')), 403);
  host.socket.send(JSON.stringify({ type: 'ready', ready: true }));
  guest.socket.send(JSON.stringify({ type: 'ready', ready: true }));
  await waitFor(host, event => event.type === 'state' && event.phase === 'ready');
  host.messages.length = 0;
  guest.messages.length = 0;
  host.socket.send(JSON.stringify({ type: 'capture' }));
  const capture = await waitFor(host, event => event.type === 'capture');
  const guestCapture = await waitFor(guest, event => event.type === 'capture');
  assert.equal(capture.captureId, guestCapture.captureId);
  assert.equal(capture.at, guestCapture.at);
  assert.equal(capture.series, undefined, 'Dedicated frames retain the previous single-shot wire format.');
  assert.ok(capture.at > Date.now() + 2500);
  const beforeRelay = await storedRoom(created.roomId);
  host.socket.send(JSON.stringify({ type: 'relay', data: '{"test":"transit-only-photo-chunk"}' }));
  assert.deepEqual(await waitFor(guest, event => event.type === 'relay'), { type: 'relay', from: 'host', data: '{"test":"transit-only-photo-chunk"}' });
  const afterRelay = await storedRoom(created.roomId);
  if (beforeRelay && afterRelay) {
    assert.deepEqual(afterRelay, beforeRelay, 'Relaying media must not modify the actual stored room metadata.');
    assert.equal(afterRelay.includes(Buffer.from('transit-only-photo-chunk')), false);
  }
  host.socket.send(JSON.stringify({ type: 'captured', captureId: capture.captureId }));
  guest.socket.send(JSON.stringify({ type: 'captured', captureId: capture.captureId }));
  await waitFor(host, event => event.type === 'state' && event.phase === 'result');
  host.messages.length = 0;
  guest.messages.length = 0;
  guest.socket.send(JSON.stringify({ type: 'retake' }));
  const reset = await waitFor(host, event => event.type === 'state' && event.phase === 'waiting');
  assert.equal(reset.capture, undefined);
  assert.equal(reset.participants.every(person => !person.ready), true);

  for (const [frameId, total] of [['concert-pass', 2], ['orbit-club', 3], ['pocket-arcade', 4]]) {
    const sharedSettings = { frameId, scene: 'night', cutout: false };
    host.messages.length = 0;
    guest.messages.length = 0;
    host.socket.send(JSON.stringify({ type: 'settings', settings: sharedSettings }));
    await waitFor(guest, event => event.type === 'state' && event.settings.frameId === frameId);
    host.socket.send(JSON.stringify({ type: 'ready', ready: true }));
    guest.socket.send(JSON.stringify({ type: 'ready', ready: true }));
    await waitFor(host, event => event.type === 'state' && event.phase === 'ready');
    host.messages.length = 0;
    guest.messages.length = 0;
    host.socket.send(JSON.stringify({ type: 'capture' }));
    let shot = await waitFor(host, event => event.type === 'capture');
    const seriesId = shot.series.seriesId;
    const captureIds = new Set();
    for (let index = 0; index < total; index++) {
      const peerShot = await waitFor(guest, event => event.type === 'capture' && event.captureId === shot.captureId);
      assert.deepEqual(peerShot, shot, 'Every pose has the same settings, identity and shutter time for both participants.');
      assert.deepEqual(shot.settings, sharedSettings);
      assert.deepEqual(shot.series, { seriesId, index, total });
      assert.equal(captureIds.has(shot.captureId), false, 'Each pose must have a fresh capture identity.');
      captureIds.add(shot.captureId);
      assert.ok(shot.at > Date.now() + 2500, 'Each pose needs a fresh coordinated countdown.');
      guest.messages.length = 0;
      guest.socket.send(JSON.stringify({ type: 'advance', captureId: shot.captureId }));
      await waitFor(guest, event => event.type === 'error' && event.code === 'host_only');
      host.messages.length = 0;
      host.socket.send(JSON.stringify({ type: 'advance', captureId: shot.captureId }));
      await waitFor(host, event => event.type === 'error' && event.code === 'not_captured');
      host.messages.length = 0;
      host.socket.send(JSON.stringify({ type: 'captured', captureId: shot.captureId }));
      host.socket.send(JSON.stringify({ type: 'advance', captureId: shot.captureId }));
      await waitFor(host, event => event.type === 'error' && event.code === 'not_captured');
      guest.socket.send(JSON.stringify({ type: 'captured', captureId: shot.captureId }));
      await waitFor(host, event => event.type === 'state' && event.phase === 'result' && event.capture?.id === shot.captureId);
      host.messages.length = 0;
      guest.messages.length = 0;
      host.socket.send(JSON.stringify({ type: 'advance', captureId: shot.captureId }));
      if (index + 1 === total) {
        await waitFor(host, event => event.type === 'error' && event.code === 'series_complete');
      } else {
        const previousId = shot.captureId;
        shot = await waitFor(host, event => event.type === 'capture' && event.captureId !== previousId);
        host.socket.send(JSON.stringify({ type: 'captured', captureId: previousId }));
        await waitFor(host, event => event.type === 'error' && event.code === 'stale_capture');
      }
    }
    assert.equal(captureIds.size, total);
  }
  host.messages.length = 0;
  guest.socket.close();
  const departed = await waitFor(host, event => event.type === 'state' && event.participants.some(person => person.role === 'guest' && !person.connected));
  assert.equal(departed.phase, 'waiting');
  assert.equal(departed.capture, undefined, 'Disconnect cancels the active pose sequence.');
  console.log('Verified actual room HTTP + 2 WebSockets: private invitations, ICE auth, origin checks, capacity, valid frame IDs, readiness, legacy single capture, host-only 2/3/4-pose sequences with both-ACK gating and fresh countdowns/IDs, relay without SQLite writes, result, retake, disconnect.');
} finally {
  for (const socket of connections) if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.terminate();
}
