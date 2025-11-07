# GRIST_SINGLE_ORG Architectural Analysis

## Executive Summary

The `GRIST_SINGLE_ORG` feature exhibits a fundamental architectural inconsistency where **personal orgs are created and visible via API, but documents within them are inaccessible**. This creates a confusing user experience with "zombie" resources that appear to exist but cannot be used.

The root cause is that different layers of the system make contradictory assumptions about what "single org mode" means, leading to a split-brain architecture.

---

## The Contradiction Explained

### Observed Behavior with GRIST_SINGLE_ORG=exampleorg

```bash
# Personal org EXISTS and is VISIBLE
GET /api/orgs → 200 OK
  [{id: 2, domain: "docs-5", name: "Personal", owner: {...}}]

# Personal org metadata ACCESSIBLE
GET /api/orgs/2 → 200 OK
  {id: 2, domain: "docs-5", name: "Personal", ...}

# Workspaces within personal org ACCESSIBLE
GET /api/orgs/2/workspaces → 200 OK
  [{id: 2, name: "Home", docs: [{id: "87KQmuWg37QEF7g2UK5xj2"}]}]

# Can CREATE documents successfully
POST /api/workspaces/2/docs → 200 OK
  {id: "87KQmuWg37QEF7g2UK5xj2", name: "My Doc"}

# BUT documents are INACCESSIBLE
GET /api/docs/87KQmuWg37QEF7g2UK5xj2 → 404 "document not found"
```

### Root Cause: Split-Brain Architecture

Different code paths enforce different rules:

| Layer | Behavior | GRIST_SINGLE_ORG Check? | File Location |
|-------|----------|------------------------|---------------|
| **User Signup** | Always creates personal org | ❌ NO | `app/gen-server/lib/homedb/UsersManager.ts:500-520` |
| **Org Listing** | Returns personal orgs | ❌ NO | `app/gen-server/lib/homedb/HomeDBManager.ts:_orgs()` |
| **Doc Access** | Filters by GRIST_SINGLE_ORG org | ✅ YES | `app/server/lib/extractOrg.ts:89` → `HomeDBManager._whereOrg()` |
| **Member Counting** | Special logic for "docs" | ⚠️ PARTIAL | `app/gen-server/lib/ActivationsManager.ts:64-74` |

---

## Technical Deep Dive

### 1. Personal Org Creation (No Check)

**File:** `app/gen-server/lib/homedb/UsersManager.ts`
**Lines:** 500-520

```typescript
if (!user.personalOrg && !NON_LOGIN_EMAILS.includes(login.email)) {
  // NO CHECK for GRIST_SINGLE_ORG here!
  const result = await this._homeDb.addOrg(user, {name: "Personal"}, {
    setUserAsOwner: true,
    useNewPlan: true,
    product: PERSONAL_FREE_PLAN,
  }, manager);
  // ...
}
```

**Trigger:** Called during `getUserByLogin()` whenever a user logs in.

**Key Finding:** Personal orgs are created unconditionally during user login, regardless of GRIST_SINGLE_ORG configuration.

---

### 2. Personal Org Domain Generation

**File:** `app/gen-server/lib/homedb/HomeDBManager.ts`
**Lines:** 2875-2899

Personal org domains follow the pattern `docs-{userId}` but are **NOT stored in the database**. Instead:
- Database stores `domain = NULL` for personal orgs (identified by `owner_id IS NOT NULL`)
- Domain is generated dynamically in `normalizeOrgDomain()` AFTER the query
- Applied to JSON responses via `_normalizeQueryResults()`

```typescript
public normalizeOrgDomain(orgId: number, domain: string|null,
                          ownerId: number|undefined, ...): string {
  if (ownerId) {
    const personalDomain = `docs-${this._idPrefix}${ownerId}`;  // e.g., "docs-1234"
    if (mergePersonalOrgs && (!domain || domain === personalDomain)) {
      domain = this.mergedOrgDomain();  // Returns "docs" (or "docs-s")
    }
    if (!domain) {
      domain = personalDomain;
    }
  }
  // ...
}
```

**Key Finding:** The `docs-*` domain is a post-query cosmetic addition, not a database value.

---

### 3. Document Access Control (Enforces Check)

**File:** `app/server/lib/extractOrg.ts`
**Lines:** 82-92

```typescript
public async getOrgInfoFromParts(host: string, urlPath: string): Promise<RequestOrgInfo> {
  // ...
  const singleOrg = getSingleOrg();  // Reads GRIST_SINGLE_ORG
  if (singleOrg) {
    return {org: singleOrg, url: parts.pathRemainder, isCustomHost: false};  // Force org
  }
  // ...
}
```

This middleware runs on EVERY request and sets `req.org` to the GRIST_SINGLE_ORG value.

**File:** `app/gen-server/lib/homedb/HomeDBManager.ts`
**Lines:** 4443-4479

```typescript
private _whereOrg<T>(qb: T, org: string|number, includeSupport = false): T {
  if (this.isMergedOrg(org)) {
    // Special case: "docs" means ALL personal orgs
    qb = qb.andWhere('orgs.owner_id is not null');
    return qb;
  }
  // Regular org: filter by domain
  return this._wherePlainOrg(qb, org);
}

private _wherePlainOrg<T>(qb: T, org: string|number): T {
  if (typeof org === 'number') {
    return qb.andWhere('orgs.id = :org', {org});
  }
  if (org.startsWith(`docs-${this._idPrefix}`)) {
    const ownerId = org.split(`docs-${this._idPrefix}`)[1];
    qb = qb.andWhere('orgs.owner_id = :ownerId', {ownerId});
  } else if (org.startsWith(`o-${this._idPrefix}`)) {
    const orgId = org.split(`o-${this._idPrefix}`)[1];
    qb = qb.andWhere('orgs.id = :orgId', {orgId});
  } else {
    // CRITICAL LINE: Filter by domain
    qb = qb.andWhere('orgs.domain = :org', {org});  // ← Filters out personal orgs!
  }
  return qb;
}
```

**The Problem:**
1. When `GRIST_SINGLE_ORG=exampleorg`, extractOrg sets `req.org = "exampleorg"`
2. This flows into document queries via `_whereOrg()`
3. SQL executes: `WHERE orgs.domain = 'exampleorg'`
4. Personal orgs have `domain = NULL` in database (domain is generated post-query)
5. Personal org documents don't match the WHERE clause → 404 "document not found"

**Key Finding:** Document access uses database-level filtering on a field that doesn't exist for personal orgs.

---

### 4. The "docs" Special Case

**File:** `app/gen-server/lib/homedb/HomeDBManager.ts`
**Lines:** 2917-2930

```typescript
public mergedOrgDomain() {
  if (this._idPrefix) {
    return `docs-${this._idPrefix}`;  // e.g., "docs-s" for staging
  }
  return 'docs';  // Production
}

// The merged organization is a special pseudo-organization
// patched together from all the material a given user has access to.
public isMergedOrg(orgKey: string|number|null) {
  return orgKey === this.mergedOrgDomain() || orgKey === 0;
}
```

**Why GRIST_SINGLE_ORG=docs Works:**

1. User logs in → personal org created
2. Request: `GET /api/docs/87KQmuWg37QEF7g2UK5xj2`
3. extractOrg sets `req.org = "docs"`
4. _whereOrg() called with org="docs"
5. `isMergedOrg("docs")` returns `TRUE` ✓
6. SQL executes: `WHERE orgs.owner_id IS NOT NULL` (matches personal orgs!)
7. Document found → 200 OK ✓

**Why GRIST_SINGLE_ORG=exampleorg Fails:**

1. User logs in → personal org created
2. Request: `GET /api/docs/87KQmuWg37QEF7g2UK5xj2`
3. extractOrg sets `req.org = "exampleorg"`
4. _whereOrg() called with org="exampleorg"
5. `isMergedOrg("exampleorg")` returns `FALSE` ✗
6. SQL executes: `WHERE orgs.domain = 'exampleorg'` (doesn't match NULL!)
7. Document NOT found → 404 ✗

**Key Finding:** "docs" is a magic value that triggers special merged-org behavior, allowing personal org access.

---

### 5. Member Counting Inconsistency

**File:** `app/gen-server/lib/ActivationsManager.ts`
**Lines:** 64-74

```typescript
if (process.env.GRIST_SINGLE_ORG === 'docs') {
  // Count only personal orgs
  return sub
    .where('o.owner_id = u.id')
    .andWhere('u.id NOT IN (:...excludedUsers)', {excludedUsers});
} else if (process.env.GRIST_SINGLE_ORG) {
  // Count users of this single org
  return sub
    .where('o.owner_id IS NULL')
    .andWhere('o.domain = :domain', {domain: process.env.GRIST_SINGLE_ORG})
    .andWhere('u.id NOT IN (:...excludedUsers)', {excludedUsers});
}
```

**Key Finding:** The system has special awareness of GRIST_SINGLE_ORG=docs for licensing/counting purposes, treating it differently from other single-org values.

---

## Authorization Flow Diagram

```
GET /api/docs/{docId}
  │
  ├─ extractOrg middleware
  │  └─ If GRIST_SINGLE_ORG set → req.org = GRIST_SINGLE_ORG
  │
  ├─ ApiServer.get('/api/docs/:did')
  │  └─ HomeDBManager.getDoc(req)
  │
  ├─ getDoc() → getDocImpl()
  │  └─ _doc() builds SQL query
  │     └─ _applyLimit(scope)
  │        └─ _whereOrg(scope.org)
  │           │
  │           ├─ If isMergedOrg(org):  ← GRIST_SINGLE_ORG=docs goes here
  │           │  └─ WHERE orgs.owner_id IS NOT NULL  ✓ Matches personal orgs
  │           │
  │           └─ Else:  ← GRIST_SINGLE_ORG=exampleorg goes here
  │              └─ WHERE orgs.domain = 'exampleorg'  ✗ Doesn't match NULL
  │
  └─ Result:
     ├─ GRIST_SINGLE_ORG=docs → Personal org docs accessible
     └─ GRIST_SINGLE_ORG=exampleorg → Personal org docs return 404
```

---

## Design Intent Analysis

Based on code comments and patterns, the **intended purpose** of GRIST_SINGLE_ORG appears to be:

### Original Intent (Inferred)
```
GRIST_SINGLE_ORG=docs     → Single-user deployment, all users get personal orgs
GRIST_SINGLE_ORG=teamname → Multi-user team deployment, all collaborate in one org
```

### Actual Implementation
- Personal orgs are **always created** (no conditional logic)
- Personal org docs are **accessible only when GRIST_SINGLE_ORG=docs**
- Personal org docs are **inaccessible when GRIST_SINGLE_ORG=anything else**
- But personal orgs remain **visible and seemingly functional** via org/workspace APIs

### The Confusion

The system simultaneously:
1. **Allows** personal org creation (no gate)
2. **Shows** personal orgs in listings (no filter)
3. **Allows** workspace creation in personal orgs (no prevention)
4. **Allows** doc creation in personal org workspaces (returns success)
5. **Blocks** access to those docs (returns 404)

This creates **zombie resources**: they exist, they're visible, you can create them, but you can't use them.

---

## Proposed Architectural Solutions

### Option A: True Single Org (Prevent Personal Org Creation)

**Philosophy:** "If GRIST_SINGLE_ORG is set to a team, users shouldn't have personal orgs at all."

**Changes:**
```typescript
// In UsersManager.getUserByLogin()
if (!user.personalOrg && !NON_LOGIN_EMAILS.includes(login.email)) {
  // NEW: Check if we're in single-org mode for a team
  if (process.env.GRIST_SINGLE_ORG && process.env.GRIST_SINGLE_ORG !== 'docs') {
    // Skip personal org creation - user will use the configured team org
    return;
  }
  // Existing: Create personal org
  const result = await this._homeDb.addOrg(user, {name: "Personal"}, ...);
}
```

**Pros:**
- Clean, simple mental model
- No zombie resources
- Matches likely intent of "single org" configuration
- Users immediately land in the configured team org

**Cons:**
- Breaking change for existing deployments
- Users who already have personal orgs would need migration
- What happens to existing docs in personal orgs?

---

### Option B: Allow Personal Org Docs in Single-Org Mode

**Philosophy:** "If we create personal orgs, make them fully functional."

**Changes:**
```typescript
// In HomeDBManager._whereOrg()
private _whereOrg<T>(qb: T, org: string|number, includeSupport = false): T {
  if (this.isMergedOrg(org)) {
    qb = qb.andWhere('orgs.owner_id is not null');
    return qb;
  }
  // NEW: When in GRIST_SINGLE_ORG mode, also include personal orgs
  if (process.env.GRIST_SINGLE_ORG && org === process.env.GRIST_SINGLE_ORG) {
    // Allow both the configured org AND personal orgs
    return qb.andWhere(new Brackets((q) =>
      this._wherePlainOrg(q, org)
      .orWhere('orgs.owner_id is not null')
    ));
  }
  // Regular org filtering
  return this._wherePlainOrg(qb, org);
}
```

**Pros:**
- No breaking changes
- Makes current behavior consistent
- Users can use personal orgs for private work

**Cons:**
- Defeats the purpose of "single org" - now it's multi-org
- Unexpected for admins who configured single-org mode
- Complicates the mental model

---

### Option C: Make GRIST_SINGLE_ORG More Explicit

**Philosophy:** "Provide separate config for personal org behavior."

**New Environment Variables:**
```bash
GRIST_SINGLE_ORG=exampleorg          # Team org for collaboration
GRIST_ENABLE_PERSONAL_ORGS=false     # Disable personal org creation
```

**Changes:**
```typescript
// In UsersManager.getUserByLogin()
if (!user.personalOrg && !NON_LOGIN_EMAILS.includes(login.email)) {
  if (process.env.GRIST_ENABLE_PERSONAL_ORGS === 'false') {
    // Skip personal org creation
    return;
  }
  const result = await this._homeDb.addOrg(user, {name: "Personal"}, ...);
}

// In HomeDBManager._whereOrg()
private _whereOrg<T>(qb: T, org: string|number, includeSupport = false): T {
  if (this.isMergedOrg(org)) {
    qb = qb.andWhere('orgs.owner_id is not null');
    return qb;
  }
  // NEW: Include personal orgs if enabled
  if (process.env.GRIST_ENABLE_PERSONAL_ORGS !== 'false' &&
      process.env.GRIST_SINGLE_ORG && org === process.env.GRIST_SINGLE_ORG) {
    return qb.andWhere(new Brackets((q) =>
      this._wherePlainOrg(q, org)
      .orWhere('orgs.owner_id is not null')
    ));
  }
  return this._wherePlainOrg(qb, org);
}
```

**Pros:**
- Explicit control over behavior
- Backward compatible (default to current behavior)
- Clear configuration surface

**Cons:**
- More complexity in configuration
- Two related env vars to coordinate

---

### Option D: Fix Only Access (Minimal Change)

**Philosophy:** "Just make personal org docs accessible when they exist."

**Changes:**
```typescript
// In HomeDBManager._whereOrg()
private _whereOrg<T>(qb: T, org: string|number, includeSupport = false): T {
  if (this.isMergedOrg(org)) {
    qb = qb.andWhere('orgs.owner_id is not null');
    return qb;
  }
  // NEW: Treat all GRIST_SINGLE_ORG values like "docs" for personal orgs
  if (process.env.GRIST_SINGLE_ORG) {
    // In single-org mode, allow access to both the configured org and personal orgs
    return qb.andWhere(new Brackets((q) =>
      this._wherePlainOrg(q, org)
      .orWhere('orgs.owner_id is not null')
    ));
  }
  return this._wherePlainOrg(qb, org);
}
```

**Pros:**
- Minimal code change
- Fixes the immediate 404 issue
- No configuration changes needed

**Cons:**
- Doesn't address the conceptual inconsistency
- Makes "single org" mean "one team org plus unlimited personal orgs"
- May not match admin expectations

---

## Recommendation: Option A (True Single Org)

**Rationale:**

1. **Matches Semantic Intent:** "GRIST_SINGLE_ORG=exampleorg" implies "this installation has one organization"
2. **Least Surprising:** Admins expect single-org to mean single-org
3. **Clean Architecture:** One clear rule throughout the codebase
4. **Preserves docs special case:** GRIST_SINGLE_ORG=docs continues to enable personal-org-only mode

**Migration Path:**
- Check for existing personal orgs on startup when GRIST_SINGLE_ORG != "docs"
- Log warning about personal org docs being inaccessible
- Provide migration command to move docs from personal to team org
- After migration, prevent new personal org creation

**Backwards Compatibility:**
- Add feature flag: `GRIST_LEGACY_PERSONAL_ORG_BEHAVIOR=true` to maintain old behavior
- Default to new behavior for new installations
- Document migration path clearly

---

## Next Steps

1. ✅ **Complete investigation** (this document)
2. ⏳ **Decide on approach** (Option A recommended)
3. ⏳ **Implement solution**
4. ⏳ **Add tests** to prevent regression
5. ⏳ **Document behavior** in README and code comments
6. ⏳ **Create migration guide** for existing deployments
