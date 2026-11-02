import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { AuditorView } from './components/AuditorView';
import { ChairmanView } from './components/ChairmanView';
import { AdminView } from './components/AdminView';
import { 
  initStorage, getCurrentUser, getAudits, getActiveAuditId, 
  setActiveAuditId, getAudit, saveAudit 
} from './services/storage';

export function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('auditor');
  const [audits, setAudits] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    initStorage().then(() => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentRole(user.role || 'auditor');
      } else {
        // Default to auditor
        setCurrentRole('auditor');
      }
      refreshAudits();
    });
  }, []);

  const refreshAudits = () => {
    const list = getAudits();
    setAudits(list);
    const activeId = getActiveAuditId();
    if (activeId) {
      const found = list.find((a) => a.id === activeId);
      setActiveAudit(found || null);
    }
  };

  const handleSelectAudit = (audit) => {
    setActiveAudit(audit);
    setActiveAuditId(audit ? audit.id : null);
  };

  const handleUpdateAudit = (updatedAudit) => {
    saveAudit(updatedAudit);
    setActiveAudit(updatedAudit);
    refreshAudits();
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentRole(user.role || 'auditor');
    refreshAudits();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-jcb-yellow selection:text-neutral-950">
      {/* Top Application Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleSwitch={() => setIsLoginOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeAudit={activeAudit}
      />

      {/* Role View Routing */}
      <main className="flex-1">
        {currentRole === 'auditor' && (
          <AuditorView
            audits={audits}
            activeAudit={activeAudit}
            onSelectAudit={handleSelectAudit}
            onUpdateAudit={handleUpdateAudit}
            onRefreshAudits={refreshAudits}
          />
        )}

        {currentRole === 'chairman' && (
          <div className="py-4">
            {activeAudit ? (
              <ChairmanView
                audit={activeAudit}
                onUpdateAudit={handleUpdateAudit}
              />
            ) : audits.length > 0 ? (
              <ChairmanView
                audit={audits[0]}
                onUpdateAudit={handleUpdateAudit}
              />
            ) : (
              <div className="max-w-md mx-auto text-center py-20 px-4">
                <h3 className="text-lg font-black text-white mb-2">No Audits Available for Review</h3>
                <p className="text-xs text-neutral-400 mb-4">
                  Switch to Auditor mode to upload an SAP stock list and start an audit.
                </p>
                <button
                  onClick={() => setCurrentRole('auditor')}
                  className="px-4 py-2 bg-jcb-yellow text-neutral-950 font-bold text-xs rounded-xl"
                >
                  Switch to Auditor Portal
                </button>
              </div>
            )}
          </div>
        )}

        {currentRole === 'admin' && (
          <AdminView onAuditChanged={refreshAudits} />
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={() => setCurrentUser(getCurrentUser())}
      />
    </div>
  );
}

export default App;
