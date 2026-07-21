# 3. Domain-Driven Architecture

Date: 2026-07-21

## Status

Accepted

## Context

The application is a complex Workflow Engine (Printing Business Management System) with multiple interconnected modules (Customers, WorkOrders, Khata, Inventory). A traditional MVC or flat architecture will lead to spaghetti code, tightly coupling business logic with UI components.

## Decision

We will adopt a **Domain-Driven Architecture** within the `src/domain/` directory.

- Every business module (e.g., `customer`) will have its own folder.
- Inside each folder: `.types.ts`, `.constants.ts`, `.validation.ts`, `.repository.ts`, `.service.ts`.
- **Repositories** are the ONLY layer allowed to communicate with Prisma.
- **Services** are the ONLY layer allowed to contain business logic.
- UI components (React) communicate with Services via Next.js API routes or Server Actions.

## Consequences

- **Pros:**
  - Extreme modularity and testability.
  - Prevents business logic from leaking into React components.
  - Swapping databases or ORMs only requires rewriting Repositories.
- **Cons:**
  - More boilerplate code.
  - Higher upfront structural cost.
