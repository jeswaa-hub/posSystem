# QA Audit Report: Core Workflows & Security
**Date:** 2026-03-08
**Auditor:** Senior Quality Analyst

---

## 1. Functional Audit: Sales & Inventory
Matapos ang code review sa [transactions.js](file:///c:/Users/LENOVO/Desktop/POS%20System/BackendSide/routes/transactions.js), narito ang mga obserbasyon:

- **Inventory Deductions:** Gumagamit ang system ng recipe-based at direct-product deduction logic. Maayos ang implementation ng ingredient stock check bago i-process ang sale (Line 253-260).
- **Desync Handling:** Mayroong built-in logic para i-sync ang `Inventory` model mula sa `Product` model kapag may nakitang mismatch (Line 271-275). **Status: PASSED**.
- **Tax Calculation:** Ang tax rate ay dynamic na kinukuha mula sa system settings. **Status: PASSED**.
- **Transaction Status:** Naka-set sa `pending` by default. Kailangan i-verify kung kailan ito nagiging `completed`.

---

## 2. Security Audit: Authentication & RBAC
Siniyasat ang [authMiddleware.js](file:///c:/Users/LENOVO/Desktop/POS%20System/BackendSide/middleware/authMiddleware.js):

- **JWT Validation:** Gumagamit ng `jwt.verify` na may `JWT_SECRET` mula sa environment variables. Maayos ang handling ng missing secrets. **Status: PASSED**.
- **RBAC Enforcement:** Ang `verifyTokenAndAdmin` ay mahigpit na nag-checheck ng `role === "admin"`.
- **Potential Improvement:** Ang `verifyTokenAndAuthorization` ay gumagamit ng `req.user.id` pero ang token payload ay maaaring gumagamit ng `req.user._id`. Kailangan i-confirm ang consistency ng user object ID property.

---

## 3. Real-time Synchronization (WebSocket)
- **Broadcasting:** Lahat ng major actions (Create, Update, Delete) sa Products, Inventory, at Transactions ay nag-e-emit ng events via Socket.io.
- **Frontend Listeners:** Ang mga apektadong pages ay may active listeners na gumagamit ng functional state updates. **Status: PASSED**.

---

## 4. Usability & UI/UX Findings
- **Skeleton Screens:** Maayos ang implementation ng loading states gamit ang custom skeletons.
- **Modal Layering:** Na-fix na ang z-index issue kung saan ang modals ay lumalabas sa ilalim ng sidebar.

---

## 5. Summary of Identified Issues (Defect Log)
| ID | Severity | Component | Description | Recommended Action |
| :--- | :--- | :--- | :--- | :--- |
| DEF-001 | Minor | Auth | Potential ID property mismatch (`id` vs `_id`) in `verifyTokenAndAuthorization`. | I-standardize ang user ID property sa buong app. |
| DEF-002 | Minor | UX | "Discard Changes" button removed per user request, but no "Cancel" confirmation for long forms. | Magdagdag ng simple close confirmation kung may dirty state ang form. |
| DEF-003 | Major | PCI-DSS | Clear-text logs ng transaction details sa console during development. | Siguraduhing walang sensitive data (e.g. customer info) sa production logs. |
