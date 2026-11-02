# 🚜 AuditX — JCB Automotive Parts Internal Audit System

An industrial-grade, offline-first mobile application designed for JCB automotive dealership parts auditors. Eliminates manual paper count sheets, automatically cleans messy SAP stock exports, provides a high-speed single-hand warehouse counting cockpit, categorizes discrepancies into standardized JCB resolution types, and generates executive **Chairman Sir Reports** along with official multi-sheet Excel workbooks (`.xlsx`) and printable PDF summaries.

---

## 🌟 Key Architecture & Capabilities

### 1. Multi-Role Portals
- **Auditor Portal**: Upload raw SAP stock list, fast warehouse count cockpit (`= Stock` match button, tactile keypad, decimal support for oils/grease, additive counting for split bins, unlisted part capture), and mismatched issue categorization.
- **Chairman Portal**: Executive boardroom dashboard with financial discrepancy KPIs, branch risk indicators, cash-in-hand checks, records maintenance checklist (11 documents), official digital sign-off seal, and 1-click official reports.
- **Admin Portal**: Auditor account management, branch store master list, system diagnostics, and zero-cloud phone-to-laptop data transfer (`.auditx` snapshot import/export).

### 2. Pre-Configured Access Credentials
| Portal | Username | Password | Role Description |
| :--- | :--- | :--- | :--- |
| **Auditor** | `auditor` | `audit123` | Field Auditor (Physical counts & Issue Resolution) |
| **Chairman** | `chairman` | `chair123` | Executive Review, Approval Seal & Reporting |
| **Admin** | `admin` | `admin123` | User & Branch Master Management |

*(Passwords and profiles can be modified anytime in Account Settings).*

---

## 📊 Standardized 17 JCB Issue Categories Supported
1. `CBPL`: Customer Bill Pending Issues Cleared During Audit Period
2. `CBP`: Customer DC Bill Pending Issues
3. `CQTNP`: Customer Quotation Bill Pending Issues During Audit Period
4. `DLPI`: Delivery Pending Issues Cleared During Audit Period
5. `JCBDESP`: JCB Discrepancy Claim Pending Issues (System Stock Mail Raised)
6. `JCBDEMG`: JCB Damage Parts Claim Pending Issues
7. `ITRCHPISU`: Interchange JCB Parts Received Pending Issues
8. `GWNPI`: Godown Internal Transaction Pending Issues
9. `EXCPI`: Excess Parts Inward Pending Issues Cleared During Audit Period
10. `EXCCFM`: Excess Parts Conform Separate Parcel In Store
11. `STNDELP`: STN Delivery Inward Pending Issues Cleared
12. `OPENDELP`: Open Delivery Inward Pending Issues Cleared
13. `WTYP`: Warranty Machine Issued Parts Bill Pending Issues
14. `WKSPP`: Workshop Machine Issued Parts Bill Pending Issues
15. `SALFOC`: New Machine Sales FOC Bill Pending Issues
16. `RECDMT`: Records Maintenance Details (11 documents)
17. `STOCK`: Inventory Audit Stock Reports
18. `RECHECK`: Physical Recheck Required

---

## 📱 Mobile Warehouse Cockpit Features
- **One-Tap `= Stock` Match**: Instantly records count and auto-advances in 0.2s.
- **Additive Counting**: Count parts split across multiple racks without mental math.
- **Unlisted Part Capture**: Instantly records physical parts found on shelves that are missing from SAP.
- **Screen Wake Lock**: Phone screen stays awake while climbing ladders or counting trays.
- **Tactile Keypad with Decimal Point**: Full support for lubricants (`9.83 Ltr`) and grease (`2.5 KG`).
- **Zero-Cloud Data Transfer**: 1-click export of `.auditx` files to transfer between mobile and laptop via WhatsApp, Bluetooth, or Email.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build production bundle
npm run build
```

---

## 🌐 100% Free Cloud Hosting on GitHub Pages
This repository contains a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`).
1. Push this project to your GitHub repository:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   git push -u origin main
   ```
2. In your GitHub repository settings:
   - Go to **Settings > Pages**.
   - Under **Source**, choose **GitHub Actions**.
3. GitHub will automatically build and deploy your app for **100% free forever** on `https://<YOUR_USERNAME>.github.io/<REPO_NAME>/`.
