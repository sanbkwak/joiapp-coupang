// /src/scripts/createTestAccount.cjs
const StellarSdk = require('stellar-sdk');

// If your Node is < 18, uncomment the next line:
// global.fetch = require('node-fetch');

(async () => {
  try {
    const pair = StellarSdk.Keypair.random();
    const pub = pair.publicKey();
    const sec = pair.secret();

    console.log('New TESTNET wallet');
    console.log('Public Key :', pub);
    console.log('Secret Key :', sec);

    // 1) fund with Friendbot
    const fb = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(pub)}`);
    if (!fb.ok) {
      const t = await fb.text();
      throw new Error(`Friendbot failed: ${fb.status} ${t}`);
    }
    console.log('✅ Funded by Friendbot');

    // 2) (optional) add SZUP trustline now from Node
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(pub);
    const fee = await server.fetchBaseFee();

    const SZUP = new StellarSdk.Asset(
      'SZUP',
      'GDZERDXVPQ3BSZKMUWERCPQRLPLFDWQOBZQ6TAYFUWBZSSF4EDKRDL3L' // your issuer
    );

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.changeTrust({ asset: SZUP, limit: '1000000' }))
      .setTimeout(120)
      .build();

    tx.sign(StellarSdk.Keypair.fromSecret(sec));
    const res = await server.submitTransaction(tx);
    console.log('✅ Trustline added:', res.hash);

    console.log('\nUse this Public Key in your app to test SZUP issuing.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  }
})();
