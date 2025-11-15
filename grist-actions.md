# Grist UserActions Reference

## Overview

### What are UserActions?

UserActions are the primary way to programmatically modify Grist documents through the API. They represent high-level operations like adding tables, modifying columns, or updating records. Each UserAction is an array with the action name as the first element, followed by parameters specific to that action.

### The /apply Endpoint

**Endpoint**: `POST /api/docs/:docId/apply`

**Critical Format Requirements**:
- **Send the actions array directly** in the request body
- ❌ **WRONG**: `{"actions": [['AddTable', ...]]}`
- ✅ **CORRECT**: `[['AddTable', 'MyTable', [...]]]`

The endpoint accepts either:
- A single UserAction: `['AddTable', 'MyTable', [...]]`
- An array of UserActions: `[['AddTable', 'MyTable', [...]], ['BulkAddRecord', 'MyTable', ...]]`

**Query Parameters**:
- `noparse=1`: Skip automatic string parsing (defaults to parsing strings as dates, numbers, etc.)

**Implementation**: `/home/user/grist-core/app/server/lib/DocApi.ts:258-261`

### UserAction Format

All UserActions follow this structure:
```typescript
[ActionName: string, ...parameters: any[]]
```

Example:
```typescript
['AddColumn', 'People', 'age', {type: 'Numeric', isFormula: false}]
```

### Column-Oriented Data Format

Bulk operations (BulkAddRecord, BulkUpdateRecord) use a **column-oriented** format:

```typescript
{
  colId1: [value1, value2, value3],
  colId2: [value1, value2, value3]
}
```

**NOT row-oriented** (this won't work):
```typescript
// ❌ WRONG
[
  {colId1: value1, colId2: value1},
  {colId1: value2, colId2: value2}
]
```

---

## Table Actions

### AddTable

Creates a new table with columns and associated views.

**Signature**: `['AddTable', tableId, columns]`

**Parameters**:
- `tableId` (string): Table identifier. Must be valid Python identifier (no spaces, no keywords like 'class', 'import', etc.)
- `columns` (array): Array of column definitions

**Column Definition Structure**:
```typescript
{
  id?: string,           // Column ID (optional, auto-generated if null)
  type?: string,         // Column type (default: 'Text' for data cols, 'Any' for formula cols)
  isFormula?: boolean,   // Default: true if formula provided, false otherwise
  formula?: string,      // Python expression (default: '')
  label?: string,        // Display label (default: same as id)
  widgetOptions?: string // JSON string for widget configuration
}
```

**Examples**:

Basic table with text columns:
```typescript
['AddTable', 'People', [
  {id: 'name', type: 'Text', isFormula: false},
  {id: 'email', type: 'Text', isFormula: false}
]]
```

Table with formula column:
```typescript
['AddTable', 'Orders', [
  {id: 'quantity', type: 'Numeric', isFormula: false},
  {id: 'price', type: 'Numeric', isFormula: false},
  {id: 'total', type: 'Numeric', isFormula: true, formula: '$quantity * $price'}
]]
```

Minimal column definition (auto-generates IDs):
```typescript
['AddTable', 'Tasks', [
  {id: null, isFormula: true},
  {id: null, isFormula: true},
  {id: null, isFormula: true}
]]
```

**Common Errors**:
- ❌ Using Python keywords: `['AddTable', 'class', ...]` → Use `Classes` or `Class_`
- ❌ Spaces in table ID: `['AddTable', 'My Table', ...]` → Use `My_Table` or `MyTable`
- ❌ Missing columns array: `['AddTable', 'People']` → Must provide columns array

### RemoveTable

Removes a table and all associated data, views, and columns.

**Signature**: `['RemoveTable', tableId]`

**Parameters**:
- `tableId` (string): Table to remove

**Example**:
```typescript
['RemoveTable', 'OldData']
```

**Common Errors**:
- ❌ Cannot remove system tables starting with `_grist_`

### RenameTable

Renames a table and updates all references in formulas.

**Signature**: `['RenameTable', oldTableId, newTableId]`

**Parameters**:
- `oldTableId` (string): Current table ID
- `newTableId` (string): New table ID (must be valid Python identifier)

**Example**:
```typescript
['RenameTable', 'Person', 'People']
```

**Common Errors**:
- ❌ New ID is Python keyword: `['RenameTable', 'Data', 'class']`
- ❌ Table doesn't exist: Returns error

### AddEmptyTable

Creates a table with 3 empty formula columns (A, B, C).

**Signature**: `['AddEmptyTable', tableId]`

**Example**:
```typescript
['AddEmptyTable', 'NewTable']
```

### AddRawTable

Creates a table without a primary view (no page created).

**Signature**: `['AddRawTable', tableId]`

**Example**:
```typescript
['AddRawTable', 'DataImport']
```

---

## Record Actions

### BulkAddRecord

Adds multiple records to a table in a single operation.

**Signature**: `['BulkAddRecord', tableId, rowIds, colValues]`

**Parameters**:
- `tableId` (string): Target table
- `rowIds` (array): Array of row IDs. Use `null` for auto-generation, or positive integers
- `colValues` (object): Column-oriented value dict

**Column Values Structure**:
```typescript
{
  columnId1: [val1, val2, val3, ...],
  columnId2: [val1, val2, val3, ...]
}
// All arrays must have the same length as rowIds
```

**Examples**:

Auto-generated row IDs:
```typescript
['BulkAddRecord', 'People', [null, null, null], {
  name: ['Alice', 'Bob', 'Charlie'],
  age: [30, 25, 35],
  email: ['alice@example.com', 'bob@example.com', 'charlie@example.com']
}]
```

Specific row IDs:
```typescript
['BulkAddRecord', 'Products', [100, 101, 102], {
  name: ['Widget', 'Gadget', 'Doohickey'],
  price: [9.99, 19.99, 14.99]
}]
```

Empty record:
```typescript
['BulkAddRecord', 'Tasks', [null], {
  title: ['New Task']
}]
```

**Common Errors**:
- ❌ Mismatched array lengths:
  ```typescript
  // rowIds has 3 elements, but name has 2
  ['BulkAddRecord', 'People', [null, null, null], {
    name: ['Alice', 'Bob']  // ❌ Length mismatch!
  }]
  ```
- ❌ Row-oriented format:
  ```typescript
  // ❌ WRONG - not column-oriented
  ['BulkAddRecord', 'People', [null, null], [
    {name: 'Alice', age: 30},
    {name: 'Bob', age: 25}
  ]]
  ```
- ❌ Row IDs too high: `[1000001]` → Max is 1,000,000
- ❌ Negative row IDs (except as references within same bundle)

### UpdateRecord

Updates a single record.

**Signature**: `['UpdateRecord', tableId, rowId, colValues]`

**Parameters**:
- `tableId` (string): Target table
- `rowId` (number): Row ID to update
- `colValues` (object): Key-value pairs of columns to update

**Example**:
```typescript
['UpdateRecord', 'People', 5, {
  name: 'Alice Smith',
  email: 'alice.smith@example.com'
}]
```

### BulkUpdateRecord

Updates multiple records.

**Signature**: `['BulkUpdateRecord', tableId, rowIds, colValues]`

**Parameters**:
- `tableId` (string): Target table
- `rowIds` (array): Array of row IDs to update
- `colValues` (object): Column-oriented value dict (same structure as BulkAddRecord)

**Example**:
```typescript
['BulkUpdateRecord', 'Products', [1, 2, 3], {
  price: [10.99, 20.99, 15.99],
  inStock: [true, false, true]
}]
```

**Common Errors**:
- ❌ Array length mismatch between rowIds and column value arrays

### RemoveRecord

Removes a single record.

**Signature**: `['RemoveRecord', tableId, rowId]`

**Parameters**:
- `tableId` (string): Target table
- `rowId` (number): Row ID to remove

**Example**:
```typescript
['RemoveRecord', 'People', 42]
```

### BulkRemoveRecord

Removes multiple records.

**Signature**: `['BulkRemoveRecord', tableId, rowIds]`

**Parameters**:
- `tableId` (string): Target table
- `rowIds` (array): Array of row IDs to remove

**Example**:
```typescript
['BulkRemoveRecord', 'OldRecords', [1, 5, 10, 15, 20]]
```

### ReplaceTableData

Replaces all data in a table (clears existing data and adds new rows).

**Signature**: `['ReplaceTableData', tableId, rowIds, colValues]`

**Parameters**: Same as BulkAddRecord

**Example**:
```typescript
['ReplaceTableData', 'Cache', [1, 2], {
  key: ['foo', 'bar'],
  value: ['data1', 'data2']
}]
```

---

## Column Actions

### AddColumn

Adds a new column to a table.

**Signature**: `['AddColumn', tableId, colId, colInfo]`

**Parameters**:
- `tableId` (string): Target table
- `colId` (string): Column identifier (must be valid Python identifier)
- `colInfo` (object): Column configuration

**ColInfo Structure**:
```typescript
{
  type?: string,           // Column type (see Grist Types below)
  isFormula?: boolean,     // true = formula column, false = data column
                          // Default: true (formula) unless formula is empty
  formula?: string,        // Python expression (default: '')
  label?: string,          // Display name (default: same as colId)
  widgetOptions?: string,  // JSON string with widget configuration
  visibleCol?: number,     // Column ref for Ref/RefList display (top-level!)
  // ... other metadata fields
}
```

**CRITICAL: visibleCol Placement**
- ✅ **CORRECT**: `visibleCol` is a **top-level** property in colInfo
- ❌ **WRONG**: `visibleCol` inside widgetOptions

**Grist Column Types**:
- Basic: `'Text'`, `'Numeric'`, `'Int'`, `'Bool'`, `'Date'`, `'DateTime'`
- Special: `'Any'`, `'Attachments'`, `'Choice'`, `'ChoiceList'`
- References: `'Ref:TableName'`, `'RefList:TableName'`

**Examples**:

Simple text column:
```typescript
['AddColumn', 'People', 'firstName', {
  type: 'Text',
  isFormula: false,
  label: 'First Name'
}]
```

Numeric column with currency widget:
```typescript
['AddColumn', 'Products', 'price', {
  type: 'Numeric',
  isFormula: false,
  widgetOptions: JSON.stringify({
    decimals: 2,
    currency: 'USD'
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
// First, get the column ID for People.name (e.g., col_id = 25)
// Then create the reference column
['AddColumn', 'Orders', 'customer', {
  type: 'Ref:People',
  isFormula: false,
  visibleCol: 25  // ✅ Top-level, NOT in widgetOptions!
}]
```

Date column:
```typescript
['AddColumn', 'Events', 'eventDate', {
  type: 'Date',
  isFormula: false,
  widgetOptions: JSON.stringify({
    dateFormat: 'YYYY-MM-DD'
  })
}]
```

Choice column:
```typescript
['AddColumn', 'Tasks', 'status', {
  type: 'Choice',
  isFormula: false,
  widgetOptions: JSON.stringify({
    choices: ['Todo', 'In Progress', 'Done'],
    choiceOptions: {
      'Todo': {fillColor: '#FF0000'},
      'Done': {fillColor: '#00FF00'}
    }
  })
}]
```

**Common Errors**:
- ❌ **widgetOptions as object instead of JSON string**:
  ```typescript
  // ❌ WRONG
  widgetOptions: {decimals: 2}

  // ✅ CORRECT
  widgetOptions: JSON.stringify({decimals: 2})
  ```

- ❌ **visibleCol inside widgetOptions**:
  ```typescript
  // ❌ WRONG
  {
    type: 'Ref:People',
    widgetOptions: JSON.stringify({visibleCol: 25})
  }

  // ✅ CORRECT
  {
    type: 'Ref:People',
    visibleCol: 25
  }
  ```

- ❌ **Python keyword as column ID**: `['AddColumn', 'Data', 'class', ...]`
- ❌ **Missing isFormula for data columns**: Defaults to `true`, creating a formula column

### ModifyColumn

Modifies an existing column's properties.

**Signature**: `['ModifyColumn', tableId, colId, colInfo]`

**Parameters**:
- `tableId` (string): Target table
- `colId` (string): Column to modify
- `colInfo` (object): Properties to update

**Modifiable Properties**:
- Schema: `type`, `formula`, `isFormula`, `reverseColId`
- Metadata: `label`, `widgetOptions`, `visibleCol`, `displayCol`, etc.
- Cannot modify: `colId`, `id`, `parentId`

**Examples**:

Change column type:
```typescript
['ModifyColumn', 'People', 'age', {
  type: 'Numeric'
}]
```

Update formula:
```typescript
['ModifyColumn', 'Orders', 'total', {
  formula: '($quantity * $unitPrice) * (1 + $taxRate)'
}]
```

Convert to formula column:
```typescript
['ModifyColumn', 'Products', 'discount', {
  isFormula: true,
  formula: '$price * 0.1'
}]
```

Update widget options and visibleCol:
```typescript
['ModifyColumn', 'Orders', 'customer', {
  visibleCol: 30,  // Reference to People.fullName column
  widgetOptions: JSON.stringify({
    widget: 'Reference'
  })
}]
```

**Common Errors**:
- ❌ Trying to modify `colId` - use `RenameColumn` instead
- ❌ Same widgetOptions/visibleCol mistakes as AddColumn

### RenameColumn

Renames a column and updates all formula references.

**Signature**: `['RenameColumn', tableId, oldColId, newColId]`

**Parameters**:
- `tableId` (string): Target table
- `oldColId` (string): Current column ID
- `newColId` (string): New column ID (must be valid Python identifier)

**Example**:
```typescript
['RenameColumn', 'People', 'firstName', 'first_name']
```

Formulas are automatically updated:
```python
# Before: $firstName + " " + $lastName
# After:  $first_name + " " + $lastName
```

### RemoveColumn

Removes a column from a table.

**Signature**: `['RemoveColumn', tableId, colId]`

**Parameters**:
- `tableId` (string): Target table
- `colId` (string): Column to remove

**Example**:
```typescript
['RemoveColumn', 'People', 'temporaryField']
```

**Common Errors**:
- ❌ Cannot remove `id` or `manualSort` system columns

### AddVisibleColumn

Adds a column and makes it visible in all record views (not just raw data).

**Signature**: `['AddVisibleColumn', tableId, colId, colInfo]`

**Parameters**: Same as AddColumn

**Example**:
```typescript
['AddVisibleColumn', 'People', 'phoneNumber', {
  type: 'Text',
  isFormula: false
}]
```

### AddHiddenColumn

Adds a column but keeps it hidden from default views.

**Signature**: `['AddHiddenColumn', tableId, colId, colInfo]`

**Parameters**: Same as AddColumn

**Example**:
```typescript
// Useful for internal helper columns
['AddHiddenColumn', 'People', 'gristHelper_Display', {
  type: 'Any',
  isFormula: true,
  formula: '$firstName + " " + $lastName'
}]
```

---

## Import and Transform Actions

### GenImporterView

Generates views for importing data.

**Signature**: `['GenImporterView', sourceTableId, destTableId, transformRule]`

This is a complex action typically used internally during imports. For most use cases, use the higher-level import endpoints instead of this action directly.

---

## View Actions

These actions manage views, view sections, and fields. Most developers won't need these unless building custom UI.

### AddView

Adds a new view (page) to the document.

**Signature**: `['AddView', viewName]`

### RemoveView

Removes a view.

**Signature**: `['RemoveView', viewRef]`

### CreateViewSection

Creates a new view section (widget on a page).

**Signature**: `['CreateViewSection', tableRef, viewRef, typeStr, widgetOptions, linkingInfo]`

**Common view section types**: `'record'`, `'chart'`, `'custom'`

---

## Advanced Actions

### Calculate

Triggers recalculation of formulas (system action).

**Signature**: `['Calculate']`

### UpdateCurrentTime

Updates the NOW() function's value (system action).

**Signature**: `['UpdateCurrentTime']`

### ApplyDocActions

Applies low-level DocActions directly (advanced use only).

**Signature**: `['ApplyDocActions', docActions]`

---

## Common Pitfalls Summary

### 1. UserAction Format Wrapping
❌ **WRONG**: `{actions: [['AddTable', ...]]}`
✅ **CORRECT**: `[['AddTable', ...]]`

### 2. visibleCol Placement
❌ **WRONG**: Inside `widgetOptions`
✅ **CORRECT**: Top-level in `colInfo`

### 3. widgetOptions Serialization
❌ **WRONG**: `widgetOptions: {decimals: 2}` (object)
✅ **CORRECT**: `widgetOptions: JSON.stringify({decimals: 2})` (string)

### 4. Python Keywords in Identifiers
❌ **WRONG**: `'class'`, `'import'`, `'from'`, `'return'`, etc.
✅ **CORRECT**: `'Class'`, `'Import_'`, `'From_'`, `'return_value'`

Common Python keywords to avoid:
- `class`, `def`, `import`, `from`, `as`, `return`, `if`, `else`, `elif`, `for`, `while`, `break`, `continue`, `pass`, `try`, `except`, `finally`, `raise`, `with`, `lambda`, `yield`, `global`, `nonlocal`, `assert`, `del`

### 5. Column-Oriented vs Row-Oriented
❌ **WRONG**: Array of row objects
✅ **CORRECT**: Object with arrays for each column

### 6. isFormula Default Value
- **Default**: `true` if formula is non-empty, `false` otherwise
- **Best practice**: Always specify explicitly for clarity

### 7. Empty vs Null Arrays
For `rowIds` in BulkAddRecord:
- `[null, null]` - Auto-generate 2 row IDs ✅
- `[]` - Add 0 rows ✅
- Not providing rowIds - ERROR ❌

### 8. Date Formats
Grist dates are stored as **seconds since epoch**, not milliseconds:
```typescript
// ❌ WRONG (JavaScript timestamp in milliseconds)
date: Date.now()  // 1699876543210

// ✅ CORRECT (seconds since epoch)
date: Math.floor(Date.now() / 1000)  // 1699876543
```

For Date columns, you can also use date strings:
```typescript
date: '2025-11-15'  // ✅ Parsed automatically
```

### 9. Reference Column Values
When adding/updating Ref columns:
- Use the **row ID** of the referenced record (number)
- `0` means no reference (null)
- Invalid IDs are treated as 0

```typescript
['BulkAddRecord', 'Orders', [null, null], {
  customer: [5, 12],  // References to People table row IDs
  product: [0, 8]     // 0 = no reference, 8 = reference to row 8
}]
```

### 10. RefList Encoding
RefList columns store arrays of row IDs:
```typescript
['UpdateRecord', 'Projects', 1, {
  assignees: ['L', 5, 10, 15]  // Special encoding: ['L', ...rowIds]
}]
```

However, for most API usage, you can pass a simple array:
```typescript
assignees: [5, 10, 15]  // Usually works, converted internally
```

### 11. Array Length Mismatches
All column arrays in BulkAddRecord/BulkUpdateRecord must have the same length:
```typescript
// ❌ WRONG
['BulkAddRecord', 'People', [null, null, null], {
  name: ['Alice', 'Bob'],      // Length 2
  age: [30, 25, 35]            // Length 3 - MISMATCH!
}]

// ✅ CORRECT
['BulkAddRecord', 'People', [null, null, null], {
  name: ['Alice', 'Bob', 'Charlie'],   // Length 3
  age: [30, 25, 35]                    // Length 3
}]
```

### 12. Formula Syntax
Formulas are **Python expressions**, not JavaScript:
```python
# ✅ CORRECT (Python)
formula: '$price * 0.9'
formula: '$firstName + " " + $lastName'
formula: 'sum($values) if $values else 0'

# ❌ WRONG (JavaScript syntax won't work)
formula: '$price * 0.9;'  // No semicolons
formula: `${firstName}`   // No template literals
formula: '$values.reduce((a,b) => a+b)'  // No arrow functions
```

### 13. Attempting to Modify System Tables
Most `_grist_*` system tables should be modified through UserActions, not direct record updates:
```typescript
// ❌ WRONG - Don't directly add records to _grist_Tables_column
['BulkAddRecord', '_grist_Tables_column', ...]

// ✅ CORRECT - Use AddColumn UserAction
['AddColumn', 'MyTable', 'myColumn', {...}]
```

---

## Complete Action Reference

**Table Actions**:
- `AddTable(tableId, columns)`
- `AddEmptyTable(tableId)`
- `AddRawTable(tableId)`
- `RemoveTable(tableId)`
- `RenameTable(oldTableId, newTableId)`
- `DuplicateTable(tableId, newTableId, includeData)`

**Record Actions**:
- `AddRecord(tableId, rowId, colValues)`
- `BulkAddRecord(tableId, rowIds, colValues)`
- `UpdateRecord(tableId, rowId, colValues)`
- `BulkUpdateRecord(tableId, rowIds, colValues)`
- `RemoveRecord(tableId, rowId)`
- `BulkRemoveRecord(tableId, rowIds)`
- `ReplaceTableData(tableId, rowIds, colValues)`
- `AddOrUpdateRecord(tableId, rowId, colValues)`
- `BulkAddOrUpdateRecord(tableId, rowIds, colValues)`

**Column Actions**:
- `AddColumn(tableId, colId, colInfo)`
- `AddHiddenColumn(tableId, colId, colInfo)`
- `AddVisibleColumn(tableId, colId, colInfo)`
- `RemoveColumn(tableId, colId)`
- `RenameColumn(tableId, oldColId, newColId)`
- `ModifyColumn(tableId, colId, colInfo)`
- `SetDisplayFormula(tableId, rowId, colRef, formula)`
- `AddReverseColumn(sourceTableId, sourceColId, reverseColId)`

**View Actions**:
- `AddView(viewName)`
- `RemoveView(viewRef)`
- `AddViewSection(tableRef, viewRef, sectionType, linkedSectionRef)`
- `RemoveViewSection(sectionRef)`
- `CreateViewSection(tableRef, viewRef, typeStr, widgetOptions, linkingInfo)`
- `UpdateSummaryViewSection(sectionRef, groupByColumns)`
- `DetachSummaryViewSection(sectionRef)`

**System Actions**:
- `Calculate()`
- `UpdateCurrentTime()`
- `ApplyDocActions(docActions)`
- `ApplyUndoActions(docActions)`
- `InitNewDoc()`
- `RemoveStaleObjects()`

**Import Actions**:
- `GenImporterView(sourceTableId, destTableId, transformRule)`

**ACL Actions**:
- `AddEmptyRule()`

---

## Usage Examples

### Complete Workflow: Creating a CRM

```typescript
// 1. Create tables
await fetch('/api/docs/DOCID/apply', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify([
    ['AddTable', 'Companies', [
      {id: 'name', type: 'Text', isFormula: false},
      {id: 'industry', type: 'Choice', isFormula: false,
       widgetOptions: JSON.stringify({
         choices: ['Technology', 'Finance', 'Healthcare', 'Retail']
       })}
    ]],
    ['AddTable', 'Contacts', [
      {id: 'firstName', type: 'Text', isFormula: false},
      {id: 'lastName', type: 'Text', isFormula: false},
      {id: 'email', type: 'Text', isFormula: false},
      {id: 'company', type: 'Ref:Companies', isFormula: false}
    ]]
  ])
});

// 2. Add company records
await fetch('/api/docs/DOCID/apply', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify([
    ['BulkAddRecord', 'Companies', [1, 2, 3], {
      name: ['Acme Corp', 'TechStart Inc', 'MegaRetail'],
      industry: ['Technology', 'Technology', 'Retail']
    }]
  ])
});

// 3. Add contacts with company references
await fetch('/api/docs/DOCID/apply', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify([
    ['BulkAddRecord', 'Contacts', [null, null, null, null], {
      firstName: ['John', 'Jane', 'Bob', 'Alice'],
      lastName: ['Doe', 'Smith', 'Johnson', 'Williams'],
      email: ['john@acme.com', 'jane@acme.com', 'bob@techstart.com', 'alice@megaretail.com'],
      company: [1, 1, 2, 3]  // References to Companies
    }]
  ])
});

// 4. Add a formula column to Companies
await fetch('/api/docs/DOCID/apply', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify([
    ['AddColumn', 'Companies', 'contactCount', {
      type: 'Numeric',
      isFormula: true,
      formula: 'len(Contacts.lookupRecords(company=$id))'
    }]
  ])
});

// 5. Update records
await fetch('/api/docs/DOCID/apply', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify([
    ['BulkUpdateRecord', 'Contacts', [1, 2], {
      email: ['john.doe@acme.com', 'jane.smith@acme.com']
    }]
  ])
});
```

---

## Debugging Tips

1. **Check the response**: The /apply endpoint returns detailed information about what was executed
2. **Use single actions first**: Test one action at a time before batching
3. **Inspect metadata tables**: Query `_grist_Tables`, `_grist_Tables_column` to see current schema
4. **Check Python syntax**: Formulas must be valid Python expressions
5. **Verify column references**: Use the API to get column IDs before referencing them in visibleCol

---

## Related Documentation

- **Grist Types Reference**: For detailed information about column types and widgetOptions
- **REST API Reference**: For general API usage and authentication
- **Formula Reference**: For Python formula syntax and available functions
- **Sandbox Documentation**: `/home/user/grist-core/sandbox/grist/useractions.py:211` - Complete implementation

---

**Last Updated**: 2025-11-15
**Audience**: Developers using the Grist `/apply` endpoint
**Grist Core Version**: Based on current `grist-core` repository
