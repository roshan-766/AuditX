import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, ArrowRight, ArrowLeft, Search, Plus, MapPin, 
  FileText, AlertTriangle, CheckCircle2, RotateCcw, 
  Volume2, VolumeX, Smartphone, PlusCircle, Filter
} from 'lucide-react';

export const PhysicalAuditCockpit = ({ audit, onUpdateItem, onAddUnlistedItem }) => {
  const items = audit.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'uncounted' | 'matched' | 'discrepancy'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Keypad & input state
  const currentItem = items[currentIndex] || null;
  const [inputVal, setInputVal] = useState('');
  const [locVal, setLocVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');

  // Modals state
  const [showAdditiveModal, setShowAdditiveModal] = useState(false);
  const [additionalQty, setAdditionalQty] = useState('');
  const [showUnlistedModal, setShowUnlistedModal] = useState(false);
  const [unlistedItemNo, setUnlistedItemNo] = useState('');
  const [unlistedDesc, setUnlistedDesc] = useState('');
  const [unlistedMrp, setUnlistedMrp] = useState('');
  const [unlistedQty, setUnlistedQty] = useState('');
  const [unlistedLoc, setUnlistedLoc] = useState('');

  // Synchronize local input state whenever current item changes
  useEffect(() => {
    if (currentItem) {
      setInputVal(currentItem.phy !== null ? String(currentItem.phy) : '');
      setLocVal(currentItem.loc || '');
      setRemarksVal(currentItem.remarks || '');
    }
  }, [currentIndex, currentItem]);

  // Audio & Haptic Feedback
  const triggerFeedback = (isMatch = true) => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = isMatch ? 880 : 440; // High chime for match, lower for discrepancy
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } catch (err) {
        // audio context not allowed without interaction
      }
    }
    if (navigator.vibrate) {
      navigator.vibrate(isMatch ? 30 : [50, 40, 50]);
    }
  };

  // Commit Count & Save
  const commitCount = (valNumber, autoAdvance = true) => {
    if (!currentItem) return;

    let phy = valNumber !== null && !isNaN(valNumber) ? parseFloat(valNumber) : null;
    let shortage = 0;
    let excess = 0;
    let status = 'uncounted';

    if (phy !== null) {
      if (phy === currentItem.stock) {
        status = 'matched';
      } else if (phy < currentItem.stock) {
        status = 'shortage';
        shortage = parseFloat((currentItem.stock - phy).toFixed(2));
      } else {
        status = 'excess';
        excess = parseFloat((phy - currentItem.stock).toFixed(2));
      }
      triggerFeedback(status === 'matched');
    }

    const updated = {
      ...currentItem,
      phy: phy,
      shortage: shortage,
      excess: excess,
      status: status,
      loc: locVal.trim(),
      remarks: remarksVal.trim(),
      lastModified: new Date().toISOString()
    };

    onUpdateItem(updated);

    if (autoAdvance && currentIndex < filteredList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // One-tap "= System Stock" Match
  const handleQuickMatch = () => {
    if (!currentItem) return;
    setInputVal(String(currentItem.stock));
    commitCount(currentItem.stock, true);
  };

  // Quick Zero Stock
  const handleQuickZero = () => {
    setInputVal('0');
    commitCount(0, true);
  };

  // Keypad Click
  const handleKeypadPress = (val) => {
    if (val === 'DEL') {
      setInputVal((prev) => prev.slice(0, -1));
    } else if (val === 'CLR') {
      setInputVal('');
    } else if (val === '.') {
      if (!inputVal.includes('.')) {
        setInputVal((prev) => (prev === '' ? '0.' : prev + '.'));
      }
    } else {
      setInputVal((prev) => (prev === '0' ? val : prev + val));
    }
  };

  // Confirm manual typed count
  const handleManualConfirm = () => {
    if (inputVal === '') {
      commitCount(null, true);
    } else {
      commitCount(parseFloat(inputVal), true);
    }
  };

  // Additive Counting Modal Commit
  const handleAdditiveSubmit = (e) => {
    e.preventDefault();
    const addNum = parseFloat(additionalQty);
    if (!isNaN(addNum)) {
      const currentCount = currentItem.phy !== null ? currentItem.phy : 0;
      const newTotal = parseFloat((currentCount + addNum).toFixed(2));
      setInputVal(String(newTotal));
      commitCount(newTotal, false);
      setShowAdditiveModal(false);
      setAdditionalQty('');
    }
  };

  // Add Unlisted Physical Part Modal Commit
  const handleUnlistedSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(unlistedQty) || 1;
    const mrp = parseFloat(unlistedMrp) || 0;
    
    onAddUnlistedItem({
      itemNo: unlistedItemNo.trim(),
      description: unlistedDesc.trim() || 'Physical Part (Unlisted in SAP)',
      mrp: mrp,
      stock: 0, // Not in SAP
      phy: qty,
      shortage: 0,
      excess: qty, // Entire quantity is excess
      status: 'excess',
      loc: unlistedLoc.trim(),
      remarks: 'Found physically on rack - Not in SAP export',
      issueCategory: 'EXCCFM' // Default to excess confirmed
    });

    setShowUnlistedModal(false);
    setUnlistedItemNo('');
    setUnlistedDesc('');
    setUnlistedMrp('');
    setUnlistedQty('');
    setUnlistedLoc('');
  };

  // Filter items
  const filteredList = items.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.itemNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.sNo) === searchTerm.trim();

    if (!matchesSearch) return false;

    if (filterMode === 'uncounted') return item.status === 'uncounted';
    if (filterMode === 'matched') return item.status === 'matched';
    if (filterMode === 'discrepancy') return item.status === 'shortage' || item.status === 'excess';
    return true;
  });

  // Calculate Progress Stats
  const totalCount = items.length;
  const countedCount = items.filter((i) => i.status !== 'uncounted').length;
  const matchedCount = items.filter((i) => i.status === 'matched').length;
  const discrepancyCount = items.filter((i) => i.status === 'shortage' || i.status === 'excess').length;
  const progressPercent = totalCount > 0 ? Math.round((countedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto px-2 py-3 pb-24 sm:px-4">
      {/* Search & Top Action Bar */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Part No, Desc, S/No..."
            className="w-full pl-9 pr-8 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-jcb-yellow transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-neutral-500 hover:text-white text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Add Unlisted Part Button */}
        <button
          onClick={() => setShowUnlistedModal(true)}
          title="Add part found on shelf not in SAP"
          className="flex items-center space-x-1 px-3 py-2.5 bg-neutral-900 border border-neutral-700 hover:border-jcb-yellow text-jcb-yellow rounded-xl text-xs font-bold transition active-press whitespace-nowrap shadow-sm"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Add Part</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl active-press"
        >
          {soundEnabled ? <Volume2 size={16} className="text-jcb-yellow" /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Progress & Quick Stats Card */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 mb-3 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-white">
            Count Progress: <span className="text-jcb-yellow font-black">{countedCount}</span> / {totalCount} ({progressPercent}%)
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400">✓ {matchedCount}</span>
            <span className="text-red-400">⚠ {discrepancyCount}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800 mb-2.5">
          <div
            className="h-full bg-gradient-to-r from-jcb-yellow to-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto text-[11px] font-bold">
          <button
            onClick={() => { setFilterMode('all'); setCurrentIndex(0); }}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'all' ? 'bg-neutral-800 text-white border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => { setFilterMode('uncounted'); setCurrentIndex(0); }}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'uncounted' ? 'bg-neutral-800 text-white border border-neutral-700' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Pending ({totalCount - countedCount})
          </button>
          <button
            onClick={() => { setFilterMode('matched'); setCurrentIndex(0); }}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'matched' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Matched ({matchedCount})
          </button>
          <button
            onClick={() => { setFilterMode('discrepancy'); setCurrentIndex(0); }}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterMode === 'discrepancy' ? 'bg-red-950/80 text-red-400 border border-red-800' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Discrepant ({discrepancyCount})
          </button>
        </div>
      </div>

      {/* Main Focus Part Card */}
      {currentItem ? (
        <div className="bg-neutral-900 border-2 border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden mb-3">
          {/* Header Row: S/No, Status Badge, Navigation Arrows */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-black text-jcb-yellow font-mono">
                S/No: {currentItem.sNo}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Index {currentIndex + 1} of {filteredList.length}
              </span>
            </div>

            {/* Status Pill */}
            {currentItem.status === 'matched' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                <CheckCircle2 size={12} />
                <span>MATCHED</span>
              </span>
            )}
            {currentItem.status === 'shortage' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center space-x-1">
                <AlertTriangle size={12} />
                <span>SHORT: -{currentItem.shortage}</span>
              </span>
            )}
            {currentItem.status === 'excess' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center space-x-1">
                <Plus size={12} />
                <span>EXCESS: +{currentItem.excess}</span>
              </span>
            )}
            {currentItem.status === 'uncounted' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
                UNCOUNTED
              </span>
            )}
          </div>

          {/* Part Number (High Visibility) */}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono break-all mb-1">
            {currentItem.itemNo}
          </h2>

          {/* Part Description */}
          <p className="text-sm font-semibold text-neutral-300 mb-3 leading-snug">
            {currentItem.description}
          </p>

          {/* Metrics Grid: MRP & System Stock */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                System Stock (SAP)
              </span>
              <span className="text-xl font-black text-white font-mono">
                {currentItem.stock}{' '}
                <span className="text-xs font-normal text-neutral-400">{currentItem.uom || 'NOS'}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                Unit MRP / Price
              </span>
              <span className="text-xl font-black text-jcb-yellow font-mono">
                ₹{Number(currentItem.mrp || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Physical Count Input & Controls */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5 flex items-center justify-between">
                <span>Physical Count (Available on Shelf)</span>
                {currentItem.phy !== null && (
                  <button
                    type="button"
                    onClick={() => setShowAdditiveModal(true)}
                    className="text-jcb-yellow text-xs font-bold flex items-center space-x-1 hover:underline"
                  >
                    <PlusCircle size={12} />
                    <span>Multi-Bin Add (+)</span>
                  </button>
                )}
              </label>

              {/* Giant Display Input Box */}
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={inputVal}
                  placeholder="Tap = Match or enter qty"
                  className="w-full text-center py-3 bg-neutral-950 border-2 border-neutral-700 rounded-xl text-3xl font-black text-white font-mono placeholder:text-neutral-600 placeholder:text-base focus:outline-none"
                />
                {inputVal !== '' && (
                  <button
                    type="button"
                    onClick={() => setInputVal('')}
                    className="absolute right-3 top-3.5 text-neutral-500 hover:text-white text-xs px-2 py-1 rounded bg-neutral-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* FAST INDUSTRIAL BUTTONS: "= Match Stock" & "0 (Empty)" */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleQuickMatch}
                className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm sm:text-base rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 transition active-press"
              >
                <Check size={18} />
                <span>= Stock ({currentItem.stock})</span>
              </button>

              <button
                type="button"
                onClick={handleQuickZero}
                className="py-3.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-extrabold text-sm sm:text-base rounded-xl flex items-center justify-center space-x-2 border border-neutral-700 transition active-press"
              >
                <span>0 (Empty Shelf)</span>
              </button>
            </div>

            {/* Custom On-Screen Tactile Keypad */}
            <div className="grid grid-cols-4 gap-1.5 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className={`py-3 rounded-xl font-mono text-lg font-bold border transition active-press ${
                    key === 'DEL'
                      ? 'bg-neutral-800 text-red-400 border-neutral-700 hover:bg-neutral-700'
                      : key === '.'
                      ? 'bg-neutral-800 text-jcb-yellow border-neutral-700 hover:bg-neutral-700'
                      : 'bg-neutral-950 text-white border-neutral-800 hover:bg-neutral-800'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Confirm & Save Button */}
            <button
              type="button"
              onClick={handleManualConfirm}
              className="w-full py-3 bg-jcb-yellow hover:bg-jcb-yellowDark text-neutral-950 font-black text-sm rounded-xl transition active-press flex items-center justify-center space-x-2 shadow-md shadow-jcb-yellow/10"
            >
              <span>Save & Next Item</span>
              <ArrowRight size={16} />
            </button>

            {/* Optional Location & Remarks Collapsible */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center space-x-1">
                  <MapPin size={10} />
                  <span>Bin Location</span>
                </label>
                <input
                  type="text"
                  value={locVal}
                  onChange={(e) => setLocVal(e.target.value)}
                  placeholder="e.g. A-12, Rack 4"
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1 flex items-center space-x-1">
                  <FileText size={10} />
                  <span>Auditor Note</span>
                </label>
                <input
                  type="text"
                  value={remarksVal}
                  onChange={(e) => setRemarksVal(e.target.value)}
                  placeholder="Quick note..."
                  className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>
          </div>

          {/* Bottom Prev / Next Nav */}
          <div className="flex items-center justify-between pt-4 mt-3 border-t border-neutral-800">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Previous</span>
            </button>

            <span className="text-xs text-neutral-500 font-mono">
              Item {currentIndex + 1} / {filteredList.length}
            </span>

            <button
              type="button"
              disabled={currentIndex >= filteredList.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(filteredList.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 flex items-center space-x-1"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400">
          <p className="font-bold text-sm mb-1">No items match your filter.</p>
          <p className="text-xs text-neutral-500 mb-3">Try clearing search or switching filter tabs.</p>
          <button
            onClick={() => { setSearchTerm(''); setFilterMode('all'); }}
            className="px-4 py-2 bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-neutral-700"
          >
            Show All Items
          </button>
        </div>
      )}

      {/* Multi-Bin Additive Modal */}
      {showAdditiveModal && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-black text-white mb-1 flex items-center space-x-2">
              <PlusCircle className="text-jcb-yellow" size={18} />
              <span>Additive Count (Multiple Bins)</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-3">
              Part <span className="font-mono font-bold text-white">{currentItem.itemNo}</span> currently has{' '}
              <span className="font-bold text-emerald-400">{currentItem.phy || 0}</span> pieces recorded.
            </p>

            <form onSubmit={handleAdditiveSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Additional Pieces Found in New Bin:
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  value={additionalQty}
                  onChange={(e) => setAdditionalQty(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-lg font-mono text-white focus:outline-none focus:border-jcb-yellow"
                />
              </div>

              {additionalQty && (
                <div className="p-2.5 rounded-lg bg-neutral-950 text-xs text-neutral-400 border border-neutral-800 font-mono">
                  New Total Count: <span className="text-jcb-yellow font-bold">{(currentItem.phy || 0) + (parseFloat(additionalQty) || 0)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdditiveModal(false)}
                  className="py-2.5 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-jcb-yellow text-neutral-950 text-xs font-black rounded-xl"
                >
                  Add & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unlisted Part Found on Rack Modal */}
      {showUnlistedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-base font-black text-white mb-1 flex items-center space-x-2">
              <Plus className="text-jcb-yellow" size={18} />
              <span>Add Physical Part Found (Not in SAP)</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-3">
              Found a physical part on warehouse shelf that was missing from SAP? Record it here as Excess.
            </p>

            <form onSubmit={handleUnlistedSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Part / Item Number *</label>
                <input
                  type="text"
                  required
                  value={unlistedItemNo}
                  onChange={(e) => setUnlistedItemNo(e.target.value)}
                  placeholder="e.g. 331/36009"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-jcb-yellow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Description</label>
                <input
                  type="text"
                  value={unlistedDesc}
                  onChange={(e) => setUnlistedDesc(e.target.value)}
                  placeholder="e.g. Flexible Coupling"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Physical Qty *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={unlistedQty}
                    onChange={(e) => setUnlistedQty(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-jcb-yellow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">MRP / Unit Price</label>
                  <input
                    type="number"
                    step="any"
                    value={unlistedMrp}
                    onChange={(e) => setUnlistedMrp(e.target.value)}
                    placeholder="1896"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-jcb-yellow"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Bin Location Found</label>
                <input
                  type="text"
                  value={unlistedLoc}
                  onChange={(e) => setUnlistedLoc(e.target.value)}
                  placeholder="e.g. Rack B-4"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white focus:outline-none focus:border-jcb-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlistedModal(false)}
                  className="py-2.5 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 bg-jcb-yellow text-neutral-950 text-xs font-black rounded-xl"
                >
                  Add to Audit List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
