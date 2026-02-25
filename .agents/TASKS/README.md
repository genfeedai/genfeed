# Task Management

Task tracking for the content-workflow project. Compatible with Kaiban Board VS Code extension.

### Source of Truth

- GitHub issues (`gh issue list --state all`) are the source of truth.
- Active issue tracking is done on GitHub only.
- Local `.agents/TASKS/` keeps snapshots/reports and quick notes (`INBOX.md`).
- Historical local task markdown is kept in `.agents/TASKS/archive/`.

## Local Files

- `issues-all.json`: Full issue export snapshot from GitHub.
- `AUDIT-SYNC-REPORT.md`: Latest reconciliation report.
- `INBOX.md`: Optional quick-capture scratchpad.
- `archive/`: Historical task markdown (not active tracking).

---

**Last Updated:** 2026-02-25
