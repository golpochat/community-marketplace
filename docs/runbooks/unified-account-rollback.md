# Unified marketplace account — rollback

Git and deploy rollback for the **unified account** work (single login, `MEMBER` role, `/account/*` routes).

**Created:** 2026-07-14 · **Feature branch:** `feature/unified-marketplace-account`

---

## Backup references (on `origin`)

| Ref | Commit / tip | Purpose |
|-----|----------------|---------|
| **Tag** | `pre-unified-account-v1` | Last `main` **before** unified-account work (`ab4ad2f`) |
| **Branch** | `backup/pre-unified-account-2026-07-14` | Snapshot with pilot-feedback WIP included (`2ef3967`) |
| **Branch** | `feature/unified-marketplace-account` | Active implementation branch |

---

## When to rollback

- Registration or login broken for new or existing users
- Buyers cannot checkout after deploy
- Sellers cannot list or receive payouts
- Widespread 403s on `/account/*`, `/buyer/*`, or `/seller/*`
- JWT/session issues after role migration

---

## 1. Local / dev — discard unified-account changes

### Return to pre-work `main` (buyer/seller split)

```bash
git fetch origin
git checkout main
git reset --hard pre-unified-account-v1
```

### Or checkout the backup branch (includes pilot-feedback commit)

```bash
git fetch origin
git checkout backup/pre-unified-account-2026-07-14
```

### Abandon feature branch locally (optional)

```bash
git checkout main
git branch -D feature/unified-marketplace-account
```

---

## 2. GitHub — revert feature branch merge on `main`

If unified-account work was **merged to `main`** and you need to undo it:

```bash
git fetch origin
git checkout main
git pull origin main

# Option A: revert the merge commit (safe for shared branches)
git log --oneline -5   # find merge commit SHA
git revert -m 1 <merge-commit-sha>
git push origin main

# Option B: hard reset main to the tag (destructive — coordinate with team)
git reset --hard pre-unified-account-v1
git push --force-with-lease origin main
```

Prefer **Option A** if others may have pulled `main`. Use **Option B** only if `main` was not widely shared yet.

---

## 3. Production VPS — redeploy pre-work code

After resetting or reverting `main` on GitHub:

```bash
ssh ubuntu@sellnearby.ie
cd /opt/sellnearby

git fetch origin
git checkout main
git reset --hard pre-unified-account-v1

./infra/scripts/vps-update.sh
```

Verify:

```bash
curl -s https://api.sellnearby.ie/api/health/ready
```

From your machine:

```powershell
.\scripts\smoke-pilot.ps1 -BaseUrl "https://api.sellnearby.ie"
```

---

## 4. Database rollback (if MEMBER migration ran)

Prisma migrations are **forward-only**. Do **not** run `migrate reset` on production.

| Situation | Action |
|-----------|--------|
| Migration not yet applied on prod | Redeploy old code only (section 3) — no DB change needed |
| Migration applied, users mapped to `MEMBER` | Restore DB from backup ([restore-backup.md](./restore-backup.md)), **or** ship a new forward migration that maps `MEMBER` → `BUYER`/`SELLER` |
| Partial / failed migration | Fix forward with a new migration; restore from backup if data is inconsistent |

---

## 5. Session invalidation after rollback

Users who logged in during unified-account deploy may have stale JWTs.

After rollback deploy:

- Ask pilot users to **log out and log back in**, or
- Clear cookies for `sellnearby.ie` (hard refresh / incognito test)

---

## 6. Quick reference

```bash
# Show tag commit
git show pre-unified-account-v1 --oneline -s

# Show backup branch tip
git log origin/backup/pre-unified-account-2026-07-14 -1 --oneline

# List branches related to this work
git branch -a | grep -E 'unified|backup/pre-unified'
```

---

## Related

- [Rollback (general)](./rollback.md)
- [OVH VPS deploy](./ovh-vps-deploy.md)
- [Restore backup](./restore-backup.md)
