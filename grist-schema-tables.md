# Grist Schema Tables Documentation

This document provides comprehensive documentation for all Grist metadata tables (schema version 44). These tables store the structure and configuration of Grist documents.

> **Note:** Before modifying the schema, review `/documentation/migrations.md`

## Table of Contents

- [Core Document Tables](#core-document-tables)
  - [_grist_DocInfo](#_grist_docinfo)
  - [_grist_Tables](#_grist_tables)
  - [_grist_Tables_column](#_grist_tables_column)
- [View & Display Tables](#view--display-tables)
  - [_grist_Pages](#_grist_pages)
  - [_grist_Views](#_grist_views)
  - [_grist_Views_section](#_grist_views_section)
  - [_grist_Views_section_field](#_grist_views_section_field)
  - [_grist_Filters](#_grist_filters)
  - [_grist_TabBar](#_grist_tabbar)
- [Access Control Tables](#access-control-tables)
  - [_grist_ACLResources](#_grist_aclresources)
  - [_grist_ACLRules](#_grist_aclrules)
- [Feature Tables](#feature-tables)
  - [_grist_Attachments](#_grist_attachments)
  - [_grist_Triggers](#_grist_triggers)
  - [_grist_Cells](#_grist_cells)
  - [_grist_Shares](#_grist_shares)
- [Deprecated Tables](#deprecated-tables)
- [Data Types Reference](#data-types-reference)
- [Storage vs Wire Format](#storage-vs-wire-format)
- [Table Relationships](#table-relationships)

---

## Core Document Tables

### _grist_DocInfo

Document-wide metadata. Contains a single record with id=1.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| docId | Text | **DEPRECATED** (as of v44) - docId is now stored in _gristsys_FileInfo | `""` | | Do not use |
| peers | Text | **DEPRECATED** - now _grist_ACLPrincipals is used for this | `""` | | Do not use |
| basketId | Text | Basket id of the document for online storage, if a Basket has been created for it | `""` | | |
| schemaVersion | Int | Version number of the document. Tells how to migrate to reach SCHEMA_VERSION | `0` | ✓ | Current version: 44 |
| timezone | Text | Document timezone | `""` | | Used for DateTime columns |
| documentSettings | Text | Document settings (excluding timezone) | `""` | | JSON string |

**Example:**
```json
{
  "id": 1,
  "schemaVersion": 44,
  "timezone": "America/New_York",
  "documentSettings": "{\"locale\":\"en-US\"}"
}
```

---

### _grist_Tables

Names and configuration of user tables. Does NOT include built-in metadata tables.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| tableId | Text | Unique identifier for the table | `""` | ✓ | Snake_case by convention |
| primaryViewId | Ref:_grist_Views | Primary view for this table | `0` | | Auto-created on table creation |
| summarySourceTable | Ref:_grist_Tables | For summary tables, points to the source table | `0` | | Non-zero only for summary tables |
| onDemand | Bool | If true, keeps data out of data engine and loads only when requested by frontend | `False` | | For large tables |
| rawViewSectionRef | Ref:_grist_Views_section | Reference to raw data view section | `0` | | |
| recordCardViewSectionRef | Ref:_grist_Views_section | Reference to record card view section | `0` | | |

**Example:**
```json
{
  "id": 1,
  "tableId": "People",
  "primaryViewId": 1,
  "summarySourceTable": 0,
  "onDemand": false
}
```

---

### _grist_Tables_column

All columns in all user tables.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| parentId | Ref:_grist_Tables | Table this column belongs to | `0` | ✓ | References _grist_Tables |
| parentPos | PositionNumber | Position of column in table | `inf` | ✓ | Determines display order |
| colId | Text | Column identifier | `""` | ✓ | Must be valid Python identifier |
| type | Text | Column type (e.g., "Text", "Int", "Ref:TableName") | `""` | ✓ | See Data Types Reference |
| widgetOptions | Text | JSON extending column's widgetOptions | `""` | | Widget-specific configuration |
| isFormula | Bool | True if this is a formula column | `False` | ✓ | Formula columns auto-calculate |
| formula | Text | Python formula code | `""` | | Required if isFormula=True |
| label | Text | Display label for the column | `""` | | Defaults to colId if empty |
| description | Text | Column description/documentation | `""` | | Shown in column info |
| untieColIdFromLabel | Bool | If true, changing label won't change colId | `False` | | Default: colId follows label |
| summarySourceCol | Ref:_grist_Tables_column | For summary table columns, points to source column | `0` | | Group-by columns only |
| displayCol | Ref:_grist_Tables_column | Points to display column if it exists | `0` | | Auto-created for Ref columns |
| visibleCol | Ref:_grist_Tables_column | For Ref columns, column in target table to display | `0` | | E.g., Person.Name |
| rules | RefList:_grist_Tables_column | Formula columns holding conditional formatting rules | `None` | | List of column refs |
| reverseCol | Ref:_grist_Tables_column | For Ref/RefList columns, the reverse reference column | `0` | | Two-way references |
| recalcWhen | Int | When to recalculate formula on data columns | `0` | | See RecalcWhen constants |
| recalcDeps | RefList:_grist_Tables_column | Fields that trigger recalculation | `None` | | Only when recalcWhen=DEFAULT |

**RecalcWhen Constants:**
- `0` (DEFAULT): Calculate on new records or when recalcDeps changes
- `1` (NEVER): Don't calculate automatically (manual trigger only)
- `2` (MANUAL_UPDATES): Calculate on new records and manual updates

**Example:**
```json
{
  "id": 5,
  "parentId": 1,
  "parentPos": 2.5,
  "colId": "Full_Name",
  "type": "Text",
  "isFormula": true,
  "formula": "$First_Name + ' ' + $Last_Name",
  "label": "Full Name"
}
```

---

## View & Display Tables

### _grist_Pages

Tree structure of pages in the document. Parent-child relationships are inferred from indentation differences.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| viewRef | Ref:_grist_Views | View displayed on this page | `0` | ✓ | |
| indentation | Int | Nesting level (depth) | `0` | ✓ | 0 = root level |
| pagePos | PositionNumber | Overall position when all pages visible | `inf` | ✓ | Determines order |
| shareRef | Ref:_grist_Shares | Share configuration for this page | `0` | | For public sharing |
| options | Text | Page-specific options | `""` | | JSON string |

**Page Hierarchy Rules:**
- Difference of +1 between consecutive pages: second page is child of first
- Difference of 0: pages are siblings
- Difference of -1: second page is sibling of first page's parent

**Example:**
```json
[
  {"id": 1, "viewRef": 1, "indentation": 0, "pagePos": 1.0},
  {"id": 2, "viewRef": 2, "indentation": 1, "pagePos": 2.0},
  {"id": 3, "viewRef": 3, "indentation": 1, "pagePos": 3.0},
  {"id": 4, "viewRef": 4, "indentation": 0, "pagePos": 4.0}
]
```
Creates: Page 1 → [Page 2, Page 3], Page 4

---

### _grist_Views

All user views (pages).

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| name | Text | Display name of the view | `""` | ✓ | User-visible |
| type | Text | View type | `""` | | TODO: Should this be removed? |
| layoutSpec | Text | JSON describing the view layout | `""` | | Contains section arrangement |

**Example layoutSpec:**
```json
{
  "id": 1,
  "name": "People",
  "layoutSpec": "{\"type\":\"horizontal\",\"children\":[{\"leaf\":1},{\"leaf\":2}]}"
}
```

---

### _grist_Views_section

Sections within views (e.g., list section + detail section). Different section types use different subsets of parameters.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| tableRef | Ref:_grist_Tables | Table displayed in this section | `0` | ✓ | |
| parentId | Ref:_grist_Views | View containing this section | `0` | ✓ | |
| parentKey | Text | Section type | `""` | ✓ | 'list', 'detail', 'single', 'chart', 'custom' |
| title | Text | Section title | `""` | | User-visible |
| description | Text | Section description | `""` | | |
| defaultWidth | Int | Default width for columns | `100` | | Pixels |
| borderWidth | Int | Border width | `1` | | Pixels |
| theme | Text | Color theme | `""` | | |
| options | Text | Section-specific options | `""` | | JSON string |
| chartType | Text | Chart type for chart sections | `""` | | 'bar', 'line', 'pie', etc. |
| layoutSpec | Text | JSON describing record layout | `""` | | For detail/card views |
| filterSpec | Text | **DEPRECATED** (as of v15) | `""` | | Do not remove or reuse |
| sortColRefs | Text | Sorted list of column refs for sorting | `""` | | JSON array as string |
| linkSrcSectionRef | Ref:_grist_Views_section | Source section for linking | `0` | | For linked sections |
| linkSrcColRef | Ref:_grist_Tables_column | Source column for linking | `0` | | Used with linkSrcSectionRef |
| linkTargetColRef | Ref:_grist_Tables_column | Target column for linking | `0` | | Matched against linkSrcColRef |
| embedId | Text | **DEPRECATED** (as of v12) | `""` | | Do not remove or reuse |
| rules | RefList:_grist_Tables_column | Conditional formatting rules for section | `None` | | Formula columns |
| shareOptions | Text | Sharing options | `""` | | JSON string |

**Example:**
```json
{
  "id": 1,
  "tableRef": 1,
  "parentId": 1,
  "parentKey": "list",
  "title": "People List",
  "sortColRefs": "[2, -5]"
}
```

---

### _grist_Views_section_field

Fields displayed in a view section (subset of table columns with display settings).

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| parentId | Ref:_grist_Views_section | Section containing this field | `0` | ✓ | |
| parentPos | PositionNumber | Position of field in section | `inf` | ✓ | Display order |
| colRef | Ref:_grist_Tables_column | Column being displayed | `0` | ✓ | |
| width | Int | Field width in pixels | `0` | | 0 = auto |
| widgetOptions | Text | JSON extending field's widgetOptions | `""` | | Overrides column settings |
| displayCol | Ref:_grist_Tables_column | Display column for this field | `0` | | For Ref fields |
| visibleCol | Ref:_grist_Tables_column | Override visible column for Ref fields | `0` | | Overrides column setting |
| filter | Text | **DEPRECATED** (replaced v25) | `""` | | Do not remove or reuse |
| rules | RefList:_grist_Tables_column | Conditional formatting rules for field | `None` | | Formula columns |

**Example:**
```json
{
  "id": 1,
  "parentId": 1,
  "parentPos": 1.5,
  "colRef": 3,
  "width": 150,
  "widgetOptions": "{\"alignment\":\"right\"}"
}
```

---

### _grist_Filters

Filter configurations for view sections.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| viewSectionRef | Ref:_grist_Views_section | Section this filter applies to | `0` | ✓ | |
| colRef | Ref:_grist_Tables_column | Column being filtered | `0` | ✓ | |
| filter | Text | Filter specification | `""` | | JSON: `{"included": [...]}` or `{"excluded": [...]}` |
| pinned | Bool | Show button in filter bar | `False` | | Makes filter easily accessible |

**Filter Format Examples:**
```json
{"included": ["foo", "bar"]}
{"excluded": ["apple", "orange"]}
```

---

### _grist_TabBar

**DEPRECATED** - Use _grist_Pages instead.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| viewRef | Ref:_grist_Views | View in tab bar | `0` | | |
| tabPos | PositionNumber | Position in tab bar | `inf` | | |

---

## Access Control Tables

### _grist_ACLResources

Defines resources (tables/columns) that ACL rules can apply to.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| tableId | Text | Table name or '*' for all tables | `""` | ✓ | '*' = all tables |
| colIds | Text | Comma-separated column IDs or '*' for all columns | `""` | ✓ | '*' = all columns |

**Special Resource:**
The resource with tableId='' and colIds='' should be ignored. It exists for older Grist versions (pre-Nov 2020).

**Examples:**
```json
{"id": 1, "tableId": "People", "colIds": "*"}           // All columns in People
{"id": 2, "tableId": "People", "colIds": "Email,Phone"} // Specific columns
{"id": 3, "tableId": "*", "colIds": "*"}                // All tables and columns
```

---

### _grist_ACLRules

Access control rules that determine permissions.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| resource | Ref:_grist_ACLResources | Resource this rule applies to | `0` | ✓ | |
| permissions | Int | **DEPRECATED** - use permissionsText | `0` | | Do not use |
| principals | Text | **DEPRECATED** | `""` | | Do not use |
| aclFormula | Text | Match formula in restricted Python | `""` | | Empty = default rule |
| aclColumn | Ref:_grist_Tables_column | **DEPRECATED** | `0` | | Do not use |
| aclFormulaParsed | Text | JSON parse tree of aclFormula | `""` | | Empty for default rule |
| permissionsText | Text | Permissions specification | `""` | ✓ | See format below |
| rulePos | PositionNumber | Rule ordering (increasing) | `inf` | ✓ | Default rule should be last |
| userAttributes | Text | Extra user attributes definition | `""` | | JSON, see format below |
| memo | Text | Rule description/comment | `""` | | Extracted from aclFormula in v35+ |

**permissionsText Format:**
- `[+<bits>][-<bits>]` where bits are C,R,U,D,S characters (each appears at most once)
- Special values: `'all'`, `'none'`
- Empty string: no permission change
- Examples: `"+CRUD"`, `"+R-U"`, `"all"`, `"none"`

**Permissions:**
- C = Create
- R = Read
- U = Update
- D = Delete
- S = Schema

**userAttributes Format:**
```json
{
  "name": "Owner",
  "tableId": "People",
  "lookupColId": "Email",
  "charId": "Email"
}
```
Looks up user[charId] in tableId on lookupColId, adds full record as user[name].

**Example:**
```json
{
  "id": 1,
  "resource": 1,
  "aclFormula": "user.Access == 'owners'",
  "permissionsText": "+CRUD",
  "rulePos": 1.0,
  "memo": "Owners have full access"
}
```

---

## Feature Tables

### _grist_Attachments

Attachments in the document.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| fileIdent | Text | Checksum of file contents | `""` | ✓ | Identifies file in _gristsys_Files |
| fileName | Text | User-defined file name | `""` | ✓ | Original upload name |
| fileType | Text | MIME type | `""` | | e.g., "image/png" |
| fileSize | Int | Size in bytes | `0` | ✓ | |
| fileExt | Text | File extension including "." | `""` | | Added April 2023 |
| imageHeight | Int | Height in pixels (images only) | `0` | | 0 for non-images |
| imageWidth | Int | Width in pixels (images only) | `0` | | 0 for non-images |
| timeDeleted | DateTime | When deleted (soft delete) | `None` | | None = not deleted |
| timeUploaded | DateTime | When uploaded | `None` | | |

**Notes:**
- fileExt column added April 2023; older attachments have blank fileExt
- Extension may still be in fileName for older records

**Example:**
```json
{
  "id": 1,
  "fileIdent": "abc123def456",
  "fileName": "photo.jpg",
  "fileType": "image/jpeg",
  "fileSize": 153600,
  "fileExt": ".jpg",
  "imageHeight": 1200,
  "imageWidth": 1600,
  "timeUploaded": 1704945919
}
```

---

### _grist_Triggers

Triggers that subscribe to table changes.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| tableRef | Ref:_grist_Tables | Table to watch | `0` | ✓ | |
| eventTypes | ChoiceList | Events to trigger on | `None` | ✓ | e.g., ['add', 'update'] |
| isReadyColRef | Ref:_grist_Tables_column | Column indicating row is ready | `0` | | Must be True to trigger |
| actions | Text | JSON array of actions to perform | `""` | ✓ | Webhook URLs, etc. |
| label | Text | User-friendly label | `""` | | |
| memo | Text | Description/notes | `""` | | |
| enabled | Bool | Whether trigger is active | `False` | ✓ | |
| watchedColRefList | RefList:_grist_Tables_column | Specific columns to watch | `None` | | Empty = watch all |
| options | Text | Additional options | `""` | | JSON string |

**Event Types:**
- 'add': New records
- 'update': Record changes
- 'delete': Record deletions (not yet implemented)

**Example:**
```json
{
  "id": 1,
  "tableRef": 1,
  "eventTypes": ["L", "add", "update"],
  "actions": "[{\"type\":\"webhook\",\"url\":\"https://example.com/hook\"}]",
  "label": "Notify on changes",
  "enabled": true
}
```

---

### _grist_Cells

Additional metadata for individual cells (e.g., comments, discussions).

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| tableRef | Ref:_grist_Tables | Table containing the cell | `0` | ✓ | |
| colRef | Ref:_grist_Tables_column | Column containing the cell | `0` | ✓ | |
| rowId | Int | Row ID of the cell | `0` | ✓ | |
| root | Bool | Whether this is a root node | `False` | | For hierarchical metadata |
| parentId | Ref:_grist_Cells | Parent metadata node | `0` | | For threaded comments |
| type | Int | Metadata type | `0` | ✓ | 1 = Comments |
| content | Text | JSON representation of metadata | `""` | | Format depends on type |
| userRef | Text | User who created the metadata | `""` | | |

**Metadata Structure:**
- Hierarchical (tree structure)
- Root nodes marked with root=True
- Children reference parent via parentId
- Autoremove feature: when all children deleted, parent deleted

**Type Values:**
- 1: Comments

**Example:**
```json
{
  "id": 1,
  "tableRef": 1,
  "colRef": 3,
  "rowId": 5,
  "root": true,
  "type": 1,
  "content": "{\"text\":\"This needs review\",\"replies\":[]}",
  "userRef": "user@example.com"
}
```

---

### _grist_Shares

Public share configurations.

| Column Name | Type | Description | Default | Required | Notes |
|-------------|------|-------------|---------|----------|-------|
| linkId | Text | Share link identifier | `""` | ✓ | Used to match home DB records |
| options | Text | Share options | `""` | | JSON configuration |
| label | Text | Share label | `""` | | User-friendly name |
| description | Text | Share description | `""` | | |

**Example:**
```json
{
  "id": 1,
  "linkId": "abc123",
  "options": "{\"publish\":true}",
  "label": "Public Dashboard",
  "description": "Public view of sales data"
}
```

---

## Deprecated Tables

These tables are kept for compatibility but should not be used in new code.

### _grist_Imports
**DEPRECATED** - Previously kept import options. Do not use.

### _grist_External_database
**DEPRECATED** - Previously stored external database credentials. Do not use.

### _grist_External_table
**DEPRECATED** - Previously referenced external database tables. Do not use.

### _grist_TableViews
**DEPRECATED** - Previously cross-referenced Tables and Views. Do not use.

### _grist_TabItems
**DEPRECATED** - Previously cross-referenced Tables and Views. Do not use.

### _grist_Validations
**DEPRECATED** - Validation rules. Do not use.

### _grist_REPL_Hist
**DEPRECATED** - REPL history for usercode. Do not use.

### _grist_ACLPrincipals
**DEPRECATED** - Principals (users, groups, instances). Do not use.

### _grist_ACLMemberships
**DEPRECATED** - Principal containment relationships. Do not use.

---

## Data Types Reference

### Simple Types

| Type | Storage Type | Default | Description |
|------|--------------|---------|-------------|
| Text | string | `""` | String data |
| Int | integer | `0` | Integer (-2^53 to 2^53) |
| Numeric | float | `0.0` | Floating point number |
| Bool | boolean | `False` | Boolean (true/false) |
| Date | float | `None` | Date (timestamp, no timezone) |
| DateTime | float | `None` | Date and time (timestamp) |
| Choice | string | `""` | One choice from a set |
| Blob | bytes | `None` | Binary data |
| Any | any | `None` | Any value type |
| Id | integer | `0` | Record ID (positive integer) |

### Reference Types

| Type | Format | Default | Description |
|------|--------|---------|-------------|
| Ref:TableName | integer | `0` | Reference to another table (stores row ID) |
| RefList:TableName | array | `None` | List of references to another table |

### Position Types

| Type | Storage Type | Default | Description |
|------|--------------|---------|-------------|
| PositionNumber | float | `inf` | Fractional position for ordering |
| ManualSortPos | float | `inf` | Manual sort position |

### List Types

| Type | Storage Type | Default | Description |
|------|--------------|---------|-------------|
| ChoiceList | tuple | `None` | List of strings from acceptable choices |
| Attachments | array | `None` | List of attachment IDs |

---

## Storage vs Wire Format

Grist uses different representations for data in storage (database) versus wire format (API/plugin communication).

### RefList Encoding

**Storage Format:**
```python
# Python: list of integers
[1, 2, 3]
```

**Wire Format:**
```javascript
// Encoded as tuple with 'L' code
["L", 1, 2, 3]

// For RefList specifically
["r", "TableName", [1, 2, 3]]
```

### ChoiceList Encoding

**Storage Format:**
```python
# Python: tuple of strings
("apple", "banana", "cherry")
```

**Wire Format:**
```javascript
// Encoded as tuple with 'L' code
["L", "apple", "banana", "cherry"]
```

### Reference Encoding

**Storage Format:**
```python
# Python: integer (row ID)
42
```

**Wire Format:**
```javascript
// Simple integer for Ref columns
42

// Full encoding with table info (in some contexts)
["R", "TableName", 42]
```

### DateTime Encoding

**Storage Format:**
```python
# Python: float (Unix timestamp)
1704945919.0
```

**Wire Format:**
```javascript
// Encoded with timezone info
["D", 1704945919, "America/New_York"]
```

### Date Encoding

**Storage Format:**
```python
# Python: float (Unix timestamp)
1704844800.0
```

**Wire Format:**
```javascript
// Encoded with 'd' code
["d", 1704844800]
```

### Complete Wire Format Reference

| Code | Type | Format | Example |
|------|------|--------|---------|
| `L` | List | `["L", ...items]` | `["L", "foo", "bar"]` |
| `l` | LookUp | `["l", value, options]` | `["l", 42, {...}]` |
| `O` | Dict | `["O", {key: value}]` | `["O", {"foo": "bar"}]` |
| `D` | DateTime | `["D", timestamp, timezone]` | `["D", 1704945919, "UTC"]` |
| `d` | Date | `["d", timestamp]` | `["d", 1704844800]` |
| `C` | Censored | `["C"]` | `["C"]` |
| `R` | Reference | `["R", table_id, row_id]` | `["R", "People", 17]` |
| `r` | ReferenceList | `["r", table_id, [row_ids]]` | `["r", "People", [1,2]]` |
| `E` | Exception | `["E", name, ...]` | `["E", "ValueError"]` |
| `P` | Pending | `["P"]` | `["P"]` |
| `U` | Unmarshallable | `["U", text]` | `["U", "???"]` |
| `V` | Version | `["V", version_obj]` | `["V", {...}]` |

---

## Table Relationships

### Primary Relationships

```
_grist_Tables
  ├─→ _grist_Tables_column (parentId)
  ├─→ _grist_Views (primaryViewId)
  ├─→ _grist_Views_section (rawViewSectionRef, recordCardViewSectionRef)
  └─→ _grist_Tables (summarySourceTable) [self-reference]

_grist_Tables_column
  ├─→ _grist_Tables (parentId)
  ├─→ _grist_Tables_column (summarySourceCol, displayCol, visibleCol, reverseCol) [self-ref]
  └─→ _grist_Tables_column (rules, recalcDeps) [lists]

_grist_Views
  └─→ _grist_Views_section (parentId)

_grist_Views_section
  ├─→ _grist_Views (parentId)
  ├─→ _grist_Tables (tableRef)
  ├─→ _grist_Views_section (linkSrcSectionRef) [self-reference]
  ├─→ _grist_Tables_column (linkSrcColRef, linkTargetColRef)
  └─→ _grist_Tables_column (rules) [list]

_grist_Views_section_field
  ├─→ _grist_Views_section (parentId)
  ├─→ _grist_Tables_column (colRef, displayCol, visibleCol)
  └─→ _grist_Tables_column (rules) [list]

_grist_Pages
  ├─→ _grist_Views (viewRef)
  └─→ _grist_Shares (shareRef)

_grist_Filters
  ├─→ _grist_Views_section (viewSectionRef)
  └─→ _grist_Tables_column (colRef)

_grist_ACLRules
  ├─→ _grist_ACLResources (resource)
  └─→ _grist_Tables_column (aclColumn) [deprecated]

_grist_Triggers
  ├─→ _grist_Tables (tableRef)
  ├─→ _grist_Tables_column (isReadyColRef)
  └─→ _grist_Tables_column (watchedColRefList) [list]

_grist_Cells
  ├─→ _grist_Tables (tableRef)
  ├─→ _grist_Tables_column (colRef)
  └─→ _grist_Cells (parentId) [self-reference for hierarchy]
```

### Relationship Diagram (Simplified)

```
┌─────────────────┐
│ _grist_DocInfo  │ (Document settings)
└─────────────────┘

┌─────────────────┐         ┌──────────────────────┐
│ _grist_Tables   │────────→│ _grist_Tables_column │
│                 │         │                      │
│ - tableId       │         │ - colId              │
│ - primaryViewId │         │ - type               │
│ - onDemand      │         │ - formula            │
└────────┬────────┘         └──────────────────────┘
         │                              │
         │                              │ (rules, recalcDeps)
         ↓                              ↓
┌─────────────────┐         ┌──────────────────────┐
│ _grist_Views    │←───────→│ _grist_Views_section │
│                 │         │                      │
│ - name          │         │ - tableRef           │
│ - layoutSpec    │         │ - parentKey          │
└────────┬────────┘         │ - sortColRefs        │
         │                  └──────────┬───────────┘
         │                             │
         ↓                             ↓
┌─────────────────┐         ┌──────────────────────────┐
│ _grist_Pages    │         │ _grist_Views_section_field│
│                 │         │                           │
│ - viewRef       │         │ - colRef                  │
│ - indentation   │         │ - widgetOptions           │
│ - pagePos       │         └───────────────────────────┘
└─────────────────┘

┌──────────────────┐        ┌─────────────────┐
│_grist_ACLResources│←──────│_grist_ACLRules  │
│                   │        │                 │
│ - tableId         │        │ - aclFormula    │
│ - colIds          │        │ - permissions   │
└───────────────────┘        └─────────────────┘

┌─────────────────┐         ┌─────────────────┐
│ _grist_Triggers │────────→│ _grist_Tables   │
│                 │         └─────────────────┘
│ - eventTypes    │
│ - actions       │
│ - enabled       │
└─────────────────┘

┌──────────────────┐
│ _grist_Attachments│ (File metadata)
│                   │
│ - fileIdent       │
│ - fileName        │
└───────────────────┘

┌─────────────────┐
│ _grist_Cells    │ (Cell comments/metadata)
│                 │
│ - tableRef      │
│ - colRef        │
│ - rowId         │
│ - parentId      │ (self-reference)
└─────────────────┘

┌─────────────────┐
│ _grist_Shares   │ (Public sharing)
│                 │
│ - linkId        │
│ - options       │
└─────────────────┘
```

### Key Relationships Explained

1. **Tables → Columns**: One-to-many. Each table has multiple columns.

2. **Tables → Views**: One-to-many (via primaryViewId). Each table has a primary view.

3. **Views → Sections**: One-to-many. Each view contains multiple sections (e.g., chart + grid).

4. **Sections → Fields**: One-to-many. Each section displays a subset of columns as fields.

5. **Section Linking**: Sections can link to other sections (linkSrcSectionRef) to create master-detail relationships.

6. **Column References**:
   - `displayCol`: Auto-created helper column for displaying Ref values
   - `visibleCol`: Which column in target table to show
   - `reverseCol`: Two-way reference support
   - `rules`: Conditional formatting formulas
   - `recalcDeps`: Trigger columns for data column formulas

7. **Page Hierarchy**: Pages form a tree via indentation levels, all referencing views.

8. **ACL Rules**: Link resources (table/column combinations) to permission rules.

9. **Triggers**: Watch tables (and optionally specific columns) for changes.

10. **Cell Metadata**: Forms a tree structure (parent-child) for threaded discussions.

---

## Notes

### Schema Versioning

Current schema version: **44**

When changing the schema:
1. Increment `SCHEMA_VERSION` in `sandbox/grist/schema.py`
2. Update `app/common/schema.ts` (auto-generated)
3. Add migration in `sandbox/grist/migrations.py`
4. Follow rules in `/documentation/migrations.md`

### Migration Rules

**DO NOT:**
- Remove metadata tables or columns
- Rename metadata tables or columns
- Change types of existing columns

**INSTEAD:**
- Mark old columns/tables as DEPRECATED with version comment
- Create new columns/tables with new names
- Write migration to copy/transform data
- Remove code references to deprecated entities

**Example deprecation comment:**
```python
# columnName is deprecated as of version XX. Do not remove or reuse.
```

### Backward Compatibility

The schema must support:
- Documents created by older Grist versions
- Collaboration between users on different Grist versions
- Opening documents with older Grist versions after upgrade

This is why deprecated columns remain in the schema.

---

## Additional Resources

- **Schema Definition**: `/sandbox/grist/schema.py`
- **TypeScript Schema**: `/app/common/schema.ts` (auto-generated)
- **User Types**: `/sandbox/grist/usertypes.py`
- **Migration Guide**: `/documentation/migrations.md`
- **Wire Format**: `/app/plugin/GristData.ts`

---

*Generated from schema version 44*
*Last updated: 2025-11-15*
