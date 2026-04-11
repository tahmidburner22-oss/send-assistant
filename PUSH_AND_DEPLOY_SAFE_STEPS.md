# Safe Push Steps (No Secret Leakage)

Use these commands locally in your trusted machine (not in chat):

## 1) Rotate exposed credentials first

1. Revoke any exposed GitHub PAT.
2. Change admin password.
3. Invalidate active sessions for admin account.

## 2) Configure remote

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
# or if origin already exists
git remote set-url origin <YOUR_GITHUB_REPO_URL>
```

Verify:

```bash
git remote -v
```

## 3) Push current branch

```bash
git push -u origin work
```

If your branch is different, replace `work` accordingly.

## 4) Open PR

```bash
gh pr create --fill
```

Or create PR in GitHub UI.

## 5) Production deploy checklist

1. Apply DB migrations (new worksheet tables).
2. Set required env vars (`JWT_SECRET`, provider keys, allowed origins).
3. Restart app and run smoke checks:
   - `/api/health`
   - `/api/library/resolve`
   - `/api/library/tiers`
   - `/api/library/switch-tier`
4. Verify `X-Request-Id` in responses.
5. Verify login creates HttpOnly `token` cookie.

## 6) Post-deploy verification

- Generate worksheet from library (no SEND) and confirm no structure changes.
- Apply SEND/read age/retrieval transforms and confirm diagram refs stay stable.
- Use differentiate/tier switch and confirm transform state is preserved.

## 7) If push fails

- `fatal: No configured push destination` -> set `origin` URL.
- `permission denied` -> refresh PAT and re-auth `gh auth login`.
- `non-fast-forward` -> `git pull --rebase origin work` then push.
