# Grist Actions Reference

Comprehensive reference for all Grist user actions. These actions represent the API for modifying Grist documents programmatically.

**Total Actions**: 43 | **Source**: `sandbox/grist/useractions.py`

> **Note**: While actions are implemented in Python, this reference uses TypeScript conventions for better integration with the Grist TypeScript/JavaScript codebase. All actions can be applied via `GristDocAPI.applyUserActions()`.

---

## Table of Contents

- [Document Actions](#document-actions)
- [Record Operations](#record-operations)
- [Column Operations](#column-operations)
- [Table Operations](#table-operations)
- [View Operations](#view-operations)
- [Type Definitions](#type-definitions)

---

## Document Actions

### InitNewDoc

| Property | Value |
|----------|-------|
| **Signature** | `["InitNewDoc"]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:307` |

**Description**: Initializes a new document by creating the schema structure, adding initial metadata to `_grist_DocInfo`, and setting up initial ACL data with default principals, resources, and rules.

**Parameters**: None

**TypeScript Type**:
```typescript
type InitNewDoc = ["InitNewDoc"];
```

**Examples**:

```typescript
// Initialize new document
await grist.docApi.applyUserActions([["InitNewDoc"]]);
```

---

### ApplyDocActions

| Property | Value |
|----------|-------|
| **Signature** | `["ApplyDocActions", docActions]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:334` |

**Description**: Applies a list of document actions to the document.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| docActions | `DocAction[]` | Array of document actions to apply | ✓ |

**TypeScript Type**:
```typescript
type ApplyDocActions = ["ApplyDocActions", DocAction[]];
```

**Examples**:

```typescript
// Apply multiple document actions
await grist.docApi.applyUserActions([[
  "ApplyDocActions",
  [
    ["AddRecord", "Table1", null, {A: 1}],
    ["UpdateRecord", "Table1", 1, {B: 2}]
  ]
]]);
```

---

### ApplyUndoActions

| Property | Value |
|----------|-------|
| **Signature** | `["ApplyUndoActions", undoActions]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:339` |

**Description**: Applies undo actions in reversed order.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| undoActions | `DocAction[]` | Array of undo actions to apply in reverse | ✓ |

**TypeScript Type**:
```typescript
type ApplyUndoActions = ["ApplyUndoActions", DocAction[]];
```

**Examples**:

```typescript
// Apply undo actions
await grist.docApi.applyUserActions([[
  "ApplyUndoActions",
  [["RemoveRecord", "Table1", 1]]
]]);
```

---

### Calculate

| Property | Value |
|----------|-------|
| **Signature** | `["Calculate"]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:344` |

**Description**: A dummy action whose only purpose is to trigger calculation of any dirty cells.

**Parameters**: None

**TypeScript Type**:
```typescript
type Calculate = ["Calculate"];
```

**Examples**:

```typescript
// Force recalculation of dirty cells
await grist.docApi.applyUserActions([["Calculate"]]);
```

---

### UpdateCurrentTime

| Property | Value |
|----------|-------|
| **Signature** | `["UpdateCurrentTime"]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:352` |

**Description**: Triggers calculation of any cells that depend on the current time (e.g., `NOW()` function).

**Parameters**: None

**TypeScript Type**:
```typescript
type UpdateCurrentTime = ["UpdateCurrentTime"];
```

**Examples**:

```typescript
// Update time-dependent formulas
await grist.docApi.applyUserActions([["UpdateCurrentTime"]]);
```

---

### RespondToRequests

| Property | Value |
|----------|-------|
| **Signature** | `["RespondToRequests", responses, cachedKeys]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:360` |

**Description**: Reevaluates formulas which called the `REQUEST()` function using the now available responses.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| responses | `{ [key: string]: any }` | Dictionary of responses for REQUEST function calls | ✓ |
| cachedKeys | `string[]` | Keys for older requests stored in files | ✓ |

**TypeScript Type**:
```typescript
type RespondToRequests = ["RespondToRequests", { [key: string]: any }, string[]];
```

**Examples**:

```typescript
// Respond to REQUEST() function calls
await grist.docApi.applyUserActions([[
  "RespondToRequests",
  { "req1": { value: 42, deps: {} } },
  []
]]);
```

---

### RemoveStaleObjects

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveStaleObjects"]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1620` |

**Description**: Removes transform columns and temporary tables (e.g., from imports).

**Parameters**: None

**TypeScript Type**:
```typescript
type RemoveStaleObjects = ["RemoveStaleObjects"];
```

**Examples**:

```typescript
// Clean up after import
await grist.docApi.applyUserActions([["RemoveStaleObjects"]]);
```

---

## Record Operations

### AddRecord

| Property | Value |
|----------|-------|
| **Signature** | `["AddRecord", tableId, rowId, columnValues]` |
| **Returns** | `number` - The row ID of the added record |
| **Source** | `sandbox/grist/useractions.py:383` |

**Description**: Adds a single record to a table.

**Parameters**:

| Parameter | Type | Description | Required | Default |
|-----------|------|-------------|----------|---------|
| tableId | `string` | The ID of the table | ✓ | |
| rowId | `number \| null` | The row ID for the new record | ✓ | Use `null` for auto-assignment |
| columnValues | `{ [colId: string]: CellValue }` | Column values for the new record | ✓ | |

**TypeScript Type**:
```typescript
type AddRecord = ["AddRecord", string, number | null, { [colId: string]: CellValue }];
```

**Examples**:

```typescript
// Add record with auto-assigned ID
await grist.docApi.applyUserActions([[
  "AddRecord", "People", null, { Name: "Alice", Age: 30 }
]]);

// Add record with specific ID
await grist.docApi.applyUserActions([[
  "AddRecord", "People", 100, { Name: "Bob", Age: 25 }
]]);
```

---

### BulkAddRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkAddRecord", tableId, rowIds, columnValues]` |
| **Returns** | `number[]` - Array of row IDs of added records |
| **Source** | `sandbox/grist/useractions.py:389` |

**Description**: Adds multiple records to a table in bulk. More efficient than multiple `AddRecord` calls.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| rowIds | `(number \| null)[]` | Array of row IDs | ✓ | Use `null` for auto-assignment |
| columnValues | `{ [colId: string]: CellValue[] }` | Column values (arrays must match length of rowIds) | ✓ | All arrays same length |

**TypeScript Type**:
```typescript
type BulkAddRecord = ["BulkAddRecord", string, (number | null)[], BulkColValues];
```

**Examples**:

```typescript
// Bulk add records with auto IDs
await grist.docApi.applyUserActions([[
  "BulkAddRecord",
  "People",
  [null, null],
  {
    Name: ["Alice", "Bob"],
    Age: [30, 25]
  }
]]);

// Bulk add with specific IDs
await grist.docApi.applyUserActions([[
  "BulkAddRecord",
  "People",
  [100, 101],
  {
    Name: ["Charlie", "David"],
    Age: [35, 40]
  }
]]);
```

---

### ReplaceTableData

| Property | Value |
|----------|-------|
| **Signature** | `["ReplaceTableData", tableId, rowIds, columnValues]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:397` |

**Description**: Replaces all data in a table with the provided data. Existing records are removed.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| rowIds | `number[]` | Array of row IDs for the new data | ✓ |
| columnValues | `{ [colId: string]: CellValue[] }` | Column values (arrays must match length of rowIds) | ✓ |

**TypeScript Type**:
```typescript
type ReplaceTableData = ["ReplaceTableData", string, number[], BulkColValues];
```

**Examples**:

```typescript
// Replace all table data
await grist.docApi.applyUserActions([[
  "ReplaceTableData",
  "People",
  [1, 2],
  {
    Name: ["Alice", "Bob"],
    Age: [30, 25]
  }
]]);
```

---

### UpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["UpdateRecord", tableId, rowId, columnValues]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:557` |

**Description**: Updates a single record in a table.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| rowId | `number` | The row ID to update | ✓ |
| columnValues | `{ [colId: string]: CellValue }` | Column values to update | ✓ |

**TypeScript Type**:
```typescript
type UpdateRecord = ["UpdateRecord", string, number, { [colId: string]: CellValue }];
```

**Examples**:

```typescript
// Update single field
await grist.docApi.applyUserActions([[
  "UpdateRecord", "People", 1, { Name: "Alice Updated" }
]]);

// Update multiple fields
await grist.docApi.applyUserActions([[
  "UpdateRecord", "People", 1, { Name: "Alice", Age: 31 }
]]);
```

---

### BulkUpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkUpdateRecord", tableId, rowIds, columnValues]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:562` |

**Description**: Updates multiple records in a table in bulk. More efficient than multiple `UpdateRecord` calls.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| rowIds | `number[]` | Array of row IDs to update | ✓ | |
| columnValues | `{ [colId: string]: CellValue[] }` | Column values (arrays must match length of rowIds) | ✓ | All arrays same length |

**TypeScript Type**:
```typescript
type BulkUpdateRecord = ["BulkUpdateRecord", string, number[], BulkColValues];
```

**Examples**:

```typescript
// Bulk update records
await grist.docApi.applyUserActions([[
  "BulkUpdateRecord",
  "People",
  [1, 2],
  { Age: [31, 26] }
]]);
```

---

### BulkAddOrUpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkAddOrUpdateRecord", tableId, require, colValues, options]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1027` |

**Description**: Add or update ('upsert') records based on lookup criteria. For each record, if matching records are found based on `require` criteria, update them; otherwise add new records.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| require | `{ [colId: string]: CellValue[] }` | Lookup criteria (column values to match) | ✓ | Used for lookupRecords |
| colValues | `{ [colId: string]: CellValue[] }` | Values to set (add or update) | ✓ | |
| options | `UpsertOptions` | Upsert behavior options | ✓ | See options below |

**UpsertOptions**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| onMany | `"first" \| "all" \| "none"` | `"first"` | Which records to update when multiple match |
| update | `boolean` | `true` | Whether to allow updating existing records |
| add | `boolean` | `true` | Whether to allow adding new records |
| allowEmptyRequire | `boolean` | `false` | Whether to allow empty require dict (matches all records) |

**TypeScript Type**:
```typescript
interface UpsertOptions {
  onMany?: "first" | "all" | "none";
  update?: boolean;
  add?: boolean;
  allowEmptyRequire?: boolean;
}

type BulkAddOrUpdateRecord = [
  "BulkAddOrUpdateRecord",
  string,
  BulkColValues,
  BulkColValues,
  UpsertOptions
];
```

**Examples**:

```typescript
// Simple upsert by email
await grist.docApi.applyUserActions([[
  "BulkAddOrUpdateRecord",
  "Users",
  { Email: ["alice@example.com"] },
  { Name: ["Alice"], Status: ["active"] },
  {}
]]);

// Update only (don't add new records)
await grist.docApi.applyUserActions([[
  "BulkAddOrUpdateRecord",
  "Users",
  { Email: ["bob@example.com"] },
  { Status: ["inactive"] },
  { add: false }
]]);

// Add only (don't update existing)
await grist.docApi.applyUserActions([[
  "BulkAddOrUpdateRecord",
  "Users",
  { Email: ["charlie@example.com"] },
  { Name: ["Charlie"], Status: ["active"] },
  { update: false }
]]);

// Update all matching records
await grist.docApi.applyUserActions([[
  "BulkAddOrUpdateRecord",
  "Users",
  { Status: ["pending"] },
  { Status: ["active"], UpdatedAt: [Date.now()] },
  { onMany: "all", allowEmptyRequire: false }
]]);
```

---

### AddOrUpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["AddOrUpdateRecord", tableId, require, colValues, options]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1129` |

**Description**: Add or update ('upsert') a single record based on lookup criteria.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| require | `{ [colId: string]: CellValue }` | Lookup criteria (single values) | ✓ | |
| colValues | `{ [colId: string]: CellValue }` | Values to set (single values) | ✓ | |
| options | `UpsertOptions` | Upsert behavior options | ✓ | |

**TypeScript Type**:
```typescript
type AddOrUpdateRecord = [
  "AddOrUpdateRecord",
  string,
  { [colId: string]: CellValue },
  { [colId: string]: CellValue },
  UpsertOptions
];
```

**Examples**:

```typescript
// Upsert single record
await grist.docApi.applyUserActions([[
  "AddOrUpdateRecord",
  "Users",
  { Email: "alice@example.com" },
  { Name: "Alice", Status: "active" },
  {}
]]);
```

---

### RemoveRecord

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveRecord", tableId, rowId]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1178` |

**Description**: Removes a single record from a table.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| rowId | `number` | The row ID to remove | ✓ |

**TypeScript Type**:
```typescript
type RemoveRecord = ["RemoveRecord", string, number];
```

**Examples**:

```typescript
// Remove single record
await grist.docApi.applyUserActions([[
  "RemoveRecord", "People", 1
]]);
```

---

### BulkRemoveRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkRemoveRecord", tableId, rowIds]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1182` |

**Description**: Removes multiple records from a table in bulk. Also cleans up references to deleted rows in other tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | Cannot remove from summary tables |
| rowIds | `number[]` | Array of row IDs to remove | ✓ | |

**TypeScript Type**:
```typescript
type BulkRemoveRecord = ["BulkRemoveRecord", string, number[]];
```

**Examples**:

```typescript
// Bulk remove records
await grist.docApi.applyUserActions([[
  "BulkRemoveRecord", "People", [1, 2, 3]
]]);
```

---

## Column Operations

### AddColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddColumn", tableId, colId, colInfo]` |
| **Returns** | `{ colRef: number, colId: string }` |
| **Source** | `sandbox/grist/useractions.py:1454` |

**Description**: Adds a new column to a table. Automatically adds to raw data view and record card sections.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| colId | `string \| null` | The column ID | ✓ | Use `null` for auto-generation |
| colInfo | `ColInfo` | Column configuration | ✓ | See ColInfo below |

**ColInfo**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| type | `string` | `"Any"` (formula) or `"Text"` (data) | Column type (e.g., "Text", "Numeric", "Date", "Ref:TableName") |
| isFormula | `boolean` | `true` (or `false` for OnDemand tables) | Whether it's a formula column |
| formula | `string` | `""` | Formula text |
| widgetOptions | `string` | `""` | Widget options as JSON string |
| label | `string` | `colId` | Column label |
| rules | `any[]` | `[]` | Conditional style rules |
| recalcWhen | `number` | `0` | When to recalculate |
| recalcDeps | `any[]` | `[]` | Recalculation dependencies |
| visibleCol | `number` | `0` | Visible column reference |
| _position | `number` | - | Position in table |

**TypeScript Type**:
```typescript
interface ColInfo {
  type?: string;
  isFormula?: boolean;
  formula?: string;
  widgetOptions?: string;
  label?: string;
  rules?: any[];
  recalcWhen?: number;
  recalcDeps?: any[];
  visibleCol?: number;
  _position?: number;
}

type AddColumn = ["AddColumn", string, string | null, ColInfo];
```

**Examples**:

```typescript
// Add formula column with auto-generated ID
await grist.docApi.applyUserActions([[
  "AddColumn", "People", null, { formula: "$Age * 2" }
]]);

// Add data column with specific ID
await grist.docApi.applyUserActions([[
  "AddColumn", "People", "Email", {
    type: "Text",
    isFormula: false
  }
]]);

// Add column with label
await grist.docApi.applyUserActions([[
  "AddColumn", "People", "first_name", {
    label: "First Name",
    type: "Text",
    isFormula: false
  }
]]);

// Add reference column
await grist.docApi.applyUserActions([[
  "AddColumn", "Orders", "Customer", {
    type: "Ref:Customers",
    isFormula: false
  }
]]);
```

---

### AddHiddenColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddHiddenColumn", tableId, colId, colInfo]` |
| **Returns** | `{ colRef: number, colId: string }` |
| **Source** | `sandbox/grist/useractions.py:1508` |

**Description**: Adds a hidden column (not automatically added to view sections). Useful for helper columns.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| colId | `string \| null` | The column ID | ✓ |
| colInfo | `ColInfo` | Column configuration (same as AddColumn) | ✓ |

**TypeScript Type**:
```typescript
type AddHiddenColumn = ["AddHiddenColumn", string, string | null, ColInfo];
```

**Examples**:

```typescript
// Add hidden helper column
await grist.docApi.applyUserActions([[
  "AddHiddenColumn",
  "People",
  "gristHelper_Display",
  { formula: "$Name.upper()", isFormula: true }
]]);
```

---

### AddVisibleColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddVisibleColumn", tableId, colId, colInfo]` |
| **Returns** | `{ colRef: number, colId: string }` |
| **Source** | `sandbox/grist/useractions.py:1513` |

**Description**: Adds a column and makes it visible in all 'record' views (not just raw data).

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| colId | `string \| null` | The column ID | ✓ |
| colInfo | `ColInfo` | Column configuration (same as AddColumn) | ✓ |

**TypeScript Type**:
```typescript
type AddVisibleColumn = ["AddVisibleColumn", string, string | null, ColInfo];
```

**Examples**:

```typescript
// Add column to all record views
await grist.docApi.applyUserActions([[
  "AddVisibleColumn",
  "People",
  "Status",
  { type: "Text", isFormula: false }
]]);
```

---

### RemoveColumn

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveColumn", tableId, colId]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1582` |

**Description**: Removes a column from a table. Cannot remove group-by columns from summary tables.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| colId | `string` | The column ID to remove | ✓ |

**TypeScript Type**:
```typescript
type RemoveColumn = ["RemoveColumn", string, string];
```

**Examples**:

```typescript
// Remove column
await grist.docApi.applyUserActions([[
  "RemoveColumn", "People", "TempColumn"
]]);
```

---

### RenameColumn

| Property | Value |
|----------|-------|
| **Signature** | `["RenameColumn", tableId, oldColId, newColId]` |
| **Returns** | `string` - The actual new column ID (sanitized if needed) |
| **Source** | `sandbox/grist/useractions.py:1590` |

**Description**: Renames a column. The new ID will be sanitized to ensure validity.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| oldColId | `string` | The current column ID | ✓ |
| newColId | `string` | The new column ID | ✓ |

**TypeScript Type**:
```typescript
type RenameColumn = ["RenameColumn", string, string, string];
```

**Examples**:

```typescript
// Rename column
await grist.docApi.applyUserActions([[
  "RenameColumn", "People", "Name", "FullName"
]]);
```

---

### ModifyColumn

| Property | Value |
|----------|-------|
| **Signature** | `["ModifyColumn", tableId, colId, colInfo]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1656` |

**Description**: Modifies column properties. May trigger type conversion and data migration.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| colId | `string` | The column ID | ✓ | |
| colInfo | `Partial<ColInfo>` | Column properties to update | ✓ | Cannot modify `colId`, `id`, `parentId` |

**TypeScript Type**:
```typescript
type ModifyColumn = ["ModifyColumn", string, string, Partial<ColInfo>];
```

**Examples**:

```typescript
// Change column type
await grist.docApi.applyUserActions([[
  "ModifyColumn", "People", "Age", { type: "Numeric" }
]]);

// Convert to formula column
await grist.docApi.applyUserActions([[
  "ModifyColumn", "Orders", "Total", {
    isFormula: true,
    formula: "$Price * $Quantity"
  }
]]);

// Update existing formula
await grist.docApi.applyUserActions([[
  "ModifyColumn", "Products", "Discount", {
    formula: "$Price * 0.15"
  }
]]);
```

---

### SetDisplayFormula

| Property | Value |
|----------|-------|
| **Signature** | `["SetDisplayFormula", tableId, fieldRef, colRef, formula]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1598` |

**Description**: Sets a display formula for a field or column. Creates or updates a helper column with the formula.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| fieldRef | `number \| null` | The field reference | ✓ | Mutually exclusive with colRef |
| colRef | `number \| null` | The column reference | ✓ | Mutually exclusive with fieldRef |
| formula | `string` | The display formula | ✓ | |

**TypeScript Type**:
```typescript
type SetDisplayFormula = ["SetDisplayFormula", string, number | null, number | null, string];
```

**Examples**:

```typescript
// Set display formula for a field
await grist.docApi.applyUserActions([[
  "SetDisplayFormula", "People", 123, null, "$Name.upper()"
]]);

// Set display formula for a column
await grist.docApi.applyUserActions([[
  "SetDisplayFormula", "People", null, 456, "$Name.upper()"
]]);
```

---

### ConvertFromColumn

| Property | Value |
|----------|-------|
| **Signature** | `["ConvertFromColumn", tableId, srcColId, dstColId, type, widgetOptions, visibleColRef]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1748` |

**Description**: Converts column data from source to destination using external JS conversion logic.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table | ✓ |
| srcColId | `string` | Source column ID | ✓ |
| dstColId | `string` | Destination column ID | ✓ |
| type | `string` | Target type | ✓ |
| widgetOptions | `string` | Widget options JSON | ✓ |
| visibleColRef | `number` | Visible column reference | ✓ |

**TypeScript Type**:
```typescript
type ConvertFromColumn = ["ConvertFromColumn", string, string, string, string, string, number];
```

**Examples**:

```typescript
// Convert text column to date
await grist.docApi.applyUserActions([[
  "ConvertFromColumn",
  "Events",
  "DateStr",
  "DateParsed",
  "Date",
  "{}",
  0
]]);
```

---

### CopyFromColumn

| Property | Value |
|----------|-------|
| **Signature** | `["CopyFromColumn", tableId, srcColId, dstColId, widgetOptions]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1784` |

**Description**: Copies column schema and data from source to destination.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| srcColId | `string` | Source column ID | ✓ | |
| dstColId | `string` | Destination column ID | ✓ | |
| widgetOptions | `string \| null` | Widget options JSON | ✓ | Use `null` to copy source options |

**TypeScript Type**:
```typescript
type CopyFromColumn = ["CopyFromColumn", string, string, string, string | null];
```

**Examples**:

```typescript
// Copy column data and schema
await grist.docApi.applyUserActions([[
  "CopyFromColumn", "People", "OriginalName", "CopyOfName", null
]]);
```

---

### MaybeCopyDisplayFormula

| Property | Value |
|----------|-------|
| **Signature** | `["MaybeCopyDisplayFormula", srcColRef, dstColRef]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1850` |

**Description**: If source column has a displayCol set, creates an equivalent one for destination column.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| srcColRef | `number` | Source column reference | ✓ |
| dstColRef | `number` | Destination column reference | ✓ |

**TypeScript Type**:
```typescript
type MaybeCopyDisplayFormula = ["MaybeCopyDisplayFormula", number, number];
```

**Examples**:

```typescript
// Copy display formula if it exists
await grist.docApi.applyUserActions([[
  "MaybeCopyDisplayFormula", 123, 456
]]);
```

---

### RenameChoices

| Property | Value |
|----------|-------|
| **Signature** | `["RenameChoices", tableId, colId, renames]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1865` |

**Description**: Updates the data in a Choice/ChoiceList column to reflect new choice names. Also updates filters. Does not modify widgetOptions.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| colId | `string` | The column ID | ✓ | Must be Choice or ChoiceList type |
| renames | `{ [oldName: string]: string }` | Mapping of old to new choice names | ✓ | |

**TypeScript Type**:
```typescript
type RenameChoices = ["RenameChoices", string, string, { [oldName: string]: string }];
```

**Examples**:

```typescript
// Rename choices in a Choice column
await grist.docApi.applyUserActions([[
  "RenameChoices",
  "Tasks",
  "Status",
  {
    "Todo": "To Do",
    "Inprogress": "In Progress",
    "Done": "Complete"
  }
]]);
```

---

### AddReverseColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddReverseColumn", tableId, colId]` |
| **Returns** | `{ colRef: number, colId: string }` |
| **Source** | `sandbox/grist/useractions.py:1941` |

**Description**: Adds a reverse reference column, creating a two-way binding between Ref/RefList columns. Updates to either column will update the other.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table containing the reference column | ✓ | |
| colId | `string` | The column ID of the reference column | ✓ | Must be Ref or RefList type |

**TypeScript Type**:
```typescript
type AddReverseColumn = ["AddReverseColumn", string, string];
```

**Examples**:

```typescript
// Add reverse reference (typically creates RefList)
await grist.docApi.applyUserActions([[
  "AddReverseColumn", "Orders", "Customer"
]]);
// If Orders.Customer is Ref:Customers, this creates
// Customers.Orders as RefList:Orders
```

---

### AddEmptyRule

| Property | Value |
|----------|-------|
| **Signature** | `["AddEmptyRule", tableId, fieldRef, colRef]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:1907` |

**Description**: Adds an empty conditional style rule to a field, column, or raw view section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | Required |
| fieldRef | `number \| null` | Field reference | ✓ | For field-level rule |
| colRef | `number \| null` | Column reference | ✓ | For column-level rule |

**TypeScript Type**:
```typescript
type AddEmptyRule = ["AddEmptyRule", string, number | null, number | null];
```

**Examples**:

```typescript
// Add empty rule to a field
await grist.docApi.applyUserActions([[
  "AddEmptyRule", "People", 123, null
]]);

// Add empty rule to a column
await grist.docApi.applyUserActions([[
  "AddEmptyRule", "People", null, 456
]]);
```

---

## Table Operations

### AddEmptyTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddEmptyTable", tableId]` |
| **Returns** | `{ id: number, table_id: string, columns: string[], views: any[] }` |
| **Source** | `sandbox/grist/useractions.py:2007` |

**Description**: Adds an empty table with three default formula columns (A, B, C) and a primary view with page.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The desired table ID | ✓ | May be adjusted for uniqueness |

**TypeScript Type**:
```typescript
type AddEmptyTable = ["AddEmptyTable", string];
```

**Examples**:

```typescript
// Create empty table with defaults
const result = await grist.docApi.applyUserActions([[
  "AddEmptyTable", "NewTable"
]]);
// Creates table with columns A, B, C and a primary view
```

---

### AddTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddTable", tableId, columns]` |
| **Returns** | `{ id: number, table_id: string, columns: string[], views: any[] }` |
| **Source** | `sandbox/grist/useractions.py:2017` |

**Description**: Adds a table with specified columns, including manual sort, primary view, raw section, and record card section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The desired table ID | ✓ | |
| columns | `ColInfoWithId[]` | Array of column configurations | ✓ | Each must have `id` field |

**TypeScript Type**:
```typescript
interface ColInfoWithId extends ColInfo {
  id: string;
}

type AddTable = ["AddTable", string, ColInfoWithId[]];
```

**Examples**:

```typescript
// Create table with specific columns
await grist.docApi.applyUserActions([[
  "AddTable",
  "People",
  [
    { id: "Name", isFormula: false, type: "Text" },
    { id: "Age", isFormula: false, type: "Int" },
    { id: "Email", isFormula: false, type: "Text" }
  ]
]]);
```

---

### AddRawTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddRawTable", tableId]` |
| **Returns** | `{ id: number, table_id: string, columns: string[] }` |
| **Source** | `sandbox/grist/useractions.py:2028` |

**Description**: Same as AddEmptyTable but does not create a primary view (no page). Only creates raw section and record card section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The desired table ID | ✓ | May be adjusted for uniqueness |

**TypeScript Type**:
```typescript
type AddRawTable = ["AddRawTable", string];
```

**Examples**:

```typescript
// Create hidden table (no primary view/page)
await grist.docApi.applyUserActions([[
  "AddRawTable", "TempImport"
]]);
```

---

### RemoveTable

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveTable", tableId]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:2123` |

**Description**: Removes a table and all associated metadata (columns, view sections, fields, etc.).

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| tableId | `string` | The ID of the table to remove | ✓ |

**TypeScript Type**:
```typescript
type RemoveTable = ["RemoveTable", string];
```

**Examples**:

```typescript
// Remove table
await grist.docApi.applyUserActions([[
  "RemoveTable", "OldTable"
]]);
```

---

### RenameTable

| Property | Value |
|----------|-------|
| **Signature** | `["RenameTable", oldTableId, newTableId]` |
| **Returns** | `string` - The actual new table ID (sanitized if needed) |
| **Source** | `sandbox/grist/useractions.py:2131` |

**Description**: Renames a table. Cannot rename summary tables directly.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| oldTableId | `string` | Current table ID | ✓ | |
| newTableId | `string` | New table ID | ✓ | Will be sanitized if needed |

**TypeScript Type**:
```typescript
type RenameTable = ["RenameTable", string, string];
```

**Examples**:

```typescript
// Rename table
await grist.docApi.applyUserActions([[
  "RenameTable", "OldName", "NewName"
]]);
```

---

### DuplicateTable

| Property | Value |
|----------|-------|
| **Signature** | `["DuplicateTable", existingTableId, newTableId, includeData]` |
| **Returns** | `{ id: number, table_id: string, raw_section_id: number }` |
| **Source** | `sandbox/grist/useractions.py:2140` |

**Description**: Duplicates a table structure (columns, settings, conditional styles) and optionally its data. Cannot duplicate hidden tables or summary tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| existingTableId | `string` | The table ID to duplicate | ✓ | Cannot be hidden or summary table |
| newTableId | `string` | The new table ID | ✓ | |
| includeData | `boolean` | Whether to copy data | | Default: `false` |

**TypeScript Type**:
```typescript
type DuplicateTable = ["DuplicateTable", string, string, boolean];
```

**Examples**:

```typescript
// Duplicate structure only
await grist.docApi.applyUserActions([[
  "DuplicateTable", "People", "People_Copy", false
]]);

// Duplicate with data
await grist.docApi.applyUserActions([[
  "DuplicateTable", "People", "People_Backup", true
]]);
```

---

### GenImporterView

| Property | Value |
|----------|-------|
| **Signature** | `["GenImporterView", sourceTableId, destTableId, transformRule, options]` |
| **Returns** | Result from import_actions.DoGenImporterView |
| **Source** | `sandbox/grist/useractions.py:2509` |

**Description**: Generates an importer view for importing data. Typically used internally during import workflows.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| sourceTableId | `string` | Source table ID | ✓ |
| destTableId | `string` | Destination table ID | ✓ |
| transformRule | `object \| null` | Transformation rules | ✓ |
| options | `object \| null` | Import options | ✓ |

**TypeScript Type**:
```typescript
type GenImporterView = ["GenImporterView", string, string, object | null, object | null];
```

**Examples**:

```typescript
// Generate import view
await grist.docApi.applyUserActions([[
  "GenImporterView", "ImportSource", "FinalTable", null, null
]]);
```

---

## View Operations

### CreateViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["CreateViewSection", tableRef, viewRef, sectionType, groupbyColRefs, tableId]` |
| **Returns** | `{ tableRef: number, viewRef: number, sectionRef: number }` |
| **Source** | `sandbox/grist/useractions.py:2302` |

**Description**: Creates a new view section. Can create new table and/or view if needed. Creates summary section if groupbyColRefs provided.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableRef | `number` | Table reference | ✓ | Use `0` to create new table |
| viewRef | `number` | View reference | ✓ | Use `0` to create new view |
| sectionType | `string` | Section type | ✓ | `"record"`, `"detail"`, `"chart"`, `"form"`, etc. |
| groupbyColRefs | `number[] \| null` | Column references for grouping | ✓ | `null` for plain section |
| tableId | `string` | Table ID (for new table) | ✓ | Used only if tableRef is `0` |

**TypeScript Type**:
```typescript
type CreateViewSection = [
  "CreateViewSection",
  number,
  number,
  string,
  number[] | null,
  string
];
```

**Examples**:

```typescript
// Add card view to existing table/view
await grist.docApi.applyUserActions([[
  "CreateViewSection", 123, 456, "detail", null, ""
]]);

// Create summary section grouped by columns
await grist.docApi.applyUserActions([[
  "CreateViewSection", 123, 456, "record", [789, 790], ""
]]);

// Create new table and view
await grist.docApi.applyUserActions([[
  "CreateViewSection", 0, 0, "record", null, "NewTable"
]]);
```

---

### UpdateSummaryViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["UpdateSummaryViewSection", sectionRef, groupbyColRefs]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:2355` |

**Description**: Updates a summary section to be grouped by a different set of columns. Updates fields to reference similar columns in a different summary table.

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| sectionRef | `number` | Section reference | ✓ |
| groupbyColRefs | `number[]` | Column references for grouping | ✓ |

**TypeScript Type**:
```typescript
type UpdateSummaryViewSection = ["UpdateSummaryViewSection", number, number[]];
```

**Examples**:

```typescript
// Update summary grouping columns
await grist.docApi.applyUserActions([[
  "UpdateSummaryViewSection", 123, [456, 789]
]]);
```

---

### DetachSummaryViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["DetachSummaryViewSection", sectionRef]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:2366` |

**Description**: Creates a real table equivalent to the given summary section, and updates the section to show the new table instead. Cannot detach a non-summary section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| sectionRef | `number` | Section reference | ✓ | Must be a summary section |

**TypeScript Type**:
```typescript
type DetachSummaryViewSection = ["DetachSummaryViewSection", number];
```

**Examples**:

```typescript
// Convert summary view to regular table
await grist.docApi.applyUserActions([[
  "DetachSummaryViewSection", 123
]]);
```

---

### AddView

| Property | Value |
|----------|-------|
| **Signature** | `["AddView", tableId, viewType, name]` |
| **Returns** | `{ id: number, sections: number[] }` |
| **Source** | `sandbox/grist/useractions.py:2382` |

**Description**: Creates a new view and includes it in the tab bar and pages tree.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The table ID | ✓ | |
| viewType | `string` | View type | ✓ | `"raw_data"` or `"empty"` |
| name | `string` | View name | ✓ | |

**TypeScript Type**:
```typescript
type AddView = ["AddView", string, string, string];
```

**Examples**:

```typescript
// Add raw data view
await grist.docApi.applyUserActions([[
  "AddView", "People", "raw_data", "People - Raw Data"
]]);

// Add empty view
await grist.docApi.applyUserActions([[
  "AddView", "People", "empty", "Custom View"
]]);
```

---

### RemoveView

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveView", viewId]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:2426` |

**Description**: **DEPRECATED** - Removes a view and all associated metadata.

**Use instead**: `["RemoveRecord", "_grist_Views", viewId]`

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| viewId | `number` | The view ID to remove | ✓ |

**TypeScript Type**:
```typescript
type RemoveView = ["RemoveView", number];  // DEPRECATED
```

**Examples**:

```typescript
// DEPRECATED - Use RemoveRecord instead
await grist.docApi.applyUserActions([[
  "RemoveRecord", "_grist_Views", 123
]]);
```

---

### AddViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["AddViewSection", title, viewSectionType, viewRowId, tableId]` |
| **Returns** | `{ id: number }` |
| **Source** | `sandbox/grist/useractions.py:2440` |

**Description**: **DEPRECATED** - Creates records for a view section.

**Use instead**: `CreateViewSection`

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| title | `string` | Section title | ✓ |
| viewSectionType | `string` | Section type | ✓ |
| viewRowId | `number` | View row ID | ✓ |
| tableId | `string` | Table ID | ✓ |

**TypeScript Type**:
```typescript
type AddViewSection = ["AddViewSection", string, string, number, string];  // DEPRECATED
```

---

### RemoveViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveViewSection", viewSectionId]` |
| **Returns** | `void` |
| **Source** | `sandbox/grist/useractions.py:2455` |

**Description**: **DEPRECATED** - Removes a view section.

**Use instead**: `["RemoveRecord", "_grist_Views_section", viewSectionId]`

**Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| viewSectionId | `number` | View section ID to remove | ✓ |

**TypeScript Type**:
```typescript
type RemoveViewSection = ["RemoveViewSection", number];  // DEPRECATED
```

---

## Type Definitions

### Core Types

```typescript
/**
 * A cell value can be any JSON-serializable value
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
 * Column information for creating/modifying columns
 */
interface ColInfo {
  type?: string;          // "Text", "Numeric", "Date", "Ref:TableName", etc.
  isFormula?: boolean;    // true for formula columns, false for data columns
  formula?: string;       // Formula text (e.g., "$Price * $Quantity")
  widgetOptions?: string; // JSON string of widget options
  label?: string;         // Display label
  rules?: any[];          // Conditional style rules
  recalcWhen?: number;    // When to recalculate
  recalcDeps?: any[];     // Recalculation dependencies
  visibleCol?: number;    // Visible column reference
  _position?: number;     // Position in table
}

/**
 * Column information with required id field (for AddTable)
 */
interface ColInfoWithId extends ColInfo {
  id: string;
}

/**
 * Options for upsert operations
 */
interface UpsertOptions {
  onMany?: "first" | "all" | "none";  // Which records to update when multiple match
  update?: boolean;                    // Allow updating existing records (default: true)
  add?: boolean;                       // Allow adding new records (default: true)
  allowEmptyRequire?: boolean;         // Allow empty require dict (default: false)
}

/**
 * Document actions (lower-level actions from sandbox)
 */
type DocAction =
  | AddRecord
  | BulkAddRecord
  | UpdateRecord
  | BulkUpdateRecord
  | RemoveRecord
  | BulkRemoveRecord
  | ReplaceTableData
  | AddColumn
  | RemoveColumn
  | RenameColumn
  | ModifyColumn
  | AddTable
  | RemoveTable
  | RenameTable;

/**
 * User actions (higher-level actions)
 */
type UserAction =
  | InitNewDoc
  | ApplyDocActions
  | ApplyUndoActions
  | Calculate
  | UpdateCurrentTime
  | RespondToRequests
  | AddRecord
  | BulkAddRecord
  | ReplaceTableData
  | UpdateRecord
  | BulkUpdateRecord
  | BulkAddOrUpdateRecord
  | AddOrUpdateRecord
  | RemoveRecord
  | BulkRemoveRecord
  | AddColumn
  | AddHiddenColumn
  | AddVisibleColumn
  | RemoveColumn
  | RenameColumn
  | ModifyColumn
  | SetDisplayFormula
  | ConvertFromColumn
  | CopyFromColumn
  | MaybeCopyDisplayFormula
  | RenameChoices
  | AddReverseColumn
  | AddEmptyRule
  | RemoveStaleObjects
  | AddEmptyTable
  | AddTable
  | AddRawTable
  | RemoveTable
  | RenameTable
  | DuplicateTable
  | GenImporterView
  | CreateViewSection
  | UpdateSummaryViewSection
  | DetachSummaryViewSection
  | AddView
  | RemoveView
  | AddViewSection
  | RemoveViewSection;
```

---

## Action Categories Summary

| Category | Count | Actions |
|----------|-------|---------|
| **Document** | 7 | InitNewDoc, ApplyDocActions, ApplyUndoActions, Calculate, UpdateCurrentTime, RespondToRequests, RemoveStaleObjects |
| **Records** | 10 | AddRecord, BulkAddRecord, ReplaceTableData, UpdateRecord, BulkUpdateRecord, BulkAddOrUpdateRecord, AddOrUpdateRecord, RemoveRecord, BulkRemoveRecord |
| **Columns** | 13 | AddColumn, AddHiddenColumn, AddVisibleColumn, RemoveColumn, RenameColumn, ModifyColumn, SetDisplayFormula, ConvertFromColumn, CopyFromColumn, MaybeCopyDisplayFormula, RenameChoices, AddReverseColumn, AddEmptyRule |
| **Tables** | 7 | AddEmptyTable, AddTable, AddRawTable, RemoveTable, RenameTable, DuplicateTable, GenImporterView |
| **Views** | 6 | CreateViewSection, UpdateSummaryViewSection, DetachSummaryViewSection, AddView, RemoveView (deprecated), AddViewSection (deprecated), RemoveViewSection (deprecated) |

---

## Usage Notes

### Applying Actions

All actions can be applied using the Grist Document API:

```typescript
// Single action
await grist.docApi.applyUserActions([
  ["AddRecord", "Table1", null, { Name: "Alice" }]
]);

// Multiple actions in one call
await grist.docApi.applyUserActions([
  ["AddRecord", "Table1", null, { Name: "Alice" }],
  ["AddRecord", "Table1", null, { Name: "Bob" }],
  ["UpdateRecord", "Table1", 1, { Status: "active" }]
]);
```

### System Actions

The following actions are typically performed automatically by the system:
- `Calculate` - Triggered when document loads or formulas need recalculation
- `UpdateCurrentTime` - Called at regular intervals to update time-dependent formulas
- `RespondToRequests` - Part of REQUEST() function workflow
- `RemoveStaleObjects` - Called at document shutdown

### Special Restrictions

- **Summary tables**: Cannot add non-formula columns, cannot remove records directly, cannot remove group-by columns
- **Metadata tables**: Have special handling (tables prefixed with `_grist_`)
- **Hidden tables**: Cannot be duplicated
- **Transform columns**: Automatically cleaned up by RemoveStaleObjects

### Column Types

Common column types:
- `"Text"` - Text values
- `"Numeric"` - Numbers
- `"Int"` - Integers
- `"Bool"` - Booleans
- `"Date"` - Dates
- `"DateTime"` - Date and time
- `"Ref:TableName"` - Reference to another table
- `"RefList:TableName"` - List of references
- `"Choice"` - Single choice from a list
- `"ChoiceList"` - Multiple choices
- `"Attachments"` - File attachments
- `"Any"` - Any type (default for formula columns)

---

**Last Updated**: 2025-11-15
**Source**: `sandbox/grist/useractions.py` (Python implementation)
**Conventions**: TypeScript naming and type syntax
