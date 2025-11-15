# Grist Actions Complete Reference

**The definitive guide to Grist UserActions** - high-level operations for modifying Grist documents programmatically.

**Total Actions**: 43 | **Source**: `sandbox/grist/useractions.py`

---

## Quick Start

### The /apply Endpoint

**Endpoint**: `POST /api/docs/:docId/apply`

**Critical Format**: Send actions array directly in request body

```typescript
// ✅ CORRECT
[['AddTable', 'MyTable', [...]]]

// ❌ WRONG
{"actions": [['AddTable', ...]]}
```

**Parameters**:
- `noparse=1`: Skip automatic string parsing (dates, numbers, etc.)

**Examples**:

Single action:
```bash
curl -X POST https://api.getgrist.com/api/docs/DOCID/apply \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[["AddRecord", "Table1", null, {"Name": "Alice"}]]'
```

Multiple actions:
```bash
curl -X POST https://api.getgrist.com/api/docs/DOCID/apply \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[
    ["AddTable", "People", [{"id": "name", "type": "Text", "isFormula": false}]],
    ["BulkAddRecord", "People", [null, null], {"name": ["Alice", "Bob"]}]
  ]'
```

---

## Table of Contents

- [Quick Start](#quick-start)
- [Type Definitions](#type-definitions)
- [Common Patterns](#common-patterns)
- [Table Actions](#table-actions)
- [Record Actions](#record-actions)
- [Column Actions](#column-actions)
- [View Actions](#view-actions)
- [Document Actions](#document-actions)
- [Common Pitfalls](#common-pitfalls)
- [Complete Action Index](#complete-action-index)

---

## Type Definitions

### Core Types

```typescript
/**
 * Cell value - any JSON-serializable value or encoded tuple
 */
type CellValue = null | boolean | number | string | [string, ...any[]];

/**
 * Column values for a single record
 */
interface ColValues {
  [colId: string]: CellValue;
}

/**
 * Column values for multiple records (column-oriented)
 */
interface BulkColValues {
  [colId: string]: CellValue[];
}

/**
 * Column configuration
 */
interface ColInfo {
  type?: string;          // "Text", "Numeric", "Ref:TableName", etc.
  isFormula?: boolean;    // true for formula columns
  formula?: string;       // Python expression
  widgetOptions?: string; // JSON string
  label?: string;         // Display label
  visibleCol?: number;    // Visible column ref (for Ref/RefList)
  recalcWhen?: number;    // Recalculation trigger
  recalcDeps?: number[];  // Recalc dependencies
}

/**
 * Column with ID (for AddTable)
 */
interface ColInfoWithId extends ColInfo {
  id: string;
}

/**
 * Upsert options
 */
interface UpsertOptions {
  onMany?: "first" | "all" | "none";  // Which records to update when multiple match
  update?: boolean;                    // Allow updating (default: true)
  add?: boolean;                       // Allow adding (default: true)
  allowEmptyRequire?: boolean;         // Allow empty require (default: false)
}
```

### Column-Oriented Format

**CRITICAL**: Bulk operations use column-oriented format:

```typescript
// ✅ CORRECT - Column-oriented
{
  name: ["Alice", "Bob", "Charlie"],
  age: [30, 25, 35]
}

// ❌ WRONG - Row-oriented (NOT supported)
[
  {name: "Alice", age: 30},
  {name: "Bob", age: 25}
]
```

---

## Common Patterns

### Creating a Table with Data

```typescript
[
  // 1. Create table structure
  ['AddTable', 'People', [
    {id: 'name', type: 'Text', isFormula: false},
    {id: 'email', type: 'Text', isFormula: false},
    {id: 'age', type: 'Numeric', isFormula: false}
  ]],

  // 2. Add data
  ['BulkAddRecord', 'People', [null, null, null], {
    name: ['Alice', 'Bob', 'Charlie'],
    email: ['alice@example.com', 'bob@example.com', 'charlie@example.com'],
    age: [30, 25, 35]
  }]
]
```

### Adding a Reference Column

```typescript
// Assume People table has a 'name' column with ID 25
[
  ['AddColumn', 'Orders', 'customer', {
    type: 'Ref:People',
    isFormula: false,
    visibleCol: 25  // Points to People.name
  }]
]
```

### Upsert Pattern

```typescript
['BulkAddOrUpdateRecord', 'Users',
  // Lookup criteria
  {email: ['alice@example.com', 'bob@example.com']},
  // Values to set
  {name: ['Alice Smith', 'Bob Jones'], status: ['active', 'active']},
  // Options
  {onMany: 'first', update: true, add: true}
]
```

---

## Table Actions

### AddTable

Creates a new table with columns and views.

**Signature**: `['AddTable', tableId, columns]`

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | string | Table identifier (valid Python identifier) | ✓ |
| columns | ColInfoWithId[] | Array of column definitions | ✓ |

**Column Definition**:
```typescript
{
  id: string,            // Column ID
  type?: string,         // Default: 'Any' (formula), 'Text' (data)
  isFormula?: boolean,   // Default: bool(formula)
  formula?: string,      // Default: ''
  label?: string,        // Default: same as id
  widgetOptions?: string // JSON string
}
```

**Examples**:

Basic table:
```typescript
['AddTable', 'People', [
  {id: 'name', type: 'Text', isFormula: false},
  {id: 'email', type: 'Text', isFormula: false}
]]
```

With formula column:
```typescript
['AddTable', 'Orders', [
  {id: 'quantity', type: 'Numeric', isFormula: false},
  {id: 'price', type: 'Numeric', isFormula: false},
  {id: 'total', type: 'Numeric', isFormula: true, formula: '$quantity * $price'}
]]
```

**Returns**: `{id: number, table_id: string, columns: string[], views: any[]}`

**Source**: `sandbox/grist/useractions.py:2017`

---

### AddEmptyTable

Creates a table with 3 empty formula columns (A, B, C).

**Signature**: `['AddEmptyTable', tableId]`

**Example**:
```typescript
['AddEmptyTable', 'NewTable']
```

**Returns**: Same as AddTable

**Source**: `sandbox/grist/useractions.py:2007`

---

### AddRawTable

Creates a table without a primary view (no page created).

**Signature**: `['AddRawTable', tableId]`

**Example**:
```typescript
['AddRawTable', 'TempImport']
```

**Returns**: `{id: number, table_id: string, columns: string[]}`

**Source**: `sandbox/grist/useractions.py:2028`

---

### RemoveTable

Removes a table and all associated data.

**Signature**: `['RemoveTable', tableId]`

**Example**:
```typescript
['RemoveTable', 'OldData']
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:2123`

---

### RenameTable

Renames a table and updates formula references.

**Signature**: `['RenameTable', oldTableId, newTableId]`

**Example**:
```typescript
['RenameTable', 'Person', 'People']
```

**Returns**: `string` - The actual new table ID (sanitized if needed)

**Source**: `sandbox/grist/useractions.py:2131`

---

### DuplicateTable

Duplicates table structure and optionally data.

**Signature**: `['DuplicateTable', existingTableId, newTableId, includeData]`

| Parameter | Type | Description |
|-----------|------|-------------|
| existingTableId | string | Source table |
| newTableId | string | New table name |
| includeData | boolean | Copy data (true) or structure only (false) |

**Examples**:

Structure only:
```typescript
['DuplicateTable', 'Orders', 'Orders_Template', false]
```

With data:
```typescript
['DuplicateTable', 'Products', 'Products_Archive', true]
```

**Returns**: `{id: number, table_id: string, raw_section_id: number}`

**Restrictions**: Cannot duplicate hidden or summary tables

**Source**: `sandbox/grist/useractions.py:2140`

---

## Record Actions

### AddRecord

Adds a single record.

**Signature**: `['AddRecord', tableId, rowId, columnValues]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableId | string | Target table |
| rowId | number \| null | Row ID (use null for auto) |
| columnValues | ColValues | Column values |

**Example**:
```typescript
['AddRecord', 'People', null, {
  name: 'Alice',
  email: 'alice@example.com',
  age: 30
}]
```

**Returns**: `number` - The row ID

**Source**: `sandbox/grist/useractions.py:383`

---

### BulkAddRecord

Adds multiple records efficiently.

**Signature**: `['BulkAddRecord', tableId, rowIds, columnValues]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableId | string | Target table |
| rowIds | (number \| null)[] | Row IDs (null = auto) |
| columnValues | BulkColValues | Column-oriented values |

**Example**:
```typescript
['BulkAddRecord', 'People', [null, null, null], {
  name: ['Alice', 'Bob', 'Charlie'],
  age: [30, 25, 35],
  email: ['alice@example.com', 'bob@example.com', 'charlie@example.com']
}]
```

**Returns**: `number[]` - Array of row IDs

**Column-Oriented Format**:
- All arrays must have same length as rowIds
- Keys are column IDs
- Values are arrays of cell values

**Source**: `sandbox/grist/useractions.py:389`

---

### UpdateRecord

Updates a single record.

**Signature**: `['UpdateRecord', tableId, rowId, columnValues]`

**Example**:
```typescript
['UpdateRecord', 'People', 5, {
  name: 'Alice Smith',
  email: 'alice.smith@example.com'
}]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:557`

---

### BulkUpdateRecord

Updates multiple records efficiently.

**Signature**: `['BulkUpdateRecord', tableId, rowIds, columnValues]`

**Example**:
```typescript
['BulkUpdateRecord', 'Products', [1, 2, 3], {
  price: [10.99, 20.99, 15.99],
  inStock: [true, false, true]
}]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:562`

---

### RemoveRecord

Removes a single record.

**Signature**: `['RemoveRecord', tableId, rowId]`

**Example**:
```typescript
['RemoveRecord', 'People', 42]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1178`

---

### BulkRemoveRecord

Removes multiple records.

**Signature**: `['BulkRemoveRecord', tableId, rowIds]`

**Example**:
```typescript
['BulkRemoveRecord', 'OldRecords', [1, 5, 10, 15, 20]]
```

**Returns**: `void`

**Cleanup**: Automatically cleans up references to deleted rows

**Source**: `sandbox/grist/useractions.py:1182`

---

### ReplaceTableData

Replaces all data in a table.

**Signature**: `['ReplaceTableData', tableId, rowIds, columnValues]`

**Example**:
```typescript
['ReplaceTableData', 'Cache', [1, 2], {
  key: ['foo', 'bar'],
  value: ['data1', 'data2']
}]
```

**Returns**: `void`

**Behavior**: Removes existing data, then adds new rows

**Source**: `sandbox/grist/useractions.py:397`

---

### BulkAddOrUpdateRecord

Add or update records based on lookup criteria (upsert).

**Signature**: `['BulkAddOrUpdateRecord', tableId, require, colValues, options]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableId | string | Target table |
| require | BulkColValues | Lookup criteria (columns to match) |
| colValues | BulkColValues | Values to set |
| options | UpsertOptions | Behavior configuration |

**Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| onMany | "first" \| "all" \| "none" | "first" | How to handle multiple matches |
| update | boolean | true | Allow updating existing records |
| add | boolean | true | Allow adding new records |
| allowEmptyRequire | boolean | false | Allow empty require dict |

**Behavior**:
- For each record, looks up existing records matching all fields in `require`
- If found and `update=true`: updates matched record(s)
- If not found and `add=true`: creates new record with `{...require, ...colValues}`

**Examples**:

Upsert by email:
```typescript
['BulkAddOrUpdateRecord', 'Users',
  {email: ['alice@example.com', 'bob@example.com']},
  {name: ['Alice Smith', 'Bob Jones'], status: ['active', 'active']},
  {onMany: 'first', update: true, add: true}
]
```

Only add if not exists:
```typescript
['BulkAddOrUpdateRecord', 'Products',
  {sku: ['SKU001', 'SKU002']},
  {name: ['Widget', 'Gadget'], price: [9.99, 19.99]},
  {update: false, add: true}
]
```

Update all matching:
```typescript
['BulkAddOrUpdateRecord', 'Tasks',
  {status: ['pending']},
  {status: ['in_progress']},
  {onMany: 'all'}
]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1027`

---

### AddOrUpdateRecord

Single-record upsert.

**Signature**: `['AddOrUpdateRecord', tableId, require, colValues, options]`

**Example**:
```typescript
['AddOrUpdateRecord', 'Users',
  {email: 'alice@example.com'},
  {name: 'Alice Smith', age: 30},
  {onMany: 'first'}
]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1129`

---

## Column Actions

### AddColumn

Adds a column to a table.

**Signature**: `['AddColumn', tableId, colId, colInfo]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableId | string | Target table |
| colId | string \| null | Column ID (null = auto-generate) |
| colInfo | ColInfo | Column configuration |

**ColInfo Fields**:
```typescript
{
  type?: string,           // Column type (see types below)
  isFormula?: boolean,     // true = formula, false = data
  formula?: string,        // Python expression
  label?: string,          // Display label
  widgetOptions?: string,  // JSON string (NOT object!)
  visibleCol?: number,     // Top-level field (NOT in widgetOptions!)
  recalcWhen?: number,     // 0=DEFAULT, 1=NEVER, 2=MANUAL_UPDATES
  recalcDeps?: number[]    // Column refs for recalc triggers
}
```

**Column Types**:
- Basic: `'Text'`, `'Numeric'`, `'Int'`, `'Bool'`, `'Date'`, `'DateTime'`
- Special: `'Any'`, `'Attachments'`, `'Choice'`, `'ChoiceList'`
- References: `'Ref:TableName'`, `'RefList:TableName'`

**Examples**:

Text column:
```typescript
['AddColumn', 'People', 'firstName', {
  type: 'Text',
  isFormula: false,
  label: 'First Name'
}]
```

Numeric with currency:
```typescript
['AddColumn', 'Products', 'price', {
  type: 'Numeric',
  isFormula: false,
  widgetOptions: JSON.stringify({
    numMode: 'currency',
    currency: 'USD',
    decimals: 2
  })
}]
```

Formula column:
```typescript
['AddColumn', 'Orders', 'total', {
  type: 'Numeric',
  isFormula: true,
  formula: '$quantity * $unitPrice'
}]
```

Reference column with visibleCol:
```typescript
// Assuming People.name column has ID 25
['AddColumn', 'Orders', 'customer', {
  type: 'Ref:People',
  isFormula: false,
  visibleCol: 25  // ✅ Top-level, NOT in widgetOptions!
}]
```

Choice column:
```typescript
['AddColumn', 'Tasks', 'status', {
  type: 'Choice',
  isFormula: false,
  widgetOptions: JSON.stringify({
    choices: ['Todo', 'In Progress', 'Done']
  })
}]
```

**Returns**: `{colRef: number, colId: string}`

**Source**: `sandbox/grist/useractions.py:1454`

---

### AddHiddenColumn

Adds a column hidden from default views.

**Signature**: `['AddHiddenColumn', tableId, colId, colInfo]`

**Example**:
```typescript
['AddHiddenColumn', 'People', 'gristHelper_Display', {
  type: 'Text',
  isFormula: true,
  formula: '$firstName + " " + $lastName'
}]
```

**Returns**: `{colRef: number, colId: string}`

**Source**: `sandbox/grist/useractions.py:1508`

---

### AddVisibleColumn

Adds a column visible in all record views.

**Signature**: `['AddVisibleColumn', tableId, colId, colInfo]`

**Example**:
```typescript
['AddVisibleColumn', 'People', 'phoneNumber', {
  type: 'Text',
  isFormula: false
}]
```

**Returns**: `{colRef: number, colId: string}`

**Source**: `sandbox/grist/useractions.py:1513`

---

### RemoveColumn

Removes a column.

**Signature**: `['RemoveColumn', tableId, colId]`

**Example**:
```typescript
['RemoveColumn', 'People', 'temporaryField']
```

**Returns**: `void`

**Restrictions**: Cannot remove group-by columns from summary tables

**Source**: `sandbox/grist/useractions.py:1582`

---

### RenameColumn

Renames a column and updates formula references.

**Signature**: `['RenameColumn', tableId, oldColId, newColId]`

**Example**:
```typescript
['RenameColumn', 'People', 'firstName', 'first_name']
```

**Returns**: `string` - The actual new column ID (sanitized)

**Auto-update**: Formulas using the old column ID are automatically updated

**Source**: `sandbox/grist/useractions.py:1590`

---

### ModifyColumn

Modifies column properties.

**Signature**: `['ModifyColumn', tableId, colId, colInfo]`

**Modifiable**: All ColInfo fields except `colId`, `id`, `parentId`

**Example**:
```typescript
['ModifyColumn', 'People', 'age', {
  type: 'Numeric',
  widgetOptions: JSON.stringify({decimals: 0})
}]
```

**Returns**: `void`

**Note**: May trigger type conversion and data migration

**Source**: `sandbox/grist/useractions.py:1656`

---

### SetDisplayFormula

Sets a display formula for a field or column.

**Signature**: `['SetDisplayFormula', tableId, fieldRef, colRef, formula]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableId | string | Target table |
| fieldRef | number \| null | Field reference (mutually exclusive with colRef) |
| colRef | number \| null | Column reference (mutually exclusive with fieldRef) |
| formula | string | Display formula |

**Example**:
```typescript
['SetDisplayFormula', 'People', null, 25, '$firstName + " " + $lastName']
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1598`

---

### CopyFromColumn

Copies column schema and data.

**Signature**: `['CopyFromColumn', tableId, srcColId, dstColId, widgetOptions]`

**Example**:
```typescript
['CopyFromColumn', 'People', 'age_temp', 'age', null]
```

**Returns**: `void`

**Use Case**: Column transformations

**Source**: `sandbox/grist/useractions.py:1784`

---

### ConvertFromColumn

Converts column data using external conversion logic.

**Signature**: `['ConvertFromColumn', tableId, srcColId, dstColId, type, widgetOptions, visibleColRef]`

**Example**:
```typescript
['ConvertFromColumn', 'Locations', 'cityName', 'cityRef', 'Ref:Cities', '{}', 25]
```

**Returns**: `void`

**Note**: Primarily used internally by Grist UI

**Source**: `sandbox/grist/useractions.py:1748`

---

### RenameChoices

Updates choice names in Choice/ChoiceList columns.

**Signature**: `['RenameChoices', tableId, colId, renames]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableId | string | Target table |
| colId | string | Choice/ChoiceList column |
| renames | {[old: string]: string} | Old → new name mapping |

**Example**:
```typescript
['RenameChoices', 'Tasks', 'status', {
  'Todo': 'To Do',
  'In Progress': 'Working On'
}]
```

**Returns**: `void`

**Behavior**: Updates data and filters, but NOT widgetOptions

**Source**: `sandbox/grist/useractions.py:1865`

---

### AddReverseColumn

Creates a reverse reference column (two-way binding).

**Signature**: `['AddReverseColumn', tableId, colId]`

**Example**:
```typescript
// If Orders.customer references People
// This creates People.orders pointing back
['AddReverseColumn', 'Orders', 'customer']
```

**Returns**: `{colRef: number, colId: string}`

**Source**: `sandbox/grist/useractions.py:1941`

---

### AddEmptyRule

Adds an empty conditional style rule.

**Signature**: `['AddEmptyRule', tableId, fieldRef, colRef]`

**Example**:
```typescript
['AddEmptyRule', 'People', null, 25]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1907`

---

### MaybeCopyDisplayFormula

Copies displayCol if source has one.

**Signature**: `['MaybeCopyDisplayFormula', srcColRef, dstColRef]`

**Example**:
```typescript
['MaybeCopyDisplayFormula', 25, 30]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1850`

---

## View Actions

### CreateViewSection

Creates a view section (can create new table/view if needed).

**Signature**: `['CreateViewSection', tableRef, viewRef, sectionType, groupbyColRefs, tableId]`

| Parameter | Type | Description |
|-----------|------|-------------|
| tableRef | number | Table reference (0 = create new) |
| viewRef | number | View reference (0 = create new) |
| sectionType | string | 'record', 'detail', 'chart', 'form', etc. |
| groupbyColRefs | number[] \| null | Columns for grouping (null = plain section) |
| tableId | string | Table ID for new table |

**Example**:
```typescript
['CreateViewSection', 1, 2, 'record', null, '']
```

**Returns**: `{tableRef: number, viewRef: number, sectionRef: number}`

**Source**: `sandbox/grist/useractions.py:2302`

---

### UpdateSummaryViewSection

Updates summary section grouping columns.

**Signature**: `['UpdateSummaryViewSection', sectionRef, groupbyColRefs]`

**Example**:
```typescript
['UpdateSummaryViewSection', 10, [5, 8]]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:2355`

---

### DetachSummaryViewSection

Converts summary section to real table.

**Signature**: `['DetachSummaryViewSection', sectionRef]`

**Example**:
```typescript
['DetachSummaryViewSection', 10]
```

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:2366`

---

### AddView

Creates a new view (page).

**Signature**: `['AddView', tableId, viewType, name]`

**Example**:
```typescript
['AddView', 'People', 'raw_data', 'People Page']
```

**Returns**: `{id: number, sections: number[]}`

**Source**: `sandbox/grist/useractions.py:2382`

---

### RemoveView (Deprecated)

**Use instead**: `['RemoveRecord', '_grist_Views', viewId]`

**Signature**: `['RemoveView', viewId]`

**Source**: `sandbox/grist/useractions.py:2426`

---

### AddViewSection (Deprecated)

**Use instead**: `CreateViewSection`

**Signature**: `['AddViewSection', title, viewSectionType, viewRowId, tableId]`

**Source**: `sandbox/grist/useractions.py:2440`

---

### RemoveViewSection (Deprecated)

**Use instead**: `['RemoveRecord', '_grist_Views_section', sectionId]`

**Signature**: `['RemoveViewSection', viewSectionId]`

**Source**: `sandbox/grist/useractions.py:2455`

---

## Document Actions

### InitNewDoc

Initializes a new document with schema structure.

**Signature**: `['InitNewDoc']`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:307`

---

### Calculate

Triggers formula recalculation (system action).

**Signature**: `['Calculate']`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:344`

---

### UpdateCurrentTime

Updates NOW() function (system action).

**Signature**: `['UpdateCurrentTime']`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:352`

---

### ApplyDocActions

Applies low-level DocActions.

**Signature**: `['ApplyDocActions', docActions]`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:334`

---

### ApplyUndoActions

Applies undo actions in reverse.

**Signature**: `['ApplyUndoActions', undoActions]`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:339`

---

### RespondToRequests

Reevaluates REQUEST() function calls.

**Signature**: `['RespondToRequests', responses, cachedKeys]`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:360`

---

### RemoveStaleObjects

Removes transform columns and temp tables.

**Signature**: `['RemoveStaleObjects']`

**Returns**: `void`

**Source**: `sandbox/grist/useractions.py:1620`

---

### GenImporterView

Generates importer view (internal use).

**Signature**: `['GenImporterView', sourceTableId, destTableId, transformRule, options]`

**Returns**: Result from DoGenImporterView

**Source**: `sandbox/grist/useractions.py:2509`

---

## Common Pitfalls

### 1. Request Body Format

❌ **WRONG**: Wrapping in `{actions: [...]}`
```json
{"actions": [["AddTable", "MyTable", [...]]]}
```

✅ **CORRECT**: Direct array
```json
[["AddTable", "MyTable", [...]]]
```

---

### 2. visibleCol Placement

❌ **WRONG**: Inside widgetOptions
```typescript
{
  type: 'Ref:People',
  widgetOptions: JSON.stringify({visibleCol: 25})
}
```

✅ **CORRECT**: Top-level in ColInfo
```typescript
{
  type: 'Ref:People',
  visibleCol: 25
}
```

---

### 3. widgetOptions Serialization

❌ **WRONG**: Object
```typescript
widgetOptions: {decimals: 2}
```

✅ **CORRECT**: JSON string
```typescript
widgetOptions: JSON.stringify({decimals: 2})
```

---

### 4. Column-Oriented vs Row-Oriented

❌ **WRONG**: Row-oriented
```typescript
[
  {name: 'Alice', age: 30},
  {name: 'Bob', age: 25}
]
```

✅ **CORRECT**: Column-oriented
```typescript
{
  name: ['Alice', 'Bob'],
  age: [30, 25]
}
```

---

### 5. Python Keywords

❌ **WRONG**: Using reserved words
```typescript
'class', 'import', 'from', 'return', 'if', 'for', 'while'
```

✅ **CORRECT**: Avoid or modify
```typescript
'Class', 'Import_', 'From_', 'return_value', 'If_', 'For_', 'While_'
```

**Complete list**: `False`, `None`, `True`, `and`, `as`, `assert`, `async`, `await`, `break`, `class`, `continue`, `def`, `del`, `elif`, `else`, `except`, `finally`, `for`, `from`, `global`, `if`, `import`, `in`, `is`, `lambda`, `nonlocal`, `not`, `or`, `pass`, `raise`, `return`, `try`, `while`, `with`, `yield`

---

### 6. Array Length Mismatches

❌ **WRONG**: Mismatched lengths
```typescript
['BulkAddRecord', 'People', [null, null, null], {
  name: ['Alice', 'Bob'],    // Length 2
  age: [30, 25, 35]          // Length 3
}]
```

✅ **CORRECT**: All same length
```typescript
['BulkAddRecord', 'People', [null, null, null], {
  name: ['Alice', 'Bob', 'Charlie'],  // Length 3
  age: [30, 25, 35]                   // Length 3
}]
```

---

### 7. isFormula Default

**Default in AddColumn/ModifyColumn**: `true` (creates formula column)
**Default in AddTable**: `bool(formula)` (true if formula non-empty)

❌ **UNCLEAR**: Relying on defaults
```typescript
{id: 'name'}  // Creates formula column!
```

✅ **CLEAR**: Always specify
```typescript
{id: 'name', isFormula: false, type: 'Text'}
```

---

### 8. Date/Time Format

❌ **WRONG**: Milliseconds
```typescript
date: Date.now()  // 1699876543210
```

✅ **CORRECT**: Seconds
```typescript
date: Math.floor(Date.now() / 1000)  // 1699876543
```

Or use date strings:
```typescript
date: '2025-11-15'  // Auto-parsed
```

---

### 9. Reference Values

For Ref columns:
- Use row ID (number)
- `0` = no reference
- Invalid IDs treated as `0`

```typescript
['BulkAddRecord', 'Orders', [null, null], {
  customer: [5, 12],  // Row IDs in People table
  product: [0, 8]     // 0 = no reference
}]
```

---

### 10. RefList Encoding

RefList values use `['L', ...rowIds]` encoding:

```typescript
['UpdateRecord', 'Projects', 1, {
  assignees: ['L', 5, 10, 15]
}]
```

**However**: For most API usage, simple arrays work:
```typescript
assignees: [5, 10, 15]  // Auto-converted internally
```

---

### 11. Formula Syntax

Formulas are **Python**, not JavaScript:

✅ **CORRECT** (Python):
```python
'$price * 0.9'
'$firstName + " " + $lastName'
'sum($values) if $values else 0'
```

❌ **WRONG** (JavaScript):
```javascript
'$price * 0.9;'  // No semicolons
`${firstName}`   // No template literals
'$values.reduce((a,b) => a+b)'  // No arrow functions
```

---

### 12. System Tables

❌ **WRONG**: Direct modification
```typescript
['BulkAddRecord', '_grist_Tables_column', ...]
```

✅ **CORRECT**: Use UserActions
```typescript
['AddColumn', 'MyTable', 'myColumn', {...}]
```

---

## Complete Action Index

### Table Operations (7)
- `AddTable(tableId, columns)` - Create table with columns
- `AddEmptyTable(tableId)` - Create empty table (3 formula columns)
- `AddRawTable(tableId)` - Create table without view
- `RemoveTable(tableId)` - Delete table
- `RenameTable(oldId, newId)` - Rename table
- `DuplicateTable(existingId, newId, includeData)` - Duplicate table
- `GenImporterView(sourceTable, destTable, rule, opts)` - Import view (internal)

### Record Operations (10)
- `AddRecord(table, rowId, values)` - Add single record
- `BulkAddRecord(table, rowIds, values)` - Add multiple records
- `UpdateRecord(table, rowId, values)` - Update single record
- `BulkUpdateRecord(table, rowIds, values)` - Update multiple records
- `RemoveRecord(table, rowId)` - Remove single record
- `BulkRemoveRecord(table, rowIds)` - Remove multiple records
- `ReplaceTableData(table, rowIds, values)` - Replace all data
- `AddOrUpdateRecord(table, require, values, opts)` - Upsert single
- `BulkAddOrUpdateRecord(table, require, values, opts)` - Upsert multiple

### Column Operations (13)
- `AddColumn(table, colId, colInfo)` - Add column
- `AddHiddenColumn(table, colId, colInfo)` - Add hidden column
- `AddVisibleColumn(table, colId, colInfo)` - Add visible column
- `RemoveColumn(table, colId)` - Remove column
- `RenameColumn(table, oldId, newId)` - Rename column
- `ModifyColumn(table, colId, colInfo)` - Modify column properties
- `SetDisplayFormula(table, fieldRef, colRef, formula)` - Set display formula
- `CopyFromColumn(table, srcId, dstId, opts)` - Copy column
- `ConvertFromColumn(table, srcId, dstId, type, opts, visCol)` - Convert column
- `RenameChoices(table, colId, renames)` - Rename choice values
- `AddReverseColumn(table, colId)` - Add reverse reference
- `AddEmptyRule(table, fieldRef, colRef)` - Add style rule
- `MaybeCopyDisplayFormula(srcRef, dstRef)` - Copy display formula

### View Operations (6)
- `CreateViewSection(tableRef, viewRef, type, groupby, tableId)` - Create section
- `UpdateSummaryViewSection(sectionRef, groupby)` - Update summary
- `DetachSummaryViewSection(sectionRef)` - Detach summary
- `AddView(tableId, viewType, name)` - Create view
- `RemoveView(viewId)` - **DEPRECATED** - Remove view
- `AddViewSection(title, type, viewId, tableId)` - **DEPRECATED**
- `RemoveViewSection(sectionId)` - **DEPRECATED**

### Document Operations (7)
- `InitNewDoc()` - Initialize new document
- `Calculate()` - Recalculate formulas (system)
- `UpdateCurrentTime()` - Update NOW() (system)
- `ApplyDocActions(actions)` - Apply low-level actions
- `ApplyUndoActions(actions)` - Apply undo actions
- `RespondToRequests(responses, keys)` - Reevaluate REQUEST()
- `RemoveStaleObjects()` - Clean up temp objects

**Total**: 43 actions

---

## Quick Reference

### Most Common Actions

```typescript
// Create table
['AddTable', 'People', [{id: 'name', type: 'Text', isFormula: false}]]

// Add records
['BulkAddRecord', 'People', [null, null], {name: ['Alice', 'Bob']}]

// Update records
['BulkUpdateRecord', 'People', [1, 2], {status: ['active', 'active']}]

// Add column
['AddColumn', 'People', 'email', {type: 'Text', isFormula: false}]

// Modify column
['ModifyColumn', 'People', 'age', {type: 'Numeric'}]

// Upsert
['BulkAddOrUpdateRecord', 'Users',
  {email: ['a@ex.com', 'b@ex.com']},
  {name: ['Alice', 'Bob']},
  {onMany: 'first'}
]
```

---

**Last Updated**: 2025-11-15
**Source**: `sandbox/grist/useractions.py`
**Endpoint**: `POST /api/docs/:docId/apply`
