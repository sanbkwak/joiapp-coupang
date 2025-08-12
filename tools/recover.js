// recover.js
// ✅ Grab the default export so that `.fromMnemonic` exists
const Wallet = require('stellar-hd-wallet').default;


// Replace with your exact 12 words (space-separated)
const mnemonic = 'pond million slow pizza uncover sister coyote skin spoil man pepper absurd';

// Derive the first account (index 0)
const wallet = Wallet.fromMnemonic(mnemonic);
const keypair = wallet.getKeypair(0);

console.log('Public Key: ', keypair.publicKey());
console.log('Secret Key: ', keypair.secret());
