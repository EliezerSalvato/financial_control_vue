#!/bin/bash
# Applies the style rules that AGENTS.md delegates to tooling, right after an edit.
# Always exits 0: a formatting failure must never block an edit.
set -uo pipefail

# The hook process does not inherit an interactive shell's PATH, so node (asdf,
# homebrew) may be missing for the `env node` shebang in node_modules/.bin.
export PATH="$HOME/.asdf/shims:/opt/homebrew/bin:/usr/local/bin:$PATH"

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" || exit 0
cd "$root" || exit 0

file="$(jq -r '.file_path // empty')"

if [ -z "$file" ]; then
  exit 0
fi

case "$file" in
  /*) ;;
  *) file="$root/$file" ;;
esac

# Never touch anything outside the project root.
case "$file" in
  "$root"/*) rel="${file#"$root"/}" ;;
  *) exit 0 ;;
esac

if [ ! -f "$file" ]; then
  exit 0
fi

case "$rel" in
  node_modules/* | dist/* | dist-ssr/* | coverage/* | .git/*) exit 0 ;;
esac

case "$rel" in
  *.vue | *.ts | *.mts | *.tsx)
    node_modules/.bin/eslint --fix --no-warn-ignored "$rel" >/dev/null 2>&1
    node_modules/.bin/prettier --write --ignore-unknown "$rel" >/dev/null 2>&1
    ;;
  *)
    node_modules/.bin/prettier --write --ignore-unknown "$rel" >/dev/null 2>&1
    ;;
esac

exit 0
