// src/scripts/createAccounts.cjs  (CommonJS)
require('dotenv').config();
const StellarSdk = require('stellar-sdk');
const fetch      = require('node-fetch');

const { ISSUER_SECRET, DIST_SECRET, FRIENDBOT } = process.env;
if (!ISSUER_SECRET || !DIST_SECRET) {
  console.error('❌ Missing ISSUER_SECRET or DIST_SECRET in .env');
  process.exit(1);
}

const friendbotURL = FRIENDBOT || 'https://horizon-testnet.stellar.org/friendbot';

async function fund(secret) {
  const kp = StellarSdk.Keypair.fromSecret(secret);
  console.log(`Funding ${kp.publicKey()} via Friendbot…`);

  const res = await fetch(`${friendbotURL}?addr=${kp.publicKey()}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Friendbot error ${res.status}: ${body}`);
  }
}

(async () => {
  await fund(ISSUER_SECRET);
  await fund(DIST_SECRET);
  console.log('✅ Issuer & distribution accounts funded on TESTNET');
})();
