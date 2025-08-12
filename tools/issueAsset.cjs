// scripts/issueAsset.js
require('dotenv').config();
const StellarSdk = require('stellar-sdk');
const fetch      = require('node-fetch');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const issuer = StellarSdk.Keypair.fromSecret(process.env.ISSUER_SECRET);
const dist   = StellarSdk.Keypair.fromSecret(process.env.DIST_SECRET);
const SZUP    = new StellarSdk.Asset('SZUP', issuer.publicKey());

(async () => {
  // 1) distribution must trust SZUP
  const distAcct = await server.loadAccount(dist.publicKey());
  const trustTx = new StellarSdk.TransactionBuilder(distAcct, { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: SZUP, limit: '1000000' }))
    .setTimeout(100).build();
  trustTx.sign(dist);
  await server.submitTransaction(trustTx);

  // 2) issuer sends SZUP to distribution
  const issuerAcct = await server.loadAccount(issuer.publicKey());
  const payTx = new StellarSdk.TransactionBuilder(issuerAcct, { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET })
    .addOperation(StellarSdk.Operation.payment({ destination: dist.publicKey(), asset: SZUP, amount: '1000000' }))
    .setTimeout(100).build();
  payTx.sign(issuer);
  await server.submitTransaction(payTx);

  console.log('✅ SZUP minted to distribution account');
})();
