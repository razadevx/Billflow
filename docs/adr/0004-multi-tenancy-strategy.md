# 4. Multi-Tenancy Strategy

Date: 2026-07-21

## Status

Accepted

## Context

BillFlow is a SaaS application. Multiple printing businesses will use the software, and their data must remain completely isolated.

## Decision

We will use a **Row-Level Multi-Tenancy (Shared Database, Shared Schema)** approach.
- Every domain table in the database will have a `companyId` foreign key.
- The `Company` table is the root tenant entity.
- Repositories must enforce the `companyId` filter on every query.

## Consequences

- **Pros:**
  - Simplest operational overhead (one database to manage, backup, and migrate).
  - Easy to aggregate data across tenants if necessary.
- **Cons:**
  - High risk of data leakage if a developer forgets to apply the `companyId` filter. (Mitigation: Enforce this at the Repository level or via Prisma Client Extensions).
