import ExcelJS from 'exceljs';
import { ISSUE_CATEGORIES } from './storage';

export const generateAuditWorkbook = async (audit) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AuditX Mobile System';
  workbook.lastModifiedBy = audit.auditors || 'Internal Auditor';
  workbook.created = new Date();
  workbook.modified = new Date();

  const company = audit.companyName || 'JAYARAJ AUTOMOBILE AGENCY';
  const store = audit.storeName || 'TIRUNELVELI';
  const auditDate = audit.auditDate || new Date().toLocaleDateString('en-GB');
  const auditors = audit.auditors || 'V ARUMUGAM & S SIVA GANESH';
  const storeIC = audit.storeIncharge || 'ROBIN & VARATHARAJAN';
  const whse = audit.whseCode || 'DJ00016';
  const items = audit.items || [];

  // Helper styles
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' } // light gray
  };
  const titleFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFB800' } // JCB Yellow
  };
  const boldBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // -------------------------------------------------------------
  // 1. SHEET: Main Stock
  // -------------------------------------------------------------
  const wsMain = workbook.addWorksheet('Main Stock', { views: [{ showGridLines: true }] });

  wsMain.columns = [
    { width: 8 },  // A: S/No
    { width: 12 }, // B: MRP
    { width: 42 }, // C: Description
    { width: 22 }, // D: Item No
    { width: 10 }, // E: Stock
    { width: 10 }, // F: Phy
    { width: 10 }, // G: Shrt
    { width: 10 }, // H: Exc
    { width: 12 }, // I: Loc
    { width: 25 }, // J: Remarks
  ];

  // Title rows
  wsMain.mergeCells('A1:J1');
  wsMain.getCell('A1').value = company;
  wsMain.getCell('A1').font = { size: 14, bold: true };
  wsMain.getCell('A1').alignment = { horizontal: 'center' };

  wsMain.mergeCells('A2:J2');
  wsMain.getCell('A2').value = `${store} PARTS AUDIT ON ${auditDate}`;
  wsMain.getCell('A2').font = { size: 12, bold: true };
  wsMain.getCell('A2').alignment = { horizontal: 'center' };

  wsMain.mergeCells('A3:J3');
  wsMain.getCell('A3').value = `AUDIT BY ${auditors}             STORE I/C- ${storeIC}`;
  wsMain.getCell('A3').font = { size: 11, bold: true };

  wsMain.getCell('D5').value = 'Whse:';
  wsMain.getCell('D5').font = { bold: true };
  wsMain.getCell('E5').value = whse;
  wsMain.getCell('E5').font = { bold: true };

  // Table Headers
  const mainHeaders = ['S/No', 'MRP', 'Description', 'Item No', 'Stock', 'Phy', 'Shrt', 'Exc', 'Loc', 'Remarks'];
  const headerRow = wsMain.getRow(6);
  mainHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = headerFill;
    cell.border = boldBorder;
    cell.alignment = { horizontal: i === 2 ? 'left' : 'center' };
  });

  // Data rows
  items.forEach((item, idx) => {
    const rIdx = 7 + idx;
    const r = wsMain.getRow(rIdx);

    r.getCell(1).value = item.sNo || idx + 1;
    r.getCell(2).value = item.mrp || '';
    r.getCell(3).value = item.description || '';
    r.getCell(4).value = item.itemNo || '';
    r.getCell(5).value = item.stock || 0;
    r.getCell(6).value = item.phy !== null ? item.phy : '';
    r.getCell(7).value = item.shortage > 0 ? item.shortage : '';
    r.getCell(8).value = item.excess > 0 ? item.excess : '';
    r.getCell(9).value = item.loc || '';
    r.getCell(10).value = item.remarks || '';

    // Alignments & numbers
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).numFmt = '#,##0.00';
    r.getCell(5).numFmt = '#,##0.00';
    if (item.phy !== null) r.getCell(6).numFmt = '#,##0.00';
    if (item.shortage > 0) r.getCell(7).numFmt = '#,##0.00';
    if (item.excess > 0) r.getCell(8).numFmt = '#,##0.00';

    for (let c = 1; c <= 10; c++) {
      r.getCell(c).border = boldBorder;
    }
  });

  // -------------------------------------------------------------
  // 2. SHEET: Recheck
  // -------------------------------------------------------------
  const wsRecheck = workbook.addWorksheet('Recheck', { views: [{ showGridLines: true }] });
  wsRecheck.columns = [
    { width: 8 },  // S/No
    { width: 10 }, // O/S/No
    { width: 12 }, // MRP
    { width: 40 }, // Description
    { width: 22 }, // Item No
    { width: 10 }, // Qty
    { width: 30 }, // Remarks
  ];

  wsRecheck.mergeCells('A1:G1');
  wsRecheck.getCell('A1').value = company;
  wsRecheck.getCell('A1').font = { size: 13, bold: true };
  wsRecheck.getCell('A1').alignment = { horizontal: 'center' };

  wsRecheck.mergeCells('A2:G2');
  wsRecheck.getCell('A2').value = `${store} PARTS RECHECK ON ${auditDate}`;
  wsRecheck.getCell('A2').font = { size: 11, bold: true };
  wsRecheck.getCell('A2').alignment = { horizontal: 'center' };

  const recheckHeaders = ['S/No', 'O/S/No', 'MRP', 'Description', 'Item No', 'Qty', 'Remarks'];
  const rHeader = wsRecheck.getRow(5);
  recheckHeaders.forEach((h, i) => {
    const c = rHeader.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.fill = headerFill;
    c.border = boldBorder;
  });

  const recheckItems = items.filter(
    (item) => item.issueCategory === 'RECHECK' || (item.remarks && item.remarks.toLowerCase().includes('recheck'))
  );

  recheckItems.forEach((item, idx) => {
    const r = wsRecheck.getRow(6 + idx);
    r.getCell(1).value = idx + 1;
    r.getCell(2).value = item.sNo;
    r.getCell(3).value = item.mrp || 0;
    r.getCell(4).value = item.description;
    r.getCell(5).value = item.itemNo;
    r.getCell(6).value = item.shortage || item.excess || (item.stock - (item.phy || 0));
    r.getCell(7).value = item.remarks || '';
    for (let c = 1; c <= 7; c++) r.getCell(c).border = boldBorder;
  });

  // -------------------------------------------------------------
  // 3. SHEET: WTY (Warranty Requisition Pending Issues)
  // -------------------------------------------------------------
  const wsWty = workbook.addWorksheet('WTY', { views: [{ showGridLines: true }] });
  wsWty.columns = [
    { width: 8 },  // S.No
    { width: 10 }, // O.S.N
    { width: 12 }, // MRP
    { width: 36 }, // Item Description
    { width: 20 }, // Item No.
    { width: 8 },  // Qty
    { width: 14 }, // Value
    { width: 14 }, // Req No
    { width: 14 }, // Date
    { width: 14 }, // Mach No
    { width: 14 }, // Call ID
    { width: 22 }, // Cus.Name
    { width: 30 }, // Remarks
  ];

  wsWty.mergeCells('A1:M1');
  wsWty.getCell('A1').value = `${store} PARTS AUDIT ON ${auditDate}`;
  wsWty.getCell('A1').font = { size: 12, bold: true };

  wsWty.mergeCells('A2:M2');
  wsWty.getCell('A2').value = 'WARRANTY REQUISITION PENDING ISSUES';
  wsWty.getCell('A2').font = { size: 11, bold: true };

  const wtyHeaders = ['S.No', 'O.S.N', 'MRP', 'Item Description', 'Item No.', 'Qty', 'Value', 'Req No', 'Date', 'Mach No', 'Call ID', 'Cus.Name', 'Remarks'];
  const wtyRow = wsWty.getRow(4);
  wtyHeaders.forEach((h, i) => {
    const c = wtyRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.fill = headerFill;
    c.border = boldBorder;
  });

  const wtyItems = items.filter((item) => item.issueCategory === 'WTYP');
  let wtyTotal = 0;

  wtyItems.forEach((item, idx) => {
    const r = wsWty.getRow(5 + idx);
    const details = item.issueDetails || {};
    const qty = details.qty || item.shortage || 1;
    const val = parseFloat(((item.mrp || 0) * qty).toFixed(2));
    wtyTotal += val;

    r.getCell(1).value = idx + 1;
    r.getCell(2).value = item.sNo;
    r.getCell(3).value = item.mrp || 0;
    r.getCell(4).value = item.description;
    r.getCell(5).value = item.itemNo;
    r.getCell(6).value = qty;
    r.getCell(7).value = val;
    r.getCell(8).value = details.reqNo || '';
    r.getCell(9).value = details.date || '';
    r.getCell(10).value = details.machNo || '';
    r.getCell(11).value = details.callId || '';
    r.getCell(12).value = details.cusName || '';
    r.getCell(13).value = details.remarks || item.remarks || '';

    r.getCell(3).numFmt = '#,##0.00';
    r.getCell(7).numFmt = '#,##0.00';
    for (let c = 1; c <= 13; c++) r.getCell(c).border = boldBorder;
  });

  // Total row
  if (wtyItems.length > 0) {
    const totRow = wsWty.getRow(5 + wtyItems.length);
    totRow.getCell(6).value = 'Total';
    totRow.getCell(6).font = { bold: true };
    totRow.getCell(7).value = wtyTotal;
    totRow.getCell(7).font = { bold: true };
    totRow.getCell(7).numFmt = '#,##0.00';
  }

  // -------------------------------------------------------------
  // 4. SHEET: WKSP (Workshop Requisition Pending Issues)
  // -------------------------------------------------------------
  const wsWksp = workbook.addWorksheet('WKSP', { views: [{ showGridLines: true }] });
  wsWksp.columns = [
    { width: 8 },  // S.No
    { width: 12 }, // MRP
    { width: 36 }, // Item Description
    { width: 20 }, // Item No.
    { width: 8 },  // Qty
    { width: 14 }, // Value
    { width: 16 }, // Req No/QTN No
    { width: 14 }, // Date
    { width: 14 }, // Mach No
    { width: 14 }, // Call ID
    { width: 22 }, // Cus.Name
    { width: 30 }, // Remarks
  ];

  wsWksp.mergeCells('A1:L1');
  wsWksp.getCell('A1').value = `${store} PARTS AUDIT ON ${auditDate}`;
  wsWksp.getCell('A1').font = { size: 12, bold: true };

  wsWksp.mergeCells('A2:L2');
  wsWksp.getCell('A2').value = 'WORKSHOP REQUISITION PENDING ISSUES';
  wsWksp.getCell('A2').font = { size: 11, bold: true };

  const wkspHeaders = ['S.No', 'MRP', 'Item Description', 'Item No.', 'Qty', 'Value', 'Req No/QTN No', 'Date', 'Mach No', 'Call ID', 'Cus.Name', 'Remarks'];
  const wkspRow = wsWksp.getRow(4);
  wkspHeaders.forEach((h, i) => {
    const c = wkspRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.fill = headerFill;
    c.border = boldBorder;
  });

  const wkspItems = items.filter((item) => item.issueCategory === 'WKSPP');
  let wkspTotal = 0;

  wkspItems.forEach((item, idx) => {
    const r = wsWksp.getRow(5 + idx);
    const details = item.issueDetails || {};
    const qty = details.qty || item.shortage || 1;
    const val = parseFloat(((item.mrp || 0) * qty).toFixed(2));
    wkspTotal += val;

    r.getCell(1).value = idx + 1;
    r.getCell(2).value = item.mrp || 0;
    r.getCell(3).value = item.description;
    r.getCell(4).value = item.itemNo;
    r.getCell(5).value = qty;
    r.getCell(6).value = val;
    r.getCell(7).value = details.reqNo || details.qtnNo || '';
    r.getCell(8).value = details.date || '';
    r.getCell(9).value = details.machNo || '';
    r.getCell(10).value = details.callId || '';
    r.getCell(11).value = details.cusName || '';
    r.getCell(12).value = details.remarks || item.remarks || '';

    r.getCell(2).numFmt = '#,##0.00';
    r.getCell(6).numFmt = '#,##0.00';
    for (let c = 1; c <= 12; c++) r.getCell(c).border = boldBorder;
  });

  if (wkspItems.length > 0) {
    const totRow = wsWksp.getRow(5 + wkspItems.length);
    totRow.getCell(5).value = 'Total';
    totRow.getCell(5).font = { bold: true };
    totRow.getCell(6).value = wkspTotal;
    totRow.getCell(6).font = { bold: true };
    totRow.getCell(6).numFmt = '#,##0.00';
  }

  // -------------------------------------------------------------
  // 5. SHEET: STN & OPEN DY
  // -------------------------------------------------------------
  const wsStn = workbook.addWorksheet('STN & OPEN DY', { views: [{ showGridLines: true }] });
  wsStn.columns = [
    { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 },
    { width: 20 }, { width: 32 }, { width: 8 },  { width: 14 }, { width: 14 }
  ];

  wsStn.mergeCells('A1:I1');
  wsStn.getCell('A1').value = `${store} JCB PARTS AUDIT ON ${auditDate}`;
  wsStn.getCell('A1').font = { size: 12, bold: true };

  wsStn.mergeCells('A2:I2');
  wsStn.getCell('A2').value = `STN INWARD PENDING ON 01.01.21 TO ${auditDate}`;
  wsStn.getCell('A2').font = { size: 11, bold: true };

  const stnHeaders = ['Branch From', 'Branch To', 'Del No', 'Del. date', 'Part No', 'Part Desc.', 'Qty', 'Inward No', 'Date'];
  const stnRow = wsStn.getRow(4);
  stnHeaders.forEach((h, i) => {
    const c = stnRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.fill = headerFill;
    c.border = boldBorder;
  });

  const stnItems = items.filter((item) => item.issueCategory === 'STNDELP');
  stnItems.forEach((item, idx) => {
    const r = wsStn.getRow(5 + idx);
    const d = item.issueDetails || {};
    r.getCell(1).value = d.branchFrom || '';
    r.getCell(2).value = d.branchTo || store;
    r.getCell(3).value = d.delNo || '';
    r.getCell(4).value = d.delDate || '';
    r.getCell(5).value = item.itemNo;
    r.getCell(6).value = item.description;
    r.getCell(7).value = d.qty || item.shortage || item.excess || 1;
    r.getCell(8).value = d.inwardNo || '';
    r.getCell(9).value = d.inwardDate || '';
    for (let c = 1; c <= 9; c++) r.getCell(c).border = boldBorder;
  });

  // Open delivery sub-section
  const openDyStart = 7 + stnItems.length;
  wsStn.mergeCells(`A${openDyStart}:J${openDyStart}`);
  wsStn.getCell(`A${openDyStart}`).value = `${store} PARTS OPEN DELIVERY PENDING ON 01.01.21 TO ${auditDate}`;
  wsStn.getCell(`A${openDyStart}`).font = { size: 11, bold: true };

  const openDyHeaders = ['Delivery No.', 'DeliveryDate', 'Cust. Code', 'Customer Name', 'Part No', 'Part Desc', 'Qty', 'Branch', 'Inward No', 'Date'];
  const openDyHeaderRow = wsStn.getRow(openDyStart + 2);
  openDyHeaders.forEach((h, i) => {
    const c = openDyHeaderRow.getCell(i + 1);
    c.value = h;
    c.font = { bold: true };
    c.fill = headerFill;
    c.border = boldBorder;
  });

  const openDyItems = items.filter((item) => item.issueCategory === 'OPENDELP');
  openDyItems.forEach((item, idx) => {
    const r = wsStn.getRow(openDyStart + 3 + idx);
    const d = item.issueDetails || {};
    r.getCell(1).value = d.delNo || '';
    r.getCell(2).value = d.delDate || '';
    r.getCell(3).value = d.custCode || '';
    r.getCell(4).value = d.customerName || '';
    r.getCell(5).value = item.itemNo;
    r.getCell(6).value = item.description;
    r.getCell(7).value = d.qty || item.shortage || item.excess || 1;
    r.getCell(8).value = d.branch || whse;
    r.getCell(9).value = d.inwardNo || '';
    r.getCell(10).value = d.inwardDate || '';
    for (let c = 1; c <= 10; c++) r.getCell(c).border = boldBorder;
  });

  // -------------------------------------------------------------
  // 6. SHEET: Chairman Sir Report
  // -------------------------------------------------------------
  const wsChair = workbook.addWorksheet('Chairman Sir Report', { views: [{ showGridLines: true }] });
  wsChair.columns = [
    { width: 8 },  // S/N
    { width: 10 }, // O.S.No
    { width: 12 }, // MRP
    { width: 36 }, // Description
    { width: 22 }, // Part No
    { width: 8 },  // QTY
    { width: 14 }, // Value
    { width: 36 }, // Remarks
  ];

  wsChair.mergeCells('D1:F1');
  wsChair.getCell('D1').value = 'CHAIRMAN SIR REPORT';
  wsChair.getCell('D1').font = { size: 14, bold: true, color: { argb: 'FF000000' } };
  wsChair.getCell('D1').alignment = { horizontal: 'center' };

  wsChair.getCell('A3').value = company;
  wsChair.getCell('A3').font = { size: 12, bold: true };
  wsChair.getCell('A4').value = `${store} PARTS AUDIT ON ${auditDate}`;
  wsChair.getCell('A4').font = { size: 11, bold: true };
  wsChair.getCell('A5').value = `AUDIT BY ${auditors}`;
  wsChair.getCell('A5').font = { size: 10, bold: true };

  // Calculate statistics
  const shortageItems = items.filter((i) => i.status === 'shortage');
  const excessItems = items.filter((i) => i.status === 'excess');
  const shortageValue = shortageItems.reduce((acc, i) => acc + (i.shortage * (i.mrp || 0)), 0);
  const excessValue = excessItems.reduce((acc, i) => acc + (i.excess * (i.mrp || 0)), 0);

  const stats = [
    ['Cash In Hand', `: Rs. ${audit.cashInHand || '58,500/-'} Correct as per Account statement balance.`],
    ['Last Bill No', `: ${audit.lastBillNo || '251324212 dt 22.4.25'}`],
    ['Shortage', `: ${shortageItems.length === 0 ? 'NIL' : `${shortageItems.length} Lines (Rs. ${shortageValue.toLocaleString('en-IN')})`}`],
    ['Excess', `: ${excessItems.length} Lines (Rs. ${excessValue.toLocaleString('en-IN')})`],
    ['Warranty Pending', `: ${wtyItems.length} Lines (Rs. ${wtyTotal.toLocaleString('en-IN')})`],
    ['WKSP Requisition', `: ${wkspItems.length} Lines (Rs. ${wkspTotal.toLocaleString('en-IN')})`],
    ['Main Stock', `: ${items.length} Lines`],
    ['Petty Cash', `: ${audit.pettyCash || 'NIL'}`],
    ['STN Pending', `: ${stnItems.length === 0 ? 'NIL' : `${stnItems.length} Lines`}`],
    ['Open Del Pending', `: ${openDyItems.length === 0 ? 'NIL' : `${openDyItems.length} Lines`}`],
    ['CREDIT BILL PENDING', `: Rs. ${audit.creditBillPending || '14,55,101/-'}`],
  ];

  let curRow = 7;
  stats.forEach(([label, val]) => {
    wsChair.getCell(`A${curRow}`).value = label;
    wsChair.getCell(`A${curRow}`).font = { bold: true };
    wsChair.getCell(`E${curRow}`).value = val;
    curRow++;
  });

  // Table Generator Helper for Issue Subtables in Chairman report
  const appendSubTable = (title, categoryCode) => {
    curRow += 2;
    wsChair.getCell(`A${curRow}`).value = title;
    wsChair.getCell(`A${curRow}`).font = { bold: true, size: 11 };

    curRow += 2;
    const subHeaders = ['S/N', 'O.S.No', 'MRP', 'Description', 'Part No', 'QTY', 'Value', 'Remarks'];
    const rHead = wsChair.getRow(curRow);
    subHeaders.forEach((h, i) => {
      const c = rHead.getCell(i + 1);
      c.value = h;
      c.font = { bold: true };
      c.fill = headerFill;
      c.border = boldBorder;
    });

    const groupItems = items.filter((i) => i.issueCategory === categoryCode);
    let subTot = 0;

    groupItems.forEach((item, idx) => {
      curRow++;
      const r = wsChair.getRow(curRow);
      const d = item.issueDetails || {};
      const qty = d.qty || item.shortage || item.excess || 1;
      const val = parseFloat(((item.mrp || 0) * qty).toFixed(2));
      subTot += val;

      r.getCell(1).value = idx + 1;
      r.getCell(2).value = item.sNo;
      r.getCell(3).value = item.mrp || 0;
      r.getCell(4).value = item.description;
      r.getCell(5).value = item.itemNo;
      r.getCell(6).value = qty;
      r.getCell(7).value = val;
      r.getCell(8).value = d.remarks || d.billInfo || item.remarks || '';

      r.getCell(3).numFmt = '#,##0.00';
      r.getCell(7).numFmt = '#,##0.00';
      for (let c = 1; c <= 8; c++) r.getCell(c).border = boldBorder;
    });

    if (groupItems.length > 0) {
      curRow++;
      const totR = wsChair.getRow(curRow);
      totR.getCell(6).value = 'Total';
      totR.getCell(6).font = { bold: true };
      totR.getCell(7).value = subTot;
      totR.getCell(7).font = { bold: true };
      totR.getCell(7).numFmt = '#,##0.00';
    }
  };

  appendSubTable('CUSTOMER BILL PENDING ISSUES CLEARED DURING AUDIT PERIOD', 'CBPL');
  appendSubTable('DELIVERY PENDING ISSUES CLEARED', 'DLPI');
  appendSubTable('JCB DISCREPANCY IN SYSTEM STOCK MAIL RAISED', 'JCBDESP');
  appendSubTable('INTERCHANGE PARTS RECEIVED FROM JCB MAIL RAISED', 'ITRCHPISU');
  appendSubTable('GODOWN ISSUES PENDING', 'GWNPI');
  appendSubTable('EXCESS PARTS WITH SYSTEM STOCK', 'EXCPI');
  appendSubTable('EXCESS PARTS WITHOUT SYSTEM STOCK ISSUES CLEARED', 'EXCCFM');

  // Records Maintenance Table
  curRow += 3;
  wsChair.getCell(`A${curRow}`).value = 'RECORDS MAINT';
  wsChair.getCell(`A${curRow}`).font = { bold: true, size: 11 };

  curRow += 2;
  wsChair.getRow(curRow).getCell(1).value = 'S/N';
  wsChair.getRow(curRow).getCell(2).value = 'Documents';
  wsChair.getRow(curRow).getCell(5).value = 'Remarks';
  wsChair.getRow(curRow).font = { bold: true };

  const checklist = audit.checklist || [];
  checklist.forEach((chk, idx) => {
    curRow++;
    wsChair.getRow(curRow).getCell(1).value = idx + 1;
    wsChair.getRow(curRow).getCell(2).value = chk.name;
    wsChair.getRow(curRow).getCell(5).value = chk.status + (chk.remarks ? ` - ${chk.remarks}` : '');
  });

  // Observations / Points
  curRow += 3;
  wsChair.getCell(`A${curRow}`).value = 'POINTS:-';
  wsChair.getCell(`A${curRow}`).font = { bold: true };

  const points = audit.points || [
    '1. JCB Store Housekeeping done.',
    '2. Parts Bin location 65% done.',
    '3. Self audit not done.',
    '4. JCB invoice and Castrol invoice inward pending yet to be check.'
  ];
  points.forEach((p) => {
    curRow++;
    wsChair.getCell(`B${curRow}`).value = p;
  });

  // Signatures
  curRow += 3;
  wsChair.getCell(`A${curRow}`).value = `Auditor Signature: ${audit.auditors || ''}`;
  wsChair.getCell(`A${curRow}`).font = { bold: true };
  wsChair.getCell(`F${curRow}`).value = `Chairman Approval: ${audit.chairmanApproved ? 'APPROVED & SIGNED' : 'PENDING APPROVAL'}`;
  wsChair.getCell(`F${curRow}`).font = { bold: true, color: { argb: audit.chairmanApproved ? 'FF008000' : 'FFCC0000' } };

  // -------------------------------------------------------------
  // 7. SHEET: DETAILS (Standard Reference Sheet)
  // -------------------------------------------------------------
  const wsDetails = workbook.addWorksheet('DETAILS', { views: [{ showGridLines: true }] });
  wsDetails.columns = [{ width: 10 }, { width: 40 }, { width: 14 }];

  wsDetails.mergeCells('A1:C1');
  wsDetails.getCell('A1').value = 'JCB PARTS AUDIT SYSTEM CREATE POINTS & ISSUE CATEGORIES';
  wsDetails.getCell('A1').font = { bold: true, size: 12 };

  wsDetails.getRow(3).getCell(1).value = 'S/N';
  wsDetails.getRow(3).getCell(2).value = 'DETAILS';
  wsDetails.getRow(3).getCell(3).value = 'CODE';
  wsDetails.getRow(3).font = { bold: true };

  ISSUE_CATEGORIES.forEach((cat, idx) => {
    const r = wsDetails.getRow(4 + idx);
    r.getCell(1).value = idx + 1;
    r.getCell(2).value = cat.name;
    r.getCell(3).value = cat.code;
    for (let c = 1; c <= 3; c++) r.getCell(c).border = boldBorder;
  });

  // Generate binary buffer & trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = (store || 'AUDIT').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = (auditDate || '').replace(/[^a-zA-Z0-9]/g, '.');

  anchor.href = url;
  anchor.download = `${safeName}_Parts_Audit_on_${safeDate}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};
