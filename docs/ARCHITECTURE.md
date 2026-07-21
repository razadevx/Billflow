# BillFlow Architecture & Engineering Contract

This document is the authoritative source of truth for all BillFlow developers and subagents. It defines the constraints, boundaries, and standards required to maintain a modular and scalable ERP system.

## 1. Domain Ownership Matrix

Agents and developers MUST strictly adhere to their assigned domains.

| Domain | Owns | Responsibilities |
|---|---|---|
| **Customer** | Customers only | Customer profile, settings, credit limits. |
| **Inventory** | Inventory & Categories | Stock levels, catalog, adjustments, units. |
| **Work Orders** | Jobs & Reservations | Job tracking, material reservations. |
| **Payments** | Payments & Ledger | Payments, accounting ledger (Khata). |
| **Reports** | Read-only projections | Aggregating data across domains. |
| **Dashboard** | Read-only projections | Top-level summary widgets. |
| **Administration** | Users & Settings | Auth, roles, feature flags, global settings. |

### Public Domain Interfaces
**Rule**: No cross-domain database repository access is permitted.
If the Work Order domain needs to reserve stock, it MUST NOT use `InventoryRepository`. It must use the `InventoryFacade` or equivalent public API (e.g. `src/domain/inventory/public.ts`).

## 2. Shared Types & Freezes

The following directories and files are **FROZEN** and may only be modified by the Integration Engineer:
- `prisma/schema.prisma`
- `src/types/`
- `src/contracts/`
- `src/server/core/`
- `src/server/events/`
- `src/server/result/`

## 3. Engineering Contract

1. **Prisma Access**: No direct Prisma access from UI components or Next.js route handlers.
2. **Architecture Layers**: Controllers/Route Handlers -> Services -> Repositories -> Prisma.
3. **API Standards**: All Domain Services and API Route Handlers must return `Result<T, E>`.
4. **Transactions**: Any mutation involving multiple tables (especially financial/inventory) MUST accept and use `TransactionManager` and `RequestContext`.
5. **Auditing**: Every mutation MUST emit `DomainEvents` which are automatically logged to `ActivityLog` and `AuditLog`.
6. **Testing**: Every mutation must have at least one unit test.
7. **UI**: Use exclusively the BillFlow Design System components (`src/components/ui`). Do not write custom CSS or generic Tailwind classes outside of layout composition.

## 4. Shared Services

### Sequence Service
Use `SequenceService.reserveSequence` for generating human-readable IDs.
Examples: `CUST-00001`, `WO-00001`, `INV-00001`.

### Money Utility
Use `Money` class in `src/server/core/money/Money.ts` and `MoneyCalculator` for all financial arithmetic. Do not use raw floats for calculations to prevent drift.

## 5. Event Versioning
All domain events use versioned identifiers. Examples:
- `inventory.adjusted.v1`
- `workorder.completed.v1`
- `payment.recorded.v1`

## 6. API Versioning
All API routes must be versioned. Example: `/api/v1/workorders`.

## 7. CI Requirements
Before merging any branch, the following MUST pass locally:
```bash
npm run lint
npm run build
npm run test
npx prisma generate
npm run typecheck
```
