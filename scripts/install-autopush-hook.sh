#!/bin/sh
# Installs scripts/post-commit as the repo's post-commit hook, so every
# commit auto-pushes to origin (keeps GitHub's contribution graph current).
# Run from anywhere:  sh scripts/install-autopush-hook.sh   (or: pnpm hooks:install)
set -e

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

if [ -n "$(git config core.hooksPath)" ]; then
  echo "warning: core.hooksPath is set to '$(git config core.hooksPath)';" >&2
  echo "         .git/hooks/post-commit will NOT run. Unset it or install there." >&2
fi

install -m 755 scripts/post-commit .git/hooks/post-commit
sh -n .git/hooks/post-commit

echo "installed .git/hooks/post-commit — commits will auto-push to origin"
echo "bypass anytime with: GIT_AUTOPUSH_OFF=1 <git commit ...>"