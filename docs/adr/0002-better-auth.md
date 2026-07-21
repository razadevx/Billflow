# 2. Use Better Auth

Date: 2026-07-21

## Status

Accepted

## Context

We need a secure, modern, and flexible authentication system for a B2B SaaS application. It needs to support session management, role-based access control, and potentially multi-tenancy in the future.

## Decision

We will use **Better Auth**.

## Consequences

- **Pros:**
  - Framework-agnostic but provides deep Next.js App Router integration.
  - Supports our Prisma schema out of the box.
  - Extremely lightweight compared to NextAuth/Auth.js with fewer edge-case bugs.
  - First-class TypeScript support.
- **Cons:**
  - Newer ecosystem compared to Auth.js or Supabase Auth.
  - Requires specific schema tables (`User`, `Session`, `Account`, `Verification`) which must be maintained.
