import React, { useState } from 'react';
import { 
  Shield, Users, Building, Database, Download, Upload, 
  Trash2, Plus, KeyRound, Check, RefreshCw, AlertCircle
} from 'lucide-react';
import { 
  getUsers, saveUsers, getBranches, saveBranches, 
  getAudits, deleteAudit, importAuditFile, exportAuditFile 
} from '../services/storage';

export const AdminView = ({ onAuditChanged }) => {
  const [activeSubTab, setActiveSubTab] = useState('audits'); // 'audits' | 'users' | 'branches' | 'backup'
  
  // Data states
  const [users, setUsers] = useState(getUsers());
  const [branches, setBranches] = useState(getBranches());
  const [audits, setAudits] = useState(getAudits());

  // Add User State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('auditor');
  const [userMsg, setUserMsg] = useState('');

  // Add Branch State
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchMsg, setBranchMsg] = useState('');

  const refreshData = () => {
    setUsers(getUsers());
    setBranches(getBranches());
    setAudits(getAudits());
    onAuditChanged();
  };

  // Add New User
  const handleAddUser = (e) => {
    e.preventDefault();
    setUserMsg('');
    if (users.some((u) => u.username.toLowerCase() === newUsername.toLowerCase())) {
      setUserMsg('Error: Username already exists!');
      return;
    }
    const updated = [
      ...users,
      {
        username: newUsername.trim(),
        password: newPassword.trim(),
        name: newName.trim(),
        role: newRole,
        designation: newRole === 'chairman' ? 'Chairman Sir' : newRole === 'admin' ? 'Admin' : 'Parts Internal Auditor',
        phone: '',
        signature: newName.trim()
      }
    ];
    saveUsers(updated);
    setUsers(updated);
    setNewUsername('');
    setNewPassword('');
    setNewName('');
    setUserMsg('User account created successfully!');
    setTimeout(() => setUserMsg(''), 3000);
  };

  // Delete User
  const handleDeleteUser = (username) => {
    if (username === 'admin' || username === 'auditor') {
      alert('System primary accounts cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user ${username}?`)) {
      const updated = users.filter((u) => u.username !== username);
      saveUsers(updated);
      setUsers(updated);
    }
  };

  // Add New Branch
  const handleAddBranch = (e) => {
    e.preventDefault();
    setBranchMsg('');
    const id = branchName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (branches.some((b) => b.id === id || b.code === branchCode)) {
      setBranchMsg('Error: Branch name or Warehouse code already exists!');
      return;
    }
    const updated = [...branches, { id, name: branchName.trim().toUpperCase(), code: branchCode.trim().toUpperCase() }];
    saveBranches(updated);
    setBranches(updated);
    setBranchName('');
    setBranchCode('');
    setBranchMsg('Branch store registered successfully!');
    setTimeout(() => setBranchMsg(''), 3000);
  };

  // Delete Branch
  const handleDeleteBranch = (id) => {
    if (confirm('Delete this branch?')) {
      const updated = branches.filter((b) => b.id !== id);
      saveBranches(updated);
      setBranches(updated);
    }
  };

  // Delete Audit
  const handleDeleteAudit = (id, name) => {
    if (confirm(`Permanently delete audit session "${name}"?`)) {
      deleteAudit(id);
      refreshData();
    }
  };

  // Handle Import Session File
  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const audit = await importAuditFile(file);
      alert(`Audit session "${audit.storeName}" imported successfully with ${audit.items?.length || 0} items!`);
      refreshData();
      e.target.value = '';
    } catch (err) {
      alert('Failed to import file: ' + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 py-4 pb-24 sm:px-4">
      {/* Admin Title */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 mb-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">System Admin Control Tower</h2>
            <p className="text-xs text-neutral-400">
              Manage Auditor & Chairman accounts, Branch master list, and system backups.
            </p>
          </div>
        </div>

        <button
          onClick={refreshData}
          className="p-2 bg-neutral-800 text-neutral-400 hover:text-white rounded-xl border border-neutral-700"
          title="Refresh All Data"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Admin Navigation Pills */}
      <div className="grid grid-cols-4 gap-2 p-1.5 bg-neutral-950 rounded-2xl border border-neutral-800 mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('audits')}
          className={`py-2 text-center rounded-xl transition ${
            activeSubTab === 'audits' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Audits ({audits.length})
        </button>
        <button
          onClick={() => setActiveSubTab('users')}
          className={`py-2 text-center rounded-xl transition ${
            activeSubTab === 'users' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveSubTab('branches')}
          className={`py-2 text-center rounded-xl transition ${
            activeSubTab === 'branches' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveSubTab('backup')}
          className={`py-2 text-center rounded-xl transition ${
            activeSubTab === 'backup' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Data Transfer
        </button>
      </div>

      {/* SUBTAB 1: AUDITS MANAGEMENT */}
      {activeSubTab === 'audits' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <h3 className="text-sm font-black text-white mb-3">All Stored Audits in Local Database</h3>
          {audits.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs">No audits saved in database yet.</div>
          ) : (
            <div className="space-y-2">
              {audits.map((a) => (
                <div key={a.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-white text-sm">
                      {a.storeName} ({a.whseCode})
                    </h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      {a.auditDate} | {a.items?.length || 0} items | Auditor: {a.auditors}
                    </p>
                    {a.chairmanApproved && (
                      <span className="text-[10px] text-emerald-400 font-bold">✓ Chairman Approved</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportAuditFile(a)}
                      title="Download Backup Snapshot (.auditx)"
                      className="p-2 bg-neutral-800 text-neutral-300 hover:text-jcb-yellow rounded-lg border border-neutral-700"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAudit(a.id, a.storeName)}
                      title="Delete this audit"
                      className="p-2 bg-neutral-800 text-neutral-400 hover:text-red-400 rounded-lg border border-neutral-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: USERS & ROLES */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User List */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3">System Accounts</h3>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.username} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-xs">{u.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-neutral-800 text-jcb-yellow">
                        {u.role.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">username: {u.username}</span>
                  </div>
                  {u.username !== 'admin' && u.username !== 'auditor' && (
                    <button
                      onClick={() => handleDeleteUser(u.username)}
                      className="p-1.5 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3">Create New Account</h3>
            {userMsg && (
              <div className={`p-2.5 text-xs rounded-xl mb-3 ${userMsg.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {userMsg}
              </div>
            )}
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                >
                  <option value="auditor">Auditor (Store field worker)</option>
                  <option value="chairman">Chairman (Executive approver)</option>
                  <option value="admin">Admin (System operator)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. S Siva Ganesh"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. sivaganesh"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="password123"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-jcb-yellow text-neutral-950 font-black text-xs rounded-xl transition active-press"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BRANCHES */}
      {activeSubTab === 'branches' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3">Branch Master List</h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {branches.map((b) => (
                <div key={b.id} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{b.name}</span>
                    <span className="text-[11px] text-neutral-500 font-mono ml-2">({b.code})</span>
                  </div>
                  <button onClick={() => handleDeleteBranch(b.id)} className="text-neutral-500 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <h3 className="text-sm font-black text-white mb-3">Add New Branch Store</h3>
            {branchMsg && (
              <div className={`p-2.5 text-xs rounded-xl mb-3 ${branchMsg.startsWith('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {branchMsg}
              </div>
            )}
            <form onSubmit={handleAddBranch} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Branch Store Name *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. TUTICORIN"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">SAP Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="e.g. DJ00045"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-jcb-yellow text-neutral-950 font-black text-xs rounded-xl transition active-press"
              >
                Register Branch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DATA TRANSFER & BACKUPS */}
      {activeSubTab === 'backup' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-sm font-black text-white mb-2 flex items-center space-x-2">
            <Database className="text-jcb-yellow" size={18} />
            <span>Zero-Cloud Phone-to-Laptop Data Transfer</span>
          </h3>
          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
            When your father finishes an audit on his mobile phone, he can export a snapshot file (<code className="text-jcb-yellow">.auditx</code>) and send it via WhatsApp or email. You can import that exact snapshot file here on your laptop to review, edit, and print!
          </p>

          <div className="p-6 bg-neutral-950 border-2 border-dashed border-neutral-800 rounded-2xl text-center">
            <Upload size={32} className="text-neutral-500 mx-auto mb-2" />
            <h4 className="font-bold text-white text-sm mb-1">Import AuditX Snapshot (.auditx or .json)</h4>
            <p className="text-xs text-neutral-500 mb-4">Click below to upload a session file transferred from phone</p>
            <label className="inline-block px-5 py-2.5 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black text-xs rounded-xl cursor-pointer shadow transition active-press">
              <span>Select .auditx File</span>
              <input type="file" accept=".auditx,.json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
