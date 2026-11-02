import React, { useState } from 'react';
import { 
  ShieldAlert, CheckCircle2, Search, ChevronRight, X, 
  Check, Filter, AlertTriangle, Layers
} from 'lucide-react';
import { ISSUE_CATEGORIES } from '../services/storage';

export const IssueResolutionCockpit = ({ audit, onUpdateItem }) => {
  const items = audit.items || [];
  const discrepancies = items.filter((i) => i.status === 'shortage' || i.status === 'excess');

  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNRESOLVED' | 'RESOLVED'

  // Resolution Form State
  const [category, setCategory] = useState('');
  const [reqNo, setReqNo] = useState('');
  const [date, setDate] = useState('');
  const [machNo, setMachNo] = useState('');
  const [callId, setCallId] = useState('');
  const [cusName, setCusName] = useState('');
  const [billNo, setBillNo] = useState('');
  const [delNo, setDelNo] = useState('');
  const [delDate, setDelDate] = useState('');
  const [inwardNo, setInwardNo] = useState('');
  const [inwardDate, setInwardDate] = useState('');
  const [interchangePart, setInterchangePart] = useState('');
  const [mailDate, setMailDate] = useState('');
  const [issueQty, setIssueQty] = useState('1');
  const [remarks, setRemarks] = useState('');

  const openResolution = (item) => {
    setSelectedItem(item);
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
    setRemarks(d.remarks || item.remarks || '');
  };

  const handleSave = (e) => {
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
      remarks
    };

    onUpdateItem({
      ...selectedItem,
      issueCategory: category || null,
      issueDetails: details,
      remarks: remarks || selectedItem.remarks,
      lastModified: new Date().toISOString()
    });

    setSelectedItem(null);
  };

  const filtered = discrepancies.filter((i) => {
    const matchesSearch =
      !searchTerm ||
      i.itemNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.description.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'RESOLVED') return !!i.issueCategory;
    if (filterMode === 'UNRESOLVED') return !i.issueCategory;
    return true;
  });

  const resolvedCount = discrepancies.filter((i) => !!i.issueCategory).length;

  return (
    <div className="max-w-md mx-auto px-3.5 pt-3 pb-24 font-sans">
      {/* Overview Status Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3.5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert size={16} className="text-amber-400" />
            <span className="font-bold text-sm text-white">Mismatched Items</span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-400">
            {resolvedCount} / {discrepancies.length} Resolved
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 text-xs font-semibold">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1 rounded-lg transition active-press ${
              filterMode === 'ALL' ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400'
            }`}
          >
            All ({discrepancies.length})
          </button>
          <button
            onClick={() => setFilterMode('UNRESOLVED')}
            className={`px-3 py-1 rounded-lg transition active-press ${
              filterMode === 'UNRESOLVED' ? 'bg-red-500/15 text-red-400 font-bold' : 'text-neutral-400'
            }`}
          >
            Needs Reason ({discrepancies.length - resolvedCount})
          </button>
          <button
            onClick={() => setFilterMode('RESOLVED')}
            className={`px-3 py-1 rounded-lg transition active-press ${
              filterMode === 'RESOLVED' ? 'bg-emerald-500/15 text-emerald-400 font-bold' : 'text-neutral-400'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Discrepant List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400">
            <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={32} />
            <p className="font-bold text-sm text-white">No Mismatches</p>
            <p className="text-xs text-neutral-500">Every counted item matches system stock.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isShort = item.status === 'shortage';
            const hasCat = !!item.issueCategory;

            return (
              <button
                key={item.id}
                onClick={() => openResolution(item)}
                className="w-full bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-3.5 text-left active-press transition flex items-center justify-between"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="font-mono font-bold text-sm text-white">{item.itemNo}</span>
                    <span className={`text-xs font-mono font-black ${isShort ? 'text-red-400' : 'text-amber-400'}`}>
                      {isShort ? `-${item.shortage}` : `+${item.excess}`}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate mb-1">{item.description}</p>
                  <div className="flex items-center space-x-2 text-[11px] font-mono">
                    <span className="text-neutral-500">SAP: {item.stock} | Phy: {item.phy || 0}</span>
                    {hasCat ? (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {item.issueCategory}
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold">● Tap to Assign Category</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-600 flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {/* Slide-Up Resolution Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-t border-neutral-700 rounded-t-3xl p-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div>
                <span className="text-[11px] font-mono text-neutral-400">Line #{selectedItem.sNo}</span>
                <h4 className="font-mono font-bold text-base text-white">{selectedItem.itemNo}</h4>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded-lg text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Standard JCB Issue Category *
                </label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                >
                  <option value="">-- Choose Category (17 Types) --</option>
                  {ISSUE_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      [{cat.code}] {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic inputs for Warranty / Workshop */}
              {(category === 'WTYP' || category === 'WKSPP') && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5 text-xs">
                  <span className="font-bold text-amber-400 text-[11px] block uppercase">
                    {category === 'WTYP' ? 'Warranty Requisition' : 'Workshop Requisition'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Req No / QTN No *"
                      value={reqNo}
                      onChange={(e) => setReqNo(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Date (e.g. 24.02.25)"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Machine No"
                      value={machNo}
                      onChange={(e) => setMachNo(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Call ID"
                      value={callId}
                      onChange={(e) => setCallId(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={cusName}
                    onChange={(e) => setCusName(e.target.value)}
                    className="w-full px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                  />
                </div>
              )}

              {/* Dynamic inputs for Customer Billed */}
              {(category === 'CBPL' || category === 'CBP') && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 text-[11px] block uppercase">Customer Billed Details</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bill / DC No *"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic inputs for STN & Open Delivery */}
              {(category === 'STNDELP' || category === 'OPENDELP' || category === 'DLPI') && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 text-[11px] block uppercase">Delivery / Inward Ref</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Del No"
                      value={delNo}
                      onChange={(e) => setDelNo(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                    <input
                      type="text"
                      placeholder="Inward No"
                      value={inwardNo}
                      onChange={(e) => setInwardNo(e.target.value)}
                      className="px-2.5 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Remarks (Appears on Excel/PDF)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. S/Engr Peter or Bill- 25000201 dt 23.04.25"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="py-3 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-2xl active-press"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 bg-amber-400 text-neutral-950 text-xs font-black rounded-2xl active-press shadow-md"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
