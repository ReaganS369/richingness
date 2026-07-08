# ADR 0001: Monorepo Architecture

## Status
Approved

## Context
Richingness is a multi-platform Financial Operating System deployed across web, mobile, and desktop. A single-application codebase limits structural scaling, leading to fragmented business logic, inconsistent UI, and duplicate code across separate platforms.

## Decision
We choose a monorepo setup using **Turborepo** and **pnpm workspaces** for package management and dependency isolation.

### Package Categories
- `/apps`: Deployable products (`mobile`, `web`, `desktop`).
- `/packages`: Shared interfaces and packages:
  - `design-system`: Visual style tokens.
  - `ui`: Modular components.
  - `budget-engine` & `finance-engine`: Platform-agnostic financial logic.
  - `database`: Schemas and migration scripts.
  - `sync`: Syncing orchestrators.
  - `config`: Tooling rules.
- `/modules`: Scaffold structures for future modular integration.

## Consequences
- **Code Sharing**: High reuse of logical engines and UI tokens.
- **Dependency Control**: pnpm workspaces allow local links with zero registry overhead.
- **Build Speed**: Turborepo utilizes remote caching and task hashing to skip rebuilding unchanged modules.
- **Symlink Gotcha**: Metro (React Native) cannot resolve standard pnpm symlinks without hoisting config (`node-linker=hoisted` inside `.npmrc`).
