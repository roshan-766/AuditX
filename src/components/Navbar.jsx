import React, { useState, useEffect } from 'react';
import { Shield, User, LogOut, Moon, Sun, Lock, Unlock, Database, Download, RefreshCw, KeyRound } from 'lucide-react';
import { getCurrentUser, logout, exportAuditFile } from '../services/storage';

export const Navbar = ({ currentRole, onRoleSwitch, onOpenProfile, onOpenLogin, activeAudit }) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, [currentRole]);

  // Handle Screen Wake Lock API
  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        if (!wakeLockActive) {
          const sentinel = await navigator.wakeLock.request('screen');
          setWakeLockSentinel(sentinel);
          setWakeLockActive(true);
          sentinel.addEventListener('release', () => {
            setWakeLockActive(false);
            setWakeLockSentinel(null);
          });
        } else {
          if (wakeLockSentinel) {
            await wakeLockSentinel.release();
          }
          setWakeLockActive(false);
          setWakeLockSentinel(null);
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    } else {
      alert('Screen Wake Lock is not supported on this browser.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'chairman':
        return { text: 'Chairman Sir', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'admin':
        return { text: 'Admin', color: 'bg-red-500/20 text-red-400 border-red-500/40' };
      default:
        return { text: 'Auditor', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    }
  };

  const badge = getRoleBadge(currentRole);

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-3 py-2.5 sm:px-6 flex items-center justify-between">
      {/* Brand & Active Audit Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-lg bg-jcb-yellow flex items-center justify-center font-black text-neutral-950 text-xl tracking-tighter shadow-md shadow-jcb-yellow/20">
            AX
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">AuditX</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-jcb-yellow px-1 py-0.5 rounded bg-jcb-yellow/10">
                PRO
              </span>
            </div>
            {activeAudit ? (
              <p className="text-xs text-neutral-400 font-medium truncate max-w-[140px] sm:max-w-xs">
                {activeAudit.storeName} ({activeAudit.whseCode})
              </p>
            ) : (
              <p className="text-[11px] text-neutral-500">JCB Parts Audit System</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2">
        {/* Screen Stay Awake Toggle */}
        <button
          onClick={toggleWakeLock}
          title={wakeLockActive ? 'Screen will stay awake' : 'Enable screen stay-awake'}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition active-press ${
            wakeLockActive
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm'
              : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
        >
          {wakeLockActive ? <Unlock size={14} className="text-amber-400 animate-pulse" /> : <Lock size={14} />}
          <span className="hidden sm:inline">{wakeLockActive ? 'Awake: ON' : 'Keep Awake'}</span>
        </button>

        {/* Quick Backup Snapshot */}
        {activeAudit && (
          <button
            onClick={() => exportAuditFile(activeAudit)}
            title="Download emergency backup snapshot (.auditx)"
            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700 hover:text-jcb-yellow active-press"
          >
            <Download size={16} />
          </button>
        )}

        {/* Role Pill */}
        <button
          onClick={onOpenLogin}
          title="Click to Switch Portal"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition active-press ${badge.color}`}
        >
          <Shield size={12} />
          <span>{badge.text}</span>
          <RefreshCw size={10} className="opacity-60" />
        </button>

        {/* Profile / Menu */}
        <button
          onClick={onOpenProfile}
          title="Auditor Profile & Password"
          className="p-1.5 rounded-lg bg-neutral-800/90 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 active-press"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
};
