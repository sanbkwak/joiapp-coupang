// src/components/PersonalPage.js
import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';

export default function PersonalPage({
  version = '1.0',
  build = '1',
  initialLanguage = 'English',
  onViewResults,
  onNotifications,
  onCameraMicrophone,
  onEditAccount,
  onOpenJDVM, // Joi Data Valuation Model
  onOpenPrivacy,
  onOpenTOS,
  onWithdrawConsentConfirm, // optional async confirm
}) {
  const { user, logout } = useAuth?.() ?? { user: null, logout: async () => {} };

  const displayName = user?.displayName || 'Alex Wong';
  const email = user?.email || 'alexwong@example.com';

  const [language, setLanguage] = useState(initialLanguage);
  const [dataUsageConsent, setDataUsageConsent] = useState(false);
  const [withdrawConsent, setWithdrawConsent] = useState(false);

  // Simple chevron
  const Chevron = () => <span style={styles.chevron}>›</span>;

  const handleWithdrawToggle = async (next) => {
    if (typeof onWithdrawConsentConfirm === 'function') {
      const ok = await onWithdrawConsentConfirm(next);
      if (!ok) return;
    }
    setWithdrawConsent(next);
  };

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={styles.headerTitle}>Personal</div>
          <div style={styles.versionTop}>Version {version}</div>
        </div>

        {/* SECTION: Account */}
        <SectionTitle>Account</SectionTitle>

        <Row>
          <div style={{ flex: 1 }}>
            <div style={styles.primaryText}>{displayName}</div>
            <div style={styles.secondaryText}>{email}</div>
          </div>
          <button
            style={styles.linkButton}
            onClick={onEditAccount}
            aria-label="Edit Account"
          >
            Edit
          </button>
        </Row>

        <RowButton onClick={onViewResults} ariaLabel="View Survey Results">
          <span>View Survey Results</span>
          <Chevron />
        </RowButton>

        {/* SECTION: Settings */}
        <SectionTitle>Settings</SectionTitle>

        <RowButton
          onClick={() => {
            // Replace with your language selector modal if you have one.
            const next = window.prompt('Language', language) || language;
            setLanguage(next);
          }}
          ariaLabel="Language"
        >
          <span>Language</span>
          <span style={styles.valueText}>{language}</span>
        </RowButton>

        <RowButton onClick={onNotifications} ariaLabel="Notifications">
          <span>Notifications</span>
          <Chevron />
        </RowButton>

        <RowButton onClick={onCameraMicrophone} ariaLabel="Camera & Microphone">
          <span>Camera & Microphone</span>
          <Chevron />
        </RowButton>

        {/* SECTION: Consents */}
        <SectionTitle>Consents</SectionTitle>

        <Row>
          <span>Data Usage</span>
          <input
            type="checkbox"
            checked={dataUsageConsent}
            onChange={(e) => setDataUsageConsent(e.target.checked)}
            aria-label="Data Usage Consent"
            style={styles.checkbox}
          />
        </Row>

        <Row>
          <span>Withdraw Consent</span>
          <input
            type="checkbox"
            checked={withdrawConsent}
            onChange={(e) => handleWithdrawToggle(e.target.checked)}
            aria-label="Withdraw Consent"
            style={styles.checkbox}
          />
        </Row>

        {/* Legal / Docs */}
        <RowButton onClick={onOpenJDVM} ariaLabel="Joi Data Valuation Model">
          <span>Joi Data Valuation Model</span>
          <Chevron />
        </RowButton>

        <RowButton onClick={onOpenPrivacy} ariaLabel="Privacy Policy">
          <span>Privacy Policy</span>
          <Chevron />
        </RowButton>

        <RowButton onClick={onOpenTOS} ariaLabel="Terms of Service">
          <span>Terms of Service</span>
          <Chevron />
        </RowButton>

        {/* Sign out */}
        <RowButton
          onClick={async () => {
            try { await logout?.(); } catch (_) {}
          }}
          ariaLabel="Sign Out"
        >
          <span style={{ color: '#1f2937', fontWeight: 600 }}>Sign Out</span>
        </RowButton>

        {/* Footer version */}
        <div style={styles.footerVersion}>Version {version} ({build})</div>
      </div>
    </div>
  );
}

/* ---------- Small building blocks ---------- */

function SectionTitle({ children }) {
  return <div style={styles.sectionTitle}>{children}</div>;
}

function Row({ children }) {
  return <div style={styles.row}>{children}</div>;
}

function RowButton({ children, onClick, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ ...styles.row, ...styles.rowButton }}
    >
      {children}
    </button>
  );
}

/* ---------- Inline styles (no external CSS needed) ---------- */

const styles = {
  screen: {
    minHeight: '100vh',
    background:
      'linear-gradient(180deg, rgba(18,77,120,1) 0%, rgba(27,88,130,1) 35%, rgba(36,100,144,1) 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '32px 16px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#fff',
    borderRadius: 28,
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  headerRow: {
    position: 'relative',
    padding: '20px 16px 12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0f172a',
  },
  versionTop: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 14,
    color: '#374151',
  },
  sectionTitle: {
    padding: '12px 16px 8px 16px',
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
    background: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#fff',
    fontSize: 16,
    color: '#111827',
  },
  rowButton: {
    width: '100%',
    textAlign: 'left',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
  },
  primaryText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1.2,
  },
  secondaryText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  valueText: {
    marginLeft: 'auto',
    color: '#6b7280',
  },
  linkButton: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontWeight: 600,
    cursor: 'pointer',
  },
  chevron: {
    marginLeft: 'auto',
    color: '#9ca3af',
    fontSize: 22,
    lineHeight: 1,
  },
  checkbox: {
    marginLeft: 'auto',
    width: 20,
    height: 20,
    cursor: 'pointer',
  },
  footerVersion: {
    textAlign: 'center',
    padding: '20px 0',
    color: '#6b7280',
    fontSize: 14,
  },
};
