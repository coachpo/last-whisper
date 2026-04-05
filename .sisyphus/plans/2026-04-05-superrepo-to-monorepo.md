# Superrepo to Monorepo Migration Plan (No Backward Compatibility)

## Plan Metadata
- **Plan path:** `.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md`
- **Requirement:** turn this repository from a superrepo with Git submodules into a true monorepo
- **Implementation worktree:** `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo`
- **Base ref:** `origin/main`
- **Implementation branch:** `sisyphus/monorepo-migration-no-compatibility`
- **Main repo start HEAD / worktree HEAD:** `3a6b7d4eb9cb5a3b2b99dcea22987313583f5304`
- **Backend source revision to inline:** `33b4bd79fac91b832ae51451f1741043964ee497` on `heads/main`
- **Frontend source revision to inline:** `1f84cdca5f97205eafea89caa09c36bc9eae73ec` on `heads/main`
- **Stop condition:** stop after implementation and verification, before commit, rebase, push, merge, or worktree cleanup

## Goal / Scope
Convert the repository in `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo` into a single Git repository that directly tracks the contents of:
- `last-whisper-backend/`
- `last-whisper-frontend/`

This migration explicitly includes:
- removing `.gitmodules`
- removing both submodule gitlinks
- inlining the backend contents from `33b4bd79fac91b832ae51451f1741043964ee497`
- inlining the frontend contents from `1f84cdca5f97205eafea89caa09c36bc9eae73ec`
- removing nested `.git` indirection from both inlined project directories
- updating root docs, AGENTS guidance, workflows, and path assumptions to match a real monorepo
- moving pnpm workspace ownership to the repo root
- preserving the existing frontend `onlyBuiltDependencies` values when creating the new root `pnpm-workspace.yaml`
- removing obsolete submodule-era workflow metadata rather than preserving compatibility

This migration explicitly excludes:
- any backward compatibility layer
- any continued use of `git submodule`
- any post-implementation commit/rebase/cleanup actions

## Assumptions
- The top-level directory names remain `last-whisper-backend/` and `last-whisper-frontend/`.
- The provided backend and frontend SHAs are the exact source revisions to inline.
- There is currently no root `package.json` and no root `pnpm-workspace.yaml`.
- The frontend already has a minimal `pnpm-workspace.yaml`; its existing `onlyBuiltDependencies` values must be preserved in the new root workspace file.
- The backend remains a Python project rooted at `last-whisper-backend/pyproject.toml`.
- The frontend remains a pnpm project rooted at `last-whisper-frontend/package.json`.
- Root GitHub Actions workflows become the authoritative workflow surface for the monorepo.

## Submodule Scope
### Current submodules
- **Backend**
  - path: `last-whisper-backend`
  - current submodule SHA: `33b4bd79fac91b832ae51451f1741043964ee497`
  - current branch metadata: `heads/main`
- **Frontend**
  - path: `last-whisper-frontend`
  - current submodule SHA: `1f84cdca5f97205eafea89caa09c36bc9eae73ec`
  - current branch metadata: `heads/main`

### Required removals
- Delete `.gitmodules`.
- Remove both `160000` gitlink entries from the main repo index.
- Remove any nested `.git` file or directory inside `last-whisper-backend/` and `last-whisper-frontend/`.
- Remove any remaining submodule administrative metadata for those paths from the worktree Git admin area if present.
- End state: zero submodules, zero gitlinks, zero submodule lifecycle instructions.

## Monorepo Scope
### Target repository shape
- The root repository directly owns:
  - `last-whisper-backend/`
  - `last-whisper-frontend/`
  - root docs
  - root GitHub workflows

### Workspace / bootstrap target state
- Create a new repo-root `pnpm-workspace.yaml`.
- The new root `pnpm-workspace.yaml` must:
  - declare `last-whisper-frontend` under `packages:`
  - preserve the exact existing frontend `onlyBuiltDependencies` values
- Delete `last-whisper-frontend/pnpm-workspace.yaml` after its `onlyBuiltDependencies` content has been preserved in the root workspace file.
- Keep developer bootstrap project-scoped under one repo checkout:
  - backend: `cd last-whisper-backend && pip install -e ".[dev]"`
  - frontend: `cd last-whisper-frontend && pnpm install`

## Planned Touch Points
### Root
- `.gitmodules` (delete)
- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/architecture.md`
- `docs/frontend-architecture.md`
- `docs/deployment.md`
- `docs/testing.md`
- `docs/data-model.md`
- `.github/workflows/builder.yml`
- `.github/workflows/cleanup.yml`
- `pnpm-workspace.yaml` (new)
- `.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md`

### Backend-local
- `last-whisper-backend/README.md`
- `last-whisper-backend/AGENTS.md`
- `last-whisper-backend/Dockerfile`
- `last-whisper-backend/pyproject.toml`
- `last-whisper-backend/.github/workflows/ci.yml` (remove after any required behavior is migrated to root workflows)

### Frontend-local
- `last-whisper-frontend/README.md`
- `last-whisper-frontend/AGENTS.md`
- `last-whisper-frontend/Dockerfile`
- `last-whisper-frontend/package.json`
- `last-whisper-frontend/pnpm-workspace.yaml` (delete after root workspace file preserves its `onlyBuiltDependencies`)

## Concrete Implementation Steps With Immediate QA

### 1. Save the revised approved plan in the worktree
Write this plan to:
- `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md`

**Immediate QA**
```bash
test -f /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md
```
**Expected outcome:** exit status 0.

```bash
grep -n '^# Superrepo to Monorepo Migration Plan (No Backward Compatibility)$' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md
```
**Expected outcome:** one matching title line.

---

### 2. Replace the backend gitlink with normal tracked files
Use the backend submodule contents at `33b4bd79fac91b832ae51451f1741043964ee497` as the source of truth. Remove the backend gitlink from the main repo index and replace it with normal tracked files under the same path. Remove any nested `.git` file or directory from `last-whisper-backend/`.

**Immediate QA**
```bash
test -f /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/pyproject.toml
```
**Expected outcome:** exit status 0.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/.git
```
**Expected outcome:** exit status 0.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo ls-files --stage | grep -E '^160000 .*	last-whisper-backend$'
```
**Expected outcome:** no output.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo ls-files --stage -- last-whisper-backend/pyproject.toml
```
**Expected outcome:** one staged file entry with a normal file mode such as `100644`, not `160000`.

---

### 3. Replace the frontend gitlink with normal tracked files
Use the frontend submodule contents at `1f84cdca5f97205eafea89caa09c36bc9eae73ec` as the source of truth. Remove the frontend gitlink from the main repo index and replace it with normal tracked files under the same path. Remove any nested `.git` file or directory from `last-whisper-frontend/`.

**Immediate QA**
```bash
test -f /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/package.json
```
**Expected outcome:** exit status 0.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/.git
```
**Expected outcome:** exit status 0.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo ls-files --stage | grep -E '^160000 .*	last-whisper-frontend$'
```
**Expected outcome:** no output.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo ls-files --stage -- last-whisper-frontend/package.json
```
**Expected outcome:** one staged file entry with a normal file mode such as `100644`, not `160000`.

---

### 4. Remove all submodule metadata and gitlink remnants
Delete `.gitmodules`. Remove any remaining submodule admin metadata for `last-whisper-backend` and `last-whisper-frontend` from the worktree’s Git admin area if present. Confirm the repository no longer has any gitlinks or submodule config entries.

**Immediate QA**
```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.gitmodules
```
**Expected outcome:** exit status 0.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo ls-files --stage | grep '^160000 '
```
**Expected outcome:** no output.

```bash
test ! -e "$(git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo rev-parse --git-dir)/modules/last-whisper-backend"
```
**Expected outcome:** exit status 0.

```bash
test ! -e "$(git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo rev-parse --git-dir)/modules/last-whisper-frontend"
```
**Expected outcome:** exit status 0.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo config --file "$(git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo rev-parse --git-dir)/config" --get-regexp '^submodule\.'
```
**Expected outcome:** no output.

---

### 5. Move pnpm workspace ownership to the repo root without losing `onlyBuiltDependencies`
Create `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml` at the repo root. It must contain:
- `packages:` with `last-whisper-frontend`
- the exact `onlyBuiltDependencies` values currently present in `last-whisper-frontend/pnpm-workspace.yaml`

Do not replace the existing frontend workspace content with only a `packages:` list. Preserve or merge the existing `onlyBuiltDependencies` block into the new root workspace file, then delete `last-whisper-frontend/pnpm-workspace.yaml`.

**Immediate QA 5a — run before deleting `last-whisper-frontend/pnpm-workspace.yaml`**
```bash
python3 - <<'PY'
from pathlib import Path
root = Path("/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo")
old = root / "last-whisper-frontend" / "pnpm-workspace.yaml"
new = root / "pnpm-workspace.yaml"

def extract_only_built(path: Path):
    lines = path.read_text().splitlines()
    capture = False
    block = []
    for line in lines:
        if not capture and line.startswith("onlyBuiltDependencies:"):
            capture = True
            block.append(line.rstrip())
            continue
        if capture:
            if line.strip() == "":
                continue
            if not line.startswith(" ") and not line.startswith("\t") and not line.lstrip().startswith("-"):
                break
            block.append(line.rstrip())
    return block

old_block = extract_only_built(old)
new_block = extract_only_built(new)

if not old_block:
    raise SystemExit("missing onlyBuiltDependencies block in original frontend workspace file")
if old_block != new_block:
    raise SystemExit("onlyBuiltDependencies block mismatch between original frontend file and new root workspace file")

print("onlyBuiltDependencies preserved exactly")
PY
```
**Expected outcome:** prints `onlyBuiltDependencies preserved exactly`.

**Immediate QA 5b — run after deleting `last-whisper-frontend/pnpm-workspace.yaml`**
```bash
grep -n '^packages:$' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml
```
**Expected outcome:** one matching `packages:` line.

```bash
grep -n 'last-whisper-frontend' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml
```
**Expected outcome:** one or more matches showing `last-whisper-frontend` is declared in the root workspace.

```bash
grep -n '^onlyBuiltDependencies:$' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml
```
**Expected outcome:** one matching `onlyBuiltDependencies:` line.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/pnpm-workspace.yaml
```
**Expected outcome:** exit status 0.

---

### 6. Update root docs and root AGENTS guidance for the actual monorepo shape
Update the root repo docs and guidance so they describe one repository that directly owns backend and frontend. Remove submodule lifecycle instructions and any separate-repo assumptions from:
- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `docs/architecture.md`
- `docs/frontend-architecture.md`
- `docs/deployment.md`
- `docs/testing.md`
- `docs/data-model.md`

**Immediate QA**
```bash
grep -R -n -E 'git submodule|submodule update|submodule init' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/docs
```
**Expected outcome:** no output.

```bash
grep -R -n -E 'last-whisper-backend|last-whisper-frontend' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/docs
```
**Expected outcome:** one or more matches showing root-owned backend/frontend paths are documented.

---

### 7. Update backend-local files for monorepo ownership and retire nested backend workflow metadata
Update:
- `last-whisper-backend/README.md`
- `last-whisper-backend/AGENTS.md`
- `last-whisper-backend/Dockerfile`
- `last-whisper-backend/pyproject.toml`

Remove `last-whisper-backend/.github/workflows/ci.yml` after any required behavior has been migrated to root `.github/workflows/`. Do not preserve a nested backend CI workflow as a compatibility layer.

**Immediate QA**
```bash
grep -R -n -E 'git submodule|submodule update|submodule init|standalone repository|separate repository' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/Dockerfile \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/pyproject.toml
```
**Expected outcome:** no output.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/.github/workflows/ci.yml
```
**Expected outcome:** exit status 0.

---

### 8. Update frontend-local files for monorepo ownership
Update:
- `last-whisper-frontend/README.md`
- `last-whisper-frontend/AGENTS.md`
- `last-whisper-frontend/Dockerfile`
- `last-whisper-frontend/package.json`

Remove separate-repo assumptions and ensure workspace references point to the new root-owned monorepo layout.

**Immediate QA**
```bash
grep -R -n -E 'git submodule|submodule update|submodule init|standalone repository|separate repository' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/Dockerfile \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/package.json
```
**Expected outcome:** no output.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/pnpm-workspace.yaml
```
**Expected outcome:** exit status 0.

---

### 9. Make root GitHub workflows authoritative for the inlined monorepo
Update:
- `.github/workflows/builder.yml`
- `.github/workflows/cleanup.yml`

Remove submodule checkout/update assumptions. Ensure root workflows use the inlined `last-whisper-backend/` and `last-whisper-frontend/` paths. If any behavior from `last-whisper-backend/.github/workflows/ci.yml` is still required, port it into root `.github/workflows/` before deleting the nested backend workflow file.

**Immediate QA**
```bash
grep -R -n -E 'git submodule|submodule update|submodule init|submodules:' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.github/workflows
```
**Expected outcome:** no output.

```bash
grep -R -n -E 'last-whisper-backend|last-whisper-frontend' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.github/workflows
```
**Expected outcome:** one or more matches showing root workflows target inlined project paths.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/.github/workflows/ci.yml
```
**Expected outcome:** exit status 0.

---

### 10. Reconcile all bootstrap and path assumptions with the new monorepo shape
Ensure the final tree consistently documents a single repo checkout with project-scoped commands. Remove any remaining instructions that require submodule commands, separate clones, or a superrepo mental model.

**Immediate QA**
```bash
grep -R -n -E 'git submodule|submodule update|submodule init|git clone .*last-whisper-backend|git clone .*last-whisper-frontend' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/docs \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.github/workflows \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/AGENTS.md
```
**Expected outcome:** no output.

```bash
grep -R -n -E 'cd last-whisper-backend|cd last-whisper-frontend' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/docs
```
**Expected outcome:** one or more matches showing project-scoped commands inside a single repo checkout.

---

### 11. Run full verification, capture revision inventory, and stop
Run the final verification commands below from the implementation worktree. Capture the exact results, including the step-5 `onlyBuiltDependencies` preservation evidence, then stop before commit/rebase/cleanup.

**Immediate QA**
- Every command in the **Exact Final Verification Commands** section below must pass with the expected outcome.
- `git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo branch --show-current` must print `sisyphus/monorepo-migration-no-compatibility`.
- `git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo rev-parse HEAD` must print `3a6b7d4eb9cb5a3b2b99dcea22987313583f5304` because implementation stops before commit.

## Exact Final Verification Commands

### Repo-level shape and metadata verification
```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.gitmodules
```
**Expected outcome:** exit status 0.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/.git
```
**Expected outcome:** exit status 0.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/.git
```
**Expected outcome:** exit status 0.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo ls-files --stage | grep '^160000 '
```
**Expected outcome:** no output.

```bash
grep -n '^packages:$' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml
```
**Expected outcome:** one matching `packages:` line.

```bash
grep -n '^onlyBuiltDependencies:$' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml
```
**Expected outcome:** one matching `onlyBuiltDependencies:` line.

```bash
grep -n 'last-whisper-frontend' /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/pnpm-workspace.yaml
```
**Expected outcome:** one or more matches showing the frontend package path is declared.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/pnpm-workspace.yaml
```
**Expected outcome:** exit status 0.

```bash
grep -R -n -E 'git submodule|submodule update|submodule init|submodules:' \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/docs \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/.github/workflows \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/AGENTS.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/README.md \
  /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend/AGENTS.md
```
**Expected outcome:** no output.

```bash
test ! -e /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend/.github/workflows/ci.yml
```
**Expected outcome:** exit status 0.

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo branch --show-current
```
**Expected outcome:** `sisyphus/monorepo-migration-no-compatibility`

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo rev-parse HEAD
```
**Expected outcome:** `3a6b7d4eb9cb5a3b2b99dcea22987313583f5304`

```bash
git -C /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo status --short
```
**Expected outcome:** modified/added/deleted file entries only; no submodule status entries.

### Backend verification
```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend && pytest
```
**Expected outcome:** exit status 0.

```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend && ruff check app tests
```
**Expected outcome:** exit status 0.

```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-backend && black app tests --check
```
**Expected outcome:** exit status 0.

### Frontend verification
```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend && pnpm lint
```
**Expected outcome:** exit status 0.

```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend && pnpm type-check
```
**Expected outcome:** exit status 0.

```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend && pnpm test:unit
```
**Expected outcome:** exit status 0.

```bash
cd /Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo/last-whisper-frontend && pnpm build
```
**Expected outcome:** exit status 0.

## Branch / Worktree / Revision Tracking
- **Worktree path:** `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo`
- **Base ref:** `origin/main`
- **Branch:** `sisyphus/monorepo-migration-no-compatibility`
- **Main repo start HEAD:** `3a6b7d4eb9cb5a3b2b99dcea22987313583f5304`
- **Backend source SHA to inline:** `33b4bd79fac91b832ae51451f1741043964ee497`
- **Frontend source SHA to inline:** `1f84cdca5f97205eafea89caa09c36bc9eae73ec`

### Tracking rules
- Perform all work only in the stated worktree.
- Do not create additional branches.
- Do not create additional worktrees.
- Do not commit during implementation.
- Treat the backend and frontend SHAs above as the revision inventory for the inlined source trees.
- Since implementation stops before commit, the final report must describe the verified dirty worktree state.

## Risks / Rollback
### Risks
- A gitlink may be removed from the working tree but not fully replaced with normal tracked files in the index.
- Nested `.git` metadata may survive inside one of the inlined directories.
- The new root `pnpm-workspace.yaml` may accidentally drop the frontend `onlyBuiltDependencies` values.
- Root workflows may still assume submodule checkout/update behavior.
- Root docs may be updated while backend/frontend local docs still describe standalone repos.

### Rollback
- If the migration becomes inconsistent before verification passes, reset the worktree back to `3a6b7d4eb9cb5a3b2b99dcea22987313583f5304`.
- Restore the original superrepo state using the recorded backend and frontend SHAs.
- Re-run the migration from this plan instead of layering fixes onto a partially converted tree.
- Do not ship a mixed state containing both gitlinks and inlined files.

## Approval Record
- **Planner:** `@Prometheus`
- **Critic:** `@Momus`
- **Plan file:** `.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md`
- **Status:** `APPROVED`
- **Approved revision:** `Momus re-review after task-level QA additions and pnpm workspace preservation requirement`
- **Approval date:** `2026-04-05`
- **Approval notes:** `Plan approved as executable with concrete task-level QA scenarios.`

## Stop Point
Stop after:
- all implementation steps are complete in `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo`
- all immediate QA checks have passed
- all commands in **Exact Final Verification Commands** have passed
- the revision inventory below has been captured

Do not:
- commit
- rebase
- push
- merge
- delete the worktree
- clean up branches
- continue into release flow

## Revision Inventory Expectations
The final stop report must include:
- approved plan path: `.sisyphus/plans/2026-04-05-superrepo-to-monorepo.md`
- implementation worktree path: `/Users/liqing/Documents/PersonalProjects/My_Proj/last-whisper-sisyphus-monorepo`
- base ref used: `origin/main`
- branch used: `sisyphus/monorepo-migration-no-compatibility`
- main repo start HEAD: `3a6b7d4eb9cb5a3b2b99dcea22987313583f5304`
- backend source SHA inlined: `33b4bd79fac91b832ae51451f1741043964ee497`
- frontend source SHA inlined: `1f84cdca5f97205eafea89caa09c36bc9eae73ec`
- explicit confirmation that `.gitmodules` was removed
- explicit confirmation that no `160000` gitlink entries remain
- explicit confirmation that `last-whisper-backend/.git` and `last-whisper-frontend/.git` do not exist
- explicit confirmation that `last-whisper-frontend/pnpm-workspace.yaml` was removed
- explicit confirmation that root `pnpm-workspace.yaml` was created
- the exact `onlyBuiltDependencies` values preserved from the original frontend workspace file into the root workspace file
- explicit confirmation that `last-whisper-backend/.github/workflows/ci.yml` was removed after any required behavior was migrated to root workflows
- the exact final verification commands run and pass/fail status for each
- the step-5 QA evidence proving `onlyBuiltDependencies` preservation
- explicit statement that no additional branches or worktrees were used, or a full inventory if that expectation was broken
- explicit statement that implementation stopped before commit, rebase, and cleanup
