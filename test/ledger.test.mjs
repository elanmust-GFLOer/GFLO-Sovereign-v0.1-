import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import solc from 'solc';
import ganache from 'ganache';
import { BrowserProvider, ContractFactory, id, ZeroHash, ZeroAddress, MaxUint256 } from 'ethers';

const source = readFileSync(new URL('../contracts/ContributionLedger.sol', import.meta.url), 'utf8');
const output = JSON.parse(solc.compile(JSON.stringify({
  language: 'Solidity', sources: { 'ContributionLedger.sol': { content: source } },
  settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai',
    outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
})));
assert.deepEqual((output.errors ?? []).filter(e => e.severity === 'error'), []);
const artifact = output.contracts['ContributionLedger.sol'].ContributionLedger;

async function fixture(t) {
  const rpc = ganache.provider({ logging: { quiet: true }, chain: { hardfork: 'shanghai' } });
  const provider = new BrowserProvider(rpc);
  provider.pollingInterval = 10;
  t.after(async () => { provider.destroy(); await rpc.disconnect(); });
  const actors = await Promise.all([0, 1, 2, 3].map(i => provider.getSigner(i)));
  const [admin, grantor, user, successor] = actors;
  const factory = new ContractFactory(artifact.abi, artifact.evm.bytecode.object, admin);
  const ledger = await factory.deploy(admin.address);
  await ledger.waitForDeployment();
  return { ledger, factory, admin, grantor, user, successor };
}
async function send(promise) { return (await promise).wait(); }
async function revert(promise) { await assert.rejects(async () => send(promise)); }

test('users and owner without issuance role cannot credit XP', async t => {
  const { ledger, admin, user, grantor } = await fixture(t);
  for (const actor of [user, admin]) {
    await revert(ledger.connect(actor).credit(id('a'), user.address, 100));
    await revert(ledger.connect(actor).credit(id('b'), grantor.address, 100));
  }
  await revert(ledger.connect(user).setGrantor(user.address, true));
  assert.equal(await ledger.xp(user.address), 0n);
});

test('authorized credit uses whole units and records its provenance', async t => {
  const { ledger, grantor, user } = await fixture(t);
  await send(ledger.setGrantor(grantor.address, true));
  const receipt = await send(ledger.connect(grantor).credit(id('work-1'), user.address, 1));
  assert.equal(await ledger.xp(user.address), 1n);
  const event = ledger.interface.parseLog(receipt.logs[0]);
  assert.equal(event.name, 'ContributionCredited');
  assert.deepEqual([...event.args], [id('work-1'), user.address, grantor.address, 1n]);
  await send(ledger.connect(grantor).credit(id('work-2'), user.address, 999));
  assert.equal(await ledger.xp(user.address), 1000n);
});

test('same ID cannot be credited again by another grantor or to another recipient', async t => {
  const { ledger, admin, grantor, user, successor } = await fixture(t);
  await send(ledger.setGrantor(grantor.address, true));
  await send(ledger.setGrantor(admin.address, true));
  await send(ledger.connect(grantor).credit(id('same'), user.address, 50));
  await revert(ledger.connect(grantor).credit(id('same'), user.address, 51));
  await revert(ledger.credit(id('same'), successor.address, 52));
  assert.equal(await ledger.xp(user.address), 50n);
  assert.equal(await ledger.xp(successor.address), 0n);
});

test('revoked grantor cannot issue a fresh credit', async t => {
  const { ledger, grantor, user } = await fixture(t);
  await send(ledger.setGrantor(grantor.address, true));
  await send(ledger.connect(grantor).credit(id('before'), user.address, 5));
  await send(ledger.setGrantor(grantor.address, false));
  await revert(ledger.connect(grantor).credit(id('after'), user.address, 5));
  assert.equal(await ledger.xp(user.address), 5n);
});

test('invalid grant inputs leave the ID unused', async t => {
  const { ledger, grantor, user } = await fixture(t);
  await send(ledger.setGrantor(grantor.address, true));
  await revert(ledger.connect(grantor).credit(ZeroHash, user.address, 1));
  await revert(ledger.connect(grantor).credit(id('invalid'), ZeroAddress, 1));
  await revert(ledger.connect(grantor).credit(id('invalid'), await ledger.getAddress(), 1));
  await revert(ledger.connect(grantor).credit(id('invalid'), user.address, 0));
  assert.equal(await ledger.credited(id('invalid')), false);
});

test('overflow reverts atomically including the consumed ID', async t => {
  const { ledger, grantor, user } = await fixture(t);
  await send(ledger.setGrantor(grantor.address, true));
  await send(ledger.connect(grantor).credit(id('max'), user.address, MaxUint256));
  await revert(ledger.connect(grantor).credit(id('overflow'), user.address, 1));
  assert.equal(await ledger.credited(id('overflow')), false);
  assert.equal(await ledger.xp(user.address), MaxUint256);
});

test('admin transfer requires acceptance and removes previous admin authority', async t => {
  const { ledger, admin, grantor, user, successor } = await fixture(t);
  await send(ledger.setGrantor(admin.address, true));
  await revert(ledger.connect(user).transferOwnership(user.address));
  await send(ledger.transferOwnership(successor.address));
  assert.equal(await ledger.owner(), admin.address);
  await revert(ledger.connect(user).acceptOwnership());
  await revert(ledger.connect(successor).setGrantor(user.address, true));
  await send(ledger.connect(successor).acceptOwnership());
  assert.equal(await ledger.owner(), successor.address);
  assert.equal(await ledger.pendingOwner(), ZeroAddress);
  assert.equal(await ledger.grantors(admin.address), false);
  await revert(ledger.setGrantor(grantor.address, true));
  await revert(ledger.credit(id('old-admin'), user.address, 1));
  await send(ledger.connect(successor).setGrantor(grantor.address, true));
});

test('invalid admin and grantor addresses are rejected', async t => {
  const { ledger, factory } = await fixture(t);
  await assert.rejects(async () => { const bad = await factory.deploy(ZeroAddress); await bad.waitForDeployment(); });
  for (const address of [ZeroAddress, await ledger.getAddress()]) {
    await revert(ledger.setGrantor(address, true));
    await revert(ledger.transferOwnership(address));
  }
});

test('replacing the pending owner invalidates the previous proposal', async t => {
  const { ledger, user, successor } = await fixture(t);
  await send(ledger.transferOwnership(user.address));
  await send(ledger.transferOwnership(successor.address));
  await revert(ledger.connect(user).acceptOwnership());
  await send(ledger.connect(successor).acceptOwnership());
  assert.equal(await ledger.owner(), successor.address);
});
