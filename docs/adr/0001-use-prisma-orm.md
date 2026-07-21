# 1. Use Prisma ORM

Date: 2026-07-21

## Status

Accepted

## Context

We need an Object-Relational Mapper (ORM) to interface with our PostgreSQL database (Supabase). The application requires a robust, strictly typed schema that acts as the single source of truth for the entire business domain (Customers, WorkOrders, Invoices, etc.).

## Decision

We will use **Prisma ORM**.

## Consequences

- **Pros:**
  - Prisma provides excellent end-to-end type safety with TypeScript.
  - The `schema.prisma` file serves as a clear, centralized blueprint for the entire database.
  - Generates a tailored Prisma Client that integrates well with our Repository layer.
- **Cons:**
  - Slightly larger bundle size and memory footprint compared to query builders like Drizzle or Kysely.
  - Complex dynamic queries can sometimes be harder to express than raw SQL.
