import React, { useState } from 'react';
import { X, User, KeyRound, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { getCurrentUser, updateProfile, changePassword } from '../services/storage';

export const ProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const user = getCurrentUser() || {};
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Profile Form State
  const [name, setName] = useState(user.name || '');
  const [designation, setDesignation] = useState(user.designation || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [signature, setSignature] = useState(user.signature || '');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  if (!isOpen) return null;

  const handleProfileSave = (e) => {
    e.preventDefault();
    const res = updateProfile(user.username, { name, designation, phone, signature });
    if (res.success) {
      setProfileSuccess('Profile saved successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
      onProfileUpdated();
    }
  };

  const handlePasswordSave = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    const res = changePassword(user.username, oldPassword, newPassword);
    if (res.success) {
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } else {
      setPasswordError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="text-jcb-yellow" size={20} />
            <h3 className="font-extrabold text-lg text-white">Account & Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 bg-neutral-950 border-b border-neutral-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 text-center rounded-lg transition active-press ${
              activeTab === 'profile' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Auditor Details
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 text-center rounded-lg transition active-press ${
              activeTab === 'password' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSave} className="p-6 space-y-4">
            {profileSuccess && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center space-x-2">
                <Check size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Username (Immutable)</label>
              <input
                type="text"
                disabled
                value={user.username || ''}
                className="w-full px-3.5 py-2 bg-neutral-950/60 border border-neutral-800 rounded-xl text-xs text-neutral-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Auditor / User Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Internal Parts Auditor"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98421 XXXXX"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Report Signature Label</label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g. V. Arumugam"
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black rounded-xl text-sm transition active-press"
              >
                Save Profile Details
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
            {passwordError && (
              <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center space-x-2">
                <Check size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black rounded-xl text-sm transition active-press"
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
