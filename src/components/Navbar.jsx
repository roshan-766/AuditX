import React, { useState } from 'react';
import { Shield, Lock, Unlock, Download, ChevronDown } from 'lucide-react';
import { exportAuditFile } from '../services/storage';

export const Navbar = ({ currentRole, onOpenLogin, onOpenProfile, activeAudit }) => {
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState(null);

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
          if (wakeLockSentinel) await wakeLockSentinel.release();
          setWakeLockActive(false);
          setWakeLockSentinel(null);
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    } else {
      alert('Screen Wake Lock is not supported on this device.');
    }
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case 'chairman':
        return { label: 'Chairman', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'admin':
        return { label: 'Admin', color: 'bg-red-500/15 text-red-300 border-red-500/30' };
      default:
        return { label: 'Auditor', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  const roleConfig = getRoleConfig(currentRole);

  return (
    <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800/80 px-3.5 py-2.5 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        {/* Left: Brand & Branch */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center font-black text-neutral-950 text-sm tracking-tight shadow-sm">
            AX
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                {activeAudit ? activeAudit.storeName : 'AuditX Mobile'}
              </span>
              {activeAudit?.whseCode && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-bold border border-neutral-700/60">
                  {activeAudit.whseCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 font-medium leading-none mt-0.5">
              {activeAudit?.auditDate ? `Audit: ${activeAudit.auditDate}` : 'Parts Inventory System'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Screen Stay Awake */}
          <button
            onClick={toggleWakeLock}
            title={wakeLockActive ? 'Screen Stay-Awake: ON' : 'Keep Screen Awake'}
            className={`p-1.5 rounded-lg border text-xs transition active-press ${
              wakeLockActive
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
                : 'bg-neutral-800/90 text-neutral-400 border-neutral-700'
            }`}
          >
            {wakeLockActive ? <Unlock size={14} className="text-amber-400 animate-pulse" /> : <Lock size={14} />}
          </button>

          {/* Backup Button */}
          {activeAudit && (
            <button
              onClick={() => exportAuditFile(activeAudit)}
              title="Save Backup Snapshot (.auditx)"
              className="p-1.5 rounded-lg bg-neutral-800/90 text-neutral-300 border border-neutral-700 active-press hover:text-amber-400"
            >
              <Download size={14} />
            </button>
          )}

          {/* Role Switch Pill */}
          <button
            onClick={onOpenLogin}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition active-press ${roleConfig.color}`}
          >
            <Shield size={11} />
            <span>{roleConfig.label}</span>
            <ChevronDown size={11} className="opacity-60" />
          </button>
        </div>
      </div>
    </header>
  );
};
