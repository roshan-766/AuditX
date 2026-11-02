import React from 'react';
import { ClipboardCheck, AlertCircle, BarChart3, Settings } from 'lucide-react';

export const MobileBottomNav = ({ activeTab, onTabChange, mismatchCount = 0, currentRole }) => {
  const tabs = [
    {
      id: 'audit',
      label: 'Audit',
      icon: ClipboardCheck,
      badge: null
    },
    {
      id: 'issues',
      label: 'Issues',
      icon: AlertCircle,
      badge: mismatchCount > 0 ? mismatchCount : null,
      badgeColor: 'bg-red-500'
    },
    {
      id: 'executive',
      label: currentRole === 'chairman' ? 'Chairman' : 'Executive',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800/80 px-2 py-1 max-w-md mx-auto">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative active-press ${
                isActive ? 'text-amber-400' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                {tab.badge !== null && (
                  <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black font-mono text-white bg-red-500 shadow-sm leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-semibold tracking-tight ${isActive ? 'font-bold text-amber-400' : 'text-neutral-400'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
