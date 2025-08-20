// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate  } from 'react-router-dom';

import LandingPage       from './LandingPage';
import QuestionsPage     from './QuestionsPage';
import ResultsPage       from './ResultsPage';
import CalculatingPage   from './CalculatingPage';
import DashboardPage     from './DashboardPage';
import RegistrationPage  from './RegistrationPage';
import SurveyPage        from './SurveyPage';
import LoginPage         from './LoginPage';
import ProfilePage       from './ProfilePage';
import SettingsPage      from './SettingsPage';
import AdminPage         from './Admin/AdminPage';
import PersonalPage       from './PersonalPage';
import ActionItemsPage from './ActionItemsPage';

// Stellar wallet components
import ConnectWallet     from './components/ConnectWallet';
import Trustline         from './components/Trustline';
import TransferSzup      from './components/TransferSzup';
import IssueSzup         from './components/debuggin/IssueSzup';
import DebugStellar      from './components/debuggin/DebugStellar';
import SelfIssueSzup     from './components/debuggin/SelfIssueSzup';
import TestTransferSetup from './components/debuggin/TestTransferSetup';
import DebugAuthIssue    from './components/debuggin/DebugAuthIssue';
import FixUndefinedSZUP  from './components/debuggin/FiextUndefiedSzup';
import AnalyzeTransactionXDR from './components/debuggin/AnalyzeTransactionXDR';
import Debug400SubmissionError from './components/debuggin/Debug404';
 
import FinalDiagnostic   from './components/debuggin/FinalDiagnostic';
import FreighterAccountMismatch from './components/debuggin/FreighterAccountMismatch';
import SimpleAccountFix  from './components/debuggin/SimpleFix';
import AccountMismatchConfirmed from './components/debuggin/AccountMismatchConfirmed';

// >>> Firebase Auth bits
import { AuthProvider } from './contexts/AuthContext';
import RequireAdmin from './routes/RequireAdmin';
import SzupAdmin from './components/admin/SzupAdmin';
import AdminLogin from './components/admin/AdminLogin';

 

// add this small component above `const App = () => { ... }`
function PersonalPageRoute() {
  const navigate = useNavigate();
  return (
    <PersonalPage
      onViewResults={() => navigate('/results')}
      onNotifications={() => alert('Open notifications settings')}
      onCameraMicrophone={() => alert('Open camera & microphone settings')}
      onOpenJDVM={() => window.open('https://your-domain/jdvm', '_blank')}
      onOpenPrivacy={() => window.open('https://your-domain/privacy', '_blank')}
      onOpenTOS={() => window.open('https://your-domain/terms', '_blank')}
      onEditAccount={() => navigate('/profile')}
      onWithdrawConsentConfirm={async (next) =>
        next ? window.confirm('Withdraw consent?') : true
      }
    />
  );
}

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public pages */}
          <Route path="/"            element={<LandingPage />} />
          <Route path="/questions"   element={<QuestionsPage />} />
          <Route path="/results"     element={<ResultsPage />} />
          <Route path="/calculating" element={<CalculatingPage />} />
          <Route path="/survey"      element={<SurveyPage />} />
          <Route path="/register"    element={<RegistrationPage />} />
          <Route path="/login"       element={<LoginPage />} />

          {/* User pages (not admin-protected here) */}
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/profile"     element={<ProfilePage />} />
          <Route path="/settings"    element={<SettingsPage />} />
          <Route path="/personal"    element={<PersonalPage />} />
          <Route path="/action-items" element={<ActionItemsPage />} />


          {/* (Optional) keep your old admin UI on a different path */}
          <Route path="/legacy-admin" element={<AdminPage />} />

          {/* Admin auth routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <SzupAdmin />
              </RequireAdmin>
            }
          />

          {/* Stellar wallet routes */}
          <Route path="/wallet/connect"     element={<ConnectWallet />} />
          <Route path="/wallet/trustline"   element={<Trustline />} />
          <Route path="/wallet/transfer"    element={<TransferSzup />} />
          <Route path="/wallet/issue"       element={<IssueSzup />} />
          <Route path="/wallet/selfissue"   element={<SelfIssueSzup />} />
          <Route path="/wallet/debug"       element={<DebugStellar />} />
          <Route path="/wallet/testTransfer" element={<TestTransferSetup />} />
          <Route path="/wallet/debugAuth"   element={<DebugAuthIssue />} />
          <Route path="/wallet/fix"         element={<FixUndefinedSZUP />} />
          <Route path="/wallet/analyzeXDR"  element={<AnalyzeTransactionXDR />} />
          <Route path="/wallet/debug404"    element={<Debug400SubmissionError />} />
        
 
          <Route path="/wallet/finalDiag"   element={<FinalDiagnostic />} />
          <Route path="/wallet/freighterAccount" element={<FreighterAccountMismatch />} />
          <Route path="/wallet/simpleFix"   element={<SimpleAccountFix />} />
          <Route path="/wallet/accountMismatch" element={<AccountMismatchConfirmed />} />



    


          {/* Catch-all → redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
