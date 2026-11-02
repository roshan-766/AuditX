import React, { useState } from 'react';
import { 
  Building2, FileSpreadsheet, FileText, Stamp, 
  TrendingDown, TrendingUp, CheckCircle2, ShieldCheck, 
  ChevronRight, ClipboardCheck
} from 'lucide-react';
import { generateAuditWorkbook } from '../services/excelExport';
import { generateAuditPDF } from '../services/pdfExport';

export const ChairmanView = ({ audit, onUpdateAudit }) => {
  const items = audit?.items || [];

  const shortageItems = items.filter((i) => i.status === 'shortage');
  const excessItems = items.filter((i) => i.status === 'excess');
  const matchedItems = items.filter((i) => i.status === 'matched');

  const shortageValue = shortageItems.reduce((acc, i) => acc + (i.shortage * (i.mrp || 0)), 0);
  const excessValue = excessItems.reduce((acc, i) => acc + (i.excess * (i.mrp || 0)), 0);
  const totalStockValue = items.reduce((acc, i) => acc + (i.stock * (i.mrp || 0)), 0);

  const matchPercent = items.length > 0 ? ((matchedItems.length / items.length) * 100).toFixed(1) : 0;

  const handleApprove = () => {
    const isApproved = !audit.chairmanApproved;
    onUpdateAudit({
      ...audit,
      chairmanApproved: isApproved,
      approvedAt: isApproved ? new Date().toISOString() : null,
      approvedBy: isApproved ? 'Chairman & Managing Director' : null
    });
  };

  const handleChecklistToggle = (id, newStatus) => {
    const checklist = (audit.checklist || []).map((c) => {
      if (c.id === id) return { ...c, status: newStatus };
      return c;
    });
    onUpdateAudit({ ...audit, checklist });
  };

  return (
    <div className="max-w-md mx-auto px-3.5 pt-3 pb-24 font-sans space-y-3.5">
      {/* 1. Executive Title & Approval Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-sm">
        <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mb-1">
          <Building2 size={14} className="text-amber-400" />
          <span className="font-semibold uppercase tracking-wider">{audit.companyName || 'JAYARAJ AUTOMOBILE AGENCY'}</span>
        </div>

        <h2 className="text-xl font-black text-white tracking-tight mb-0.5">
          {audit.storeName} Audit Sign-Off
        </h2>
        <p className="text-xs text-neutral-400 mb-3 font-mono">
          Whse: <strong className="text-white">{audit.whseCode}</strong> | Date: <strong className="text-white">{audit.auditDate}</strong>
        </p>

        {/* Approval Button */}
        <button
          onClick={handleApprove}
          className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 transition active-press ${
            audit.chairmanApproved
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-amber-400 text-neutral-950 hover:bg-amber-500 shadow-md'
          }`}
        >
          <Stamp size={16} />
          <span>{audit.chairmanApproved ? '✓ APPROVED & DIGITALLY SEALED' : 'Approve & Sign-Off Audit'}</span>
        </button>

        {audit.chairmanApproved && (
          <p className="text-[10px] text-emerald-400 font-mono text-center mt-2">
            Signed by Chairman Sir on {new Date(audit.approvedAt).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* 2. Key Executive Financial Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-0.5">
            System Stock Value
          </span>
          <div className="text-lg font-black font-mono text-white">
            ₹{totalStockValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">{items.length} Lines Audited</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-0.5">
            Match Accuracy
          </span>
          <div className="text-lg font-black font-mono text-emerald-400">
            {matchPercent}%
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">{matchedItems.length} Matched</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-0.5 flex items-center space-x-1">
            <TrendingDown size={11} />
            <span>Shortage Value</span>
          </span>
          <div className="text-lg font-black font-mono text-red-400">
            ₹{shortageValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">{shortageItems.length} Short Lines</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5 flex items-center space-x-1">
            <TrendingUp size={11} />
            <span>Excess Value</span>
          </span>
          <div className="text-lg font-black font-mono text-amber-400">
            ₹{excessValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">{excessItems.length} Excess Lines</span>
        </div>
      </div>

      {/* 3. Official Master 1-Click Export Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 space-y-2">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
          Official Reports Download
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => generateAuditWorkbook(audit)}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 active-press shadow"
          >
            <FileSpreadsheet size={15} />
            <span>7-Sheet Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => generateAuditPDF(audit)}
            className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 active-press"
          >
            <FileText size={15} />
            <span>Executive PDF</span>
          </button>
        </div>
      </div>

      {/* 4. Document Maintenance Checklist */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4">
        <div className="flex items-center space-x-1.5 mb-2.5">
          <ClipboardCheck size={16} className="text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            11-Point Records Maintenance Checklist
          </h3>
        </div>

        <div className="space-y-2">
          {(audit.checklist || []).map((c) => (
            <div key={c.id} className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-200">{c.name}</span>
              <div className="flex items-center space-x-1">
                {['Maint', 'Not Maint', 'Sys only maint'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleChecklistToggle(c.id, opt)}
                    className={`px-2 py-0.5 text-[9px] font-bold rounded-md border transition ${
                      c.status === opt
                        ? 'bg-amber-400 text-neutral-950 border-amber-400'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-white'
                    }`}
                  >
                    {opt === 'Sys only maint' ? 'Sys' : opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
