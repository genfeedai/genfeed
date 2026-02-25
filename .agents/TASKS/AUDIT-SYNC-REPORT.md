# TASKS/PRDS GitHub Reconciliation Audit

**Date:** 2026-02-25
**Repository:** `genfeedai/core`
**Source of Truth:** GitHub Issues via `gh` CLI
**Applied Policy:** GitHub-only active tracking (no active local TASK/PRD mirrors), per user clarification.

## Summary Counts

- GitHub issues snapshot: 21 total
- GitHub open issues: 20
- GitHub closed issues: 1
- Active local task files after sync: 0
- Active local PRD files after sync: 0
- Archived local task files: 21
- Archived local PRD files: 18

## Reconciliation Actions

### Added

- `.agents/TASKS/issues-all.json` (GitHub issue snapshot export)
- `.agents/TASKS/AUDIT-SYNC-REPORT.md` (this report)
- Archived task entries created for GitHub issues previously missing local files:
  - `#6`, `#7`, `#9`, `#26`, `#27`, `#28`, `#29`, `#30`

### Updated

- `.agents/TASKS/README.md` updated to GitHub-only tracking policy
- `.agents/PRDS/README.md` updated to indicate PRDs are archived reference docs
- Historical local docs were already modified during initial reconciliation pass, then archived to preserve history

### Archived

- All GitHub-linked task markdown files moved from `.agents/TASKS/` to `.agents/TASKS/archive/`
- All PRD markdown files moved from `.agents/PRDS/` to `.agents/PRDS/archive/`
- Closed issue `#12` (`command-palette`) remains archived (task + PRD)

### Orphaned / Non-Issue Local Docs

Moved to archive as non-active local documentation:
- `avatar-workflow.md`
- `ugc-factory-prd.md`
- `ugc-factory-integration.md`
- `telegram-bot-core.md`
- `telegram-bot-workflow.md`

## Needs Manual Review

- Issues with no deterministic prior local PRD mapping: `#6`, `#7`, `#9`, `#26`, `#27`, `#28`, `#29`, `#30`.
  - Action taken: created minimal archived task stubs only (no active local PRDs), consistent with GitHub-only policy.
  - Review needed only if team wants to recreate local PRD/spec docs for any of these issues.

## Exact Commands Run

```bash
# Verify repo and read local rules
pwd
ls -la .agents/SYSTEM/ai/SESSION-QUICK-START.md .agents/SYSTEM/RULES.md
sed -n '1,220p' .agents/SYSTEM/ai/SESSION-QUICK-START.md
sed -n '1,220p' .agents/SYSTEM/RULES.md
sed -n '1,220p' .agents/SYSTEM/critical/CRITICAL-NEVER-DO.md

# Confirm GitHub remote and export issue snapshot
git remote -v | head -n 4
gh repo view --json nameWithOwner,defaultBranchRef
gh issue list --limit 200 --state all --json number,title,state,labels,milestone,assignees,url,updatedAt,createdAt,closedAt > .agents/TASKS/issues-all.json

# Inventory local TASKS/PRDS and inspect metadata
rg --files .agents/TASKS .agents/PRDS
jq 'length' .agents/TASKS/issues-all.json
jq -r '.[] | "#\(.number)\t\(.state)\t\(.title)"' .agents/TASKS/issues-all.json | sort -t'#' -k2,2n
for f in .agents/TASKS/*.md; do echo "--- $f"; rg -n "^## Task:|^\*\*Issue:\*\*|^\*\*Status:\*\*|^\*\*PRD:\*\*" "$f"; done
for f in .agents/PRDS/*.md; do echo "--- $f"; rg -n "^#|^##|Issue|Task|Status|Superseded|Cloud" "$f" | head -n 20; done

# Initial reconciliation pass (create missing issue task files, status alignment)
node <<'NODE' ... NODE

# Archive closed/non-active and orphan PRDs
mkdir -p .agents/TASKS/archive .agents/PRDS/archive
git mv .agents/TASKS/command-palette.md .agents/TASKS/archive/command-palette.md
git mv .agents/PRDS/command-palette.md .agents/PRDS/archive/command-palette.md
git mv .agents/PRDS/avatar-workflow.md .agents/PRDS/archive/avatar-workflow.md
git mv .agents/PRDS/ugc-factory-prd.md .agents/PRDS/archive/ugc-factory-prd.md
git mv .agents/PRDS/ugc-factory-integration.md .agents/PRDS/archive/ugc-factory-integration.md
git mv .agents/PRDS/telegram-bot-core.md .agents/PRDS/archive/telegram-bot-core.md
git mv .agents/PRDS/telegram-bot-workflow.md .agents/PRDS/archive/telegram-bot-workflow.md

# Apply policy pivot: GitHub-only active tracking
for f in .agents/TASKS/*.md; do ... git mv "$f" ".agents/TASKS/archive/$b"; done
for f in .agents/PRDS/*.md; do ... git mv "$f" ".agents/PRDS/archive/$b"; done
rm -f .agents/TASKS/.reconcile-tmp.json .agents/TASKS/.reconcile-prd-updates.json

# Validate final state
node <<'NODE' ... NODE
git status --short
```

## Final State Assertion

- GitHub remains source of truth.
- No active local TASK/PRD mirrors for GitHub issues.
- Historical local docs preserved in `archive/` via moves (history retained).
