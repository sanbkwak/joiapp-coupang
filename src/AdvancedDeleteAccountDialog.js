// AdvancedDeleteAccountDialog.js - Full-featured deletion dialog

import React, { useState, useEffect } from 'react';
import { 
  validateAccountDeletion,
  getAccountDeletionStatus,
  deleteUserAccountEnhanced,
  cancelAccountDeletion 
} from './utils/userModel';

function AdvancedDeleteAccountDialog({ 
  user, 
  onClose, 
  onDeleteComplete,
  onLogout 
}) {
  const [step, setStep] = useState('loading'); // loading, blocked, warning, grace-period, confirmation, processing
  const [validationResult, setValidationResult] = useState(null);
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useGracePeriod, setUseGracePeriod] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState(30);
  
  const expectedConfirmText = 'DELETE MY ACCOUNT';

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const checkAccountStatus = async () => {
    try {
      // Check if account is already scheduled for deletion
      const status = await getAccountDeletionStatus(user.uid);
      setDeletionStatus(status);
      
      if (status.status === 'scheduled_for_deletion') {
        setStep('scheduled');
        return;
      }
      
      // Validate if account can be deleted
      const validation = await validateAccountDeletion(user.uid);
      setValidationResult(validation);
      
      if (!validation.canDelete) {
        setStep('blocked');
      } else {
        setStep('warning');
        // Auto-suggest grace period if there are warnings
        if (validation.recommendGracePeriod) {
          setUseGracePeriod(true);
        }
      }
    } catch (error) {
      console.error('Status check failed:', error);
      setStep('error');
    }
  };

  const handleCancelScheduledDeletion = async () => {
    try {
      setIsProcessing(true);
      await cancelAccountDeletion(user.uid);
      
      alert('Account deletion cancelled successfully!');
      onClose();
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert('Failed to cancel deletion. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalDeletion = async () => {
    if (!useGracePeriod && confirmationText !== expectedConfirmText) {
      alert(`Please type "${expectedConfirmText}" exactly to confirm.`);
      return;
    }

    try {
      setIsProcessing(true);
      setStep('processing');

      const options = {
        gracePeriodDays: useGracePeriod ? gracePeriodDays : 0,
        reason: 'user_requested'
      };

      const result = await deleteUserAccountEnhanced(user.uid, options);

      if (result.scheduled) {
        alert(`Account deletion scheduled for ${new Date(result.deletionDate).toLocaleDateString()}. You can cancel before this date.`);
        onClose();
      } else {
        alert('Account deleted successfully. You will now be logged out.');
        await onLogout();
        onDeleteComplete();
      }

    } catch (error) {
      console.error('Deletion failed:', error);
      alert(`Deletion failed: ${error.message}`);
      setStep(useGracePeriod ? 'grace-period' : 'confirmation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <Dialog title="Checking Account Status" onClose={onClose}>
        <div style={styles.dialogContent}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Validating account deletion requirements...</p>
          </div>
        </div>
      </Dialog>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <Dialog title="Error" onClose={onClose}>
        <div style={styles.dialogContent}>
          <div style={styles.errorBox}>
            <p>Unable to process deletion request. Please try again or contact support.</p>
          </div>
          <div style={styles.dialogButtons}>
            <button style={styles.cancelButton} onClick={onClose}>Close</button>
          </div>
        </div>
      </Dialog>
    );
  }

  // Already scheduled for deletion
  if (step === 'scheduled') {
    return (
      <Dialog title="Account Deletion Scheduled" onClose={onClose}>
        <div style={styles.dialogContent}>
          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>Deletion Scheduled</h4>
            <p>Your account is scheduled for deletion on:</p>
            <p style={styles.deletionDate}>
              {deletionStatus.scheduledDeletionDate ? 
                new Date(deletionStatus.scheduledDeletionDate).toLocaleDateString() : 
                'Date unavailable'}
            </p>
            <p>Reason: {deletionStatus.deletionReason}</p>
          </div>

          {deletionStatus.canCancel && (
            <div style={styles.actionSection}>
              <h4>Cancel Deletion</h4>
              <p>You can cancel the deletion and restore your account:</p>
              <button
                style={styles.cancelDeletionButton}
                onClick={handleCancelScheduledDeletion}
                disabled={isProcessing}
              >
                {isProcessing ? 'Cancelling...' : 'Cancel Account Deletion'}
              </button>
            </div>
          )}
        </div>
      </Dialog>
    );
  }

  // Blocked from deletion
  if (step === 'blocked') {
    return (
      <Dialog title="Cannot Delete Account" onClose={onClose}>
        <div style={styles.dialogContent}>
          <div style={styles.errorBox}>
            <h4 style={styles.errorTitle}>Account Deletion Blocked</h4>
            <p>The following issues must be resolved before deletion:</p>
            <ul style={styles.blockerList}>
              {validationResult?.blockers?.map((blocker, index) => (
                <li key={index}>{blocker}</li>
              ))}
            </ul>
          </div>
          
          <div style={styles.dialogButtons}>
            <button style={styles.cancelButton} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  // Warning step
  if (step === 'warning') {
    return (
      <Dialog title="Delete Account" onClose={onClose}>
        <div style={styles.dialogContent}>
            <div style={styles.dangerBoxFixed}>
            <h4 style={styles.dangerTitleFixed}>Warning: Permanent Action</h4>
            
            <p style={styles.warningTextFixed}>
                Deleting your account will permanently:
            </p>
            
            <div style={styles.consequenceListFixed}>
                <div style={styles.consequenceItemFixed}>• Remove all your personal data and settings</div>
                <div style={styles.consequenceItemFixed}>• Delete your survey responses and analytics</div>
                <div style={styles.consequenceItemFixed}>• Remove your activity history and logs</div>
                <div style={styles.consequenceItemFixed}>• Invalidate all active sessions</div>
                <div style={styles.consequenceItemFixed}>• Cancel any active subscriptions</div>
            </div>
            </div>

          {validationResult?.warnings?.length > 0 && (
            <div style={styles.warningBox}>
              <h4 style={styles.warningTitle}>Additional Considerations:</h4>
              <ul style={styles.warningList}>
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.gracePeriodSection}>
  <h4 style={styles.gracePeriodTitle}>Deletion Options</h4>
  
  <div style={styles.radioGroup}>
    <label style={styles.radioLabel}>
      <input
        type="radio"
        name="deletionType"
        checked={!useGracePeriod}
        onChange={() => setUseGracePeriod(false)}
        style={styles.radioInput}
      />
      <span style={styles.radioText}>
        Delete immediately (cannot be undone)
      </span>
    </label>
    
    <label style={styles.radioLabel}>
      <input
        type="radio"
        name="deletionType"
        checked={useGracePeriod}
        onChange={() => setUseGracePeriod(true)}
        style={styles.radioInput}
      />
      <span style={styles.radioText}>
        Schedule deletion with grace period (recommended)
      </span>
    </label>
  </div>
  
  {useGracePeriod && (
    <div style={styles.gracePeriodControls}>
      <p style={styles.gracePeriodDescription}>
        Your account will be scheduled for deletion. You can cancel anytime before the deletion date.
      </p>
      <div style={styles.gracePeriodSelect}>
        <label style={styles.selectLabel}>Grace period: </label>
        <select 
          value={gracePeriodDays} 
          onChange={(e) => setGracePeriodDays(Number(e.target.value))}
          style={styles.selectInput}
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days (recommended)</option>
        </select>
      </div>
    </div>
  )}
</div>


          <div style={styles.dialogButtons}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button 
              style={styles.proceedButton} 
              onClick={() => setStep(useGracePeriod ? 'grace-period' : 'confirmation')}
            >
              Continue
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  // Grace period confirmation
  if (step === 'grace-period') {
    return (
      <Dialog title="Schedule Account Deletion" onClose={onClose}>
        <div style={styles.dialogContent}>
          <div style={styles.scheduleBox}>
            <h4 style={styles.scheduleTitle}>Deletion will be scheduled for:</h4>
            <p style={styles.scheduleDate}>
              {new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
            <p style={styles.scheduleDescription}>
              ({gracePeriodDays} days from now)
            </p>
          </div>

          <div style={styles.graceBenefits}>
            <h4>During the grace period:</h4>
            <ul style={styles.benefitsList}>
              <li>Your account remains fully functional</li>
              <li>You can cancel deletion anytime</li>
              <li>You'll receive reminder notifications</li>
              <li>All data remains intact until deletion date</li>
            </ul>
          </div>

          <div style={styles.dialogButtons}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button 
              style={styles.scheduleButton}
              onClick={handleFinalDeletion}
              disabled={isProcessing}
            >
              {isProcessing ? 'Scheduling...' : 'Schedule Deletion'}
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  // Immediate deletion confirmation
  if (step === 'confirmation') {
    return (
      <Dialog title="Final Confirmation" onClose={onClose}>
        <div style={styles.dialogContent}>
          <div style={styles.finalWarning}>
            <h4 style={styles.finalWarningTitle}>Immediate Account Deletion</h4>
            <p>Your account will be permanently deleted immediately. This action cannot be undone.</p>
          </div>

          <div style={styles.confirmationSection}>
            <label style={styles.confirmationLabel}>
              Type "{expectedConfirmText}" to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              style={styles.confirmationInput}
              placeholder={expectedConfirmText}
              autoComplete="off"
            />
          </div>

          <div style={styles.dialogButtons}>
            <button style={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button 
              style={{
                ...styles.deleteButton,
                ...(confirmationText !== expectedConfirmText ? styles.disabledButton : {})
              }}
              onClick={handleFinalDeletion}
              disabled={confirmationText !== expectedConfirmText || isProcessing}
            >
              Delete Account Now
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  // Processing step
  if (step === 'processing') {
    return (
      <Dialog title="Processing..." onClose={() => {}}>
        <div style={styles.dialogContent}>
          <div style={styles.processingState}>
            <div style={styles.spinner}></div>
            <h4>
              {useGracePeriod ? 'Scheduling account deletion...' : 'Deleting your account...'}
            </h4>
            <p>Please do not close this window.</p>
          </div>
        </div>
      </Dialog>
    );
  }

  return null;
}

// Helper Dialog component
function Dialog({ title, children, onClose }) {
  return (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogContainer}>
        <div style={styles.dialogHeader}>
          <h3 style={styles.dialogTitle}>{title}</h3>
          {onClose && (
            <button
              style={styles.dialogCloseButton}
              onClick={onClose}
              aria-label="Close dialog"
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// Comprehensive styles
const styles = {
  dialogOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  dialogContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    maxWidth: 600,
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  dialogCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: 24,
    color: '#6b7280',
    cursor: 'pointer',
    padding: 0,
  },
  dialogContent: {
    padding: '20px',
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px auto',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #f87171',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  blockerList: {
    color: '#dc2626',
    margin: '8px 0',
    paddingLeft: 20,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    border: '1px solid #3b82f6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    color: '#1d4ed8',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  deletionDate: {
    fontSize: 18,
    fontWeight: 700,
    color: '#dc2626',
    margin: '8px 0',
  },
  actionSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  cancelDeletionButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  },
dangerBoxFixed: {
    backgroundColor: '#fef2f2',
    border: '2px solid #dc2626',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
  },
  
  dangerTitleFixed: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 12px 0',
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  
  warningTextFixed: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: 600,
    margin: '0 0 12px 0',
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    lineHeight: 1.5,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  
  consequenceListFixed: {
    margin: '12px 0',
    padding: 0,
    display: 'block',
    width: '100%',
  },
  
  consequenceItemFixed: {
    color: '#dc2626',
    fontSize: 14,
    lineHeight: 1.6,
    margin: '8px 0',
    padding: '4px 0',
    display: 'block',
    visibility: 'visible',
    opacity: 1,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: 400,
    textAlign: 'left',
    whiteSpace: 'normal',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    color: '#d97706',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  warningList: {
    color: '#d97706',
    margin: '8px 0',
    paddingLeft: 20,
  },
gracePeriodSection: {
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
  },
  gracePeriodTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1f2937', // Explicit dark color
    margin: '0 0 16px 0',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
    padding: '8px 0',
  },
  radioInput: {
    width: 16,
    height: 16,
    marginRight: 12,
    marginTop: 2, // Align with first line of text
    cursor: 'pointer',
    accentColor: '#2563eb', // Modern radio button styling
  },
  radioText: {
    fontSize: 14,
    color: '#374151', // Explicit text color
    lineHeight: 1.5,
    fontWeight: 500,
    display: 'block', // Ensure it's visible
  },
  gracePeriodControls: {
    marginTop: 16,
    paddingLeft: 28, // Indent to align with radio text
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 6,
    border: '1px solid #bae6fd',
  },
  gracePeriodDescription: {
    fontSize: 13,
    color: '#0f172a', // Dark color for visibility
    marginBottom: 12,
    lineHeight: 1.4,
  },
  gracePeriodSelect: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  selectLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: 500,
  },
  selectInput: {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: 4,
    fontSize: 13,
    color: '#374151',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
  },
  scheduleBox: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#0c4a6e',
    margin: '0 0 8px 0',
  },
  scheduleDate: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0369a1',
    margin: '8px 0',
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#0369a1',
    margin: 0,
  },
  graceBenefits: {
    marginBottom: 16,
  },
  benefitsList: {
    color: '#374151',
    lineHeight: 1.6,
    paddingLeft: 20,
  },
  finalWarning: {
    backgroundColor: '#450a0a',
    color: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  finalWarningTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 700,
    margin: '0 0 8px 0',
  },
  confirmationSection: {
    marginBottom: 16,
  },
  confirmationLabel: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: '#374151',
  },
  confirmationInput: {
    width: '100%',
    padding: 12,
    border: '2px solid #dc2626',
    borderRadius: 6,
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
    textTransform: 'uppercase',
    boxSizing: 'border-box',
  },
  processingState: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  dialogButtons: {
    display: 'flex',
    gap: 12,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  proceedButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  scheduleButton: {
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

export default AdvancedDeleteAccountDialog;