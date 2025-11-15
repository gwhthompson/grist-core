# Grist Actions Reference

Comprehensive reference for all Grist user actions. These actions represent the API for modifying Grist documents programmatically.

**Total Actions**: 43 | **Source**: `sandbox/grist/useractions.py`

> **Note**: While actions are implemented in Python, this reference uses TypeScript conventions for better integration with the Grist TypeScript/JavaScript codebase. All actions can be applied via `GristDocAPI.applyUserActions()`.

---

## Table of Contents

- [Type Definitions](#type-definitions)
- [Document Actions](#document-actions)
- [Record Operations](#record-operations)
- [Column Operations](#column-operations)
- [Table Operations](#table-operations)
- [View Operations](#view-operations)
- [Usage Notes](#usage-notes)

---

## Type Definitions

### Core Types

```typescript
/**
 * A cell value can be any JSON-serializable value.
 * Arrays starting with a string are used for special types (e.g., ['D', timestamp] for dates).
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
 * Options for upsert operations (BulkAddOrUpdateRecord, AddOrUpdateRecord)
 */
interface UpsertOptions {
  onMany?: "first" | "all" | "none";  // Which records to update when multiple match
  update?: boolean;                    // Allow updating existing records (default: true)
  add?: boolean;                       // Allow adding new records (default: true)
  allowEmptyRequire?: boolean;         // Allow empty require dict (default: false)
}

/**
 * Result type for actions that add columns
 */
interface AddColumnResult {
  colRef: number;
  colId: string;
}

/**
 * Result type for AddEmptyTable and AddTable
 */
interface AddTableResult {
  id: number;
  table_id: string;
  columns: string[];
  views?: any[];
}

/**
 * Result type for DuplicateTable
 */
interface DuplicateTableResult {
  id: number;
  table_id: string;
  raw_section_id: number;
}

/**
 * Result type for CreateViewSection
 */
interface CreateViewSectionResult {
  tableRef: number;
  viewRef: number;
  sectionRef: number;
}

/**
 * Result type for AddView
 */
interface AddViewResult {
  id: number;
  sections: number[];
}

/**
 * Result type for AddViewSection (deprecated)
 */
interface AddViewSectionResult {
  id: number;
}
```

### Action Type Definitions

```typescript
// Document Actions
type InitNewDoc = ["InitNewDoc"];

type ApplyDocActions = ["ApplyDocActions", DocAction[]];

type ApplyUndoActions = ["ApplyUndoActions", DocAction[]];

type Calculate = ["Calculate"];

type UpdateCurrentTime = ["UpdateCurrentTime"];

type RespondToRequests = ["RespondToRequests", { [key: string]: any }, string[]];

type RemoveStaleObjects = ["RemoveStaleObjects"];

// Record Operations
type AddRecord = ["AddRecord", string, number | null, ColValues];

type BulkAddRecord = ["BulkAddRecord", string, (number | null)[], BulkColValues];

type ReplaceTableData = ["ReplaceTableData", string, number[], BulkColValues];

type UpdateRecord = ["UpdateRecord", string, number, ColValues];

type BulkUpdateRecord = ["BulkUpdateRecord", string, number[], BulkColValues];

type BulkAddOrUpdateRecord = [
  "BulkAddOrUpdateRecord",
  string,
  BulkColValues,
  BulkColValues,
  UpsertOptions
];

type AddOrUpdateRecord = [
  "AddOrUpdateRecord",
  string,
  ColValues,
  ColValues,
  UpsertOptions
];

type RemoveRecord = ["RemoveRecord", string, number];

type BulkRemoveRecord = ["BulkRemoveRecord", string, number[]];

// Column Operations
type AddColumn = ["AddColumn", string, string | null, ColInfo];

type AddHiddenColumn = ["AddHiddenColumn", string, string | null, ColInfo];

type AddVisibleColumn = ["AddVisibleColumn", string, string | null, ColInfo];

type RemoveColumn = ["RemoveColumn", string, string];

type RenameColumn = ["RenameColumn", string, string, string];

type ModifyColumn = ["ModifyColumn", string, string, Partial<ColInfo>];

type SetDisplayFormula = ["SetDisplayFormula", string, number | null, number | null, string];

type ConvertFromColumn = ["ConvertFromColumn", string, string, string, string, string, number];

type CopyFromColumn = ["CopyFromColumn", string, string, string, string | null];

type MaybeCopyDisplayFormula = ["MaybeCopyDisplayFormula", number, number];

type RenameChoices = ["RenameChoices", string, string, { [oldName: string]: string }];

type AddReverseColumn = ["AddReverseColumn", string, string];

type AddEmptyRule = ["AddEmptyRule", string, number | null, number | null];

// Table Operations
type AddEmptyTable = ["AddEmptyTable", string];

type AddTable = ["AddTable", string, ColInfoWithId[]];

type AddRawTable = ["AddRawTable", string];

type RemoveTable = ["RemoveTable", string];

type RenameTable = ["RenameTable", string, string];

type DuplicateTable = ["DuplicateTable", string, string, boolean];

type GenImporterView = ["GenImporterView", string, string, object | null, object | null];

// View Operations
type CreateViewSection = [
  "CreateViewSection",
  number,
  number,
  string,
  number[] | null,
  string
];

type UpdateSummaryViewSection = ["UpdateSummaryViewSection", number, number[]];

type DetachSummaryViewSection = ["DetachSummaryViewSection", number];

type AddView = ["AddView", string, string, string];

type RemoveView = ["RemoveView", number];  // DEPRECATED

type AddViewSection = ["AddViewSection", string, string, number, string];  // DEPRECATED

type RemoveViewSection = ["RemoveViewSection", number];  // DEPRECATED

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
 * User actions (higher-level actions that can be applied via applyUserActions)
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
| columnValues | `ColValues` | Column values for the new record | ✓ | |

**TypeScript Type**:
```typescript
type AddRecord = ["AddRecord", string, number | null, ColValues];
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
| columnValues | `BulkColValues` | Column values (arrays must match length of rowIds) | ✓ | All arrays same length |

**TypeScript Type**:
```typescript
type BulkAddRecord = ["BulkAddRecord", string, (number | null)[], BulkColValues];
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
| columnValues | `BulkColValues` | Column values (arrays must match length of rowIds) | ✓ |

**TypeScript Type**:
```typescript
type ReplaceTableData = ["ReplaceTableData", string, number[], BulkColValues];
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
| columnValues | `ColValues` | Column values to update | ✓ |

**TypeScript Type**:
```typescript
type UpdateRecord = ["UpdateRecord", string, number, ColValues];
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
| columnValues | `BulkColValues` | Column values (arrays must match length of rowIds) | ✓ | All arrays same length |

**TypeScript Type**:
```typescript
type BulkUpdateRecord = ["BulkUpdateRecord", string, number[], BulkColValues];
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
| require | `BulkColValues` | Lookup criteria (column values to match) | ✓ | Used for lookupRecords |
| colValues | `BulkColValues` | Values to set (add or update) | ✓ | |
| options | `UpsertOptions` | Upsert behavior options | ✓ | See UpsertOptions type |

**UpsertOptions**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| onMany | `"first" \| "all" \| "none"` | `"first"` | Which records to update when multiple match |
| update | `boolean` | `true` | Whether to allow updating existing records |
| add | `boolean` | `true` | Whether to allow adding new records |
| allowEmptyRequire | `boolean` | `false` | Whether to allow empty require dict (matches all records) |

**TypeScript Type**:
```typescript
type BulkAddOrUpdateRecord = [
  "BulkAddOrUpdateRecord",
  string,
  BulkColValues,
  BulkColValues,
  UpsertOptions
];
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
| require | `ColValues` | Lookup criteria (single values) | ✓ | |
| colValues | `ColValues` | Values to set (single values) | ✓ | |
| options | `UpsertOptions` | Upsert behavior options | ✓ | |

**TypeScript Type**:
```typescript
type AddOrUpdateRecord = [
  "AddOrUpdateRecord",
  string,
  ColValues,
  ColValues,
  UpsertOptions
];
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

---

## Column Operations

### AddColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddColumn", tableId, colId, colInfo]` |
| **Returns** | `AddColumnResult` - Object with `colRef` and `colId` |
| **Source** | `sandbox/grist/useractions.py:1454` |

**Description**: Adds a new column to a table. Automatically adds to raw data view and record card sections.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The ID of the table | ✓ | |
| colId | `string \| null` | The column ID | ✓ | Use `null` for auto-generation |
| colInfo | `ColInfo` | Column configuration | ✓ | See ColInfo type definition |

**TypeScript Type**:
```typescript
type AddColumn = ["AddColumn", string, string | null, ColInfo];
```

---

### AddHiddenColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddHiddenColumn", tableId, colId, colInfo]` |
| **Returns** | `AddColumnResult` - Object with `colRef` and `colId` |
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

---

### AddVisibleColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddVisibleColumn", tableId, colId, colInfo]` |
| **Returns** | `AddColumnResult` - Object with `colRef` and `colId` |
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

---

### AddReverseColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddReverseColumn", tableId, colId]` |
| **Returns** | `AddColumnResult` - Object with `colRef` and `colId` |
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

---

## Table Operations

### AddEmptyTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddEmptyTable", tableId]` |
| **Returns** | `AddTableResult` |
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

---

### AddTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddTable", tableId, columns]` |
| **Returns** | `AddTableResult` |
| **Source** | `sandbox/grist/useractions.py:2017` |

**Description**: Adds a table with specified columns, including manual sort, primary view, raw section, and record card section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| tableId | `string` | The desired table ID | ✓ | |
| columns | `ColInfoWithId[]` | Array of column configurations | ✓ | Each must have `id` field |

**TypeScript Type**:
```typescript
type AddTable = ["AddTable", string, ColInfoWithId[]];
```

---

### AddRawTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddRawTable", tableId]` |
| **Returns** | `Omit<AddTableResult, "views">` |
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

---

### DuplicateTable

| Property | Value |
|----------|-------|
| **Signature** | `["DuplicateTable", existingTableId, newTableId, includeData]` |
| **Returns** | `DuplicateTableResult` |
| **Source** | `sandbox/grist/useractions.py:2140` |

**Description**: Duplicates a table structure (columns, settings, conditional styles) and optionally its data. Cannot duplicate hidden tables or summary tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| existingTableId | `string` | The table ID to duplicate | ✓ | Cannot be hidden or summary table |
| newTableId | `string` | The new table ID | ✓ | |
| includeData | `boolean` | Whether to copy data | ✓ | Default: `false` |

**TypeScript Type**:
```typescript
type DuplicateTable = ["DuplicateTable", string, string, boolean];
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

---

## View Operations

### CreateViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["CreateViewSection", tableRef, viewRef, sectionType, groupbyColRefs, tableId]` |
| **Returns** | `CreateViewSectionResult` |
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

---

### AddView

| Property | Value |
|----------|-------|
| **Signature** | `["AddView", tableId, viewType, name]` |
| **Returns** | `AddViewResult` |
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

---

### AddViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["AddViewSection", title, viewSectionType, viewRowId, tableId]` |
| **Returns** | `AddViewSectionResult` |
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

### Action Categories Summary

| Category | Count | Actions |
|----------|-------|---------|
| **Document** | 7 | InitNewDoc, ApplyDocActions, ApplyUndoActions, Calculate, UpdateCurrentTime, RespondToRequests, RemoveStaleObjects |
| **Records** | 10 | AddRecord, BulkAddRecord, ReplaceTableData, UpdateRecord, BulkUpdateRecord, BulkAddOrUpdateRecord, AddOrUpdateRecord, RemoveRecord, BulkRemoveRecord |
| **Columns** | 13 | AddColumn, AddHiddenColumn, AddVisibleColumn, RemoveColumn, RenameColumn, ModifyColumn, SetDisplayFormula, ConvertFromColumn, CopyFromColumn, MaybeCopyDisplayFormula, RenameChoices, AddReverseColumn, AddEmptyRule |
| **Tables** | 7 | AddEmptyTable, AddTable, AddRawTable, RemoveTable, RenameTable, DuplicateTable, GenImporterView |
| **Views** | 6 | CreateViewSection, UpdateSummaryViewSection, DetachSummaryViewSection, AddView, RemoveView (deprecated), AddViewSection (deprecated), RemoveViewSection (deprecated) |

---

**Last Updated**: 2025-11-15
**Source**: `sandbox/grist/useractions.py` (Python implementation)
**Conventions**: TypeScript naming and type syntax
