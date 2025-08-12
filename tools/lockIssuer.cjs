// scripts/lockIssuer.js
require('dotenv').config();
const StellarSdk = require('stellar-sdk');
const fetch      = require('node-fetch');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const issuer = StellarSdk.Keypair.fromSecret(process.env.ISSUER_SECRET);

(async () => {
  const acct = await server.loadAccount(issuer.publicKey());
  const tx = new StellarSdk.TransactionBuilder(acct, { fee: StellarSdk.BASE_FEE, networkPassphrase: StellarSdk.Networks.TESTNET })
    .addOperation(StellarSdk.Operation.setOptions({
      masterWeight: 0,   // disable issuing
      lowThreshold: 1,
      medThreshold: 1,
      highThreshold: 1
    }))
    .setTimeout(100).build();
  tx.sign(issuer);
  await server.submitTransaction(tx);
  console.log('🔒 Issuer locked—no more SZUP can be minted');
})();
