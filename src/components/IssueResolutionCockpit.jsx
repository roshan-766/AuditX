import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, ChevronRight, FileSpreadsheet, 
  Search, ShieldAlert, Sparkles, Filter, Check
} from 'lucide-react';
import { ISSUE_CATEGORIES } from '../services/storage';

export const IssueResolutionCockpit = ({ audit, onUpdateItem }) => {
  const items = audit.items || [];
  
  // Filter only items with discrepancies
  const discrepancies = items.filter((i) => i.status === 'shortage' || i.status === 'excess');
  
  const [selectedItemId, setSelectedItemId] = useState(discrepancies[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const selectedItem = items.find((i) => i.id === selectedItemId) || discrepancies[0] || null;

  // Active form state for the selected item's issue resolution
  const [category, setCategory] = useState(selectedItem?.issueCategory || '');
  const [reqNo, setReqNo] = useState(selectedItem?.issueDetails?.reqNo || '');
  const [date, setDate] = useState(selectedItem?.issueDetails?.date || '');
  const [machNo, setMachNo] = useState(selectedItem?.issueDetails?.machNo || '');
  const [callId, setCallId] = useState(selectedItem?.issueDetails?.callId || '');
  const [cusName, setCusName] = useState(selectedItem?.issueDetails?.cusName || '');
  const [billNo, setBillNo] = useState(selectedItem?.issueDetails?.billNo || '');
  const [delNo, setDelNo] = useState(selectedItem?.issueDetails?.delNo || '');
  const [delDate, setDelDate] = useState(selectedItem?.issueDetails?.delDate || '');
  const [inwardNo, setInwardNo] = useState(selectedItem?.issueDetails?.inwardNo || '');
  const [inwardDate, setInwardDate] = useState(selectedItem?.issueDetails?.inwardDate || '');
  const [interchangePart, setInterchangePart] = useState(selectedItem?.issueDetails?.interchangePart || '');
  const [mailDate, setMailDate] = useState(selectedItem?.issueDetails?.mailDate || '');
  const [issueQty, setIssueQty] = useState(String(selectedItem?.issueDetails?.qty || Math.abs(selectedItem?.shortage || selectedItem?.excess || 1)));
  const [issueRemarks, setIssueRemarks] = useState(selectedItem?.issueDetails?.remarks || selectedItem?.remarks || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // When selected item changes, sync fields
  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setCategory(item.issueCategory || '');
    const d = item.issueDetails || {};
    setReqNo(d.reqNo || '');
    setDate(d.date || '');
    setMachNo(d.machNo || '');
    setCallId(d.callId || '');
    setCusName(d.cusName || '');
    setBillNo(d.billNo || '');
    setDelNo(d.delNo || '');
    setDelDate(d.delDate || '');
    setInwardNo(d.inwardNo || '');
    setInwardDate(d.inwardDate || '');
    setInterchangePart(d.interchangePart || '');
    setMailDate(d.mailDate || '');
    setIssueQty(String(d.qty || Math.abs(item.shortage || item.excess || 1)));
    setIssueRemarks(d.remarks || item.remarks || '');
    setSaveSuccess(false);
  };

  // Save issue resolution details
  const handleSaveResolution = (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const details = {
      qty: parseFloat(issueQty) || 1,
      reqNo,
      date,
      machNo,
      callId,
      cusName,
      billNo,
      delNo,
      delDate,
      inwardNo,
      inwardDate,
      interchangePart,
      mailDate,
      remarks: issueRemarks
    };

    const updated = {
      ...selectedItem,
      issueCategory: category || null,
      issueDetails: details,
      remarks: issueRemarks || selectedItem.remarks,
      lastModified: new Date().toISOString()
    };

    onUpdateItem(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    // Auto-advance to next unresolved item
    const nextUnresolved = discrepancies.find((i) => i.id !== selectedItem.id && !i.issueCategory);
    if (nextUnresolved) {
      handleSelectItem(nextUnresolved);
    }
  };

  // Filter list
  const filteredDiscrepancies = discrepancies.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.itemNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === 'RESOLVED') return !!item.issueCategory;
    if (filterCategory === 'UNRESOLVED') return !item.issueCategory;
    if (filterCategory !== 'ALL') return item.issueCategory === filterCategory;

    return true;
  });

  const resolvedCount = discrepancies.filter((i) => !!i.issueCategory).length;

  return (
    <div className="max-w-4xl mx-auto px-2 py-3 pb-24 sm:px-4">
      {/* Overview Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center space-x-2 text-jcb-yellow mb-1">
            <ShieldAlert size={18} />
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Mismatched Issue Resolution (Desk Mode)
            </h2>
          </div>
          <p className="text-xs text-neutral-400">
            Categorize short & excess parts into standard JCB resolution types with requisition & bill numbers.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold">
          <span className="px-2.5 py-1 bg-red-950/80 text-red-400 border border-red-800 rounded-lg">
            {discrepancies.length} Total Mismatches
          </span>
          <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-lg">
            {resolvedCount} Categorized
          </span>
        </div>
      </div>

      {discrepancies.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <CheckCircle className="text-emerald-400 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-black text-white mb-1">Zero Discrepancies Found!</h3>
          <p className="text-xs text-neutral-400">
            Every counted part perfectly matches system stock. No issues require resolution.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Discrepancy List (4 cols) */}
          <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-3 shadow-md h-auto lg:h-[750px] flex flex-col">
            {/* Search and Filters */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter mismatched parts..."
                  className="w-full pl-8 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-jcb-yellow"
                />
              </div>

              <div className="flex items-center space-x-1 text-[10px] font-bold overflow-x-auto">
                <button
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-2 py-1 rounded-md transition ${filterCategory === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                >
                  All ({discrepancies.length})
                </button>
                <button
                  onClick={() => setFilterCategory('UNRESOLVED')}
                  className={`px-2 py-1 rounded-md transition ${filterCategory === 'UNRESOLVED' ? 'bg-red-900/60 text-red-300' : 'text-neutral-500'}`}
                >
                  Pending ({discrepancies.length - resolvedCount})
                </button>
                <button
                  onClick={() => setFilterCategory('RESOLVED')}
                  className={`px-2 py-1 rounded-md transition ${filterCategory === 'RESOLVED' ? 'bg-emerald-900/60 text-emerald-300' : 'text-neutral-500'}`}
                >
                  Done ({resolvedCount})
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {filteredDiscrepancies.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isShort = item.status === 'shortage';
                const isCategorized = !!item.issueCategory;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left p-2.5 rounded-xl border transition active-press ${
                      isSelected
                        ? 'bg-neutral-800 border-jcb-yellow shadow-md'
                        : 'bg-neutral-950/60 border-neutral-800 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-white truncate max-w-[150px]">
                        {item.itemNo}
                      </span>
                      <span className={`font-mono font-black text-[11px] ${isShort ? 'text-red-400' : 'text-amber-400'}`}>
                        {isShort ? `-${item.shortage}` : `+${item.excess}`}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 truncate mb-1.5">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-neutral-500 font-mono">
                        Stock: {item.stock} | Phy: {item.phy !== null ? item.phy : '0'}
                      </span>
                      {isCategorized ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                          {item.issueCategory}
                        </span>
                      ) : (
                        <span className="text-red-400 font-bold">Needs Reason</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Resolution Details Form (7 cols) */}
          <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl">
            {selectedItem ? (
              <form onSubmit={handleSaveResolution} className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center space-x-2">
                    <Check size={16} />
                    <span>Issue resolution saved and linked to report!</span>
                  </div>
                )}

                {/* Selected Part Badge */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-neutral-400">
                      Line #{selectedItem.sNo}
                    </span>
                    <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-full ${
                      selectedItem.status === 'shortage' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedItem.status === 'shortage' ? `Shortage: -${selectedItem.shortage}` : `Excess: +${selectedItem.excess}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-black font-mono text-white mb-0.5">{selectedItem.itemNo}</h3>
                  <p className="text-xs text-neutral-300 font-medium mb-2">{selectedItem.description}</p>
                  <div className="flex items-center space-x-4 text-xs font-mono text-neutral-400">
                    <span>SAP Stock: <strong className="text-white">{selectedItem.stock}</strong></span>
                    <span>Phy Count: <strong className="text-white">{selectedItem.phy || 0}</strong></span>
                    <span>MRP: <strong className="text-jcb-yellow">₹{Number(selectedItem.mrp || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>

                {/* Issue Category Dropdown */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-jcb-yellow mb-1.5">
                    Select Standard JCB Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-jcb-yellow"
                  >
                    <option value="">-- Choose Category (17 JCB Types) --</option>
                    {ISSUE_CATEGORIES.map((cat) => (
                      <option key={cat.code} value={cat.code}>
                        [{cat.code}] {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discrepancy Qty */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">Issue Qty Affected *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={issueQty}
                      onChange={(e) => setIssueQty(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-jcb-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">Calculated Discrepancy Value</label>
                    <div className="px-3 py-2 bg-neutral-950/60 border border-neutral-800 rounded-xl text-sm font-mono text-jcb-yellow font-bold">
                      ₹{((parseFloat(issueQty) || 0) * (selectedItem.mrp || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Dynamic Fields for Warranty & Workshop Issues (WTYP / WKSPP) */}
                {(category === 'WTYP' || category === 'WKSPP') && (
                  <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-jcb-yellow block uppercase tracking-wider">
                      {category === 'WTYP' ? 'Warranty Requisition Details' : 'Workshop Requisition Details'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                          {category === 'WTYP' ? 'Requisition No *' : 'Req No / QTN No *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={reqNo}
                          onChange={(e) => setReqNo(e.target.value)}
                          placeholder="e.g. 43314 or 250090264"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Date</label>
                        <input
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          placeholder="e.g. 24.02.25"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Machine No</label>
                        <input
                          type="text"
                          value={machNo}
                          onChange={(e) => setMachNo(e.target.value)}
                          placeholder="e.g. 3349784"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Call ID</label>
                        <input
                          type="text"
                          value={callId}
                          onChange={(e) => setCallId(e.target.value)}
                          placeholder="e.g. 509536"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={cusName}
                        onChange={(e) => setCusName(e.target.value)}
                        placeholder="e.g. Charles, Krishna B/M"
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for Customer Bill Pending (CBPL / CBP / CQTNP) */}
                {(category === 'CBPL' || category === 'CBP' || category === 'CQTNP') && (
                  <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-jcb-yellow block uppercase tracking-wider">
                      Customer Bill / DC / Quotation Information
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Bill / DC No</label>
                        <input
                          type="text"
                          value={billNo}
                          onChange={(e) => setBillNo(e.target.value)}
                          placeholder="e.g. Bill- 251324214"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Date</label>
                        <input
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          placeholder="e.g. 23.04.25"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for STN & Open Delivery (STNDELP / OPENDELP / DLPI) */}
                {(category === 'STNDELP' || category === 'OPENDELP' || category === 'DLPI') && (
                  <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-jcb-yellow block uppercase tracking-wider">
                      Stock Transfer & Delivery Details
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Delivery No</label>
                        <input
                          type="text"
                          value={delNo}
                          onChange={(e) => setDelNo(e.target.value)}
                          placeholder="e.g. 25100514"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Delivery Date</label>
                        <input
                          type="text"
                          value={delDate}
                          onChange={(e) => setDelDate(e.target.value)}
                          placeholder="e.g. 2025-04-21"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Inward No</label>
                        <input
                          type="text"
                          value={inwardNo}
                          onChange={(e) => setInwardNo(e.target.value)}
                          placeholder="e.g. 25000626"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Inward Date</label>
                        <input
                          type="text"
                          value={inwardDate}
                          onChange={(e) => setInwardDate(e.target.value)}
                          placeholder="e.g. 24.04.25"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Fields for JCB Discrepancy & Interchange (JCBDESP / ITRCHPISU) */}
                {(category === 'JCBDESP' || category === 'ITRCHPISU' || category === 'JCBDEMG') && (
                  <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-jcb-yellow block uppercase tracking-wider">
                      JCB System Stock Mail & Interchange Reference
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Mail Raised Date</label>
                        <input
                          type="text"
                          value={mailDate}
                          onChange={(e) => setMailDate(e.target.value)}
                          placeholder="e.g. Mail dt 02.09.24"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 mb-1">Interchange Part / Ref</label>
                        <input
                          type="text"
                          value={interchangePart}
                          onChange={(e) => setInterchangePart(e.target.value)}
                          placeholder="e.g. I/C- 402/C 8939"
                          className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* General Auditor Remark */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Resolution Remarks (Appears in Report)</label>
                  <input
                    type="text"
                    value={issueRemarks}
                    onChange={(e) => setIssueRemarks(e.target.value)}
                    placeholder="e.g. Bill- 25000202 dt 23.04.25 or S/Engr Peter"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white focus:outline-none focus:border-jcb-yellow"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black text-sm rounded-xl transition active-press shadow-md shadow-jcb-yellow/10"
                  >
                    Save Resolution & Advance
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-neutral-500 text-xs">
                Select a part from the left list to resolve.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
