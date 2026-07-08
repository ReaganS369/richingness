# Contributing Guidelines

## Conventional Commits
All commits must follow the Conventional Commits specification:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```
### Allowed Types:
- `feat`: A new feature.
- `fix`: A bug fix.
- `docs`: Documentation changes.
- `style`: Formatting, missing semi-colons, etc. (no production code changes).
- `refactor`: Refactoring production code without changing behavior.
- `test`: Adding missing tests, refactoring tests.
- `chore`: Updating build scripts, package configs, dependencies, etc.

Commitlint enforces this standard at the git hook level via Husky.

## Changesets
We use **Changesets** to manage package versioning and changelogs.
1. When proposing a change that affects shared packages, run `pnpm changeset`.
2. Follow the prompt to specify the package name and change version bump type (`patch`, `minor`, `major`).
3. Commit the generated `.changeset` markdown file with your changes.
4. During release cycle runs, the CI command `pnpm changeset version` updates package versions and creates tags.

## Code Quality Check gates
Before a commit is pushed to the remote repository, a pre-commit hook runs via `husky` and `lint-staged` executing:
- TypeScript type checking.
- ESLint checks.
- Prettier formatting.
- Vitest unit tests execution.
