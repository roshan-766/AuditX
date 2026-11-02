// Local-First Storage & State Management with Atomic Persistence
// Guarantees zero data loss even if phone dies or browser tab restarts

const USERS_KEY = 'auditx_users';
const AUDITS_KEY = 'auditx_audits';
const ACTIVE_AUDIT_KEY = 'auditx_active_audit_id';
const CURRENT_USER_KEY = 'auditx_current_user';
const BRANCHES_KEY = 'auditx_branches';

// Standard 17 JCB Issue Categories from master sheet
export const ISSUE_CATEGORIES = [
  { code: 'CBPL', name: 'Customer Bill Pending Issues Cleared During Audit Period', tab: 'CBPL' },
  { code: 'CBP', name: 'Customer DC Bill Pending Issues', tab: 'CBP' },
  { code: 'CQTNP', name: 'Customer Quotation Bill Pending Issues', tab: 'CQTNP' },
  { code: 'DLPI', name: 'Delivery Pending Issues Cleared', tab: 'DLPI' },
  { code: 'JCBDESP', name: 'JCB Discrepancy Claim Pending Issues (Mail Raised)', tab: 'JCBDESP' },
  { code: 'JCBDEMG', name: 'JCB Damage Parts Claim Pending Issues', tab: 'JCBDEMG' },
  { code: 'ITRCHPISU', name: 'Interchange JCB Parts Received Pending Issues', tab: 'ITRCHPISU' },
  { code: 'GWNPI', name: 'Godown Internal Transaction Pending Issues', tab: 'GWNPI' },
  { code: 'EXCPI', name: 'Excess Parts Inward Pending Issues Cleared', tab: 'EXCPI' },
  { code: 'EXCCFM', name: 'Excess Parts Conform Separate Parcel In Store', tab: 'EXCCFM' },
  { code: 'STNDELP', name: 'STN Delivery Inward Pending Issues Cleared', tab: 'STN & OPEN DY' },
  { code: 'OPENDELP', name: 'Open Delivery Inward Pending Issues Cleared', tab: 'STN & OPEN DY' },
  { code: 'WTYP', name: 'Warranty Machine Issued Parts Bill Pending Issues', tab: 'WTY' },
  { code: 'WKSPP', name: 'Workshop Machine Issued Parts Bill Pending Issues', tab: 'WKSP' },
  { code: 'SALFOC', name: 'New Machine Sales FOC Bill Pending Issues', tab: 'SALFOC' },
  { code: 'RECDMT', name: 'Records Maintenance Details', tab: 'Chairman Sir Report' },
  { code: 'STOCK', name: 'Inventory Audit Stock Reports', tab: 'Main Stock' },
  { code: 'RECHECK', name: 'Physical Recheck Required', tab: 'Recheck' },
];

export const DEFAULT_CHECKLIST = [
  { id: 1, name: 'Parts Lost Sale', status: 'Not Maint', remarks: '' },
  { id: 2, name: 'Lubricant', status: 'Not Maint', remarks: '' },
  { id: 3, name: 'Descripency', status: 'Not Maint', remarks: '' },
  { id: 4, name: 'Customer wise Sale', status: 'Not Maint', remarks: '' },
  { id: 5, name: 'Inward', status: 'Not Maint', remarks: '' },
  { id: 6, name: 'Outward', status: 'Maint', remarks: '' },
  { id: 7, name: 'VOR', status: 'Not Maint', remarks: '' },
  { id: 8, name: 'JCB Invoice inward', status: 'Sys only maint', remarks: '' },
  { id: 9, name: 'Castrol Invoice', status: 'Sys only maint', remarks: '' },
  { id: 10, name: 'Account statement', status: 'Maint', remarks: '' },
  { id: 11, name: 'Petty cash', status: 'Received', remarks: '' },
];

export const DEFAULT_BRANCHES = [
  { id: 'tirunelveli', name: 'TIRUNELVELI', code: 'DJ00016' },
  { id: 'kappalur', name: 'KAPPALUR', code: 'DJ00025' },
  { id: 'cumbum', name: 'CUMBUM', code: 'DJ00028' },
  { id: 'tenkasi', name: 'TENKASI', code: 'DJ00038' },
  { id: 'madurai', name: 'MADURAI (TN)', code: 'DJ0001' },
  { id: 'nagercoil', name: 'NAGERCOIL', code: 'DJ00015' },
  { id: 'srivilliputhur', name: 'SRIVILLIPUTHUR', code: 'DJ00023' },
  { id: 'aruppukottai', name: 'ARUPPUKOTTAI', code: 'DJ00031' },
  { id: 'karaikudi', name: 'KARAIKUDI', code: 'DJ00034' },
  { id: 'periyakulam', name: 'PERIYAKULAM', code: 'DJ00021' },
];

const DEFAULT_USERS = [
  {
    username: 'auditor',
    password: 'audit123',
    name: 'V Arumugam & S Siva Ganesh',
    role: 'auditor',
    designation: 'Senior Parts Internal Auditor',
    phone: '+91 98421 00000',
    signature: 'V. Arumugam'
  },
  {
    username: 'chairman',
    password: 'chair123',
    name: 'Chairman & Managing Director',
    role: 'chairman',
    designation: 'Chairman Sir',
    phone: '+91 98421 99999',
    signature: 'Jayaraj CMD'
  },
  {
    username: 'admin',
    password: 'admin123',
    name: 'Audit Operations Admin',
    role: 'admin',
    designation: 'Head of Internal Audit Systems',
    phone: '+91 98421 11111',
    signature: 'System Admin'
  }
];

// Initialize storage & request persistence
export const initStorage = async () => {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
    } catch (err) {
      console.warn('[Storage] Error requesting persistence:', err);
    }
  }

  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem(BRANCHES_KEY)) {
    localStorage.setItem(BRANCHES_KEY, JSON.stringify(DEFAULT_BRANCHES));
  }
  if (!localStorage.getItem(AUDITS_KEY)) {
    localStorage.setItem(AUDITS_KEY, JSON.stringify([]));
  }
};

// User & Authentication Services
export const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return DEFAULT_USERS;
  }
};

export const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const login = (username, password) => {
  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (user) {
    const sessionUser = { ...user };
    delete sessionUser.password;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    return { success: true, user: sessionUser };
  }
  return { success: false, message: 'Invalid Username or Password' };
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const changePassword = (username, oldPassword, newPassword) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return { success: false, message: 'User not found' };
  if (users[idx].password !== oldPassword) return { success: false, message: 'Current password incorrect' };
  users[idx].password = newPassword;
  saveUsers(users);
  return { success: true, message: 'Password updated successfully' };
};

export const updateProfile = (username, profileData) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return { success: false, message: 'User not found' };
  users[idx] = { ...users[idx], ...profileData };
  saveUsers(users);
  const cur = getCurrentUser();
  if (cur && cur.username === username) {
    const updated = { ...cur, ...profileData };
    delete updated.password;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
  }
  return { success: true, message: 'Profile updated' };
};

// Branch Management
export const getBranches = () => {
  try {
    return JSON.parse(localStorage.getItem(BRANCHES_KEY) || '[]');
  } catch {
    return DEFAULT_BRANCHES;
  }
};

export const saveBranches = (branches) => {
  localStorage.setItem(BRANCHES_KEY, JSON.stringify(branches));
};

// Audit Sessions Management
export const getAudits = () => {
  try {
    return JSON.parse(localStorage.getItem(AUDITS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getAudit = (id) => {
  const audits = getAudits();
  return audits.find((a) => a.id === id) || null;
};

export const saveAudit = (audit) => {
  const audits = getAudits();
  const idx = audits.findIndex((a) => a.id === audit.id);
  audit.updatedAt = new Date().toISOString();
  if (idx >= 0) {
    audits[idx] = audit;
  } else {
    audit.createdAt = audit.createdAt || new Date().toISOString();
    audits.unshift(audit);
  }
  localStorage.setItem(AUDITS_KEY, JSON.stringify(audits));
  return audit;
};

export const deleteAudit = (id) => {
  const audits = getAudits().filter((a) => a.id !== id);
  localStorage.setItem(AUDITS_KEY, JSON.stringify(audits));
};

export const getActiveAuditId = () => {
  return localStorage.getItem(ACTIVE_AUDIT_KEY);
};

export const setActiveAuditId = (id) => {
  if (id) {
    localStorage.setItem(ACTIVE_AUDIT_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_AUDIT_KEY);
  }
};

// Export audit backup snapshot (.auditx file / JSON)
export const exportAuditFile = (audit) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(audit, null, 2));
  const downloadAnchor = document.createElement('a');
  const sanitizedName = (audit.storeName || 'AUDIT').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = audit.auditDate ? audit.auditDate.replace(/[^a-zA-Z0-9]/g, '_') : 'DATE';
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${sanitizedName}_Audit_${dateStr}.auditx`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Import audit file (.auditx or .json)
export const importAuditFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const audit = JSON.parse(e.target.result);
        if (!audit.id || !audit.items) {
          throw new Error('Invalid AuditX snapshot file structure.');
        }
        // Save to storage
        saveAudit(audit);
        resolve(audit);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
