import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateAuditPDF = (audit) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const company = audit.companyName || 'JAYARAJ AUTOMOBILE AGENCY';
  const store = audit.storeName || 'TIRUNELVELI';
  const auditDate = audit.auditDate || new Date().toLocaleDateString('en-GB');
  const auditors = audit.auditors || 'V ARUMUGAM & S SIVA GANESH';
  const storeIC = audit.storeIncharge || 'ROBIN & VARATHARAJAN';
  const whse = audit.whseCode || 'DJ00016';
  const items = audit.items || [];

  const shortageItems = items.filter((i) => i.status === 'shortage');
  const excessItems = items.filter((i) => i.status === 'excess');
  const matchedItems = items.filter((i) => i.status === 'matched');
  const uncountedItems = items.filter((i) => i.status === 'uncounted');

  const shortageValue = shortageItems.reduce((acc, i) => acc + (i.shortage * (i.mrp || 0)), 0);
  const excessValue = excessItems.reduce((acc, i) => acc + (i.excess * (i.mrp || 0)), 0);
  const totalStockValue = items.reduce((acc, i) => acc + (i.stock * (i.mrp || 0)), 0);

  // 1. Header Banner
  doc.setFillColor(18, 18, 18); // Dark industrial background
  doc.rect(0, 0, 210, 36, 'F');

  // Accent Line (JCB Yellow)
  doc.setFillColor(255, 184, 0);
  doc.rect(0, 36, 210, 2, 'F');

  doc.setTextColor(255, 184, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company, 14, 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${store} PARTS AUDIT REPORT — ${auditDate}`, 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text(`Auditors: ${auditors}  |  Store I/C: ${storeIC}  |  Warehouse: ${whse}`, 14, 30);

  // 2. Executive KPI Box Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text('EXECUTIVE AUDIT SUMMARY', 14, 46);

  const kpis = [
    ['Total Stock Lines', `${items.length} Items`, 'System Value', `Rs. ${totalStockValue.toLocaleString('en-IN')}`],
    ['Audit Matched', `${matchedItems.length} Items (${((matchedItems.length / (items.length || 1)) * 100).toFixed(1)}%)`, 'Uncounted Lines', `${uncountedItems.length} Items`],
    ['Shortage Lines', `${shortageItems.length} Items`, 'Shortage Value', `Rs. ${shortageValue.toLocaleString('en-IN')}`],
    ['Excess Lines', `${excessItems.length} Items`, 'Excess Value', `Rs. ${excessValue.toLocaleString('en-IN')}`],
    ['Cash In Hand', `Rs. ${audit.cashInHand || '58,500/-'}`, 'Last Bill No', audit.lastBillNo || '251324212'],
    ['Chairman Approval', audit.chairmanApproved ? 'APPROVED & VERIFIED' : 'PENDING APPROVAL', 'Sign-Off Date', audit.approvedAt ? new Date(audit.approvedAt).toLocaleDateString() : 'Pending']
  ];

  autoTable(doc, {
    startY: 49,
    head: [['Metric', 'Value', 'Financial Parameter', 'Amount / Status']],
    body: kpis,
    theme: 'grid',
    headStyles: { fillColor: [36, 36, 36], textColor: [255, 184, 0], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 45 },
      1: { width: 50 },
      2: { fontStyle: 'bold', width: 45 },
      3: { width: 50 }
    }
  });

  // 3. Mismatched Discrepancy Sample Table (Top 15 Discrepancies)
  const finalY1 = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('DISCREPANCY SUMMARY (SHORTAGE & EXCESS BREAKDOWN)', 14, finalY1);

  const mismatched = items
    .filter((i) => i.status === 'shortage' || i.status === 'excess')
    .slice(0, 25)
    .map((item, idx) => [
      idx + 1,
      item.itemNo,
      item.description.length > 30 ? item.description.substr(0, 28) + '...' : item.description,
      `Rs. ${(item.mrp || 0).toLocaleString('en-IN')}`,
      item.stock,
      item.phy !== null ? item.phy : '-',
      item.shortage > 0 ? `-${item.shortage}` : `+${item.excess}`,
      `Rs. ${(Math.abs(item.shortage || item.excess) * (item.mrp || 0)).toLocaleString('en-IN')}`,
      item.issueCategory || 'Pending Resolution'
    ]);

  autoTable(doc, {
    startY: finalY1 + 3,
    head: [['#', 'Part No', 'Description', 'MRP', 'Stock', 'Phy', 'Diff', 'Value', 'Category']],
    body: mismatched.length > 0 ? mismatched : [['-', 'No discrepancies found', '-', '-', '-', '-', '-', '-', 'ALL MATCHED']],
    theme: 'striped',
    headStyles: { fillColor: [255, 184, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 1.5 }
  });

  // 4. Checklist & Observations (New Page if needed)
  if (doc.lastAutoTable.finalY > 210) {
    doc.addPage();
  }

  const finalY2 = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text('STORE RECORDS & HOUSEKEEPING AUDIT CHECKLIST', 14, finalY2);

  const checkBody = (audit.checklist || []).map((c, i) => [
    i + 1,
    c.name,
    c.status,
    c.remarks || 'Verified'
  ]);

  autoTable(doc, {
    startY: finalY2 + 3,
    head: [['#', 'Document Name', 'Compliance Status', 'Auditor Notes']],
    body: checkBody,
    theme: 'grid',
    headStyles: { fillColor: [36, 36, 36], textColor: [255, 255, 255] },
    styles: { fontSize: 8, cellPadding: 1.5 }
  });

  // 5. Official Signatures Box
  const finalY3 = Math.min(doc.lastAutoTable.finalY + 12, 260);

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(14, finalY3 + 12, 70, finalY3 + 12);
  doc.line(140, finalY3 + 12, 196, finalY3 + 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(`AUDITOR: ${auditors}`, 14, finalY3 + 16);
  doc.text('Internal Audit Department', 14, finalY3 + 20);

  doc.text('CHAIRMAN & MANAGING DIRECTOR', 140, finalY3 + 16);
  doc.text(audit.chairmanApproved ? 'Verified & Officially Approved' : 'Pending Executive Approval', 140, finalY3 + 20);

  // Trigger download
  const safeName = (store || 'AUDIT').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDate = (auditDate || '').replace(/[^a-zA-Z0-9]/g, '.');
  doc.save(`${safeName}_Parts_Audit_Report_${safeDate}.pdf`);
};
