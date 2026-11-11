#!/bin/sh
# Publishes the site's source to github.com/id0xq/andynow.ru (branch main).
# GitHub Actions then builds it and deploys to Pages (.github/workflows/deploy.yml).
# The source lives in the vault (dev/projects/andynow-site); a separate clone outside the vault holds the git history.
# Usage: sh tools/publish.sh "commit message"
set -e
REPO=id0xq/andynow.ru
ROOT=$(cd "$(dirname "$0")/.." && pwd)
CLONE=${ANDYNOW_CLONE:-$HOME/.cache/andynow.ru}
MSG=${1:-Update site}

if [ ! -d "$CLONE/.git" ]; then
  gh repo view "$REPO" >/dev/null 2>&1 || gh repo create "$REPO" --public --description "andynow.ru — пространство Andy Now: музыка ханга, обучение, инструменты, проекты" --homepage "https://andynow.ru"
  mkdir -p "$CLONE"
  git -C "$CLONE" init -q -b main
  git -C "$CLONE" remote add origin "https://github.com/$REPO.git"
  git -C "$CLONE" fetch -q origin main 2>/dev/null && git -C "$CLONE" reset -q --soft origin/main || true
fi

rsync -a --delete --exclude .git --exclude .venv --exclude node_modules --exclude dist --exclude .DS_Store --exclude sources/figure-preview.png "$ROOT/" "$CLONE/"
cd "$CLONE"
git add -A
if git diff --cached --quiet; then echo "nothing new to publish"; else git commit -q -m "$MSG"; fi
git -c http.postBuffer=524288000 push -q -u origin main
echo "pushed to https://github.com/$REPO"

# Pages: built by the workflow, served on the domain
gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 || gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null
gh api -X PUT "repos/$REPO/pages" -f cname=andynow.ru >/dev/null 2>&1 || true
gh api "repos/$REPO/pages" --jq '"pages: " + .html_url + "  https: " + (.https_enforced|tostring) + "  cert: " + ((.https_certificate.state) // "pending")'
