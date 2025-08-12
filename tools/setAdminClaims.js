// tools/setAdminClaims.js
const path = require('path');
const admin = require('firebase-admin');

// Allow overriding the key path via env var FIREBASE_SA; else use local file
const keyPath = process.env.FIREBASE_SA || path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(keyPath);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const idOrEmail = process.argv[2];   // UID or email
  const distG     = process.argv[3];   // G... distribution account

  if (!idOrEmail || !distG) {
    console.error('Usage: node tools/setAdminClaims.js <uid|email> <G_DISTRIBUTION>');
    process.exit(1);
  }

  // Look up user by email or UID
  let userRecord;
  if (idOrEmail.includes('@')) {
    userRecord = await admin.auth().getUserByEmail(idOrEmail);
  } else {
    userRecord = await admin.auth().getUser(idOrEmail);
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, {
    admin: true,
    distG: distG,
  });

  console.log(`✅ Claims set for ${userRecord.uid} (${userRecord.email || 'no email'}) with distG=${distG}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
