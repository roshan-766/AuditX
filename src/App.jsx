import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { AuditorView } from './components/AuditorView';
import { PhysicalAuditCockpit } from './components/PhysicalAuditCockpit';
import { IssueResolutionCockpit } from './components/IssueResolutionCockpit';
import { ChairmanView } from './components/ChairmanView';
import { AdminView } from './components/AdminView';
import { 
  initStorage, getCurrentUser, getAudits, getActiveAuditId, 
  setActiveAuditId, saveAudit 
} from './services/storage';

export function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('auditor');
  const [audits, setAudits] = useState([]);
  const [activeAudit, setActiveAudit] = useState(null);
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'issues' | 'executive' | 'settings'

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    initStorage().then(() => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentRole(user.role || 'auditor');
        if (user.role === 'chairman') setActiveTab('executive');
        else if (user.role === 'admin') setActiveTab('settings');
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
      setActiveAudit(found || (list.length > 0 ? list[0] : null));
    } else if (list.length > 0 && !activeAudit) {
      setActiveAudit(list[0]);
    }
  };

  const handleSelectAudit = (audit) => {
    setActiveAudit(audit);
    setActiveAuditId(audit ? audit.id : null);
    setActiveTab('audit');
  };

  const handleUpdateAudit = (updatedAudit) => {
    saveAudit(updatedAudit);
    setActiveAudit(updatedAudit);
    refreshAudits();
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentRole(user.role || 'auditor');
    if (user.role === 'chairman') setActiveTab('executive');
    else if (user.role === 'admin') setActiveTab('settings');
    else setActiveTab('audit');
    refreshAudits();
  };

  // Calculate discrepancies for badge
  const mismatchCount = activeAudit?.items?.filter(
    (i) => i.status === 'shortage' || i.status === 'excess'
  ).length || 0;

  return (
    <div className="min-h-screen bg-black flex justify-center selection:bg-amber-400 selection:text-neutral-950">
      {/* Mobile-Only Application Shell */}
      <div className="w-full max-w-md min-h-screen bg-neutral-950 flex flex-col relative border-x border-neutral-900 shadow-2xl">
        {/* Native Mobile Header */}
        <Navbar
          currentRole={currentRole}
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          activeAudit={activeAudit}
        />

        {/* Tab View Routing */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'audit' && (
            <AuditorView
              audits={audits}
              activeAudit={activeAudit}
              activeTab={activeTab}
              onSelectAudit={handleSelectAudit}
              onUpdateAudit={handleUpdateAudit}
              onRefreshAudits={refreshAudits}
            />
          )}

          {activeTab === 'issues' && (
            activeAudit ? (
              <IssueResolutionCockpit
                audit={activeAudit}
                onUpdateItem={(updatedItem) => {
                  const items = activeAudit.items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
                  handleUpdateAudit({ ...activeAudit, items });
                }}
              />
            ) : (
              <div className="text-center py-20 px-4 text-xs text-neutral-400">
                Please select or start an audit to review issues.
              </div>
            )
          )}

          {activeTab === 'executive' && (
            activeAudit ? (
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
              <div className="text-center py-20 px-4 text-xs text-neutral-400">
                No audits saved. Please start an audit first.
              </div>
            )
          )}

          {activeTab === 'settings' && (
            <AdminView
              onAuditChanged={refreshAudits}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenLogin={() => setIsLoginOpen(true)}
            />
          )}
        </main>

        {/* Native Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mismatchCount={mismatchCount}
          currentRole={currentRole}
        />

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
    </div>
  );
}

export default App;
