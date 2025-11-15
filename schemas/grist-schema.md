# Grist Database Schema Reference

> **Schema Version:** 44
> **Last Updated:** 2025-11
> **Authoritative Source:** [`sandbox/grist/schema.py`](sandbox/grist/schema.py)

## Overview

Grist stores document metadata in special tables prefixed with `_grist_*`. These metadata tables describe the structure of user tables, views, pages, access control rules, and other document-level settings. While users can create and modify their own tables, these metadata tables are managed by Grist's data engine and define how the document is organized and displayed.

**Key Concepts:**
- **Document Database**: Each `.grist` file is a SQLite database containing both user data tables and metadata tables
- **Metadata Tables** (`_grist_*`): Managed by the Python data engine, defined in `sandbox/grist/schema.py`
- **System Tables** (`_gristsys_*`): Managed by Node.js, defined in `app/server/lib/DocStorage.ts`
- **Schema Version**: Currently at version 44, tracked in `_grist_DocInfo.schemaVersion`

---

## Quick Reference Table

| Metadata Table | Purpose | Key Relationships |
|----------------|---------|-------------------|
| `_grist_DocInfo` | Document-wide settings (timezone, schema version) | Single record with id=1 |
| `_grist_Tables` | Registry of user tables | → `_grist_Views`, `_grist_Views_section` |
| `_grist_Tables_column` | Column definitions and formulas | → `_grist_Tables` (parent) |
| `_grist_Views` | View definitions | ← `_grist_Tables` (primaryViewId) |
| `_grist_Views_section` | Sections within views (list, detail, chart) | → `_grist_Tables`, `_grist_Views` |
| `_grist_Views_section_field` | Field display settings within sections | → `_grist_Views_section`, `_grist_Tables_column` |
| `_grist_Pages` | Page hierarchy and navigation | → `_grist_Views`, `_grist_Shares` |
| `_grist_Filters` | Column filters for view sections | → `_grist_Views_section`, `_grist_Tables_column` |
| `_grist_ACLRules` | Access control rules | → `_grist_ACLResources`, `_grist_Tables_column` |
| `_grist_ACLResources` | ACL resource definitions (table/column specs) | ← `_grist_ACLRules` |
| `_grist_Attachments` | File attachments metadata | File data stored in `_gristsys_Files` |
| `_grist_Triggers` | Webhook triggers | → `_grist_Tables`, `_grist_Tables_column` |
| `_grist_Shares` | Document share links | ← `_grist_Pages` |
| `_grist_Cells` | Cell-level metadata (comments, etc.) | → `_grist_Tables`, `_grist_Tables_column` |

---

## Table Hierarchy Diagram

```
_grist_DocInfo (id=1, singleton)
│
├─ _grist_Tables
│  ├─ tableId: "MyTable"
│  ├─ primaryViewId → _grist_Views
│  ├─ rawViewSectionRef → _grist_Views_section
│  └─ recordCardViewSectionRef → _grist_Views_section
│  │
│  └─ _grist_Tables_column (parentId → _grist_Tables)
│     ├─ colId, type, formula
│     ├─ displayCol → _grist_Tables_column (helper column)
│     ├─ visibleCol → _grist_Tables_column (displayed field in Ref)
│     ├─ reverseCol → _grist_Tables_column (two-way reference)
│     ├─ rules → RefList:_grist_Tables_column (conditional formatting)
│     └─ recalcDeps → RefList:_grist_Tables_column
│
├─ _grist_Pages (pagePos, indentation for hierarchy)
│  ├─ viewRef → _grist_Views
│  └─ shareRef → _grist_Shares
│  │
│  └─ _grist_Views (parentId from _grist_Pages)
│     ├─ name, layoutSpec
│     │
│     └─ _grist_Views_section (parentId → _grist_Views)
│        ├─ tableRef → _grist_Tables
│        ├─ parentKey: "list" | "detail" | "single" | "chart"
│        ├─ linkSrcSectionRef → _grist_Views_section (section linking)
│        ├─ rules → RefList:_grist_Tables_column
│        │
│        ├─ _grist_Views_section_field (parentId → _grist_Views_section)
│        │  ├─ colRef → _grist_Tables_column
│        │  ├─ displayCol, visibleCol → _grist_Tables_column
│        │  └─ rules → RefList:_grist_Tables_column
│        │
│        └─ _grist_Filters (viewSectionRef → _grist_Views_section)
│           ├─ colRef → _grist_Tables_column
│           └─ filter: JSON filter spec
│
├─ _grist_ACLResources (tableId, colIds)
│  │
│  └─ _grist_ACLRules (resource → _grist_ACLResources)
│     ├─ aclFormula, permissionsText
│     └─ userAttributes: JSON
│
├─ _grist_Triggers (tableRef → _grist_Tables)
│  ├─ eventTypes, actions
│  └─ watchedColRefList → RefList:_grist_Tables_column
│
├─ _grist_Shares (linkId)
│  └─ options, label, description
│
├─ _grist_Attachments (fileIdent → _gristsys_Files)
│  └─ fileName, fileType, fileSize, fileExt
│
└─ _grist_Cells (tableRef, colRef, rowId)
   ├─ type: 1 = Comments
   ├─ content: JSON metadata
   └─ parentId → _grist_Cells (hierarchical structure)
```

---

## Metadata Tables (Alphabetical)

### `_grist_ACLResources`

**Purpose:** Define resources (tables/columns) that ACL rules apply to.

| Column | Type | Description |
|--------|------|-------------|
| `tableId` | Text | Table name this rule applies to, or `'*'` for all tables |
| `colIds` | Text | Comma-separated list of column IDs, or `'*'` for all columns |

**Notes:**
- The special resource with `tableId=''` and `colIds=''` should be ignored (exists for backwards compatibility)
- Resources are referenced by `_grist_ACLRules.resource`

**Example:**
```
tableId='MyTable', colIds='*'           → All columns in MyTable
tableId='*', colIds='*'                 → All tables and columns (default resource)
tableId='Users', colIds='Email,Phone'   → Specific columns in Users table
```

---

### `_grist_ACLRules`

**Purpose:** Access control rules defining permissions for document resources.

| Column | Type | Description |
|--------|------|-------------|
| `resource` | Ref:_grist_ACLResources | The resource this rule applies to |
| `permissions` | Int | **DEPRECATED:** Use `permissionsText` instead |
| `principals` | Text | **DEPRECATED** |
| `aclFormula` | Text | Match formula in restricted Python syntax; empty string for default rule |
| `aclColumn` | Ref:_grist_Tables_column | **DEPRECATED** |
| `aclFormulaParsed` | Text | JSON representation of the parse tree of `aclFormula`; empty for default |
| `permissionsText` | Text | Permissions string in format `[+bits][-bits]` (see below) |
| `rulePos` | PositionNumber | Rule order (rules processed in increasing order) |
| `userAttributes` | Text | JSON defining user attribute lookups (see below) |
| `memo` | Text | Comments/notes about this rule (added in schema v35) |

**Permission Characters:**
- `C` = Create
- `R` = Read
- `U` = Update
- `D` = Delete
- `S` = Schema edit

**Permission Format Examples:**
```
'+R'              → Grant read-only access
'+CRUD'           → Grant create, read, update, delete
'-D'              → Deny delete
'+CRUD-D'         → Grant CRU, deny D
'all'             → Grant all permissions
'none'            → Deny all permissions
```

**User Attributes Format:**
When non-empty, `userAttributes` contains JSON like:
```json
{
  "name": "Students",
  "tableId": "StudentRoster",
  "lookupColId": "Email",
  "charId": "Email"
}
```
This looks up `user.Email` in `StudentRoster.Email` and makes the full record available as `user.Students` in ACL formulas.

**Rule Ordering:**
- Rules for a resource are ordered by increasing `rulePos`
- User attribute rules (tied to resource `*:*`) should be listed first
- Default rule should be at the end

**Related:** See `_grist_ACLResources`, source at `sandbox/grist/schema.py:271`

---

### `_grist_Attachments`

**Purpose:** Metadata for file attachments in the document.

| Column | Type | Description |
|--------|------|-------------|
| `fileIdent` | Text | Checksum of file contents; identifies file data in `_gristsys_Files` |
| `fileName` | Text | User-defined filename |
| `fileType` | Text | MIME type (e.g., `image/png`, `application/pdf`) |
| `fileSize` | Int | Size in bytes |
| `fileExt` | Text | File extension including "." prefix (e.g., `.pdf`, `.png`) (added v37) |
| `imageHeight` | Int | Height in pixels (for images only) |
| `imageWidth` | Int | Width in pixels (for images only) |
| `timeDeleted` | DateTime | Timestamp when attachment was deleted (null if active) |
| `timeUploaded` | DateTime | Timestamp when attachment was uploaded |

**Notes:**
- `fileIdent` is a checksum, allowing deduplication of identical files
- Actual file data is stored in `_gristsys_Files` (managed by Node.js)
- `fileExt` was added in April 2023 (schema v37); older attachments may have blank `fileExt` but extension may still be in `fileName`
- For images, `imageHeight` and `imageWidth` are populated; null for non-images

**Related:** See `_gristsys_Files` for actual file storage, source at `sandbox/grist/schema.py:240`

---

### `_grist_Cells`

**Purpose:** Additional metadata for individual cells (currently used for comments).

| Column | Type | Description |
|--------|------|-------------|
| `tableRef` | Ref:_grist_Tables | The table containing this cell |
| `colRef` | Ref:_grist_Tables_column | The column containing this cell |
| `rowId` | Int | The row ID of this cell |
| `root` | Bool | True if this is the root of a metadata tree |
| `parentId` | Ref:_grist_Cells | Parent cell in hierarchical metadata structure |
| `type` | Int | Type of metadata: `1` = Comments |
| `content` | Text | JSON representation of the metadata |
| `userRef` | Text | User reference |

**Notes:**
- Cell metadata is stored hierarchically
- `root` marks the root of the tree (needed for autoremove detection)
- Currently only type `1` (Comments) is implemented
- The `content` field contains JSON-encoded metadata specific to the type

**Related:** Source at `sandbox/grist/schema.py:347`

---

### `_grist_DocInfo`

**Purpose:** Document-wide settings and metadata (single record).

| Column | Type | Description |
|--------|------|-------------|
| `docId` | Text | **DEPRECATED:** Now stored in `_gristsys_FileInfo` |
| `peers` | Text | **DEPRECATED:** Now use `_grist_ACLPrincipals` |
| `basketId` | Text | Basket ID for online storage (if created) |
| `schemaVersion` | Int | Document schema version (currently 44) |
| `timezone` | Text | Document timezone (e.g., `America/New_York`, `UTC`) |
| `documentSettings` | Text | JSON string with document settings (excluding timezone) |

**Notes:**
- This table always contains exactly **one record** with `id=1`
- `schemaVersion` indicates which schema migrations have been applied
- Migrations bring older documents up to `SCHEMA_VERSION` (defined in `schema.py`)
- `documentSettings` may include locale, currency format, etc.

**Related:** Source at `sandbox/grist/schema.py:29`

---

### `_grist_Filters`

**Purpose:** Column filters for view sections.

| Column | Type | Description |
|--------|------|-------------|
| `viewSectionRef` | Ref:_grist_Views_section | The view section this filter applies to |
| `colRef` | Ref:_grist_Tables_column | The column being filtered |
| `filter` | Text | JSON filter specification (see below) |
| `pinned` | Bool | If true, show in filter bar (added v34) |

**Filter JSON Format:**
The `filter` field contains JSON with either `included` or `excluded` arrays:

```json
{"included": ["foo", "bar"]}
```
or
```json
{"excluded": ["apple", "orange"]}
```

**Notes:**
- Added in schema v25 (replaced deprecated `_grist_Views_section_field.filter`)
- `pinned` filters display a button in the filter bar
- Multiple filters can be applied to the same section

**Related:** See `_grist_Views_section`, source at `sandbox/grist/schema.py:333`

---

### `_grist_Pages`

**Purpose:** Page tree hierarchy and navigation structure.

| Column | Type | Description |
|--------|------|-------------|
| `viewRef` | Ref:_grist_Views | The view associated with this page |
| `indentation` | Int | Nesting level (depth in page tree) |
| `pagePos` | PositionNumber | Overall position when all pages are visible (uncollapsed) |
| `shareRef` | Ref:_grist_Shares | Associated share (added v41) |
| `options` | Text | JSON options (added v44) |

**Understanding Page Hierarchy:**

Pages form a tree structure represented by `pagePos` (position) and `indentation` (depth). Parent-child relationships are inferred from consecutive `indentation` values:

- **+1 indentation**: Child of previous page
- **0 indentation**: Sibling of previous page
- **-1 indentation**: Sibling of previous page's parent

**Example:**

| pagePos | indentation | viewRef | Relationship |
|---------|-------------|---------|--------------|
| 1.0 | 0 | Dashboard | Root page |
| 2.0 | 1 | Sales | Child of Dashboard |
| 3.0 | 1 | Marketing | Child of Dashboard (sibling of Sales) |
| 4.0 | 2 | Campaigns | Child of Marketing |
| 5.0 | 0 | Reports | Root page (sibling of Dashboard) |

```
Dashboard (0)
├─ Sales (1)
└─ Marketing (1)
   └─ Campaigns (2)
Reports (0)
```

**Related:** See `_grist_Views`, `_grist_Shares`, source at `sandbox/grist/schema.py:164`

---

### `_grist_Shares`

**Purpose:** Document share links with access options.

| Column | Type | Description |
|--------|------|-------------|
| `linkId` | Text | Share identifier (common to home DB and document, not secret) |
| `options` | Text | JSON share options |
| `label` | Text | User-friendly label for this share |
| `description` | Text | Description of this share |

**Notes:**
- Added in schema v41
- `linkId` is used to match records between home database and document
- The actual secret share URL key is stored in the home database (`shares` table)
- Share options may include form settings, access restrictions, etc.

**Related:** See `_grist_Pages.shareRef`, home DB schema in `documentation/database.md`

---

### `_grist_Tables`

**Purpose:** Registry of all user tables (not including built-in metadata tables).

| Column | Type | Description |
|--------|------|-------------|
| `tableId` | Text | Unique table identifier (used in formulas and API) |
| `primaryViewId` | Ref:_grist_Views | Default view for this table |
| `summarySourceTable` | Ref:_grist_Tables | For summary tables, points to source table |
| `onDemand` | Bool | Keep data out of data engine (load only when requested) |
| `rawViewSectionRef` | Ref:_grist_Views_section | Raw data view section |
| `recordCardViewSectionRef` | Ref:_grist_Views_section | Record card view section (added v40) |

**Key Concepts:**

**Summary Tables:**
- Created via "Add to Page" → "Summary Table"
- `summarySourceTable` points to the source table
- Summary tables aggregate data by group-by columns
- Group-by columns have `summarySourceCol` set in `_grist_Tables_column`

**OnDemand Tables:**
- When `onDemand=true`, table data is not loaded into data engine by default
- Data is fetched from database only when needed by frontend
- Useful for large tables that are infrequently accessed

**Related:** See `_grist_Tables_column`, `_grist_Views`, source at `sandbox/grist/schema.py:47`

---

### `_grist_Tables_column`

**Purpose:** Complete column definitions including type, formulas, and relationships.

| Column | Type | Description |
|--------|------|-------------|
| `parentId` | Ref:_grist_Tables | Parent table |
| `parentPos` | PositionNumber | Column order/position |
| `colId` | Text | Column identifier (used in formulas) |
| `type` | Text | Column type (see Column Types section) |
| `widgetOptions` | Text | JSON widget options (formatting, etc.) |
| `isFormula` | Bool | True if this is a formula column |
| `formula` | Text | Formula code (Python syntax) |
| `label` | Text | Display label (shown in UI) |
| `description` | Text | Column description (added v36) |
| `untieColIdFromLabel` | Bool | If true, prevent auto-updating `colId` when `label` changes |
| `summarySourceCol` | Ref:_grist_Tables_column | For summary table group-by columns, points to source column |
| `displayCol` | Ref:_grist_Tables_column | Helper column for displaying reference values |
| `visibleCol` | Ref:_grist_Tables_column | For Ref columns, column in target table to display |
| `rules` | RefList:_grist_Tables_column | Conditional formatting rule columns |
| `reverseCol` | Ref:_grist_Tables_column | For two-way references (added v43) |
| `recalcWhen` | Int | When to recalculate (see RecalcWhen below) |
| `recalcDeps` | RefList:_grist_Tables_column | Trigger fields for recalculation |

**RecalcWhen Values:**

Determines when a formula in a data column (`isFormula=false`) is recalculated:

| Value | Constant | Behavior |
|-------|----------|----------|
| 0 | `DEFAULT` | Calculate on new records or when any field in `recalcDeps` changes |
| 1 | `NEVER` | Don't calculate automatically (manual trigger only) |
| 2 | `MANUAL_UPDATES` | Calculate on new records and manual updates to any data field |

**Reference Column Relationships:**

When you create a Reference column pointing to table `People`:

1. **visibleCol**: Points to `People.Name` (the column to display in the target table)
2. **displayCol**: Points to helper column `_gristHelper_Display` in the current table
3. The helper column has formula `$person.Name` to fetch the display value

**Two-Way References (v43+):**

If column `A.person` references `People` table, you can set `A.person.reverseCol` to point to `People.orders`. Then `People.orders` automatically contains all `A` records where `person` points to that `People` record.

**Conditional Formatting Rules:**

The `rules` field contains a RefList pointing to hidden formula columns that return styling information based on cell values.

**Related:** Source at `sandbox/grist/schema.py:63`

---

### `_grist_Triggers`

**Purpose:** Webhook triggers that fire on table changes.

| Column | Type | Description |
|--------|------|-------------|
| `tableRef` | Ref:_grist_Tables | Table being monitored |
| `eventTypes` | ChoiceList | Event types to monitor (e.g., `add`, `update`) |
| `isReadyColRef` | Ref:_grist_Tables_column | Optional ready-flag column |
| `actions` | Text | JSON array of action definitions |
| `label` | Text | User-friendly label (added v39) |
| `memo` | Text | Description/notes (added v39) |
| `enabled` | Bool | Enable/disable this trigger (added v39) |
| `watchedColRefList` | RefList:_grist_Tables_column | Specific columns to monitor (added v42) |
| `options` | Text | JSON options (added v42) |

**Event Types:**
- `add`: Trigger when records are added
- `update`: Trigger when records are updated

**Ready Column:**
- If `isReadyColRef` is set, trigger only fires when that column's value is truthy
- Useful for "approval" workflows

**Actions Format:**
The `actions` field contains JSON defining webhook URLs and payloads:
```json
[
  {
    "type": "webhook",
    "url": "https://example.com/webhook",
    "body": "..."
  }
]
```

**Watched Columns (v42+):**
- If `watchedColRefList` is set, trigger only fires when those specific columns change
- Empty list means watch all columns

**Related:** See `_grist_Tables`, source at `sandbox/grist/schema.py:259`

---

### `_grist_Views`

**Purpose:** View definitions (pages can contain one or more sections).

| Column | Type | Description |
|--------|------|-------------|
| `name` | Text | View name (displayed in UI) |
| `type` | Text | View type (may be deprecated/unused) |
| `layoutSpec` | Text | JSON describing view layout |

**Layout Specification:**

The `layoutSpec` is a JSON structure defining how sections are arranged:

```json
{
  "type": "vertical",
  "children": [
    {"type": "section", "id": 1},
    {"type": "section", "id": 2}
  ]
}
```

Layout types include:
- `vertical`: Stack sections vertically
- `horizontal`: Arrange sections side-by-side
- `section`: Leaf node referencing a view section

**Related:** See `_grist_Views_section`, `_grist_Pages`, source at `sandbox/grist/schema.py:173`

---

### `_grist_Views_section`

**Purpose:** Sections within views (e.g., list view, detail view, chart).

| Column | Type | Description |
|--------|------|-------------|
| `tableRef` | Ref:_grist_Tables | Table displayed in this section |
| `parentId` | Ref:_grist_Views | Parent view |
| `parentKey` | Text | Section type: `list`, `detail`, `single`, `chart`, `form` |
| `title` | Text | Section title |
| `description` | Text | Section description (added v39) |
| `defaultWidth` | Int | Default width (formula: `100`) |
| `borderWidth` | Int | Border width (formula: `1`) |
| `theme` | Text | Theme identifier |
| `options` | Text | JSON options (widget-specific settings) |
| `chartType` | Text | Chart type if `parentKey='chart'` (e.g., `bar`, `line`) |
| `layoutSpec` | Text | JSON record layout (for detail/card views) |
| `filterSpec` | Text | **DEPRECATED** (v15) - Do not reuse |
| `sortColRefs` | Text | Sorting specification |
| `linkSrcSectionRef` | Ref:_grist_Views_section | Source section for section linking |
| `linkSrcColRef` | Ref:_grist_Tables_column | Source column for linking |
| `linkTargetColRef` | Ref:_grist_Tables_column | Target column for linking |
| `embedId` | Text | **DEPRECATED** (v12) - Do not reuse |
| `rules` | RefList:_grist_Tables_column | Conditional formatting rules |
| `shareOptions` | Text | Share-specific options (added v41) |

**Section Types (parentKey):**
- `list`: Table/card list view
- `detail`: Single record detail view
- `single`: Single record (no scrolling)
- `chart`: Chart visualization
- `form`: Form view

**Section Linking:**

Sections can be linked so selecting a record in one section filters another:
- `linkSrcSectionRef`: Points to the source section
- `linkSrcColRef`: Column in source section
- `linkTargetColRef`: Column in this section's table to match against

**Example:** A `People` list section linked to an `Orders` detail section via `Orders.person` reference column.

**Sort Specification:**

`sortColRefs` is a JSON array of column references with optional `-` prefix for descending:
```json
[1, -3, 5]  // Sort by col 1 (asc), then col 3 (desc), then col 5 (asc)
```

**Related:** See `_grist_Views_section_field`, `_grist_Filters`, source at `sandbox/grist/schema.py:182`

---

### `_grist_Views_section_field`

**Purpose:** Field display settings within view sections (column visibility, width, widget options).

| Column | Type | Description |
|--------|------|-------------|
| `parentId` | Ref:_grist_Views_section | Parent section |
| `parentPos` | PositionNumber | Field order/position in section |
| `colRef` | Ref:_grist_Tables_column | Column being displayed |
| `width` | Int | Field width in pixels |
| `widgetOptions` | Text | JSON widget options (overrides column options) |
| `displayCol` | Ref:_grist_Tables_column | Display column override |
| `visibleCol` | Ref:_grist_Tables_column | Visible column override (for Ref columns) |
| `filter` | Text | **DEPRECATED** (v25) - Use `_grist_Filters` |
| `rules` | RefList:_grist_Tables_column | Conditional formatting rules |

**Widget Options:**

The `widgetOptions` field contains JSON specific to the widget type:

```json
{
  "alignment": "right",
  "numMode": "currency",
  "decimals": 2
}
```

**Display Overrides:**

`displayCol` and `visibleCol` allow per-field customization of reference display (overriding column-level settings).

**Related:** See `_grist_Views_section`, `_grist_Tables_column`, source at `sandbox/grist/schema.py:209`

---

## Deprecated Metadata Tables

The following tables exist in the schema for backwards compatibility but are no longer actively used:

### `_grist_Imports`
**Status:** Deprecated
**Previous Purpose:** Import options for CSV/Excel imports
**Source:** `sandbox/grist/schema.py:103`

### `_grist_External_database`
**Status:** Deprecated
**Previous Purpose:** External database credentials
**Source:** `sandbox/grist/schema.py:123`

### `_grist_External_table`
**Status:** Deprecated
**Previous Purpose:** External table references
**Source:** `sandbox/grist/schema.py:133`

### `_grist_TableViews`
**Status:** Deprecated
**Previous Purpose:** Table-View cross-reference
**Source:** `sandbox/grist/schema.py:140`

### `_grist_TabItems`
**Status:** Deprecated
**Previous Purpose:** Tab items
**Source:** `sandbox/grist/schema.py:146`

### `_grist_TabBar`
**Status:** Partially deprecated
**Previous Purpose:** Tab bar items
**Source:** `sandbox/grist/schema.py:151`
**Note:** Largely replaced by `_grist_Pages`

### `_grist_ACLPrincipals`
**Status:** Deprecated
**Previous Purpose:** ACL principals (users, groups, instances)
**Source:** `sandbox/grist/schema.py:315`

### `_grist_ACLMemberships`
**Status:** Deprecated
**Previous Purpose:** ACL membership relationships
**Source:** `sandbox/grist/schema.py:328`

### `_grist_Validations`
**Status:** Deprecated
**Previous Purpose:** Validation rules
**Source:** `sandbox/grist/schema.py:226`

### `_grist_REPL_Hist`
**Status:** Deprecated
**Previous Purpose:** REPL history
**Source:** `sandbox/grist/schema.py:233`

---

## Column Type Details

Grist supports the following column types (defined in `app/plugin/GristData.ts:67`):

### Basic Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `Text` | Text string | `"hello"`, `""` |
| `Int` | Integer number | `42`, `-17`, `0` |
| `Numeric` | Decimal number | `3.14`, `-0.5`, `1e6` |
| `Bool` | Boolean | `true`, `false` |
| `Date` | Date (no time) | Stored as days since epoch |
| `DateTime` | Date and time | Stored as seconds since epoch + timezone |

### Specialized Types

| Type | Description | Example Values |
|------|-------------|----------------|
| `Choice` | Single choice from list | `"Option1"` |
| `ChoiceList` | Multiple choices | Encoded as `['L', 'Option1', 'Option2']` |
| `Ref:TableId` | Reference to another table | Row ID as integer |
| `RefList:TableId` | List of references | Encoded as `['L', rowId1, rowId2]` |
| `Attachments` | File attachments | Encoded as `['L', attachId1, attachId2]` |

### Special Types

| Type | Description | Usage |
|------|-------------|-------|
| `Id` | Row identifier | Auto-generated, unique per table |
| `ManualSortPos` | Manual sort position | Used for drag-drop reordering |
| `PositionNumber` | Fractional position | Used in metadata tables for ordering |
| `Any` | Any type | Dynamic typing |
| `Blob` | Binary data | Raw bytes |

### Type Encoding Examples

Grist uses special encoding for complex values (via `GristObjCode`):

```javascript
// ChoiceList
['L', 'Red', 'Blue', 'Green']

// RefList
['L', 15, 23, 42]  // References to rows 15, 23, 42

// DateTime (with timezone)
['D', 1609459200, 'America/New_York']  // [timestamp, timezone]

// Date
['d', 18628]  // Days since epoch

// Reference (alternate encoding)
['R', 'TableId', 42]  // [tableId, rowId]
```

**GristObjCode Reference:**

| Code | Name | Meaning |
|------|------|---------|
| `L` | List | Array/list of values |
| `l` | LookUp | Lookup result |
| `O` | Dict | Dictionary/object |
| `D` | DateTime | DateTime with timezone `[timestamp, tz]` |
| `d` | Date | Date as `[days_since_epoch]` |
| `S` | Skip | Skipped value |
| `C` | Censored | Censored (hidden) value |
| `R` | Reference | Reference as `[tableId, rowId]` |
| `r` | ReferenceList | List of references |
| `E` | Exception | Error/exception value |
| `P` | Pending | Value not yet loaded |
| `U` | Unmarshallable | Cannot be unmarshalled |
| `V` | Versions | Version information |

---

## Schema Evolution

Grist documents track their schema version in `_grist_DocInfo.schemaVersion`. When a document is opened, migrations are automatically applied to bring it up to the current `SCHEMA_VERSION` (44).

**Migration Philosophy:**
- Never remove columns (may break existing formulas/code)
- Mark deprecated columns in comments
- Add new columns with appropriate defaults
- Migrations defined in `sandbox/grist/migrations.py`

### Recent Schema Versions

| Version | Changes | Date |
|---------|---------|------|
| **44** | Added `options` to `_grist_Pages` | 2024 |
| **43** | Added `reverseCol` to `_grist_Tables_column` (two-way references) | 2024 |
| **42** | Added `watchedColRefList` and `options` to `_grist_Triggers` | 2023 |
| **41** | Added `_grist_Shares` table; `shareRef` to `_grist_Pages`; `shareOptions` to sections | 2023 |
| **40** | Added `recordCardViewSectionRef` to `_grist_Tables` | 2023 |
| **39** | Added `label`, `memo`, `enabled` to triggers; `description` to sections | 2022 |
| **37** | Added `fileExt` to `_grist_Attachments` | 2023 |
| **36** | Added `description` to `_grist_Tables_column` | 2022 |
| **35** | Added `memo` to `_grist_ACLRules` | 2022 |
| **34** | Added `pinned` to `_grist_Filters` | 2021 |
| **25** | Added `_grist_Filters` table (replaced section field filters) | 2020 |

For complete migration history, see `sandbox/grist/migrations.py` or `documentation/migrations.md`.

---

## System Tables (_gristsys_*)

System tables are managed by the Node.js process (not the Python data engine). These tables handle low-level document storage and action history.

**Defined in:** `app/server/lib/DocStorage.ts`

| Table | Purpose |
|-------|---------|
| `_gristsys_Files` | Binary file storage (for attachments) |
| `_gristsys_FileInfo` | Document metadata (single row with docId, etc.) |
| `_gristsys_ActionHistory` | User action history |
| `_gristsys_ActionHistoryBranch` | Action history branches (for undo/redo) |
| `_gristsys_PluginData` | Plugin data storage |
| `_gristsys_Action` | **DEPRECATED:** Legacy action storage |
| `_gristsys_Action_step` | **DEPRECATED:** Legacy action steps |

---

## Common Query Examples

### Find all columns in a table

```sql
SELECT colId, type, isFormula, label
FROM _grist_Tables_column
WHERE parentId = (SELECT id FROM _grist_Tables WHERE tableId = 'MyTable')
ORDER BY parentPos;
```

### List all pages and their views

```sql
SELECT
  p.id,
  p.pagePos,
  p.indentation,
  v.name AS viewName
FROM _grist_Pages p
JOIN _grist_Views v ON p.viewRef = v.id
ORDER BY p.pagePos;
```

### Find all Reference columns and their targets

```sql
SELECT
  t.tableId AS sourceTable,
  c.colId AS sourceColumn,
  c.type AS refType
FROM _grist_Tables_column c
JOIN _grist_Tables t ON c.parentId = t.id
WHERE c.type LIKE 'Ref:%' OR c.type LIKE 'RefList:%'
ORDER BY t.tableId, c.parentPos;
```

### Get ACL rules for a specific table

```sql
SELECT
  r.rulePos,
  r.aclFormula,
  r.permissionsText,
  r.memo,
  res.tableId,
  res.colIds
FROM _grist_ACLRules r
JOIN _grist_ACLResources res ON r.resource = res.id
WHERE res.tableId = 'MyTable' OR res.tableId = '*'
ORDER BY r.rulePos;
```

### Find all summary tables and their source tables

```sql
SELECT
  summary.tableId AS summaryTable,
  source.tableId AS sourceTable
FROM _grist_Tables summary
JOIN _grist_Tables source ON summary.summarySourceTable = source.id
WHERE summary.summarySourceTable != 0;
```

### List all triggers and their watched tables

```sql
SELECT
  t.label,
  t.enabled,
  t.eventTypes,
  tbl.tableId AS watchedTable
FROM _grist_Triggers t
JOIN _grist_Tables tbl ON t.tableRef = tbl.id
ORDER BY tbl.tableId;
```

### Find columns with conditional formatting rules

```sql
SELECT
  t.tableId,
  c.colId,
  c.rules
FROM _grist_Tables_column c
JOIN _grist_Tables t ON c.parentId = t.id
WHERE c.rules IS NOT NULL AND c.rules != ''
ORDER BY t.tableId, c.parentPos;
```

### Get all attachments with their details

```sql
SELECT
  fileName,
  fileExt,
  fileType,
  fileSize,
  datetime(timeUploaded, 'unixepoch') AS uploaded,
  CASE WHEN timeDeleted IS NULL THEN 'Active' ELSE 'Deleted' END AS status
FROM _grist_Attachments
ORDER BY timeUploaded DESC;
```

---

## Additional Resources

- **Schema Definition:** `sandbox/grist/schema.py` (authoritative source)
- **TypeScript Schema:** `app/common/schema.ts` (auto-generated)
- **Migration Guide:** `documentation/migrations.md`
- **Database Overview:** `documentation/database.md`
- **Data Format Spec:** `documentation/grist-data-format.md`
- **GristData Types:** `app/plugin/GristData.ts`

---

## Notes for Advanced Users

### Querying Metadata

You can query metadata tables directly using:
1. **Raw Data Views:** In the UI, use "Raw Data" page to browse metadata tables
2. **SQLite CLI:** Download `.grist` file and use `sqlite3` command
3. **API:** Use the Grist API to fetch metadata table records
4. **Python Sandbox:** Access via `table._engine.docmodel`

### Modifying Metadata

**⚠️ Warning:** Direct modification of metadata tables can corrupt your document. Always:
- Make backups before manual metadata changes
- Use the Grist UI or API when possible
- Test changes on a copy of your document
- Understand the implications of foreign key relationships

### Schema Inspection

To inspect the full schema of a `.grist` file:

```bash
sqlite3 mydoc.grist ".schema _grist_Tables"
```

To see all metadata tables:

```bash
sqlite3 mydoc.grist ".tables" | grep "^_grist"
```

---

**Document Version:** Schema v44
**Generated:** 2025-11
**Maintainer:** Grist Labs (https://github.com/gristlabs/grist-core)
