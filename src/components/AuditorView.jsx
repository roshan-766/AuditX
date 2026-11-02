import React, { useState } from 'react';
import { 
  Plus, Upload, FileSpreadsheet, ArrowLeft, Clock, 
  CheckCircle2, AlertTriangle, FileText, Download, 
  Trash2, Play, Building2, Calendar, User, Search
} from 'lucide-react';
import { parseSAPExcel } from '../services/sapParser';
import { PhysicalAuditCockpit } from './PhysicalAuditCockpit';
import { IssueResolutionCockpit } from './IssueResolutionCockpit';
import { ChairmanView } from './ChairmanView';
import { 
  getBranches, saveAudit, deleteAudit, exportAuditFile, 
  DEFAULT_CHECKLIST, getCurrentUser 
} from '../services/storage';

export const AuditorView = ({ audits, activeAudit, onSelectAudit, onUpdateAudit, onRefreshAudits }) => {
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('audit'); // 'audit' | 'issues' | 'summary'
  const branches = getBranches();
  const currentUser = getCurrentUser();

  // New Audit Form State
  const [companyName, setCompanyName] = useState('JAYARAJ AUTOMOBILE AGENCY');
  const [selectedBranch, setSelectedBranch] = useState(branches[0]?.name || 'TIRUNELVELI');
  const [whseCode, setWhseCode] = useState(branches[0]?.code || 'DJ00016');
  const [auditDate, setAuditDate] = useState(new Date().toLocaleDateString('en-GB').replace(/\//g, '.'));
  const [auditorNames, setAuditorNames] = useState(currentUser?.name || 'V ARUMUGAM & S SIVA GANESH');
  const [storeIncharge, setStoreIncharge] = useState('ROBIN & VARATHARAJAN');
  const [parsedData, setParsedData] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');

  // Handle branch select auto-updating whseCode
  const handleBranchChange = (bName) => {
    setSelectedBranch(bName);
    const found = branches.find((b) => b.name.toUpperCase() === bName.toUpperCase());
    if (found) setWhseCode(found.code);
  };

  // Handle file drop/upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError('');
    try {
      const result = await parseSAPExcel(file);
      setParsedData(result);

      // Auto-fill metadata if detected by parser
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

  // Create & Start Audit
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
    setShowNewAuditModal(false);
    setParsedData(null);
    onRefreshAudits();
  };

  // Update item callback
  const handleUpdateItem = (updatedItem) => {
    if (!activeAudit) return;
    const items = activeAudit.items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    const updatedAudit = { ...activeAudit, items };
    saveAudit(updatedAudit);
    onUpdateAudit(updatedAudit);
  };

  // Add unlisted item callback
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

  return (
    <div>
      {/* CASE 1: ACTIVE AUDIT COCKPIT */}
      {activeAudit ? (
        <div>
          {/* Subheader Navigation */}
          <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex items-center justify-between">
            <button
              onClick={() => onSelectAudit(null)}
              className="flex items-center space-x-1.5 text-xs font-bold text-neutral-400 hover:text-white transition active-press"
            >
              <ArrowLeft size={16} />
              <span>All Audits</span>
            </button>

            {/* Audit Mode Tabs */}
            <div className="flex items-center space-x-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-bold">
              <button
                onClick={() => setActiveSubTab('audit')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeSubTab === 'audit' ? 'bg-jcb-yellow text-neutral-950 font-black shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                1. Physical Audit
              </button>
              <button
                onClick={() => setActiveSubTab('issues')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeSubTab === 'issues' ? 'bg-jcb-yellow text-neutral-950 font-black shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                2. Issue Resolution
              </button>
              <button
                onClick={() => setActiveSubTab('summary')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeSubTab === 'summary' ? 'bg-jcb-yellow text-neutral-950 font-black shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                3. Final Report
              </button>
            </div>
          </div>

          {/* Render Current Cockpit Mode */}
          {activeSubTab === 'audit' && (
            <PhysicalAuditCockpit
              audit={activeAudit}
              onUpdateItem={handleUpdateItem}
              onAddUnlistedItem={handleAddUnlistedItem}
            />
          )}

          {activeSubTab === 'issues' && (
            <IssueResolutionCockpit
              audit={activeAudit}
              onUpdateItem={handleUpdateItem}
            />
          )}

          {activeSubTab === 'summary' && (
            <ChairmanView
              audit={activeAudit}
              onUpdateAudit={onUpdateAudit}
            />
          )}
        </div>
      ) : (
        /* CASE 2: AUDIT LIST DASHBOARD */
        <div className="max-w-4xl mx-auto px-3 py-5 pb-24 sm:px-4">
          {/* Hero Banner */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-jcb-yellow mb-1">
                <Building2 size={18} />
                <span className="text-xs font-bold tracking-widest uppercase">Internal Audit Cockpit</span>
              </div>
              <h1 className="text-2xl font-black text-white">Parts Audit Management</h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Upload raw SAP stock lists, execute physical counts, and compile Chairman Sir reports.
              </p>
            </div>

            <button
              onClick={() => setShowNewAuditModal(true)}
              className="flex items-center justify-center space-x-2 px-5 py-3 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black text-sm rounded-xl shadow-lg shadow-jcb-yellow/20 transition active-press whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Start New Audit</span>
            </button>
          </div>

          {/* Audit Cards List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1">
              Active & Saved Audit Sessions ({audits.length})
            </h2>

            {audits.length === 0 ? (
              <div className="bg-neutral-900/60 border-2 border-dashed border-neutral-800 rounded-2xl p-10 text-center">
                <FileSpreadsheet size={36} className="text-neutral-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No Active Audits</h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Upload your raw SAP messy Excel sheet to start physical counting.
                </p>
                <button
                  onClick={() => setShowNewAuditModal(true)}
                  className="px-4 py-2 bg-jcb-yellow text-neutral-950 font-bold text-xs rounded-xl hover:bg-jcb-yellowDark transition"
                >
                  Create First Audit
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
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 sm:p-5 shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-black text-white">{a.storeName}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-jcb-yellow font-mono text-xs font-bold border border-neutral-800">
                            {a.whseCode}
                          </span>
                          {a.chairmanApproved && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/40">
                              ✓ Approved
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400">
                          Audit Date: <strong className="text-neutral-300">{a.auditDate}</strong> | Auditor:{' '}
                          <strong className="text-neutral-300">{a.auditors}</strong>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => exportAuditFile(a)}
                          title="Download Backup (.auditx)"
                          className="p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-jcb-yellow border border-neutral-700"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete audit for ${a.storeName}?`)) {
                              deleteAudit(a.id);
                              onRefreshAudits();
                            }
                          }}
                          title="Delete Audit"
                          className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-red-400 border border-neutral-700"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => onSelectAudit(a)}
                          className="flex items-center space-x-1.5 px-4 py-2 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black text-xs rounded-xl shadow transition active-press"
                        >
                          <Play size={14} />
                          <span>Resume Audit</span>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-400">
                          Progress: <strong className="text-white">{counted}</strong> / {total} items ({percent}%)
                        </span>
                        <span className={discrepancies > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {discrepancies > 0 ? `⚠ ${discrepancies} Discrepancies` : '✓ All Matched'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-jcb-yellow transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* START NEW AUDIT MODAL */}
      {showNewAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <Plus className="text-jcb-yellow" size={20} />
                <span>Start New Store Audit</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Configure branch details and upload raw SAP export (.xls / .xlsx)
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAudit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {parseError && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
                  {parseError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Company Title</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Branch Store *</label>
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
                  <label className="block text-xs font-bold text-neutral-400 mb-1">SAP Warehouse Code *</label>
                  <input
                    type="text"
                    required
                    value={whseCode}
                    onChange={(e) => setWhseCode(e.target.value)}
                    placeholder="e.g. DJ00016"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Audit Date *</label>
                  <input
                    type="text"
                    required
                    value={auditDate}
                    onChange={(e) => setAuditDate(e.target.value)}
                    placeholder="23.04.25"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Store Incharge</label>
                  <input
                    type="text"
                    value={storeIncharge}
                    onChange={(e) => setStoreIncharge(e.target.value)}
                    placeholder="ROBIN & VARATHARAJAN"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Auditors Names</label>
                <input
                  type="text"
                  required
                  value={auditorNames}
                  onChange={(e) => setAuditorNames(e.target.value)}
                  placeholder="V ARUMUGAM & S SIVA GANESH"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* File Uploader for SAP Raw Sheet */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-jcb-yellow mb-1.5">
                  Upload SAP Raw Sheet (.xls / .xlsx) *
                </label>
                <div className="p-5 bg-neutral-950 border-2 border-dashed border-neutral-700 rounded-2xl text-center">
                  <Upload size={28} className="text-neutral-500 mx-auto mb-2" />
                  <p className="text-xs text-neutral-300 font-bold mb-1">
                    {isParsing ? 'Parsing SAP File...' : 'Select or Drop SAP Excel File'}
                  </p>
                  <p className="text-[11px] text-neutral-500 mb-3">
                    Supports messy SAP exports, auto-detects Item No, MRP, Description, Stock
                  </p>
                  <label className="inline-block px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl cursor-pointer border border-neutral-700 active-press">
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

              {/* Parsed Result Preview */}
              {parsedData && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs">
                  <span className="font-bold text-emerald-400 block mb-1">
                    ✓ File Parsed Successfully: {parsedData.totalRows} Parts Extracted!
                  </span>
                  <div className="text-[11px] text-neutral-400 font-mono space-y-0.5">
                    <p>Sheet: {parsedData.sheetName}</p>
                    <p>First Part: {parsedData.items[0]?.itemNo} - {parsedData.items[0]?.description}</p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewAuditModal(false)}
                  className="py-3 bg-neutral-800 text-neutral-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!parsedData}
                  className="py-3 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black text-xs rounded-xl transition active-press disabled:opacity-40 shadow-lg shadow-jcb-yellow/20"
                >
                  Start Physical Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
