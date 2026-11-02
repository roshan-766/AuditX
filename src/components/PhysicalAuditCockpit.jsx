import React, { useState, useEffect } from 'react';
import { 
  Check, ArrowRight, ArrowLeft, Search, Plus, MapPin, 
  FileText, AlertTriangle, CheckCircle2, RotateCcw, 
  Volume2, VolumeX, PlusCircle, X, ChevronRight, Hash, Layers
} from 'lucide-react';

export const PhysicalAuditCockpit = ({ audit, onUpdateItem, onAddUnlistedItem }) => {
  const items = audit.items || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'uncounted' | 'matched' | 'discrepancy'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active Item Data
  const currentItem = items[currentIndex] || null;
  const [inputVal, setInputVal] = useState('');
  const [locVal, setLocVal] = useState('');
  const [remarksVal, setRemarksVal] = useState('');

  // Modals & Sheets
  const [showKeypadSheet, setShowKeypadSheet] = useState(false);
  const [showAdditiveSheet, setShowAdditiveSheet] = useState(false);
  const [additionalQty, setAdditionalQty] = useState('');
  const [showUnlistedSheet, setShowUnlistedSheet] = useState(false);
  const [showSearchSheet, setShowSearchSheet] = useState(false);

  // Unlisted item form
  const [unlistedItemNo, setUnlistedItemNo] = useState('');
  const [unlistedDesc, setUnlistedDesc] = useState('');
  const [unlistedMrp, setUnlistedMrp] = useState('');
  const [unlistedQty, setUnlistedQty] = useState('');
  const [unlistedLoc, setUnlistedLoc] = useState('');

  // Sync state on current item change
  useEffect(() => {
    if (currentItem) {
      setInputVal(currentItem.phy !== null ? String(currentItem.phy) : '');
      setLocVal(currentItem.loc || '');
      setRemarksVal(currentItem.remarks || '');
    }
  }, [currentIndex, currentItem]);

  // Audio / Vibration Feedback
  const triggerHaptic = (isMatch = true) => {
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = isMatch ? 880 : 440;
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (err) {}
    }
    if (navigator.vibrate) {
      navigator.vibrate(isMatch ? 35 : [50, 40, 50]);
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
      triggerHaptic(status === 'matched');
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

  // Stepper buttons (+1 / -1)
  const handleStep = (delta) => {
    if (!currentItem) return;
    const current = inputVal !== '' ? parseFloat(inputVal) : (currentItem.phy !== null ? currentItem.phy : currentItem.stock);
    const nextVal = Math.max(0, parseFloat((current + delta).toFixed(2)));
    setInputVal(String(nextVal));
    commitCount(nextVal, false);
  };

  // Quick Action Buttons
  const handleQuickMatch = () => {
    if (!currentItem) return;
    setInputVal(String(currentItem.stock));
    commitCount(currentItem.stock, true);
  };

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

  // Additive Counting Modal
  const handleAdditiveSubmit = (e) => {
    e.preventDefault();
    const addNum = parseFloat(additionalQty);
    if (!isNaN(addNum)) {
      const currentCount = currentItem.phy !== null ? currentItem.phy : 0;
      const newTotal = parseFloat((currentCount + addNum).toFixed(2));
      setInputVal(String(newTotal));
      commitCount(newTotal, false);
      setShowAdditiveSheet(false);
      setAdditionalQty('');
    }
  };

  // Unlisted Part Submit
  const handleUnlistedSubmit = (e) => {
    e.preventDefault();
    const qty = parseFloat(unlistedQty) || 1;
    const mrp = parseFloat(unlistedMrp) || 0;

    onAddUnlistedItem({
      itemNo: unlistedItemNo.trim(),
      description: unlistedDesc.trim() || 'Physical Part (Unlisted in SAP)',
      mrp: mrp,
      stock: 0,
      phy: qty,
      shortage: 0,
      excess: qty,
      status: 'excess',
      loc: unlistedLoc.trim(),
      remarks: 'Found on shelf — Not in SAP export',
      issueCategory: 'EXCCFM'
    });

    setShowUnlistedSheet(false);
    setUnlistedItemNo('');
    setUnlistedDesc('');
    setUnlistedMrp('');
    setUnlistedQty('');
    setUnlistedLoc('');
  };

  // Filter List
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

  // Summary Metrics
  const totalCount = items.length;
  const countedCount = items.filter((i) => i.status !== 'uncounted').length;
  const matchedCount = items.filter((i) => i.status === 'matched').length;
  const discrepancyCount = items.filter((i) => i.status === 'shortage' || i.status === 'excess').length;
  const progressPercent = totalCount > 0 ? Math.round((countedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-md mx-auto px-3.5 pt-3 pb-24 font-sans">
      {/* 1. Mobile Status & Progress Strip */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 mb-3 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-bold text-neutral-300">
            Progress: <strong className="text-amber-400 font-mono">{countedCount}</strong> / {totalCount} ({progressPercent}%)
          </span>
          <div className="flex items-center space-x-2 text-[11px] font-bold font-mono">
            <span className="text-emerald-400">✓ {matchedCount}</span>
            <span className="text-red-400">⚠ {discrepancyCount}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="h-full bg-amber-400 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-1.5 mt-2.5 overflow-x-auto text-[11px] font-semibold">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'uncounted', label: `Pending (${totalCount - countedCount})` },
            { id: 'matched', label: `Matched (${matchedCount})` },
            { id: 'discrepancy', label: `Mismatched (${discrepancyCount})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilterMode(f.id); setCurrentIndex(0); }}
              className={`px-2.5 py-1 rounded-lg transition active-press whitespace-nowrap ${
                filterMode === f.id
                  ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top Action Strip: Search / Add Unlisted / Mute */}
      <div className="flex items-center space-x-2 mb-3">
        <button
          onClick={() => setShowSearchSheet(true)}
          className="flex-1 flex items-center justify-between px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-400 hover:text-white transition active-press"
        >
          <div className="flex items-center space-x-2">
            <Search size={14} className="text-neutral-500" />
            <span className="truncate">{searchTerm || 'Search Part No, Desc, Line #...'}</span>
          </div>
          <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono">
            {currentIndex + 1}/{filteredList.length}
          </span>
        </button>

        <button
          onClick={() => setShowUnlistedSheet(true)}
          className="flex items-center space-x-1 px-3 py-2 bg-neutral-900 border border-neutral-800 text-amber-400 rounded-xl text-xs font-bold active-press whitespace-nowrap hover:bg-neutral-800"
        >
          <Plus size={14} />
          <span>Add Part</span>
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 rounded-xl active-press hover:text-white"
        >
          {soundEnabled ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* 3. The Main Warehouse Focus Card */}
      {currentItem ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 shadow-lg mb-3 relative overflow-hidden">
          {/* Header Strip: Line No & Status Indicator */}
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-neutral-400 text-xs font-mono font-bold border border-neutral-800">
              #{currentItem.sNo}
            </span>

            {/* Status Pill */}
            {currentItem.status === 'matched' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 size={12} />
                <span>MATCHED</span>
              </span>
            )}
            {currentItem.status === 'shortage' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center space-x-1">
                <AlertTriangle size={12} />
                <span>SHORT: -{currentItem.shortage}</span>
              </span>
            )}
            {currentItem.status === 'excess' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                <Plus size={12} />
                <span>EXCESS: +{currentItem.excess}</span>
              </span>
            )}
            {currentItem.status === 'uncounted' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium text-neutral-500 bg-neutral-800/80">
                PENDING
              </span>
            )}
          </div>

          {/* Part Number (Massive & Clear) */}
          <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight leading-tight mb-1 select-text">
            {currentItem.itemNo}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm font-semibold text-neutral-300 leading-snug mb-3">
            {currentItem.description}
          </p>

          {/* MRP & SAP Stock Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-neutral-950 rounded-2xl border border-neutral-800/80 mb-3.5">
            <div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                System Stock (SAP)
              </span>
              <div className="text-lg font-black font-mono text-white">
                {currentItem.stock}{' '}
                <span className="text-xs font-normal text-neutral-400">{currentItem.uom || 'NOS'}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                Unit MRP
              </span>
              <div className="text-lg font-black font-mono text-amber-400">
                ₹{Number(currentItem.mrp || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Count Stepper & Keypad Trigger Area */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-400">Physical Count Available:</span>
              {currentItem.phy !== null && (
                <button
                  type="button"
                  onClick={() => setShowAdditiveSheet(true)}
                  className="text-amber-400 text-xs font-bold flex items-center space-x-1 hover:underline active-press"
                >
                  <Layers size={13} />
                  <span>Split Bin (+)</span>
                </button>
              )}
            </div>

            {/* Stepper Input */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="w-12 h-14 rounded-2xl bg-neutral-800 text-white font-black text-2xl flex items-center justify-center border border-neutral-700 active-press hover:bg-neutral-700"
              >
                -
              </button>

              <button
                type="button"
                onClick={() => setShowKeypadSheet(true)}
                className="flex-1 h-14 bg-neutral-950 border-2 border-neutral-700/80 rounded-2xl flex items-center justify-center text-3xl font-black font-mono text-white active-press"
              >
                {inputVal !== '' ? inputVal : <span className="text-neutral-600 text-lg">Tap to Enter Qty</span>}
              </button>

              <button
                type="button"
                onClick={() => handleStep(+1)}
                className="w-12 h-14 rounded-2xl bg-neutral-800 text-white font-black text-2xl flex items-center justify-center border border-neutral-700 active-press hover:bg-neutral-700"
              >
                +
              </button>
            </div>
          </div>

          {/* THE TWO GIANT ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* MATCH BUTTON */}
            <button
              type="button"
              onClick={handleQuickMatch}
              className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/40 active-press"
            >
              <Check size={18} strokeWidth={3} />
              <span>= Match ({currentItem.stock})</span>
            </button>

            {/* ZERO EMPTY BUTTON */}
            <button
              type="button"
              onClick={handleQuickZero}
              className="py-3.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-extrabold text-sm rounded-2xl flex items-center justify-center space-x-1.5 border border-neutral-700 active-press"
            >
              <span>0 (Empty Bin)</span>
            </button>
          </div>

          {/* Quick Location & Note Input (Collapsible/Inline) */}
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div>
              <input
                type="text"
                value={locVal}
                onChange={(e) => setLocVal(e.target.value)}
                placeholder="Rack/Bin Loc (e.g. A-12)"
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 text-xs font-mono"
              />
            </div>
            <div>
              <input
                type="text"
                value={remarksVal}
                onChange={(e) => setRemarksVal(e.target.value)}
                placeholder="Note / remark..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 text-xs"
              />
            </div>
          </div>

          {/* Bottom Card Navigation */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-800/80">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 flex items-center space-x-1 active-press"
            >
              <ArrowLeft size={14} />
              <span>Prev</span>
            </button>

            <span className="text-[11px] text-neutral-500 font-mono">
              {currentIndex + 1} / {filteredList.length}
            </span>

            <button
              type="button"
              disabled={currentIndex >= filteredList.length - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(filteredList.length - 1, prev + 1))}
              className="px-3.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-30 flex items-center space-x-1 active-press"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center text-neutral-400">
          <p className="font-bold text-sm mb-1">No items match your filter.</p>
          <button
            onClick={() => { setSearchTerm(''); setFilterMode('all'); }}
            className="mt-3 px-4 py-2 bg-neutral-800 text-white text-xs font-bold rounded-xl hover:bg-neutral-700"
          >
            Show All Parts
          </button>
        </div>
      )}

      {/* 4. KEYPAD BOTTOM SHEET */}
      {showKeypadSheet && currentItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-t border-neutral-700 rounded-t-3xl p-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs text-neutral-400 font-mono font-bold">Part: {currentItem.itemNo}</span>
                <h4 className="text-sm font-bold text-white">Enter Physical Quantity</h4>
              </div>
              <button
                onClick={() => setShowKeypadSheet(false)}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Display */}
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 text-center mb-3">
              <span className="text-3xl font-black font-mono text-white">
                {inputVal || '0'}
              </span>
            </div>

            {/* 4x3 Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className="py-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-white font-mono text-xl font-bold active-press hover:bg-neutral-800"
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                commitCount(inputVal === '' ? null : parseFloat(inputVal), true);
                setShowKeypadSheet(false);
              }}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black rounded-2xl text-sm transition active-press"
            >
              Confirm Count & Advance →
            </button>
          </div>
        </div>
      )}

      {/* 5. MULTI-BIN ADDITIVE SHEET */}
      {showAdditiveSheet && currentItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-t border-neutral-700 rounded-t-3xl p-5 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white">Additive Count (Multiple Bins)</h4>
              <button onClick={() => setShowAdditiveSheet(false)} className="text-neutral-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Currently recorded: <strong className="text-emerald-400 font-mono">{currentItem.phy || 0}</strong> pieces.
            </p>

            <form onSubmit={handleAdditiveSubmit} className="space-y-3">
              <input
                type="number"
                step="any"
                autoFocus
                required
                value={additionalQty}
                onChange={(e) => setAdditionalQty(e.target.value)}
                placeholder="Pieces found in new bin..."
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-2xl text-xl font-mono text-white text-center focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdditiveSheet(false)}
                  className="py-3 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 bg-amber-400 text-neutral-950 text-xs font-black rounded-2xl"
                >
                  Add to Total
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD UNLISTED PART SHEET */}
      {showUnlistedSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-t border-neutral-700 rounded-t-3xl p-5 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-white">Add Part Found on Shelf (Not in SAP)</h4>
              <button onClick={() => setShowUnlistedSheet(false)} className="text-neutral-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUnlistedSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Part Number *</label>
                <input
                  type="text"
                  required
                  value={unlistedItemNo}
                  onChange={(e) => setUnlistedItemNo(e.target.value)}
                  placeholder="e.g. 331/36009"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Description</label>
                <input
                  type="text"
                  value={unlistedDesc}
                  onChange={(e) => setUnlistedDesc(e.target.value)}
                  placeholder="e.g. Flexible Coupling"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Qty Found *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={unlistedQty}
                    onChange={(e) => setUnlistedQty(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-400 mb-1">Unit Price / MRP</label>
                  <input
                    type="number"
                    step="any"
                    value={unlistedMrp}
                    onChange={(e) => setUnlistedMrp(e.target.value)}
                    placeholder="1896"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-400 mb-1">Bin Location</label>
                <input
                  type="text"
                  value={unlistedLoc}
                  onChange={(e) => setUnlistedLoc(e.target.value)}
                  placeholder="Rack B-4"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-700 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlistedSheet(false)}
                  className="py-3 bg-neutral-800 text-neutral-300 text-xs font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 bg-amber-400 text-neutral-950 text-xs font-black rounded-2xl"
                >
                  Add to Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. SEARCH & QUICK JUMP SHEET */}
      {showSearchSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-900 border-t border-neutral-700 rounded-t-3xl p-4 shadow-2xl animate-slide-up h-[85vh] flex flex-col">
            <div className="flex items-center space-x-2 pb-3 border-b border-neutral-800">
              <Search size={16} className="text-neutral-500" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search part #, name, or index..."
                className="flex-1 bg-transparent text-sm text-white focus:outline-none"
              />
              <button onClick={() => setShowSearchSheet(false)} className="text-neutral-400 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 pt-2">
              {filteredList.slice(0, 80).map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    const originalIdx = items.findIndex((i) => i.id === item.id);
                    if (originalIdx >= 0) setCurrentIndex(originalIdx);
                    setShowSearchSheet(false);
                  }}
                  className="w-full py-2.5 px-2 flex items-center justify-between text-left active-press hover:bg-neutral-800/60 rounded-xl"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-white">{item.itemNo}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">#{item.sNo}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white block">Stock: {item.stock}</span>
                    <span className={`text-[10px] font-bold ${
                      item.status === 'matched' ? 'text-emerald-400' : item.status === 'shortage' ? 'text-red-400' : 'text-neutral-500'
                    }`}>
                      {item.phy !== null ? `Phy: ${item.phy}` : 'Pending'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
