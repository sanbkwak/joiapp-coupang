// src/components/admin/SzupAdmin.js
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { WalletContext } from '../../contexts/WalletContext';

export default function SzupAdmin() {
  const { user, claims, loading, logout } = useAuth();
  const { publicKey, connect } = useContext(WalletContext);
  const navigate = useNavigate();

  // While auth state loads
  if (loading) return null;

  // Hard stop if user somehow hits this without RequireAdmin
  if (!user) return <div className="p-4">Please <Link to="/admin/login" className="text-blue-600 underline">log in</Link>.</div>;
  if (!claims?.admin) return <div className="p-4">You are not authorized to view this page.</div>;

  // Use distG from custom claims; fallback to env if needed
  const REQUIRED_DIST = claims?.distG || process.env.REACT_APP_DISTRIBUTION_PUBLIC_KEY || '';
  const ISSUER_G = process.env.REACT_APP_ISSUER_PUBLIC_KEY || '';
  const isDistribution = Boolean(publicKey && REQUIRED_DIST && publicKey === REQUIRED_DIST);

  const short = (g) => g ? `${g.slice(0,6)}…${g.slice(-6)}` : '—';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">SZUP Admin</h1>
          <p className="text-sm text-gray-600">
            Asset: <code>SZUP:{short(ISSUER_G)}</code>
          </p>
          <p className="text-xs text-gray-500">
            Distribution (required): <code>{short(REQUIRED_DIST)}</code>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="px-3 py-2 border rounded"
            onClick={async () => { await logout(); navigate('/admin/login', { replace: true }); }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* Connection / Status */}
      <section className="p-4 border rounded bg-white shadow-sm">
        <h3 className="font-semibold mb-2">Connection</h3>

        {publicKey ? (
          <>
            <p className="text-sm">
              Connected wallet:&nbsp;
              <code className="bg-gray-50 px-1 rounded">{short(publicKey)}</code>
            </p>

            {REQUIRED_DIST ? (
              isDistribution ? (
                <p className="text-sm text-green-700 mt-1">
                  ✅ This is the configured <strong>Distribution</strong> account.
                </p>
              ) : (
                <p className="text-sm text-red-700 mt-1">
                  ⚠️ Wallet mismatch. Connect&nbsp;
                  <code className="bg-gray-50 px-1 rounded">{short(REQUIRED_DIST)}</code>
                  &nbsp;to enable transfers.
                </p>
              )
            ) : (
              <p className="text-sm text-amber-700 mt-1">
                ℹ️ Add <code>REACT_APP_DISTRIBUTION_PUBLIC_KEY</code> if you aren’t setting <code>distG</code> via claims.
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm">No wallet connected.</p>
            <button
              onClick={async () => {
                try { await connect(); } catch (e) { alert(e.message || 'Failed to connect'); }
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Connect Freighter
            </button>
          </div>
        )}
      </section>

      {/* Steps */}
      <section className="p-4 border rounded bg-white shadow-sm">
        <h3 className="font-semibold mb-3">Steps to transfer SZUP</h3>
        <ol className="list-decimal ml-5 space-y-2 text-sm">
          <li>
            <strong>Connect Freighter</strong> with the <em>Distribution</em> account.
            <div className="mt-1">
              <Link to="/wallet/connect" className="text-blue-600 hover:underline">Open Connect Wallet</Link>
            </div>
          </li>
          <li>
            Ensure the recipient added a trustline to <code>SZUP:{short(ISSUER_G)}</code>.
            <div className="mt-1">
              <Link to="/wallet/trustline" className="text-blue-600 hover:underline">Add Trustline</Link>
            </div>
            <p className="text-xs text-gray-500 mt-1">If they don’t have a wallet yet, consider a claimable balance flow.</p>
          </li>
          <li>
            <strong>Send SZUP</strong> from the Distribution account.
            <div className="mt-1">
              <Link to="/wallet/transfer">
                <button
                  disabled={!publicKey || !isDistribution}
                  className={`px-3 py-2 rounded text-white ${(!publicKey || !isDistribution) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  Open Transfer
                </button>
              </Link>
            </div>
          </li>
          <li>
            (Optional) Verify in Horizon Explorer:&nbsp;
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline text-xs"
            >
              stellar.expert/testnet
            </a>
          </li>
        </ol>
      </section>

      {/* Quick links */}
      <section className="grid md:grid-cols-3 gap-3">
        <Card
          title="Connect Wallet"
          desc="Authorize with Freighter and select the Distribution account."
          to="/wallet/connect"
          cta="Connect"
          color="blue"
        />
        <Card
          title="Add Trustline"
          desc="Recipients must add a trustline to receive SZUP."
          to="/wallet/trustline"
          cta="Open"
          color="yellow"
        />
        <Card
          title="Transfer SZUP"
          desc="Send SZUP from the Distribution wallet."
          to="/wallet/transfer"
          cta="Transfer"
          color="green"
          disabled={!publicKey || !isDistribution}
        />
      </section>
    </div>
  );
}

function Card({ title, desc, to, cta, color = 'gray', disabled = false }) {
  const classes =
    'px-4 py-2 rounded text-white ' +
    (disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : color === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700'
      : color === 'yellow'
      ? 'bg-yellow-600 hover:bg-yellow-700'
      : color === 'green'
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-gray-600 hover:bg-gray-700');

  const body = (
    <div className="p-4 border rounded bg-white shadow-sm h-full flex flex-col">
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-gray-600 flex-1">{desc}</p>
      <div className="mt-3">
        <button className={classes} disabled={disabled}>{cta}</button>
      </div>
    </div>
  );

  if (disabled) return body;
  return <Link to={to}>{body}</Link>;
}
