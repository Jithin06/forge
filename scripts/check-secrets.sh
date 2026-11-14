#!/usr/bin/env bash
# M0 check: no secret appears in the client bundle or in git.
# Run after `npm run build`. Reads secret values from .env.local if present.
set -u
cd "$(dirname "$0")/.."

fail=0
bundle=".next/static"
[ -d "$bundle" ] || { echo "No $bundle. Run npm run build first."; exit 2; }

# 1. Names of server-only variables must not appear in client JS.
for name in SUPABASE_SERVICE_ROLE_KEY ANTHROPIC_API_KEY GEMINI_API_KEY STAFF_SEED; do
  if grep -rlq "$name" "$bundle"; then echo "FAIL  $name named in client bundle"; fail=1
  else echo "PASS  $name not in client bundle"; fi
done

# 2. Actual secret values (if set locally) must not appear in client JS or git.
if [ -f .env.local ]; then
  while IFS='=' read -r key value; do
    case "$key" in
      SUPABASE_SERVICE_ROLE_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY|STAFF_SEED) ;;
      *) continue ;;
    esac
    value="${value%\"}"; value="${value#\"}"
    [ -n "$value" ] || continue
    if grep -rqF -- "$value" "$bundle"; then echo "FAIL  value of $key found in client bundle"; fail=1
    else echo "PASS  value of $key not in client bundle"; fi
    if git log -p --all | grep -qF -- "$value" || git grep -qF -- "$value"; then
      echo "FAIL  value of $key found in git"; fail=1
    else echo "PASS  value of $key not in git history"; fi
  done < .env.local
else
  echo "NOTE  no .env.local, so secret values were not checked"
fi

# 3. Common key shapes must not be tracked in git (any commit).
pattern='sk-ant-[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{30,}|"role"\s*:\s*"service_role"'
if git log -p --all | grep -Eq "$pattern"; then echo "FAIL  key-shaped string in git history"; fail=1
else echo "PASS  no key-shaped strings in git history"; fi
if git ls-files --error-unmatch .env.local >/dev/null 2>&1; then echo "FAIL  .env.local is tracked"; fail=1
else echo "PASS  .env.local not tracked"; fi

exit $fail
