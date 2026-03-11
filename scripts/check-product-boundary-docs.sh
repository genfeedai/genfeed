#!/usr/bin/env bash
set -euo pipefail

ADR_PATH=".agents/SYSTEM/architecture/ADR-PLG-BOUNDARY-OSS-CLOUD.md"
COMMON_GIT_DIR="$(git rev-parse --git-common-dir)"
REPO_HOME="$(cd "$COMMON_GIT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(dirname "$REPO_HOME")"
CLOUD_ROOT="${GENFEED_CLOUD_ROOT:-$WORKSPACE_ROOT/cloud}"
DOCS_ROOT="${GENFEED_DOCS_ROOT:-$WORKSPACE_ROOT/docs}"
CLOUD_ADR_PATH="$CLOUD_ROOT/.agents/SYSTEM/architecture/ADR-PLG-BOUNDARY-OSS-CLOUD.md"
DOCS_PAGE_PATH="$DOCS_ROOT/content/product/core-cloud-boundary.mdx"
DOCS_META_PATH="$DOCS_ROOT/content/product/_meta.ts"

if [[ ! -f "$ADR_PATH" ]]; then
  echo "Missing required ADR: $ADR_PATH"
  exit 1
fi

required_patterns=(
  "^# ADR: PLG Boundary Between Core \\(OSS\\) and Cloud \\(SaaS\\)$"
  "^## Boundary Spec Version$"
  "^## Last Updated$"
  "^## Canonical Source$"
  "^## Public Canonical URL$"
  "^## Product Boundary$"
  "^## Version Bump Checklist$"
  "docs\\.genfeed\\.ai/product/core-cloud-boundary"
  "cloud/.agents/SYSTEM/architecture/ADR-PLG-BOUNDARY-OSS-CLOUD\\.md"
)

for pattern in "${required_patterns[@]}"; do
  if ! rg -n "$pattern" "$ADR_PATH" >/dev/null; then
    echo "Missing required boundary ADR content: $pattern"
    exit 1
  fi
done

if ! rg -n "ADR-PLG-BOUNDARY-OSS-CLOUD\\.md" README.md .agents/README.md >/dev/null; then
  echo "README and .agents/README must reference ADR-PLG-BOUNDARY-OSS-CLOUD.md"
  exit 1
fi

if [[ ! -f "$CLOUD_ADR_PATH" ]]; then
  echo "Missing cloud source ADR path: $CLOUD_ADR_PATH"
  exit 1
fi

if [[ ! -f "$DOCS_PAGE_PATH" ]]; then
  echo "Missing public docs page: $DOCS_PAGE_PATH"
  exit 1
fi

if [[ ! -f "$DOCS_META_PATH" ]]; then
  echo "Missing public docs meta file: $DOCS_META_PATH"
  exit 1
fi

core_version="$(awk '/^## Boundary Spec Version$/ {getline; print $0}' "$ADR_PATH" | tr -d '[:space:]')"
cloud_version="$(awk '/^## Boundary Spec Version$/ {getline; print $0}' "$CLOUD_ADR_PATH" | tr -d '[:space:]')"
docs_version="$(awk '/^## Boundary Spec Version$/ {getline; print $0}' "$DOCS_PAGE_PATH" | tr -d '[:space:]')"

if [[ -z "$core_version" || -z "$cloud_version" || -z "$docs_version" ]]; then
  echo "Unable to read Boundary Spec Version in core/cloud/docs boundary files"
  exit 1
fi

if [[ "$core_version" != "$cloud_version" ]]; then
  echo "Boundary Spec Version mismatch: core=$core_version cloud=$cloud_version"
  exit 1
fi

if [[ "$core_version" != "$docs_version" ]]; then
  echo "Boundary Spec Version mismatch: core=$core_version docs=$docs_version"
  exit 1
fi

if ! rg -n "core-cloud-boundary" "$DOCS_META_PATH" >/dev/null; then
  echo "Docs meta file must expose core-cloud-boundary route"
  exit 1
fi

echo "Core boundary documentation checks passed."
