import * as XLSX from 'xlsx';

// Normalizes fuzzy header string
const cleanHeader = (h) => {
  if (!h) return '';
  return String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Fuzzy column mappings for SAP raw sheets and formatted audit sheets
const MAPPINGS = {
  itemNo: ['itemno', 'itemnumber', 'partno', 'partnumber', 'partsno', 'material', 'materialno', 'partcode'],
  description: ['itemdescription', 'description', 'partdesc', 'partdescription', 'desc', 'materialdesc'],
  stock: ['instock', 'stock', 'stk', 'systemstock', 'sapstock', 'inventoryqty', 'qty'],
  mrp: ['itemprice', 'mrp', 'price', 'unitprice', 'rate', 'cost'],
  uom: ['inventoryuom', 'uom', 'unit'],
  phy: ['phy', 'physical', 'physicalstock', 'phystock', 'actualstock'],
  loc: ['loc', 'location', 'bin', 'binlocation', 'rack'],
  remarks: ['remarks', 'remark', 'notes', 'comment']
};

export const parseSAPExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file has no readable sheets.');
        }

        // Try to pick the most relevant sheet:
        // Priority 1: A sheet named 'Main Stock' or 'STOCK' or containing 'Audit'
        // Priority 2: The first sheet
        let targetSheetName = workbook.SheetNames[0];
        for (const name of workbook.SheetNames) {
          const lower = name.toLowerCase();
          if (lower.includes('main stock') || lower === 'stock' || lower.includes('audit')) {
            targetSheetName = name;
            break;
          }
        }

        const worksheet = workbook.Sheets[targetSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error(`Sheet "${targetSheetName}" contains no data rows.`);
        }

        // Search for metadata in top 10 rows (Company name, Store, Whse, Auditors)
        let detectedWhse = '';
        let detectedStore = '';
        let detectedDate = '';
        let detectedAuditors = '';
        let detectedStoreIC = '';

        for (let r = 0; r < Math.min(10, rawRows.length); r++) {
          const rowStr = rawRows[r].map(c => String(c).trim()).filter(Boolean).join(' ');
          
          // Warehouse code pattern (e.g. Whse: DJ00016 or DJ00025)
          const whseMatch = rowStr.match(/whse\s*[:\-]?\s*([A-Z0-9]+)/i);
          if (whseMatch && !detectedWhse) {
            detectedWhse = whseMatch[1].trim();
          }

          // Store & Date pattern (e.g. TIRUNELVELI PARTS AUDIT ON 23.04.25 or KAPPALUR ... 28.10.26)
          const auditMatch = rowStr.match(/([A-Z\s]+)\s+PARTS\s+AUDIT\s+(?:AS\s+ON|ON)\s+([0-9\.\-\/]+)/i);
          if (auditMatch && !detectedStore) {
            detectedStore = auditMatch[1].trim();
            detectedDate = auditMatch[2].trim();
          }

          // Auditors pattern (e.g. AUDIT BY V ARUMUGAM & S SIVA GANESH)
          const auditByMatch = rowStr.match(/AUDIT\s+BY\s+([^,]+?)(?:STORE|\s{4,}|$)/i);
          if (auditByMatch && !detectedAuditors) {
            detectedAuditors = auditByMatch[1].trim();
          }

          // Store Incharge pattern (e.g. STORE I/C - ROBIN, VARATHARAJAN)
          const storeICMatch = rowStr.match(/STORE\s*(?:I\/C|INCHARGE)\s*[:\-]?\s*([^,\n]+)/i);
          if (storeICMatch && !detectedStoreIC) {
            detectedStoreIC = storeICMatch[1].trim();
          }
        }

        // Locate Header Row by scanning top 15 rows for column matches
        let headerRowIndex = -1;
        let columnIndices = {};

        for (let r = 0; r < Math.min(15, rawRows.length); r++) {
          const row = rawRows[r];
          const testCols = {};
          
          row.forEach((cellVal, colIdx) => {
            const clean = cleanHeader(cellVal);
            if (!clean) return;
            
            for (const [key, variants] of Object.entries(MAPPINGS)) {
              if (variants.includes(clean)) {
                testCols[key] = colIdx;
              }
            }
          });

          // A valid header row MUST have at least `itemNo` and (`description` or `stock`)
          if (testCols.itemNo !== undefined && (testCols.description !== undefined || testCols.stock !== undefined)) {
            headerRowIndex = r;
            columnIndices = testCols;
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Could not automatically identify column headers (Item No, Description, Stock). Please ensure the file has proper column headers.');
        }

        // Parse items starting from row immediately after header
        const items = [];
        let serialNo = 1;

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          // Check if row has an Item No
          const rawItemNo = columnIndices.itemNo !== undefined ? String(row[columnIndices.itemNo] || '').trim() : '';
          
          // Skip empty rows or summary/total rows (e.g. "Total: DJ00025", "Grand Total:")
          if (!rawItemNo || rawItemNo.toLowerCase().includes('total') || rawItemNo.toLowerCase().startsWith('whse')) {
            continue;
          }

          const description = columnIndices.description !== undefined ? String(row[columnIndices.description] || '').trim() : '';
          const uom = columnIndices.uom !== undefined ? String(row[columnIndices.uom] || '').trim() : 'NOS';
          
          // Parse numerical Stock
          let systemStock = 0;
          if (columnIndices.stock !== undefined) {
            const val = String(row[columnIndices.stock] || '').replace(/,/g, '').trim();
            const num = parseFloat(val);
            if (!isNaN(num)) systemStock = num;
          }

          // Parse numerical MRP
          let mrp = 0;
          if (columnIndices.mrp !== undefined) {
            const val = String(row[columnIndices.mrp] || '').replace(/,/g, '').trim();
            const num = parseFloat(val);
            if (!isNaN(num)) mrp = num;
          }

          // Existing Phy count (if re-importing formatted sheet)
          let phy = null;
          if (columnIndices.phy !== undefined) {
            const val = String(row[columnIndices.phy] || '').replace(/,/g, '').trim();
            if (val !== '') {
              const num = parseFloat(val);
              if (!isNaN(num)) phy = num;
            }
          }

          // Location & Remarks
          const loc = columnIndices.loc !== undefined ? String(row[columnIndices.loc] || '').trim() : '';
          const remarks = columnIndices.remarks !== undefined ? String(row[columnIndices.remarks] || '').trim() : '';

          // Determine initial status
          let status = 'uncounted';
          let shortage = 0;
          let excess = 0;

          if (phy !== null) {
            if (phy === systemStock) {
              status = 'matched';
            } else if (phy < systemStock) {
              status = 'shortage';
              shortage = parseFloat((systemStock - phy).toFixed(2));
            } else {
              status = 'excess';
              excess = parseFloat((phy - systemStock).toFixed(2));
            }
          }

          items.push({
            id: `item_${serialNo}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            sNo: serialNo++,
            itemNo: rawItemNo,
            description: description || rawItemNo,
            uom: uom || 'NOS',
            stock: systemStock,
            mrp: mrp,
            phy: phy,
            shortage: shortage,
            excess: excess,
            loc: loc,
            remarks: remarks,
            status: status,
            history: [], // For additive counts & audit trail
            issueCategory: null, // One of 17 JCB categories
            issueDetails: null // Dynamic specific fields
          });
        }

        if (items.length === 0) {
          throw new Error('No parts line items found in the uploaded sheet.');
        }

        resolve({
          sheetName: targetSheetName,
          totalRows: items.length,
          detectedMetadata: {
            whseCode: detectedWhse,
            storeName: detectedStore,
            auditDate: detectedDate,
            auditors: detectedAuditors,
            storeIncharge: detectedStoreIC
          },
          items: items
        });

      } catch (err) {
        console.error('[SAP Parser Error]:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(new Error('Failed to read file: ' + err.message));
    reader.readAsArrayBuffer(file);
  });
};
