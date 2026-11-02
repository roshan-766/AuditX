import React, { useState } from 'react';
import { 
  Shield, Users, Building, Database, Download, Upload, 
  Trash2, Plus, KeyRound, User, ChevronRight, LogOut
} from 'lucide-react';
import { 
  getUsers, saveUsers, getBranches, saveBranches, 
  getAudits, deleteAudit, importAuditFile, exportAuditFile,
  getCurrentUser, logout
} from '../services/storage';

export const AdminView = ({ onAuditChanged, onOpenProfile, onOpenLogin }) => {
  const currentUser = getCurrentUser() || {};
  const [activeSubTab, setActiveSubTab] = useState('menu'); // 'menu' | 'users' | 'branches' | 'backup'
  
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
    setUserMsg('User created successfully!');
    setTimeout(() => setUserMsg(''), 2500);
  };

  const handleDeleteUser = (username) => {
    if (username === 'admin' || username === 'auditor') {
      alert('System primary accounts cannot be deleted.');
      return;
    }
    if (confirm(`Delete user ${username}?`)) {
      const updated = users.filter((u) => u.username !== username);
      saveUsers(updated);
      setUsers(updated);
    }
  };

  const handleAddBranch = (e) => {
    e.preventDefault();
    setBranchMsg('');
    const id = branchName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (branches.some((b) => b.id === id || b.code === branchCode)) {
      setBranchMsg('Error: Branch name or code already exists!');
      return;
    }
    const updated = [...branches, { id, name: branchName.trim().toUpperCase(), code: branchCode.trim().toUpperCase() }];
    saveBranches(updated);
    setBranches(updated);
    setBranchName('');
    setBranchCode('');
    setBranchMsg('Branch added!');
    setTimeout(() => setBranchMsg(''), 2500);
  };

  const handleDeleteBranch = (id) => {
    if (confirm('Delete this branch?')) {
      const updated = branches.filter((b) => b.id !== id);
      saveBranches(updated);
      setBranches(updated);
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const audit = await importAuditFile(file);
      alert(`Audit "${audit.storeName}" imported successfully!`);
      refreshData();
      e.target.value = '';
    } catch (err) {
      alert('Failed to import file: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto px-3.5 pt-3 pb-24 font-sans space-y-3">
      {/* User Profile Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-lg">
            {currentUser.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{currentUser.name || 'Auditor'}</h3>
            <p className="text-xs text-neutral-400 font-mono capitalize">{currentUser.role} Portal</p>
          </div>
        </div>

        <button
          onClick={onOpenProfile}
          className="text-xs font-bold text-amber-400 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 active-press"
        >
          Profile
        </button>
      </div>

      {/* Main Settings Menu */}
      {activeSubTab === 'menu' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl divide-y divide-neutral-800/80 overflow-hidden shadow-sm text-xs">
          <button
            onClick={onOpenLogin}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/40 active-press"
          >
            <div className="flex items-center space-x-3">
              <Shield size={18} className="text-amber-400" />
              <div>
                <span className="font-bold text-white block">Switch Portal</span>
                <span className="text-[11px] text-neutral-500">Auditor, Chairman, or Admin</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={() => setActiveSubTab('backup')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/40 active-press"
          >
            <div className="flex items-center space-x-3">
              <Database size={18} className="text-emerald-400" />
              <div>
                <span className="font-bold text-white block">Data Transfer & Import</span>
                <span className="text-[11px] text-neutral-500">Transfer audit from phone to laptop</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/40 active-press"
          >
            <div className="flex items-center space-x-3">
              <Users size={18} className="text-blue-400" />
              <div>
                <span className="font-bold text-white block">Manage Users ({users.length})</span>
                <span className="text-[11px] text-neutral-500">Add or remove auditor accounts</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>

          <button
            onClick={() => setActiveSubTab('branches')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-800/40 active-press"
          >
            <div className="flex items-center space-x-3">
              <Building size={18} className="text-amber-400" />
              <div>
                <span className="font-bold text-white block">Branch Stores ({branches.length})</span>
                <span className="text-[11px] text-neutral-500">Manage branch warehouse codes</span>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>
        </div>
      )}

      {/* SUBTAB: DATA TRANSFER */}
      {activeSubTab === 'backup' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h4 className="font-bold text-sm text-white">Import / Transfer Audit Session</h4>
            <button onClick={() => setActiveSubTab('menu')} className="text-xs text-neutral-400">Back</button>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Send the <code className="text-amber-400 font-mono">.auditx</code> file from phone via WhatsApp or email, then select it below:
          </p>

          <label className="block p-6 bg-neutral-950 border border-dashed border-neutral-700 rounded-2xl text-center cursor-pointer active-press">
            <Upload size={28} className="text-neutral-500 mx-auto mb-2" />
            <span className="text-xs font-bold text-amber-400 block mb-1">Select .auditx File</span>
            <span className="text-[10px] text-neutral-500">Restores audit session instantly</span>
            <input type="file" accept=".auditx,.json" onChange={handleFileImport} className="hidden" />
          </label>
        </div>
      )}

      {/* SUBTAB: USERS */}
      {activeSubTab === 'users' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h4 className="font-bold text-sm text-white">System Accounts</h4>
            <button onClick={() => setActiveSubTab('menu')} className="text-xs text-neutral-400">Back</button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {users.map((u) => (
              <div key={u.username} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{u.name}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{u.username} • {u.role}</span>
                </div>
                {u.username !== 'admin' && u.username !== 'auditor' && (
                  <button onClick={() => handleDeleteUser(u.username)} className="text-neutral-500 hover:text-red-400 p-1">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddUser} className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
            <span className="font-bold text-white text-xs block">Add New Account</span>
            {userMsg && <div className="text-emerald-400 text-[11px]">{userMsg}</div>}
            <input
              type="text"
              required
              placeholder="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white"
            />
            <input
              type="text"
              required
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white"
            />
            <button type="submit" className="w-full py-2 bg-amber-400 text-neutral-950 font-black rounded-xl">
              Create User
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB: BRANCHES */}
      {activeSubTab === 'branches' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <h4 className="font-bold text-sm text-white">Branch Stores Master</h4>
            <button onClick={() => setActiveSubTab('menu')} className="text-xs text-neutral-400">Back</button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {branches.map((b) => (
              <div key={b.id} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{b.name}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Whse: {b.code}</span>
                </div>
                <button onClick={() => handleDeleteBranch(b.id)} className="text-neutral-500 hover:text-red-400 p-1">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddBranch} className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
            <span className="font-bold text-white text-xs block">Add Branch Store</span>
            {branchMsg && <div className="text-emerald-400 text-[11px]">{branchMsg}</div>}
            <input
              type="text"
              required
              placeholder="Branch Name (e.g. TUTICORIN)"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white"
            />
            <input
              type="text"
              required
              placeholder="Warehouse Code (e.g. DJ00045)"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-white font-mono"
            />
            <button type="submit" className="w-full py-2 bg-amber-400 text-neutral-950 font-black rounded-xl">
              Save Branch
            </button>
          </form>
        </div>
      )}

      {/* App Version Stamp */}
      <div className="text-center pt-2">
        <span className="text-[10px] text-neutral-600 font-mono font-bold tracking-wider uppercase">
          AuditX Mobile • v1.0.0 Production Release
        </span>
      </div>
    </div>
  );
};
