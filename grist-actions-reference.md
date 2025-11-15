# Grist Actions Reference

Comprehensive reference for all Grist user actions. These actions represent the API for modifying Grist documents.

**Total Actions**: 43

---

## Table of Contents

- [Document Actions](#document-actions)
- [Record Operations](#record-operations)
- [Column Operations](#column-operations)
- [Table Operations](#table-operations)
- [View Operations](#view-operations)

---

## Document Actions

### InitNewDoc

| Property | Value |
|----------|-------|
| **Signature** | `["InitNewDoc"]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:307` |

**Description**: Initializes a new document by creating the schema structure, adding initial metadata to `_grist_DocInfo`, and setting up initial ACL data with default principals, resources, and rules.

**Parameters**: None

**Examples**:

| Scenario | Action |
|----------|--------|
| Initialize new doc | `["InitNewDoc"]` |

---

### ApplyDocActions

| Property | Value |
|----------|-------|
| **Signature** | `["ApplyDocActions", doc_actions]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:334` |

**Description**: Applies a list of document actions to the document.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| doc_actions | list | List of document actions to apply | ✓ | Each action is a list representation |

**Examples**:

| Scenario | Action |
|----------|--------|
| Apply multiple actions | `["ApplyDocActions", [["AddRecord", "Table1", null, {"A": 1}], ["UpdateRecord", "Table1", 1, {"B": 2}]]]` |

---

### ApplyUndoActions

| Property | Value |
|----------|-------|
| **Signature** | `["ApplyUndoActions", undo_actions]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:339` |

**Description**: Applies undo actions in reversed order.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| undo_actions | list | List of undo actions to apply in reverse order | ✓ | Actions from undo stack |

**Examples**:

| Scenario | Action |
|----------|--------|
| Undo previous actions | `["ApplyUndoActions", [["RemoveRecord", "Table1", 1]]]` |

---

### Calculate

| Property | Value |
|----------|-------|
| **Signature** | `["Calculate"]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:344` |

**Description**: A dummy action whose only purpose is to trigger calculation of any dirty cells.

**Parameters**: None

**Examples**:

| Scenario | Action |
|----------|--------|
| Force recalculation | `["Calculate"]` |

---

### UpdateCurrentTime

| Property | Value |
|----------|-------|
| **Signature** | `["UpdateCurrentTime"]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:352` |

**Description**: Similar to Calculate, triggers calculation of any cells that depend on the current time.

**Parameters**: None

**Examples**:

| Scenario | Action |
|----------|--------|
| Update time-dependent cells | `["UpdateCurrentTime"]` |

---

### RespondToRequests

| Property | Value |
|----------|-------|
| **Signature** | `["RespondToRequests", responses, cached_keys]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:360` |

**Description**: Reevaluates formulas which called the REQUEST function using the now available responses.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| responses | dict | Dictionary of responses for REQUEST function calls | ✓ | Keys are request identifiers |
| cached_keys | list | Keys for older requests stored in files | ✓ | Can be retrieved synchronously |

**Examples**:

| Scenario | Action |
|----------|--------|
| Respond to API requests | `["RespondToRequests", {"req1": {"value": 42, "deps": {}}}, []]` |

---

### RemoveStaleObjects

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveStaleObjects"]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1620` |

**Description**: Removes transform columns and temporary tables (e.g., from imports).

**Parameters**: None

**Examples**:

| Scenario | Action |
|----------|--------|
| Clean up after import | `["RemoveStaleObjects"]` |

---

## Record Operations

### AddRecord

| Property | Value |
|----------|-------|
| **Signature** | `["AddRecord", table_id, row_id, column_values]` |
| **Returns** | int - The row ID of the added record |
| **Source** | `sandbox/grist/useractions.py:383` |

**Description**: Adds a single record to a table. Forwards to BulkAddRecord.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table to add the record to | ✓ | |
| row_id | int or null | The row ID for the new record | | null for auto-assignment |
| column_values | dict | Dictionary mapping column IDs to values | ✓ | Keys are column IDs |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add with auto ID | `["AddRecord", "Table1", null, {"Name": "Alice", "Age": 30}]` |
| Add with specific ID | `["AddRecord", "Table1", 100, {"Name": "Bob", "Age": 25}]` |

---

### BulkAddRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkAddRecord", table_id, row_ids, column_values]` |
| **Returns** | list of int - The row IDs of the added records |
| **Source** | `sandbox/grist/useractions.py:389` |

**Description**: Adds multiple records to a table in bulk. Handles special tables differently via overrides (e.g., `_grist_ACLRules`).

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table to add records to | ✓ | |
| row_ids | list | List of row IDs | ✓ | Can contain null for auto-assignment |
| column_values | dict | Dictionary mapping column IDs to lists of values | ✓ | All lists must have same length as row_ids |

**Examples**:

| Scenario | Action |
|----------|--------|
| Bulk add records | `["BulkAddRecord", "Table1", [null, null], {"Name": ["Alice", "Bob"], "Age": [30, 25]}]` |
| Bulk add with IDs | `["BulkAddRecord", "Table1", [100, 101], {"Name": ["Charlie", "David"], "Age": [35, 40]}]` |

---

### ReplaceTableData

| Property | Value |
|----------|-------|
| **Signature** | `["ReplaceTableData", table_id, row_ids, column_values]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:397` |

**Description**: Replaces all data in a table with the provided data.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| row_ids | list | List of row IDs for the new data | ✓ | |
| column_values | dict | Dictionary mapping column IDs to lists of values | ✓ | All lists must have same length |

**Examples**:

| Scenario | Action |
|----------|--------|
| Replace all data | `["ReplaceTableData", "Table1", [1, 2], {"Name": ["Alice", "Bob"], "Age": [30, 25]}]` |

---

### UpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["UpdateRecord", table_id, row_id, columns]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:557` |

**Description**: Updates a single record in a table. Forwards to BulkUpdateRecord.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| row_id | int | The row ID to update | ✓ | |
| columns | dict | Dictionary mapping column IDs to new values | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Update single field | `["UpdateRecord", "Table1", 1, {"Name": "Alice Updated"}]` |
| Update multiple fields | `["UpdateRecord", "Table1", 1, {"Name": "Alice", "Age": 31}]` |

---

### BulkUpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkUpdateRecord", table_id, row_ids, columns]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:562` |

**Description**: Updates multiple records in a table in bulk. Has special handling for metadata tables like `_grist_Tables`, `_grist_Tables_column`, `_grist_Views_section`, `_grist_ACLRules`, and `_grist_Validations`.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| row_ids | list | List of row IDs to update | ✓ | |
| columns | dict | Dictionary mapping column IDs to lists of values | ✓ | All lists must have same length as row_ids |

**Examples**:

| Scenario | Action |
|----------|--------|
| Bulk update | `["BulkUpdateRecord", "Table1", [1, 2], {"Age": [31, 26]}]` |

---

### BulkAddOrUpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkAddOrUpdateRecord", table_id, require, col_values, options]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1027` |

**Description**: Add or Update ('upsert') records depending on options and whether records matching `require` already exist. All lists across both `require` and `col_values` must have the same length.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| require | dict | Dictionary mapping column IDs to lists of cell values for matching | ✓ | Used for lookup |
| col_values | dict | Dictionary mapping column IDs to lists of cell values to set | ✓ | Values to add/update |
| options | dict | Optional settings dictionary | ✓ | See options below |

**Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| on_many | str | "first" | "first", "all", or "none" - which records to update when several match |
| update | bool | true | Whether to allow updating existing records |
| add | bool | true | Whether to allow adding new records |
| allow_empty_require | bool | false | Whether to allow empty require dict |

**Examples**:

| Scenario | Action |
|----------|--------|
| Simple upsert | `["BulkAddOrUpdateRecord", "Table1", {"Email": ["alice@example.com"]}, {"Name": ["Alice"], "Age": [30]}, {}]` |
| Update only | `["BulkAddOrUpdateRecord", "Table1", {"Email": ["alice@example.com"]}, {"Age": [31]}, {"add": false}]` |
| Add only | `["BulkAddOrUpdateRecord", "Table1", {"Email": ["bob@example.com"]}, {"Name": ["Bob"], "Age": [25]}, {"update": false}]` |
| Update all matches | `["BulkAddOrUpdateRecord", "Table1", {"Status": ["active"]}, {"LastSeen": ["2024-01-01"]}, {"on_many": "all", "allow_empty_require": false}]` |

---

### AddOrUpdateRecord

| Property | Value |
|----------|-------|
| **Signature** | `["AddOrUpdateRecord", table_id, require, col_values, options]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1129` |

**Description**: Add or Update ('upsert') a single record. Forwards to BulkAddOrUpdateRecord.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| require | dict | Dictionary mapping column IDs to cell values for matching | ✓ | Single values, not lists |
| col_values | dict | Dictionary mapping column IDs to cell values to set | ✓ | Single values, not lists |
| options | dict | Optional settings (same as BulkAddOrUpdateRecord) | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Upsert single record | `["AddOrUpdateRecord", "Table1", {"Email": "alice@example.com"}, {"Name": "Alice", "Age": 30}, {}]` |

---

### RemoveRecord

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveRecord", table_id, row_id]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1178` |

**Description**: Removes a single record from a table. Forwards to BulkRemoveRecord.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| row_id | int | The row ID to remove | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Remove single record | `["RemoveRecord", "Table1", 1]` |

---

### BulkRemoveRecord

| Property | Value |
|----------|-------|
| **Signature** | `["BulkRemoveRecord", table_id, row_ids]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1182` |

**Description**: Removes multiple records from a table. Has special handling for metadata tables. Prevents direct removal from summary tables. Also removes references to deleted rows from other tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| row_ids | list | List of row IDs to remove | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Bulk remove | `["BulkRemoveRecord", "Table1", [1, 2, 3]]` |

---

## Column Operations

### AddColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddColumn", table_id, col_id, col_info]` |
| **Returns** | dict with `colRef` (int) and `colId` (str) |
| **Source** | `sandbox/grist/useractions.py:1454` |

**Description**: Adds a new column to a table. Automatically adds the column to the raw data view section and record card section (if unmodified). Cannot add non-formula columns to summary tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| col_id | str or null | The column ID | | null for auto-generation |
| col_info | dict | Column information dictionary | ✓ | See col_info fields below |

**col_info fields**:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| type | str | "Any" (formula) or "Text" (data) | Column type |
| isFormula | bool | true (or false for OnDemand tables) | Whether it's a formula column |
| formula | str | "" | Formula text |
| widgetOptions | str | "" | Widget options JSON |
| label | str | col_id | Column label |
| rules | list | [] | Conditional style rules |
| recalcWhen | int | 0 | When to recalculate |
| recalcDeps | list | [] | Recalculation dependencies |
| visibleCol | int | 0 | Visible column reference |
| _position | int | - | Position in the table |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add formula column | `["AddColumn", "Table1", null, {"formula": "$A + $B"}]` |
| Add data column | `["AddColumn", "Table1", "Email", {"type": "Text", "isFormula": false}]` |
| Add with label | `["AddColumn", "Table1", "first_name", {"label": "First Name", "type": "Text", "isFormula": false}]` |

---

### AddHiddenColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddHiddenColumn", table_id, col_id, col_info]` |
| **Returns** | dict with `colRef` and `colId` |
| **Source** | `sandbox/grist/useractions.py:1508` |

**Description**: Adds a hidden column (not added to view sections automatically).

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| col_id | str or null | The column ID | | null for auto-generation |
| col_info | dict | Column information (same as AddColumn) | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add hidden helper | `["AddHiddenColumn", "Table1", "gristHelper_Display", {"formula": "$Name.upper()", "isFormula": true}]` |

---

### AddVisibleColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddVisibleColumn", table_id, col_id, col_info]` |
| **Returns** | dict with `colRef` and `colId` |
| **Source** | `sandbox/grist/useractions.py:1513` |

**Description**: Inserts column and adds it as a field to all 'record' views (not just raw data).

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| col_id | str or null | The column ID | | null for auto-generation |
| col_info | dict | Column information (same as AddColumn) | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add to all views | `["AddVisibleColumn", "Table1", "Status", {"type": "Text", "isFormula": false}]` |

---

### RemoveColumn

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveColumn", table_id, col_id]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1582` |

**Description**: Removes a column from a table. Forwards to removing the column metadata record. Cannot remove group-by columns from summary tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| col_id | str | The column ID to remove | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Remove column | `["RemoveColumn", "Table1", "TempColumn"]` |

---

### RenameColumn

| Property | Value |
|----------|-------|
| **Signature** | `["RenameColumn", table_id, old_col_id, new_col_id]` |
| **Returns** | str - The actual new column ID (may be sanitized) |
| **Source** | `sandbox/grist/useractions.py:1590` |

**Description**: Renames a column. Forwards to updating the column metadata record.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| old_col_id | str | The current column ID | ✓ | |
| new_col_id | str | The new column ID | ✓ | Will be sanitized if needed |

**Examples**:

| Scenario | Action |
|----------|--------|
| Rename column | `["RenameColumn", "Table1", "Name", "FullName"]` |

---

### ModifyColumn

| Property | Value |
|----------|-------|
| **Signature** | `["ModifyColumn", table_id, col_id, col_info]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1656` |

**Description**: Modifies column properties. May trigger type conversion and data migration. Forwards to updating the column metadata record.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| col_id | str | The column ID | ✓ | |
| col_info | dict | Column information to update | ✓ | Cannot modify 'colId', 'id', 'parentId' |

**col_info updatable fields**:

| Field | Type | Description |
|-------|------|-------------|
| type | str | New column type |
| formula | str | New formula |
| isFormula | bool | Whether it's a formula column |
| reverseColId | str | Reverse column ID |
| _position | int | New position (maps to parentPos) |
| widgetOptions | str | Widget options JSON |
| label | str | Column label |

**Examples**:

| Scenario | Action |
|----------|--------|
| Change type | `["ModifyColumn", "Table1", "Age", {"type": "Numeric"}]` |
| Convert to formula | `["ModifyColumn", "Table1", "Total", {"isFormula": true, "formula": "$Price * $Quantity"}]` |
| Update formula | `["ModifyColumn", "Table1", "Discount", {"formula": "$Price * 0.1"}]` |

---

### SetDisplayFormula

| Property | Value |
|----------|-------|
| **Signature** | `["SetDisplayFormula", table_id, field_ref, col_ref, formula]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1598` |

**Description**: Sets a display formula for a field or column. Creates or updates a helper column with the formula.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| field_ref | int or null | The field reference | | Mutually exclusive with col_ref |
| col_ref | int or null | The column reference | | Mutually exclusive with field_ref |
| formula | str | The display formula | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Set field display | `["SetDisplayFormula", "Table1", 123, null, "$Name.upper()"]` |
| Set column display | `["SetDisplayFormula", "Table1", null, 456, "$Name.upper()"]` |

---

### ConvertFromColumn

| Property | Value |
|----------|-------|
| **Signature** | `["ConvertFromColumn", table_id, src_col_id, dst_col_id, typ, widgetOptions, visibleColRef]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1748` |

**Description**: Converts column data from source to destination using external JS conversion logic. Calls external "convertFromColumn" function for type conversion.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| src_col_id | str | Source column ID | ✓ | |
| dst_col_id | str | Destination column ID | ✓ | |
| typ | str | Target type | ✓ | |
| widgetOptions | str | Widget options JSON | ✓ | |
| visibleColRef | int | Visible column reference | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Convert to date | `["ConvertFromColumn", "Table1", "DateStr", "DateParsed", "Date", "{}", 0]` |

---

### CopyFromColumn

| Property | Value |
|----------|-------|
| **Signature** | `["CopyFromColumn", table_id, src_col_id, dst_col_id, widgetOptions]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1784` |

**Description**: Copies column schema and data from source to destination. Updates the destination column's type, options, and values to match the source.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| src_col_id | str | Source column ID to copy from | ✓ | |
| dst_col_id | str | Destination column ID to copy to | ✓ | |
| widgetOptions | str or null | Widget options JSON | | null to use source's options |

**Examples**:

| Scenario | Action |
|----------|--------|
| Copy column | `["CopyFromColumn", "Table1", "OriginalName", "CopyOfName", null]` |

---

### MaybeCopyDisplayFormula

| Property | Value |
|----------|-------|
| **Signature** | `["MaybeCopyDisplayFormula", src_col_ref, dst_col_ref]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1850` |

**Description**: If source column has a displayCol set, creates an equivalent one for destination column.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| src_col_ref | int | Source column reference | ✓ | |
| dst_col_ref | int | Destination column reference | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Copy display formula | `["MaybeCopyDisplayFormula", 123, 456]` |

---

### RenameChoices

| Property | Value |
|----------|-------|
| **Signature** | `["RenameChoices", table_id, col_id, renames]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1865` |

**Description**: Updates the data in a Choice/ChoiceList column to reflect the new choice names. Also updates filters. Does not touch the choices configuration in widgetOptions.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table | ✓ | |
| col_id | str | The column ID (must be Choice or ChoiceList type) | ✓ | |
| renames | dict | Dictionary mapping old choice names to new choice names | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Rename choices | `["RenameChoices", "Table1", "Status", {"Todo": "To Do", "Inprogress": "In Progress"}]` |

---

### AddReverseColumn

| Property | Value |
|----------|-------|
| **Signature** | `["AddReverseColumn", table_id, col_id]` |
| **Returns** | dict with `colRef` and `colId` |
| **Source** | `sandbox/grist/useractions.py:1941` |

**Description**: Adds a reverse reference column corresponding to `col_id`. Creates a two-way binding between two Ref/RefList columns. The reverse column is typically of type RefList. Updates to either column result in updates to the other.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table containing the reference column | ✓ | |
| col_id | str | The column ID of the reference column | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add reverse ref | `["AddReverseColumn", "Table1", "ParentRef"]` |

---

### AddEmptyRule

| Property | Value |
|----------|-------|
| **Signature** | `["AddEmptyRule", table_id, field_ref, col_ref]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:1907` |

**Description**: Adds an empty conditional style rule to a field, column, or raw view section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table (required) | ✓ | |
| field_ref | int or null | Field reference for field-level rule | | |
| col_ref | int or null | Column reference for column-level rule | | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add field rule | `["AddEmptyRule", "Table1", 123, null]` |
| Add column rule | `["AddEmptyRule", "Table1", null, 456]` |

---

## Table Operations

### AddEmptyTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddEmptyTable", table_id]` |
| **Returns** | dict with `id`, `table_id`, `columns`, `views` |
| **Source** | `sandbox/grist/useractions.py:2007` |

**Description**: Adds an empty table with three default formula columns (A, B, C) and a primary view.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The desired table ID | ✓ | May be adjusted for uniqueness |

**Examples**:

| Scenario | Action |
|----------|--------|
| Create empty table | `["AddEmptyTable", "NewTable"]` |

---

### AddTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddTable", table_id, columns]` |
| **Returns** | dict with `id`, `table_id`, `columns`, `views` |
| **Source** | `sandbox/grist/useractions.py:2017` |

**Description**: Adds a table with specified columns, including manual sort, primary view, raw section, and record card section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The desired table ID | ✓ | |
| columns | list | List of column info dictionaries | ✓ | Each dict has same fields as AddColumn col_info |

**Examples**:

| Scenario | Action |
|----------|--------|
| Create with columns | `["AddTable", "People", [{"id": "Name", "isFormula": false, "type": "Text"}, {"id": "Age", "isFormula": false, "type": "Int"}]]` |

---

### AddRawTable

| Property | Value |
|----------|-------|
| **Signature** | `["AddRawTable", table_id]` |
| **Returns** | dict with `id`, `table_id`, `columns` |
| **Source** | `sandbox/grist/useractions.py:2028` |

**Description**: Same as AddEmptyTable but does not create a primary view (and page). Creates raw section and record card section only.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The desired table ID | ✓ | May be adjusted for uniqueness |

**Examples**:

| Scenario | Action |
|----------|--------|
| Create hidden table | `["AddRawTable", "TempImport"]` |

---

### RemoveTable

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveTable", table_id]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:2123` |

**Description**: Removes a table and all associated metadata (columns, view sections, fields, etc.). Forwards to removing the table metadata record.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The ID of the table to remove | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Remove table | `["RemoveTable", "OldTable"]` |

---

### RenameTable

| Property | Value |
|----------|-------|
| **Signature** | `["RenameTable", old_table_id, new_table_id]` |
| **Returns** | str - The actual new table ID (may be sanitized) |
| **Source** | `sandbox/grist/useractions.py:2131` |

**Description**: Renames a table. Forwards to updating the table metadata record. Cannot rename summary tables directly.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| old_table_id | str | Current table ID | ✓ | |
| new_table_id | str | New table ID | ✓ | Will be sanitized if needed |

**Examples**:

| Scenario | Action |
|----------|--------|
| Rename table | `["RenameTable", "OldName", "NewName"]` |

---

### DuplicateTable

| Property | Value |
|----------|-------|
| **Signature** | `["DuplicateTable", existing_table_id, new_table_id, include_data]` |
| **Returns** | dict with `id`, `table_id`, `raw_section_id` |
| **Source** | `sandbox/grist/useractions.py:2140` |

**Description**: Duplicates a table structure (columns, settings, conditional styles) and optionally its data. Cannot duplicate hidden tables or summary tables.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| existing_table_id | str | The table ID to duplicate | ✓ | |
| new_table_id | str | The new table ID | ✓ | |
| include_data | bool | Whether to copy data | | Default: false |

**Examples**:

| Scenario | Action |
|----------|--------|
| Duplicate structure | `["DuplicateTable", "Table1", "Table1_Copy", false]` |
| Duplicate with data | `["DuplicateTable", "Table1", "Table1_Backup", true]` |

---

### GenImporterView

| Property | Value |
|----------|-------|
| **Signature** | `["GenImporterView", source_table_id, dest_table_id, transform_rule, options]` |
| **Returns** | Result from import_actions.DoGenImporterView |
| **Source** | `sandbox/grist/useractions.py:2509` |

**Description**: Generates an importer view for importing data. Passthrough to import_actions.py.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| source_table_id | str | Source table ID | ✓ | |
| dest_table_id | str | Destination table ID | ✓ | |
| transform_rule | dict or null | Transformation rules | | |
| options | dict or null | Import options | | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Generate import view | `["GenImporterView", "ImportSource", "FinalTable", null, null]` |

---

## View Operations

### CreateViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["CreateViewSection", table_ref, view_ref, section_type, groupby_colrefs, table_id]` |
| **Returns** | dict with `tableRef`, `viewRef`, `sectionRef` |
| **Source** | `sandbox/grist/useractions.py:2302` |

**Description**: Creates a new view section. Can create new table and/or view if needed. Creates summary section if groupby_colrefs provided.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_ref | int | Table reference | ✓ | 0 to create new table |
| view_ref | int | View reference | ✓ | 0 to create new view |
| section_type | str | Section type | ✓ | 'record', 'detail', 'chart', 'form', etc. |
| groupby_colrefs | list or null | Column references for grouping | | null for plain section |
| table_id | str | Table ID (used if creating new table) | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add card view | `["CreateViewSection", 123, 456, "detail", null, ""]` |
| Create summary | `["CreateViewSection", 123, 456, "record", [789, 790], ""]` |
| New table & view | `["CreateViewSection", 0, 0, "record", null, "NewTable"]` |

---

### UpdateSummaryViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["UpdateSummaryViewSection", section_ref, groupby_colrefs]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:2355` |

**Description**: Updates a summary section to be grouped by a different set of columns. Updates fields to reference similar columns in a different summary table.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| section_ref | int | Section reference | ✓ | |
| groupby_colrefs | list | List of column references for grouping | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Update grouping | `["UpdateSummaryViewSection", 123, [456, 789]]` |

---

### DetachSummaryViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["DetachSummaryViewSection", section_ref]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:2366` |

**Description**: Creates a real table equivalent to the given summary section, and updates the section to show the new table instead of the summary. Cannot detach a non-summary section.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| section_ref | int | Section reference | ✓ | Must be a summary section |

**Examples**:

| Scenario | Action |
|----------|--------|
| Detach summary | `["DetachSummaryViewSection", 123]` |

---

### AddView

| Property | Value |
|----------|-------|
| **Signature** | `["AddView", table_id, view_type, name]` |
| **Returns** | dict with `id`, `sections` |
| **Source** | `sandbox/grist/useractions.py:2382` |

**Description**: Creates records for a View. Includes it in the tab bar and pages tree.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| table_id | str | The table ID | ✓ | |
| view_type | str | View type | ✓ | 'raw_data' or 'empty' |
| name | str | View name | ✓ | |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add raw data view | `["AddView", "Table1", "raw_data", "Table1 - Raw Data"]` |
| Add empty view | `["AddView", "Table1", "empty", "Custom View"]` |

---

### RemoveView

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveView", view_id]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:2426` |

**Description**: **DEPRECATED** - Removes a view and all associated metadata. Should use `RemoveRecord('_grist_Views', view_id)` instead.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| view_id | int | The view ID to remove | ✓ | DEPRECATED |

**Examples**:

| Scenario | Action |
|----------|--------|
| Remove view (deprecated) | `["RemoveView", 123]` |

---

### AddViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["AddViewSection", title, view_section_type, view_row_id, table_id]` |
| **Returns** | dict with `id` (section ID) |
| **Source** | `sandbox/grist/useractions.py:2440` |

**Description**: **DEPRECATED** - Creates records for a view section. Superseded by CreateViewSection.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| title | str | Section title | ✓ | DEPRECATED |
| view_section_type | str | Section type ('record', 'detail', etc.) | ✓ | DEPRECATED |
| view_row_id | int | View row ID | ✓ | DEPRECATED |
| table_id | str | Table ID | ✓ | DEPRECATED |

**Examples**:

| Scenario | Action |
|----------|--------|
| Add section (deprecated) | `["AddViewSection", "Card View", "detail", 123, "Table1"]` |

---

### RemoveViewSection

| Property | Value |
|----------|-------|
| **Signature** | `["RemoveViewSection", view_section_id]` |
| **Returns** | None (void) |
| **Source** | `sandbox/grist/useractions.py:2455` |

**Description**: **DEPRECATED** - Removes a view section. Should use `RemoveRecord('_grist_Views_section', view_section_id)` instead.

**Parameters**:

| Parameter | Type | Description | Required | Notes |
|-----------|------|-------------|----------|-------|
| view_section_id | int | View section ID to remove | ✓ | DEPRECATED |

**Examples**:

| Scenario | Action |
|----------|--------|
| Remove section (deprecated) | `["RemoveViewSection", 456]` |

---

## Action Categories Summary

| Category | Action Count | Actions |
|----------|--------------|---------|
| **Document** | 7 | InitNewDoc, ApplyDocActions, ApplyUndoActions, Calculate, UpdateCurrentTime, RespondToRequests, RemoveStaleObjects |
| **Records** | 10 | AddRecord, BulkAddRecord, ReplaceTableData, UpdateRecord, BulkUpdateRecord, BulkAddOrUpdateRecord, AddOrUpdateRecord, RemoveRecord, BulkRemoveRecord |
| **Columns** | 13 | AddColumn, AddHiddenColumn, AddVisibleColumn, RemoveColumn, RenameColumn, ModifyColumn, SetDisplayFormula, ConvertFromColumn, CopyFromColumn, MaybeCopyDisplayFormula, RenameChoices, AddReverseColumn, AddEmptyRule |
| **Tables** | 7 | AddEmptyTable, AddTable, AddRawTable, RemoveTable, RenameTable, DuplicateTable, GenImporterView |
| **Views** | 6 | CreateViewSection, UpdateSummaryViewSection, DetachSummaryViewSection, AddView, RemoveView (deprecated), AddViewSection (deprecated), RemoveViewSection (deprecated) |

---

## Notes

- Actions marked as **DEPRECATED** should not be used in new code
- All actions return their results as JSON-serializable data structures
- Parameter types are inferred from the Python implementation
- Some actions have special handling for metadata tables (prefixed with `_grist_`)
- Null/None values are typically used for auto-generation of IDs
- Most bulk operations expect all value lists to have the same length
- Summary tables have special restrictions (e.g., cannot add non-formula columns)

---

**Last Updated**: 2025-11-15
**Source File**: `sandbox/grist/useractions.py`
