# Engineering Contract & Architecture

Before making any modifications to the codebase, you MUST read the `docs/ARCHITECTURE.md` file located at the root of the workspace.

It contains:
- The Engineering Contract
- The Domain Ownership Matrix
- Strict API guidelines
- Required tools and shared services (e.g. `SequenceService`, `Money`, `TransactionManager`)

**Do not deviate from the constraints outlined in that document.**

## Schema Freeze and Platform Lock
`schema.prisma` is currently frozen. No agent may modify:
- Prisma schema
- Shared contracts
- RequestContext
- BaseRepository
- BaseService
- Authentication
- Middleware

Any required changes must be requested through the integration engineer.

## Definition of Done
Every agent must finish their tasks with the following checked:
- Build: `npm run build` ✅
- Lint: `npm run lint` ✅
- Tests: `npm run test` ✅
- Type Safety: `npx tsc --noEmit` ✅
- UI: Loading state, Empty state, Error state, Responsive layout
- Documentation: Short implementation summary, Known limitations, Screenshots (or equivalent visual evidence if available)

No branch or feature is considered done without meeting all of those criteria.
