# BillFlow Financial Flow Specification & Audit Document

> **Status**: PROPOSED / AWAITING USER APPROVAL  
> **Authoritative Scope**: Customer, Work Order, Inventory, Invoice, Payments, Khata (Ledger), Reports, and Dashboard.

---

## 1. Executive Summary & Core Rules

This document establishes the single source of truth for all financial numbers, arithmetic pipelines, ledger transactions, and real-time UI synchronization in BillFlow.

### Immutable Principles
1. **Single Source of Truth**: Every financial metric (Revenue, Outstanding Balance, Line Item Total, Invoice Total, Square Feet) has **exactly one origin and algorithm** across the entire application.
2. **Append-Only Khata Ledger**: Financial history is immutable. Previous `KhataEntry` rows are **NEVER modified or deleted**. Reversals (void payments, cancelled invoices) are executed exclusively via new offsetting entry rows.
3. **Floating-Point Drift Prevention**: All monetary arithmetic must pass through `Money` (`Math.round(val * 100) / 100`) and `MoneyCalculator`. Raw float operations (`+`, `-`, `*`) on currency amounts are prohibited.
4. **Preserved React Query Caching**: React Query default cache settings (`staleTime: 5 min`) are preserved for performance. Real-time updates rely on targeted query invalidation within the tab and lightweight `BroadcastChannel` events across tabs.

---

## 2. Financial Pipeline Map (A to Z)

```
[Customer]
    │
    ▼
[Work Order Creation]
    ├── Line Items (Custom or Inventory)
    ├── Square Foot Calculation (Width × Height × Quantity × Rate)
    ├── Subtotal = ∑(Quantity × UnitPrice)
    ├── Tax = ∑(ItemSubtotal × TaxRate %)
    └── Grand Total = Subtotal + Tax
    │
    ▼ (Production / Completion)
[Invoice Generation]
    ├── Invoice Total = WorkOrder.total
    ├── Check Unlinked Advance Payments for WorkOrder/Customer
    ├── Balance Due = Math.max(0, Invoice.total - AdvancePaymentsSum)
    ├── Status = DRAFT | ISSUED | PARTIALLY_PAID | PAID
    └── Post Ledger Entry: DEBIT (Customer owes business)
    │
    ▼
[Payment Received]
    ├── Create Payment Record (Method: CASH, UPI, BANK_TRANSFER, etc.)
    ├── Link to Invoice & WorkOrder (if selected)
    ├── Update Invoice Balance Due = Math.max(0, Invoice.balanceDue - PaymentAmount)
    ├── Update Invoice Status (PARTIALLY_PAID or PAID)
    └── Post Ledger Entry: CREDIT (Money received by business)
    │
    ▼ (If Voided / Cancelled)
[Reversal Handling]
    ├── Void Payment: Post DEBIT reversal entry + Restore Invoice balanceDue
    └── Cancel Invoice: Post CREDIT reversal entry + Restore customer credit
    │
    ▼
[Single Source Projections]
    ├── Khata Statement: Customer Balance = ∑(DEBITs) - ∑(CREDITs)
    ├── Reports: Aggregate directly from Invoices, Payments, and Khata Services
    └── Dashboard: Use exact same Domain Services (Dashboard Revenue == Reports Revenue)
```

---

## 3. Authoritative Single Source of Truth Matrix

| Financial Metric | Authoritative Origin / Service | Exact Formula | Usage Context |
|---|---|---|---|
| **Line Item Total** | `SquareFootCalculator` & `WorkOrderService` | `(Quantity × UnitPrice) × (1 + TaxRate / 100)` using `MoneyCalculator` | Work Orders, Invoices, Printing |
| **Work Order Subtotal** | `WorkOrderService` | `∑(Quantity × UnitPrice)` via `MoneyCalculator` | Work Orders |
| **Work Order Tax** | `WorkOrderService` | `∑(ItemSubtotal × TaxRate / 100)` via `MoneyCalculator` | Work Orders |
| **Work Order Grand Total**| `WorkOrderService` | `Subtotal + Tax` via `MoneyCalculator` | Work Orders, Invoices |
| **Invoice Total** | `InvoiceService` | Inherited from `WorkOrder.total` | Invoices |
| **Invoice Balance Due** | `InvoiceService` / `PaymentService` | `Math.max(0, Invoice.total - ∑(Valid Invoice Payments))` | Invoices, Payment Allocation |
| **Customer Outstanding** | `KhataService.getCustomerBalance` | `∑(KhataEntry.DEBIT) - ∑(KhataEntry.CREDIT)` | Customer Profile, Payments, Khata |
| **Total System Receivables**| `KhataService.getSystemOutstanding` | `SUM(DEBIT) - SUM(CREDIT)` across all active customers | Dashboard KPI, Executive Report |
| **Billed Revenue (Accrual)**| `InvoiceService.getTotalBilledRevenue` | `SUM(Invoice.total)` for non-cancelled invoices | Sales Report, Executive Dashboard |
| **Collected Cash (Cash)** | `PaymentService.getCollectedCash` | `SUM(Payment.amount)` where `status == PAID` | Payments Report, Cash Flow KPI |

---

## 4. Advance Payments & Invoice Allocation Rules

### Business Rules
1. **Pre-Invoice Payments**: Customers CAN make payments before an invoice exists (e.g. advance deposit for a Work Order).
2. **Advance Accounting**:
   - Recording a payment creates a `CREDIT` entry in `khata_entry` for the customer immediately.
   - Customer's Khata running balance becomes negative (meaning business owes customer service/credit).
3. **Invoice Generation Alignment**:
   - When `InvoiceService.generateFromWorkOrder` is called:
     1. Creates `Invoice` record.
     2. Posts `DEBIT` entry in `khata_entry` for `invoice.total`.
     3. Queries unlinked `PAID` payments for `workOrderId` or unallocated customer credit.
     4. Links those payments to `invoice.id`.
     5. Calculates `balanceDue = Math.max(0, invoice.total - linkedPaymentsSum)`.
     6. Sets invoice status:
        - `PAID` if `balanceDue === 0`
        - `PARTIALLY_PAID` if `0 < balanceDue < invoice.total`
        - `ISSUED` if `balanceDue === invoice.total`

---

## 5. Khata Ledger Immutability & Reversal Rules

Every ledger mutation is **append-only**. Direct `UPDATE` or `DELETE` operations on `khata_entry` are strictly prohibited.

| Event | Ledger Action | Entry Type | Amount | Running Balance Impact |
|---|---|---|---|---|
| **Invoice Issued** | Billed to customer | `DEBIT` | `+Invoice.total` | Balance increases (Customer owes) |
| **Payment Received**| Money collected | `CREDIT` | `+Payment.amount` | Balance decreases (Paid down) |
| **Payment Voided** | Payment reversed | `DEBIT` | `+Payment.amount` | Balance increases (Restored debt) |
| **Invoice Cancelled**| Invoice voided | `CREDIT` | `+Invoice.total` | Balance decreases (Debt cleared) |

---

## 6. Reports & Dashboard Alignment

### Audit Corrections Required
- **Current Defect Identified in Audit**:
  - `DashboardService.getKPIs` currently calculates revenue from `WorkOrder.total` (status `COMPLETED`).
  - `ReportService.getExecutiveDashboard` calculates revenue from `KhataEntry` `DEBIT`s.
  - `ReportService.getCustomerReport` calculates outstanding as `WorkOrder.total - Payment.amount`.
- **Authoritative Fix**:
  - Refactor `DashboardService` to call `InvoiceService`, `PaymentService`, and `KhataService` public methods.
  - Refactor `ReportService` endpoints to query domain services directly.
  - Guarantee: **Dashboard Total Revenue == Sales Report Revenue** and **Dashboard Outstanding Balance == Khata Ledger Total Outstanding**.

---

## 7. Real-Time Synchronization Strategy

### Architecture
1. **Preserve React Query Defaults**:
   - Keep `staleTime: 5 * 60 * 1000` (5 minutes) and `gcTime: 30 * 60 * 1000` in `QueryProvider.tsx`.
2. **Targeted Invalidation (Same Tab)**:
   - On mutation success (e.g. creating Customer, Work Order, Payment), explicitly execute `queryClient.invalidateQueries(...)` for relevant keys.
3. **Cross-Tab Synchronization (`BroadcastChannel`)**:
   - Create lightweight helper `src/lib/realtime-sync.ts`:
     ```ts
     const syncChannel = typeof window !== "undefined" ? new BroadcastChannel("billflow_sync") : null;

     export function notifyDataChanged(entity: "customer" | "workorder" | "invoice" | "payment" | "khata") {
       syncChannel?.postMessage({ entity, timestamp: Date.now() });
     }
     ```
   - Listeners in `QueryProvider.tsx` or layout execute targeted `queryClient.invalidateQueries()` when a message is received from another tab.

---

## 8. Verification & Financial Test Matrix

Before declaring completion, the implementation will be validated against 5 rigorous test scenarios:

### Scenario 1: Standard Full Payment Lifecycle
1. Create Customer -> Create Work Order (Rs 10,000) -> Generate Invoice.
2. Verify: Khata has 1 `DEBIT` entry (Rs 10,000), Outstanding = Rs 10,000.
3. Record Full Payment (Rs 10,000).
4. Verify: Khata has 1 `CREDIT` entry (Rs 10,000), Outstanding = Rs 0, Invoice Status = `PAID`.
5. Verify: Dashboard KPIs and Reports reflect Total Billed = Rs 10,000, Collected Cash = Rs 10,000, Outstanding = Rs 0.

### Scenario 2: Advance Payment & Invoice Generation
1. Create Customer -> Record Advance Payment (Rs 3,000) for Work Order.
2. Verify: Khata has `CREDIT` (Rs 3,000), Balance = -Rs 3,000 (Advance Credit).
3. Generate Invoice for Work Order (Rs 5,000).
4. Verify: Khata records `DEBIT` (Rs 5,000), Net Balance = Rs 2,000. Payment automatically linked to Invoice, Invoice Balance Due = Rs 2,000, Status = `PARTIALLY_PAID`.

### Scenario 3: Multiple Partial Payments
1. Create Invoice (Rs 12,000).
2. Pay Rs 4,000 -> Invoice Balance = Rs 8,000 (PARTIALLY_PAID), Khata Balance = Rs 8,000.
3. Pay Rs 5,000 -> Invoice Balance = Rs 3,000 (PARTIALLY_PAID), Khata Balance = Rs 3,000.
4. Pay Rs 3,000 -> Invoice Balance = Rs 0 (PAID), Khata Balance = Rs 0.

### Scenario 4: Payment Voiding & Ledger Reversal
1. Record Payment (Rs 4,000) on Invoice (Rs 10,000) -> Balance Due = Rs 6,000.
2. Void Payment.
3. Verify: Khata receives append-only `DEBIT` reversal entry (Rs 4,000).
4. Verify: Invoice Balance Due restored to Rs 10,000, Status restored to `ISSUED`.
5. Verify: Dashboard & Reports reflect updated cash collection and receivables without entry deletion.

### Scenario 5: Work Order Cancellation & Inventory Restoration
1. Create Work Order with reserved stock items -> Cancel Work Order.
2. Verify: Stock released via `InventoryFacade.releaseStock`.
3. Verify: If un-invoiced, 0 ledger entries. If invoiced and cancelled, append-only `CREDIT` entry clears debt.
