import React, { useState } from 'react';
import { 
  Award, CheckCircle, Download, FileSpreadsheet, FileText, 
  AlertCircle, ShieldCheck, TrendingDown, TrendingUp, DollarSign,
  ClipboardList, Check, Building2, UserCheck, Stamp
} from 'lucide-react';
import { generateAuditWorkbook } from '../services/excelExport';
import { generateAuditPDF } from '../services/pdfExport';

export const ChairmanView = ({ audit, onUpdateAudit }) => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'wty' | 'wksp' | 'stn' | 'checklist'
  const items = audit?.items || [];

  const shortageItems = items.filter((i) => i.status === 'shortage');
  const excessItems = items.filter((i) => i.status === 'excess');
  const matchedItems = items.filter((i) => i.status === 'matched');
  const uncountedItems = items.filter((i) => i.status === 'uncounted');

  const shortageValue = shortageItems.reduce((acc, i) => acc + (i.shortage * (i.mrp || 0)), 0);
  const excessValue = excessItems.reduce((acc, i) => acc + (i.excess * (i.mrp || 0)), 0);
  const totalStockValue = items.reduce((acc, i) => acc + (i.stock * (i.mrp || 0)), 0);

  const wtyItems = items.filter((i) => i.issueCategory === 'WTYP');
  const wtyValue = wtyItems.reduce((acc, i) => acc + ((i.issueDetails?.qty || i.shortage || 1) * (i.mrp || 0)), 0);

  const wkspItems = items.filter((i) => i.issueCategory === 'WKSPP');
  const wkspValue = wkspItems.reduce((acc, i) => acc + ((i.issueDetails?.qty || i.shortage || 1) * (i.mrp || 0)), 0);

  // Chairman Approval Handler
  const handleApproveAudit = () => {
    const isApproved = !audit.chairmanApproved;
    const updated = {
      ...audit,
      chairmanApproved: isApproved,
      approvedAt: isApproved ? new Date().toISOString() : null,
      approvedBy: isApproved ? 'Chairman & Managing Director' : null
    };
    onUpdateAudit(updated);
  };

  // Checklist Status Toggle
  const handleToggleChecklist = (id, newStatus) => {
    const checklist = (audit.checklist || []).map((c) => {
      if (c.id === id) {
        return { ...c, status: newStatus };
      }
      return c;
    });
    onUpdateAudit({ ...audit, checklist });
  };

  // Editable Financials
  const handleUpdateFinance = (field, value) => {
    onUpdateAudit({ ...audit, [field]: value });
  };

  return (
    <div className="max-w-5xl mx-auto px-2 py-4 pb-24 sm:px-4">
      {/* Official Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border-2 border-jcb-yellow/40 rounded-2xl p-5 mb-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-jcb-yellow mb-1">
              <Building2 size={20} />
              <span className="text-xs uppercase font-bold tracking-widest text-neutral-400">
                {audit.companyName || 'JAYARAJ AUTOMOBILE AGENCY'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {audit.storeName} Parts Audit Report
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Audit Date: <strong className="text-white">{audit.auditDate}</strong> | Warehouse:{' '}
              <strong className="text-white">{audit.whseCode}</strong> | Auditor:{' '}
              <strong className="text-white">{audit.auditors}</strong>
            </p>
          </div>

          {/* Official Download Buttons & Approval */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => generateAuditWorkbook(audit)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md transition active-press"
            >
              <FileSpreadsheet size={15} />
              <span>Download Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => generateAuditPDF(audit)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-bold transition active-press"
            >
              <FileText size={15} />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleApproveAudit}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-black border transition active-press ${
                audit.chairmanApproved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md'
                  : 'bg-jcb-yellow text-neutral-950 border-jcb-yellow hover:bg-jcb-yellowDark shadow-lg shadow-jcb-yellow/20'
              }`}
            >
              <Stamp size={15} />
              <span>{audit.chairmanApproved ? '✓ APPROVED & SIGNED' : 'Approve & Sign-Off'}</span>
            </button>
          </div>
        </div>

        {audit.chairmanApproved && (
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center space-x-2 text-xs text-emerald-400 font-mono font-bold">
            <ShieldCheck size={16} />
            <span>
              Officially Verified by {audit.approvedBy} on {new Date(audit.approvedAt).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {/* Total Stock */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
            Total Stock In Store
          </span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">{items.length}</div>
          <span className="text-[11px] text-neutral-400 font-mono">
            ₹{totalStockValue.toLocaleString('en-IN')} Value
          </span>
        </div>

        {/* Physical Audit Match % */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
            Physical Match Rate
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {((matchedItems.length / (items.length || 1)) * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            {matchedItems.length} matched / {items.length} items
          </span>
        </div>

        {/* Shortage */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1 flex items-center space-x-1">
            <TrendingDown size={12} />
            <span>Total Shortage</span>
          </span>
          <div className="text-xl sm:text-2xl font-black text-red-400 font-mono">
            {shortageItems.length === 0 ? 'NIL' : `${shortageItems.length} Lines`}
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            ₹{shortageValue.toLocaleString('en-IN')} Short Value
          </span>
        </div>

        {/* Excess */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1 flex items-center space-x-1">
            <TrendingUp size={12} />
            <span>Total Excess</span>
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {excessItems.length} Lines
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            ₹{excessValue.toLocaleString('en-IN')} Excess Value
          </span>
        </div>
      </div>

      {/* Secondary Financial Indicators Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">Cash in Hand</span>
          <input
            type="text"
            value={audit.cashInHand || '58,500'}
            onChange={(e) => handleUpdateFinance('cashInHand', e.target.value)}
            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white text-xs font-bold"
          />
        </div>
        <div>
          <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">Last Bill No</span>
          <input
            type="text"
            value={audit.lastBillNo || '251324212 dt 22.4.25'}
            onChange={(e) => handleUpdateFinance('lastBillNo', e.target.value)}
            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white text-xs font-bold"
          />
        </div>
        <div>
          <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">Petty Cash</span>
          <input
            type="text"
            value={audit.pettyCash || 'NIL'}
            onChange={(e) => handleUpdateFinance('pettyCash', e.target.value)}
            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white text-xs font-bold"
          />
        </div>
        <div>
          <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">Credit Bill Pending</span>
          <input
            type="text"
            value={audit.creditBillPending || '14,55,101/- (Rahul Const.)'}
            onChange={(e) => handleUpdateFinance('creditBillPending', e.target.value)}
            className="w-full px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-white text-xs font-bold"
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1.5 mb-3 overflow-x-auto text-xs font-bold p-1 bg-neutral-950 rounded-xl border border-neutral-800">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-2 rounded-lg transition ${
            activeTab === 'summary' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Audit Observations
        </button>
        <button
          onClick={() => setActiveTab('wty')}
          className={`px-3 py-2 rounded-lg transition ${
            activeTab === 'wty' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Warranty Pending ({wtyItems.length})
        </button>
        <button
          onClick={() => setActiveTab('wksp')}
          className={`px-3 py-2 rounded-lg transition ${
            activeTab === 'wksp' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Workshop Pending ({wkspItems.length})
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-3 py-2 rounded-lg transition ${
            activeTab === 'checklist' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Records Checklist (11 Docs)
        </button>
        <button
          onClick={() => setActiveTab('discrepancies')}
          className={`px-3 py-2 rounded-lg transition ${
            activeTab === 'discrepancies' ? 'bg-neutral-800 text-jcb-yellow shadow' : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Discrepancies ({shortageItems.length + excessItems.length})
        </button>
      </div>

      {/* TAB 1: Audit Observations & Points */}
      {activeTab === 'summary' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
            <ClipboardList className="text-jcb-yellow" size={16} />
            <span>Store Housekeeping & Audit Points</span>
          </h3>

          <div className="space-y-2">
            {(audit.points || [
              '1. JCB Store Housekeeping done.',
              '2. Parts Bin location 65% done.',
              '3. Self audit not done.',
              '4. JCB invoice and Castrol invoice inward pending yet to be check.'
            ]).map((point, idx) => (
              <div key={idx} className="flex items-center space-x-2 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-xs text-neutral-300 font-medium">{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Warranty Requisition Pending */}
      {activeTab === 'wty' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white">Warranty Requisition Issues ({wtyItems.length})</h3>
            <span className="text-xs font-mono font-bold text-jcb-yellow">
              Total Value: ₹{wtyValue.toLocaleString('en-IN')}
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-bold">
                <th className="p-2">#</th>
                <th className="p-2">Part No</th>
                <th className="p-2">Description</th>
                <th className="p-2">Req No</th>
                <th className="p-2">Date</th>
                <th className="p-2">Mach No</th>
                <th className="p-2">Customer</th>
                <th className="p-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {wtyItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-neutral-800/60 font-mono text-[11px]">
                  <td className="p-2 text-neutral-500">{idx + 1}</td>
                  <td className="p-2 font-bold text-white">{item.itemNo}</td>
                  <td className="p-2 text-neutral-300">{item.description}</td>
                  <td className="p-2 text-jcb-yellow">{item.issueDetails?.reqNo || '-'}</td>
                  <td className="p-2 text-neutral-400">{item.issueDetails?.date || '-'}</td>
                  <td className="p-2 text-neutral-400">{item.issueDetails?.machNo || '-'}</td>
                  <td className="p-2 text-neutral-300">{item.issueDetails?.cusName || '-'}</td>
                  <td className="p-2 text-right font-bold text-white">
                    ₹{((item.issueDetails?.qty || item.shortage || 1) * (item.mrp || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Workshop Requisition Pending */}
      {activeTab === 'wksp' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-white">Workshop Requisition Issues ({wkspItems.length})</h3>
            <span className="text-xs font-mono font-bold text-jcb-yellow">
              Total Value: ₹{wkspValue.toLocaleString('en-IN')}
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-bold">
                <th className="p-2">#</th>
                <th className="p-2">Part No</th>
                <th className="p-2">Description</th>
                <th className="p-2">Req/QTN No</th>
                <th className="p-2">Date</th>
                <th className="p-2">Customer</th>
                <th className="p-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {wkspItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-neutral-800/60 font-mono text-[11px]">
                  <td className="p-2 text-neutral-500">{idx + 1}</td>
                  <td className="p-2 font-bold text-white">{item.itemNo}</td>
                  <td className="p-2 text-neutral-300">{item.description}</td>
                  <td className="p-2 text-jcb-yellow">{item.issueDetails?.reqNo || item.issueDetails?.qtnNo || '-'}</td>
                  <td className="p-2 text-neutral-400">{item.issueDetails?.date || '-'}</td>
                  <td className="p-2 text-neutral-300">{item.issueDetails?.cusName || '-'}</td>
                  <td className="p-2 text-right font-bold text-white">
                    ₹{((item.issueDetails?.qty || item.shortage || 1) * (item.mrp || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Records Checklist */}
      {activeTab === 'checklist' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <h3 className="text-sm font-black text-white mb-3">11-Point Branch Document Records Checklist</h3>
          <div className="space-y-2">
            {(audit.checklist || []).map((chk) => (
              <div key={chk.id} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white">{chk.name}</span>
                <div className="flex items-center space-x-1.5">
                  {['Maint', 'Not Maint', 'Sys only maint', 'Received'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleToggleChecklist(chk.id, opt)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                        chk.status === opt
                          ? 'bg-jcb-yellow text-neutral-950 border-jcb-yellow shadow'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Discrepancies Table */}
      {activeTab === 'discrepancies' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 font-bold">
                <th className="p-2">#</th>
                <th className="p-2">Part No</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Phy</th>
                <th className="p-2">Variance</th>
                <th className="p-2">Category</th>
                <th className="p-2 text-right">Discrepancy Value</th>
              </tr>
            </thead>
            <tbody>
              {shortageItems.concat(excessItems).map((item, idx) => (
                <tr key={item.id} className="border-b border-neutral-800/60 font-mono text-[11px]">
                  <td className="p-2 text-neutral-500">{idx + 1}</td>
                  <td className="p-2 font-bold text-white">{item.itemNo}</td>
                  <td className="p-2">{item.stock}</td>
                  <td className="p-2">{item.phy !== null ? item.phy : '-'}</td>
                  <td className={`p-2 font-bold ${item.status === 'shortage' ? 'text-red-400' : 'text-amber-400'}`}>
                    {item.status === 'shortage' ? `-${item.shortage}` : `+${item.excess}`}
                  </td>
                  <td className="p-2 text-neutral-300 font-mono">{item.issueCategory || 'Uncategorized'}</td>
                  <td className="p-2 text-right font-bold text-jcb-yellow">
                    ₹{(Math.abs(item.shortage || item.excess) * (item.mrp || 0)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
