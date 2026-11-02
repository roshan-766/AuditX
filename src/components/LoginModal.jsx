import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, X, CheckCircle, ArrowRight } from 'lucide-react';
import { login } from '../services/storage';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState('auditor');
  const [username, setUsername] = useState('auditor');
  const [password, setPassword] = useState('audit123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'auditor') {
      setUsername('auditor');
      setPassword('audit123');
    } else if (role === 'chairman') {
      setUsername('chairman');
      setPassword('chair123');
    } else if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = login(username, password);
    if (res.success) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setError(res.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-neutral-800/80 to-neutral-900 border-b border-neutral-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center space-x-2 text-jcb-yellow mb-1.5">
            <Shield size={22} />
            <h2 className="text-xl font-black tracking-tight text-white">Select Portal & Login</h2>
          </div>
          <p className="text-xs text-neutral-400">
            AuditX Role-Based Access Control — Choose your authorization portal.
          </p>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 mt-4 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => handleRoleSelect('auditor')}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition active-press ${
                selectedRole === 'auditor'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Auditor
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('chairman')}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition active-press ${
                selectedRole === 'chairman'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Chairman
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition active-press ${
                selectedRole === 'admin'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3.5 text-neutral-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition font-medium"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-neutral-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow transition font-medium"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-neutral-500 hover:text-neutral-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Quick Demo Credentials Pill */}
          <div className="pt-1">
            <span className="text-[11px] text-neutral-500 block mb-1">Pre-configured Demo Access:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleRoleSelect('auditor')}
                className="text-[10px] bg-neutral-800 text-emerald-400 px-2 py-1 rounded-md border border-neutral-700 font-mono hover:bg-neutral-700"
              >
                auditor / audit123
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('chairman')}
                className="text-[10px] bg-neutral-800 text-amber-400 px-2 py-1 rounded-md border border-neutral-700 font-mono hover:bg-neutral-700"
              >
                chairman / chair123
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className="text-[10px] bg-neutral-800 text-red-400 px-2 py-1 rounded-md border border-neutral-700 font-mono hover:bg-neutral-700"
              >
                admin / admin123
              </button>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-extrabold rounded-xl text-sm shadow-lg shadow-jcb-yellow/20 transition active-press"
            >
              <span>Sign In to {selectedRole.toUpperCase()}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
