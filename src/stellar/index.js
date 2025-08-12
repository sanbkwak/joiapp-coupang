// src/stellar/index.js - FIXED VERSION
import freighterApi from '@stellar/freighter-api';

// Load StellarSdk from window object (loaded via CDN)
const getStellarSdk = () => {
  if (window.StellarSdk) {
    return window.StellarSdk;
  }
  throw new Error('StellarSdk not loaded. Please add the CDN script to your HTML.');
};

const isPublic = process.env.REACT_APP_STELLAR_NETWORK === 'public';

// Lazy initialization functions
let _server = null;
let _SZUP = null;

const getServer = () => {
  if (!_server) {
    const StellarSdk = getStellarSdk();
    
    // Try different ways to create the server based on SDK version
    if (StellarSdk.Horizon && StellarSdk.Horizon.Server) {
      // Newer SDK versions
      _server = new StellarSdk.Horizon.Server(
        isPublic
          ? 'https://horizon.stellar.org'
          : 'https://horizon-testnet.stellar.org'
      );
    } else if (StellarSdk.Server) {
      // Older SDK versions
      _server = new StellarSdk.Server(
        isPublic
          ? 'https://horizon.stellar.org'
          : 'https://horizon-testnet.stellar.org'
      );
    } else {
      throw new Error('Unable to find Server constructor in StellarSdk');
    }
  }
  return _server;
};

const getSZUP = () => {
  if (!_SZUP) {
    const StellarSdk = getStellarSdk();
    const issuerKey = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
    
    if (!issuerKey) {
      throw new Error('REACT_APP_ISSUER_PUBLIC_KEY environment variable is not set');
    }
    
    _SZUP = new StellarSdk.Asset('SZUP', issuerKey);
  }
  return _SZUP;
};

// Network configuration
export const NETWORK_PASSPHRASE = isPublic 
  ? 'Public Global Stellar Network ; September 2015'
  : 'Test SDF Network ; September 2015';

// Export getters instead of direct objects
export const server = {
  get instance() {
    return getServer();
  },
  loadAccount: async (publicKey) => {
    return await getServer().loadAccount(publicKey);
  },
  submitTransaction: async (transaction) => {
    return await getServer().submitTransaction(transaction);
  }
};

// FIX: Export SZUP as the actual Asset, not a proxy object
export const SZUP = getSZUP(); // This exports the actual StellarSdk.Asset instance
export { getSZUP };

// Wallet object
export const wallet = {
  connect: async () => {
    return await freighterApi.getPublicKey();
  },

// Fix wallet.signTransaction to handle user rejection properly
// In your stellar/index.js, replace the wallet.signTransaction function:

signTransaction: async (transactionXDR) => {
  const signed = await freighterApi.signTransaction(transactionXDR, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  // ⭐ FIX: Check for user rejection FIRST
  if (signed.error) {
    if (signed.error.code === -4) {
      throw new Error('Transaction cancelled: You declined the signature request in Freighter.');
    } else {
      throw new Error(`Freighter error: ${signed.error.message}`);
    }
  }

  // Extract the signed XDR
  const xdr =
    typeof signed === 'string'
      ? signed
      : signed?.signedTxXdr || signed?.signedXDR || signed?.envelope_xdr || signed?.tx;

  if (!xdr || typeof xdr !== 'string' || xdr.length === 0) {
    console.error('Unexpected signTransaction payload:', signed);
    throw new Error('Freighter did not return a valid signed XDR string.');
  }

  return xdr;
},
  
  getPublicKey: async () => {
    return await freighterApi.getPublicKey();
  },

  isConnected: () => {
    return freighterApi.isConnected();
  },

  isAllowed: () => {
    return freighterApi.isAllowed();
  }
};

// Stellar operations
export const stellar = {
  // Helpers: trustline capacity + friendly message
  getTrustlineCapacity: async ({ server, destination, asset }) => {
    const acct = await server.loadAccount(destination);
    const a = asset; // Use asset directly since SZUP is now a proper Asset
    const tl = acct.balances.find(
      b => b.asset_code === a.code && b.asset_issuer === a.issuer
    );

    if (!tl) {
      return { hasTrustline: false, balance: 0, limit: 0, capacity: 0 };
    }

    const balance = parseFloat(tl.balance || '0');
    const limit   = parseFloat(tl.limit   || '0');
    const capacity = Math.max(0, limit - balance);
    return { hasTrustline: true, balance, limit, capacity, tl };
  },

  opLineFullUserMessage: ({ assetCode, balance, limit, capacity, amount }) => {
    return (
      `The ${assetCode} wallet you're sending to is full.\n` +
      `• Current balance: ${balance}\n` +
      `• Maximum allowed (trustline limit): ${limit}\n` +
      `• Space left: ${capacity}\n\n` +
      `You tried to send ${amount}, but there isn't any room.\n\n` +
      `What you can do:\n` +
      `1) Increase the trustline limit (Change Trust) in the receiving wallet, e.g. 2,000,000 or 922337203685.4775807 (the max), then try again.\n` +
      `2) Or move some ${assetCode} out of the receiving wallet to free space, then try again.\n` +
      `3) Or send a smaller amount (≤ ${capacity}).`
    );
  },
  
  get server() {
    return getServer();
  },

  loadAccount: async (publicKey) => {
    return await getServer().loadAccount(publicKey);
  },

// Fixed changeTrust function - remove duplicate normalization
changeTrust: async ({ asset, limit, sourceAddress }) => {
  const StellarSdk = getStellarSdk();
  const server = getServer();
  
  console.log('ChangeTrust operation:', {
    asset: asset,
    limit,
    sourceAddress
  });
  
  // Load the source account
  const account = await server.loadAccount(sourceAddress);
  
  // Build the transaction
  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
  
  // Add the changeTrust operation
  transactionBuilder.addOperation(
    StellarSdk.Operation.changeTrust({
      asset: asset,
      limit: limit,
    })
  );
  
  // Set timeout and build
  transactionBuilder.setTimeout(30);
  const transaction = transactionBuilder.build();

  console.log('Transaction built successfully');
  console.log('Unsigned XDR:', transaction.toXDR());
  
  // ⭐ FIX: wallet.signTransaction already returns normalized string
  const signedXDR = await wallet.signTransaction(transaction.toXDR());
  
  console.log('Signed XDR received:', signedXDR.substring(0, 50) + '...');
  
  // Verify it's a valid XDR string
  if (typeof signedXDR !== 'string') {
    throw new Error('wallet.signTransaction did not return a string');
  }

  // Submit via SDK
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXDR,
    NETWORK_PASSPHRASE
  );
  
  console.log('Submitting signed transaction, signatures:', signedTx.signatures.length);
  const result = await server.submitTransaction(signedTx);
  
  return result;
},

  payment: async ({ destination, asset, amount, sourceAddress }) => {
    const StellarSdk = getStellarSdk();
    const server = getServer();

    // Use asset directly since SZUP is now a proper Asset
    const a = asset;

    // Preflight capacity check (friendly errors early)
    const {
      hasTrustline,
      balance: tlBalance,
      limit: tlLimit,
      capacity: tlCapacity,
    } = await stellar.getTrustlineCapacity({ server, destination, asset: a });

    const amt = parseFloat(String(amount));
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new Error('Please enter a valid positive amount.');
    }

    if (!hasTrustline) {
      throw new Error(
        `The receiving wallet hasn't added a trustline for ${a.code} (${a.issuer}) yet. ` +
        `Ask them to add the trustline first.`
      );
    }

    if (amt > tlCapacity) {
      throw new Error(
        stellar.opLineFullUserMessage({
          assetCode: a.code,
          balance: tlBalance,
          limit: tlLimit,
          capacity: tlCapacity,
          amount,
        })
      );
    }

    // Build payment tx
    const account = await server.loadAccount(sourceAddress);
    const fee = await server.fetchBaseFee();
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: a, // Use asset directly
          amount,
        })
      )
      .setTimeout(120)
      .build();

    // Sign with Freighter
    const signedXDR = await wallet.signTransaction(tx.toXDR());

    // Submit via SDK
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXDR,
      NETWORK_PASSPHRASE
    );
    const result = await server.submitTransaction(signedTx);

    // Optional: post-payment snapshot
    const after = await stellar.getTrustlineCapacity({ server, destination, asset: a });
    console.log('trustline after payment:', after.tl);
    console.log('capacity left:', after.capacity);

    return result;
  }
};

// Initialize and log status
setTimeout(() => {
  try {
    const StellarSdk = getStellarSdk();
    const issuerKey = process.env.REACT_APP_ISSUER_PUBLIC_KEY;
    
    console.log('Stellar SDK loaded from CDN:', {
      version: StellarSdk.version || 'unknown',
      hasServer: !!StellarSdk.Server,
      hasAsset: !!StellarSdk.Asset,
      isPublic,
      networkPassphrase: NETWORK_PASSPHRASE,
      serverUrl: getServer().serverURL.toString(),
      issuerKey: issuerKey || 'NOT SET',
      szupAsset: issuerKey ? `${getSZUP().code}:${getSZUP().issuer}` : 'Cannot create - no issuer key'
    });
  } catch (e) {
    console.error('Initialization error:', e.message);
  }
}, 100);