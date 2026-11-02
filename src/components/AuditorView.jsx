import React, { useState } from 'react';
import { 
  Plus, Upload, ArrowLeft, Play, Download, Trash2, 
  Building2, FileSpreadsheet, X, CheckCircle2, ChevronRight
} from 'lucide-react';
import { parseSAPExcel } from '../services/sapParser';
import { PhysicalAuditCockpit } from './PhysicalAuditCockpit';
import { IssueResolutionCockpit } from './IssueResolutionCockpit';
import { ChairmanView } from './ChairmanView';
import { 
  getBranches, saveAudit, deleteAudit, exportAuditFile, 
  DEFAULT_CHECKLIST, getCurrentUser 
} from '../services/storage';

export const AuditorView = ({ 
  audits, 
  activeAudit, 
  activeTab, 
  onSelectAudit, 
  onUpdateAudit, 
  onRefreshAudits 
}) => {
  const [showNewAuditSheet, setShowNewAuditSheet] = useState(false);
  const branches = getBranches();
  const currentUser = getCurrentUser();

  // New Audit State
  const [companyName, setCompanyName] = useState('JAYARAJ AUTOMOBILE AGENCY');
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.name || 'TIRUNELVELI');
  const [whseCode, setWhseCode] = useState(branches[0]?.code || 'DJ00016');
  const [auditDate, setAuditDate] = useState(new Date().toLocaleDateString('en-GB').replace(/\//g, '.'));
  const [auditorNames, setAuditorNames] = useState(currentUser?.name || 'V ARUMUGAM & S SIVA GANESH');
  const [storeIncharge, setStoreIncharge] = useState('ROBIN & VARATHARAJAN');
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  const handleBranchChange = (bName) => {
    setSelectedBranch(bName);
    const found = branches.find((b) => b.name.toUpperCase() === bName.toUpperCase());
    if (found) setWhseCode(found.code);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError('');
    try {
      const result = await parseSAPExcel(file);
      setParsedData(result);

      if (result.detectedMetadata) {
        if (result.detectedMetadata.whseCode) setWhseCode(result.detectedMetadata.whseCode);
        if (result.detectedMetadata.storeName) setSelectedBranch(result.detectedMetadata.storeName);
        if (result.detectedMetadata.auditDate) setAuditDate(result.detectedMetadata.auditDate);
        if (result.detectedMetadata.auditors) setAuditorNames(result.detectedMetadata.auditors);
        if (result.detectedMetadata.storeIncharge) setStoreIncharge(result.detectedMetadata.storeIncharge);
      }
    } catch (err) {
      setParseError(err.message || 'Failed to parse SAP Excel file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreateAudit = (e) => {
    e.preventDefault();
    if (!parsedData || !parsedData.items || parsedData.items.length === 0) {
      setParseError('Please upload a valid SAP stock Excel file before proceeding.');
      return;
    }

    const newAudit = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      companyName: companyName.trim(),
      storeName: selectedBranch.trim().toUpperCase(),
      whseCode: whseCode.trim().toUpperCase(),
      auditDate: auditDate.trim(),
      auditors: auditorNames.trim(),
      storeIncharge: storeIncharge.trim(),
      items: parsedData.items,
      checklist: DEFAULT_CHECKLIST,
      points: [
        '1. JCB Store Housekeeping done.',
        '2. Parts Bin location 65% done.',
        '3. Self audit not done.',
        '4. JCB invoice and Castrol invoice inward pending yet to be check.'
      ],
      cashInHand: '58,500',
      lastBillNo: '251324212 dt 22.4.25',
      pettyCash: 'NIL',
      creditBillPending: '14,55,101/- (Rahul Const.)',
      chairmanApproved: false,
      approvedAt: null,
      approvedBy: null
    };

    saveAudit(newAudit);
    onSelectAudit(newAudit);
    setShowNewAuditSheet(false);
    setParsedData(null);
    onRefreshAudits();
  };

  const handleUpdateItem = (updatedItem) => {
    if (!activeAudit) return;
    const items = activeAudit.items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    const updatedAudit = { ...activeAudit, items };
    saveAudit(updatedAudit);
    onUpdateAudit(updatedAudit);
  };

  const handleAddUnlistedItem = (newItem) => {
    if (!activeAudit) return;
    const sNo = activeAudit.items.length + 1;
    const fullItem = {
      ...newItem,
      id: `item_${sNo}_${Date.now()}`,
      sNo: sNo,
      uom: 'NOS',
      history: []
    };
    const items = [...activeAudit.items, fullItem];
    const updatedAudit = { ...activeAudit, items };
    saveAudit(updatedAudit);
    onUpdateAudit(updatedAudit);
  };

  // If active audit is open:
  if (activeAudit) {
    if (activeTab === 'audit') {
      return (
        <PhysicalAuditCockpit
          audit={activeAudit}
          onUpdateItem={handleUpdateItem}
          onAddUnlistedItem={handleAddUnlistedItem}
        />
      );
    }
    if (activeTab === 'issues') {
      return (
        <IssueResolutionCockpit
          audit={activeAudit}
          onUpdateItem={handleUpdateItem}
        />
      );
    }
    if (activeTab === 'executive') {
      return (
        <ChairmanView
          audit={activeAudit}
          onUpdateAudit={onUpdateAudit}
        />
      );
    }
  }

  // Audit List Dashboard (When no active audit is opened)
  return (
    <div className="max-w-md mx-auto px-3.5 pt-3 pb-24 font-sans space-y-3.5">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">Parts Audit Sessions</h2>
          <p className="text-xs text-neutral-400">Select an audit to resume or start a new store.</p>
        </div>
        <button
          onClick={() => setShowNewAuditSheet(true)}
          className="flex items-center space-x-1 py-2 px-3 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black text-xs rounded-xl shadow-sm active-press"
        >
          <Plus size={14} />
          <span>New</span>
        </button>
      </div>

      {/* Audit List */}
      <div className="space-y-2">
        {audits.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center text-neutral-400">
            <FileSpreadsheet size={32} className="text-neutral-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white mb-0.5">No Audits Saved Yet</h3>
            <p className="text-xs text-neutral-500 mb-3">Upload a raw SAP file to begin counting.</p>
            <button
              onClick={() => setShowNewAuditSheet(true)}
              className="px-4 py-2 bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl"
            >
              Start New Audit
            </button>
          </div>
        ) : (
          audits.map((a) => {
            const total = a.items?.length || 0;
            const counted = a.items?.filter((i) => i.status !== 'uncounted').length || 0;
            const discrepancies = a.items?.filter((i) => i.status === 'shortage' || i.status === 'excess').length || 0;
            const percent = total > 0 ? Math.round((counted / total) * 100) : 0;

            return (
              <div
                key={a.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-white text-base">{a.storeName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-950 text-neutral-400 font-bold border border-neutral-800">
                      {a.whseCode}
                    </span>
                    {a.chairmanApproved && (
                      <span className="text-[9px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        ✓ Approved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => exportAuditFile(a)}
                      title="Download Backup Snapshot"
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-400"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete audit ${a.storeName}?`)) {
                          deleteAudit(a.id);
                          onRefreshAudits();
                        }
                      }}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 font-mono flex items-center justify-between">
                  <span>Date: {a.auditDate}</span>
                  <span>{counted} / {total} counted ({percent}%)</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${percent}%` }} />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-[11px] font-bold ${discrepancies > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {discrepancies > 0 ? `⚠ ${discrepancies} Mismatches` : '✓ All Matched'}
                  </span>
                  <button
                    onClick={() => onSelectAudit(a)}
                    className="flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300 active-press"
                  >
                    <span>Resume Count</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* START NEW AUDIT SLIDE-UP SHEET */}
      {showNewAuditSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-t border-neutral-700 rounded-t-3xl p-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <h4 className="font-bold text-base text-white">Start New Store Audit</h4>
              <button onClick={() => setShowNewAuditSheet(false)} className="text-neutral-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="space-y-3">
              {parseError && (
                <div className="p-2.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                  {parseError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">Branch Store *</label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">Whse Code *</label>
                  <input
                    type="text"
                    required
                    value={whseCode}
                    onChange={(e) => setWhseCode(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">Audit Date *</label>
                  <input
                    type="text"
                    required
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">Store Incharge</label>
                  <input
                    type="text"
                    value={storeIncharge}
                    onChange={(e) => setStoreIncharge(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 mb-1">Auditors</label>
                <input
                  type="text"
                  required
                  value={auditorNames}
                  onChange={(e) => setAuditorNames(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* Upload SAP Raw Sheet */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Upload SAP Raw Sheet (.xls / .xlsx) *
                </label>
                <div className="p-4 bg-neutral-950 border border-dashed border-neutral-700 rounded-2xl text-center">
                  <Upload size={22} className="text-neutral-500 mx-auto mb-1.5" />
                  <p className="text-xs text-neutral-300 font-bold mb-0.5">
                    {isParsing ? 'Parsing SAP File...' : 'Select SAP Export File'}
                  </p>
                  <label className="inline-block px-3 py-1.5 mt-2 bg-neutral-800 text-white font-bold text-xs rounded-xl cursor-pointer border border-neutral-700 active-press">
                    <span>Browse File</span>
                    <input
                      type="file"
                      accept=".xls,.xlsx,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {parsedData && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-mono">
                  ✓ {parsedData.totalRows} parts extracted from sheet "{parsedData.sheetName}"
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewAuditSheet(false)}
                  className="py-3 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-2xl active-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!parsedData}
                  className="py-3 bg-amber-400 text-neutral-950 text-xs font-black rounded-2xl active-press disabled:opacity-40"
                >
                  Start Counting →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
