# Grist Type System Reference

**Complete reference for Grist's type system** - column types, CellValue encoding, widget options, and validation rules.

**Last Updated**: 2025-11-15

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Column Types](#column-types)
- [CellValue Encoding](#cellvalue-encoding)
- [Widget Options](#widget-options)
- [Reference Columns](#reference-columns)
- [Identifier Validation](#identifier-validation)
- [Null Handling](#null-handling)
- [Common Pitfalls](#common-pitfalls)

---

## Quick Reference

### Column Types Overview

| Type | Storage | Input Example | Output Example | Empty Value | Notes |
|------|---------|---------------|----------------|-------------|-------|
| **Text** | `string` | `"hello"` | `"hello"` | `''` (empty string) | Plain text |
| **Numeric** | `number` | `123.45` | `123.45` | `null` | Double precision float |
| **Int** | `number` | `42` | `42` | `null` | 32-bit integer |
| **Bool** | `boolean` | `true` | `true` | `null` | Stored as 0/1 in SQLite |
| **Date** | `number` | `1704844800` | `['d', 1704844800]` | `null` | Days since epoch (seconds) |
| **DateTime** | `['D', secs, tz]` | `['D', 1704945919, 'UTC']` | `['D', 1704945919, 'UTC']` | `null` | Seconds + timezone |
| **Choice** | `string` | `"option1"` | `"option1"` | `''` | Single selection |
| **ChoiceList** | `['L', ...]` | `['L', 'a', 'b']` | `['L', 'a', 'b']` | `null` or `['L']` | Multiple selections |
| **Ref** | `number` | `17` | `17` | **`0`** | Reference to row ⚠️ |
| **RefList** | `['L', ...]` | `['L', 1, 2, 3]` | `['L', 1, 2, 3]` | `null` or `['L']` | Multiple row references |
| **Attachments** | `['L', ...]` | `['L', 123, 456]` | `['L', 123, 456]` | `null` or `['L']` | Special RefList |
| **Blob** | Binary | (binary) | (binary) | `null` | Rarely used |
| **Any** | Various | Any type | Any type | `null` | For formula columns |
| **Id** | `number` | `1` | `1` | `0` | Row ID (auto-generated) |

### Default vs Null Values

**CRITICAL DISTINCTION**:
- **Default Value**: What gets inserted for new records
- **Null/Empty**: What represents "no value" or empty cell

| Type | Default (new records) | Empty (no value) | Notes |
|------|----------------------|------------------|-------|
| Text, Choice | `''` (empty string) | `''` (empty string) | Empty string for both |
| Numeric, Int, Bool | `0` or `false` | `null` | Null means "no value" |
| **Ref** | **`0`** | **`0`** | ⚠️ Zero means "no reference" |
| RefList, ChoiceList | `null` | `null` or `['L']` | Both valid |
| Most others | `null` | `null` | |

**Source**: `app/common/gristTypes.ts:22-42`

---

## Column Types

### Text

Plain text values.

**Storage**: `string`  
**Default**: `''` (empty string)  
**Empty**: `''` (empty string)

**Example**:
```typescript
{
  type: 'Text',
  value: "Hello World"
}
```

**Widget Options**: See Widget Options section

**Source**: `app/common/gristTypes.ts:46`

---

### Numeric

Double precision floating point numbers.

**Storage**: `number`  
**Default**: `0`  
**Empty**: `null`

**Range**: IEEE 754 double precision (-1.7E+308 to 1.7E+308)

**Example**:
```typescript
{
  type: 'Numeric',
  value: 123.45
}
```

**Widget Options**: `numMode`, `decimals`, `maxDecimals`, `currency`, `numSign`

**Source**: `app/common/gristTypes.ts:47`

---

### Int

32-bit integer.

**Storage**: `number`  
**Default**: `0`  
**Empty**: `null`

**Range**: -2,147,483,648 to 2,147,483,647

**Example**:
```typescript
{
  type: 'Int',
  value: 42
}
```

**Widget Options**: Same as Numeric

**Source**: `app/common/gristTypes.ts:48`

---

### Bool

Boolean (true/false).

**Storage**: `boolean`  
**Default**: `false`  
**Empty**: `null`

**SQLite Storage**: 0 (false) or 1 (true)

**Example**:
```typescript
{
  type: 'Bool',
  value: true
}
```

**Source**: `app/common/gristTypes.ts:49`

---

### Date

Date without time (UTC midnight).

**Storage**: `number` (seconds since Unix epoch)  
**Wire Format**: `['d', timestamp]`  
**Default**: `null`  
**Empty**: `null`

**CRITICAL**: Stores seconds, NOT milliseconds!

**Examples**:
```typescript
// Stored in database:
1704844800

// Wire format:
['d', 1704844800]  // January 10, 2024 00:00:00 UTC

// Creating from JS Date:
Math.floor(Date.UTC(2024, 0, 10) / 1000)  // ✓ Correct
Date.now() / 1000  // ❌ Wrong (not UTC midnight)
```

**Widget Options**: `dateFormat`, `isCustomDateFormat`

**Source**: `app/common/gristTypes.ts:50`

---

### DateTime

Date and time with timezone.

**Storage**: `['D', timestamp, timezone]`  
**Default**: `null`  
**Empty**: `null`

**CRITICAL**: Timestamp in seconds, NOT milliseconds!

**Examples**:
```typescript
['D', 1704945919, 'America/New_York']  // Specific timezone
['D', 1704945919, 'UTC']                 // UTC
['D', 1704945919, '']                    // Document timezone

// Creating:
const timestamp = Math.floor(Date.now() / 1000);  // ✓ Seconds
const datetime = ['D', timestamp, 'America/New_York'];
```

**Widget Options**: `dateFormat`, `timeFormat`, `isCustomDateFormat`, `isCustomTimeFormat`

**Source**: `app/common/gristTypes.ts:51`

---

### Choice

Single selection from a list.

**Storage**: `string`  
**Default**: `''` (empty string)  
**Empty**: `''` (empty string)

**Example**:
```typescript
{
  type: 'Choice',
  value: "In Progress"
}
```

**Widget Options**:
```typescript
{
  choices: ['Todo', 'In Progress', 'Done'],
  choiceOptions: {
    'Todo': {fillColor: '#FF0000', textColor: '#FFFFFF'},
    'Done': {fillColor: '#00FF00'}
  }
}
```

**Source**: `app/common/gristTypes.ts:52`

---

### ChoiceList

Multiple selections from a list.

**Storage**: `['L', ...choices]` or `null`  
**Default**: `null`  
**Empty**: `null` OR `['L']` (both valid)

**Examples**:
```typescript
// Multiple selections
['L', 'Red', 'Green', 'Blue']

// Empty list - BOTH valid:
null          // ✓ Valid
['L']         // ✓ Valid (length 1, just marker)

// Invalid:
[]            // ❌ Plain empty array not valid
['L', null]   // ❌ Null inside list not valid
```

**Widget Options**: Same as Choice

**Source**: `app/common/gristTypes.ts:53`

---

### Ref

Reference to a row in another table.

**Storage**: `number` (row ID)  
**Type Format**: `'Ref:TableName'`  
**Default**: `0`  
**Empty**: **`0`** (zero, NOT null!)

**CRITICAL**: 
- Empty reference is `0`, NOT `null`
- `0` means "no reference"
- Valid row IDs start at 1

**Examples**:
```typescript
// Valid reference to row 17
17

// No reference (null)
0  // ⚠️ Use 0, NOT null!

// Type specification
{
  type: 'Ref:People',
  value: 17
}
```

**Decoded/Lookup Format**:
```typescript
// Internal lookup form (temporary):
['R', 'People', 17]              // Explicit table reference
['l', 'John', {column: 'name'}]  // Lookup by visible column
```

**Widget Options**: None (display controlled by `visibleCol` and `displayCol`)

**Source**: `app/common/gristTypes.ts:54-55`

---

### RefList

List of references to rows in another table.

**Storage**: `['L', ...rowIds]` or `null`  
**Type Format**: `'RefList:TableName'`  
**Default**: `null`  
**Empty**: `null` OR `['L']` (both valid)

**CRITICAL**: Uses `'L'` marker, Ref does NOT!

**Examples**:
```typescript
// Multiple references
['L', 17, 42, 99]  // References to rows 17, 42, 99

// Empty list - BOTH valid:
null   // ✓ Valid
['L']  // ✓ Valid (length 1, just marker)

// Invalid:
[]           // ❌ Plain empty array
[17, 42]     // ❌ Missing 'L' marker
```

**Internal/Lookup Format**:
```typescript
['l', [17, 42], {column: 'visibleColId'}]  // Temporary lookup form
```

**Widget Options**: None

**Source**: `app/common/gristTypes.ts:56`

---

### Attachments

Special RefList pointing to `_grist_Attachments` table.

**Storage**: `['L', ...attachmentIds]` or `null`  
**Type**: `'Attachments'`  
**Default**: `null`  
**Empty**: `null` OR `['L']`

**Example**:
```typescript
['L', 123, 456, 789]  // Attachment IDs

// Each ID references a row in _grist_Attachments with:
// - fileIdent (checksum)
// - fileName
// - fileType (MIME)
// - fileSize
```

**Widget Options**:
```typescript
{
  height: '100'  // Display height in pixels
}
```

**Source**: `app/common/gristTypes.ts:59-60`

---

### Blob

Binary data (rarely used).

**Storage**: Binary  
**Default**: `null`  
**Empty**: `null`

**Note**: Rarely used in practice. Attachments are preferred for file storage.

---

### Any

Any value type (default for formula columns).

**Storage**: Any  
**Default**: `null`  
**Empty**: `null`

**Usage**: Formula columns that can return different types

---

### Id

Row ID (auto-generated, read-only).

**Storage**: `number`  
**Default**: `0` (auto-assigned)  
**Read-only**: Cannot be manually set

**Notes**:
- Always present in every table
- Auto-increments starting from 1
- Used for references

---

## CellValue Encoding

CellValues use either **primitives** or **encoded tuples** for complex types.

### Encoding Codes (GristObjCode)

| Code | Type | Format | Example | Purpose |
|------|------|--------|---------|---------|
| *none* | **Primitive** | Raw value | `123`, `"text"`, `true`, `null` | Simple types |
| **`L`** | **List** | `['L', ...values]` | `['L', 'a', 'b']` | ChoiceList, RefList |
| **`D`** | **DateTime** | `['D', secs, tz]` | `['D', 1704945919, 'UTC']` | DateTime + timezone |
| **`d`** | **Date** | `['d', secs]` | `['d', 1704844800]` | Date (UTC midnight) |
| **`R`** | **Reference** | `['R', table, id]` | `['R', 'People', 17]` | Ref (decoded) |
| **`r`** | **ReferenceList** | `['r', table, ids]` | `['r', 'People', [1, 2]]` | RefList (decoded) |
| **`l`** | **LookUp** | `['l', val, opts]` | `['l', 'John', {column: 'name'}]` | Lookup (temporary) |
| **`O`** | **Dict** | `['O', {key: val}]` | `['O', {name: 'John'}]` | Structured data |
| **`E`** | **Exception** | `['E', name, msg, details]` | `['E', 'ValueError', 'Invalid']` | Formula errors |
| **`P`** | **Pending** | `['P']` | `['P']` | Formula calculating |
| **`S`** | **Skip** | `['S']` | `['S']` | Skipped (displays as `'...'`) |
| **`C`** | **Censored** | `['C']` | `['C']` | ACL hidden value |
| **`U`** | **Unmarshallable** | `['U', repr]` | `['U', '<object>']` | Cannot serialize |
| **`V`** | **Versions** | `['V', version_obj]` | `['V', {...}]` | Multi-version comparison |

**Source**: `app/plugin/GristData.ts:1-18`

---

## Widget Options

Widget options control display formatting. **MUST be JSON strings** when stored.

### Universal Options (All Types)

```typescript
{
  alignment?: 'left' | 'center' | 'right',  // Cell alignment
  textColor?: string,                        // CSS color (e.g., '#FF0000')
  fillColor?: string,                        // Background color
  wrap?: boolean                             // Text wrapping
}
```

**TypeScript Bug Note**: The `WidgetOptions` interface in `app/common/WidgetOptions.ts:4-5` incorrectly types `textColor` and `fillColor` as the literal string `'string'` instead of the type `string`. Runtime behavior is correct (treats as `string`).

---

### Numeric Options (Numeric, Int)

```typescript
{
  numMode?: 'currency' | 'decimal' | 'percent' | 'scientific',
  numSign?: 'parens',      // Use (123) for negatives
  decimals?: number,       // Min fraction digits (0-20)
  maxDecimals?: number,    // Max fraction digits (0-20)
  currency?: string        // ISO 4217 code (e.g., 'USD')
}
```

**Example**:
```typescript
{
  numMode: 'currency',
  currency: 'USD',
  decimals: 2,
  maxDecimals: 2
}
// Displays: $1,234.56
```

**Source**: `app/common/NumberFormat.ts:28-38`

---

### Date/DateTime Options

```typescript
{
  dateFormat?: string,           // moment.js format (default: 'YYYY-MM-DD')
  timeFormat?: string,           // moment.js format (default: 'h:mma') [DateTime only]
  isCustomDateFormat?: boolean,  // Using custom format
  isCustomTimeFormat?: boolean   // Using custom time format [DateTime only]
}
```

**Common Formats**:
- Date: `'YYYY-MM-DD'`, `'MM/DD/YYYY'`, `'DD/MM/YYYY'`, `'MMMM D, YYYY'`
- Time: `'h:mma'`, `'HH:mm:ss'`, `'h:mm A'`

---

### Choice/ChoiceList Options

```typescript
{
  choices?: string[],           // Available choices
  choiceOptions?: {
    [choice: string]: {
      fillColor?: string,       // Background color
      textColor?: string        // Text color
    }
  }
}
```

**Example**:
```typescript
{
  choices: ['Red', 'Green', 'Blue'],
  choiceOptions: {
    'Red': {fillColor: '#FF0000', textColor: '#FFFFFF'},
    'Green': {fillColor: '#00FF00'}
  }
}
```

---

### Attachment Options

```typescript
{
  height?: string  // Display height in pixels (e.g., '36')
}
```

---

### Text Options

```typescript
{
  widget?: 'HyperLink'  // Make text clickable
}
```

---

### Serialization Rules ⚠️

**CRITICAL**: Widget options MUST be JSON.stringify'd:

```typescript
// ❌ WRONG
column.widgetOptions = {numMode: 'currency', currency: 'USD'};

// ✅ CORRECT
column.widgetOptions = JSON.stringify({numMode: 'currency', currency: 'USD'});

// Reading:
const options = JSON.parse(column.widgetOptions || '{}');
```

**Source**: `app/common/WidgetOptions.ts:1-11`

---

## Reference Columns

Reference columns (`Ref:Table`, `RefList:Table`) store row IDs but display values from other columns.

### How References Work

```
Ref column (stores)   →   visibleCol (lookup)   →   displayCol (display)
       17            →   'name' in People table  →   "John Smith"
```

### Column Metadata Fields

**Stored in `_grist_Tables_column`**:

```typescript
{
  type: "Ref:People",          // Column type with target table
  visibleCol: 45,              // Row ID of column for lookups (e.g., 'name')
  displayCol: 47,              // Row ID of column for display (e.g., 'fullName' formula)
  widgetOptions: "{}"          // Usually empty for Ref columns
}
```

### visibleCol vs displayCol

| Field | Purpose | Example | When Different |
|-------|---------|---------|----------------|
| **visibleCol** | Column to match user input | `name` column | User types "John" to find record |
| **displayCol** | Column to display in cell | `fullName` formula | Display "John Smith" (computed) |

**Common Patterns**:
- **Simple**: Both point to same column (e.g., both = `name`)
- **Computed**: `visibleCol` = `name`, `displayCol` = formula column

### Field Overrides

View fields (in `_grist_Views_section_field`) can override column defaults:

```typescript
{
  colRef: 35,           // Column being displayed
  visibleCol: 45,       // Override (optional)
  displayCol: 47        // Override (optional)
}
```

**Source**: `app/common/schema.ts:29-47,128-138`

---

## Identifier Validation

### TableId Rules

**Validation** (`sandbox/grist/identifiers.py`):
- Characters: `[a-zA-Z0-9_]+` (alphanumeric + underscore)
- **Must start with a letter** (not digit or underscore)
- Auto-generated tables are **capitalized** (e.g., `Table1`, `People`)
- Must not be a **Python keyword**
- Case-insensitive uniqueness

**Auto-generation**:
```python
"people" → "People"
"user data" → "UserData"
"123" → "T123"
""  → "Table1"
```

**Reserved Prefixes**:
- `_grist_*` - System metadata tables
- `GristHidden_*` - User-created hidden tables

**Examples**:
```typescript
// ❌ INVALID
"class"      // Python keyword
"for"        // Python keyword
"_private"   // Starts with underscore
"123Table"   // Starts with digit

// ✅ VALID
"Class"
"For"
"my_class"
"Table123"
```

---

### ColId Rules

**Validation**:
- Characters: `[a-zA-Z0-9_]+`
- **Must start with a letter**
- Must not be a **Python keyword**
- Case-insensitive uniqueness within table

**Auto-generation**:
```python
"name" → "name"
"first name" → "first_name"
"123" → "c123"
""  → "A"  (then "B", "C", ..., "Z", "AA", "AB", ...)
```

**Reserved Names**:
- `gristHelper_*` - System helper columns
- `manualSort` - Manual sort position
- `id` - Row ID column

---

### Python Keywords (Must Avoid)

```
False, None, True, and, as, assert, async, await, break, class, continue,
def, del, elif, else, except, finally, for, from, global, if, import, in,
is, lambda, nonlocal, not, or, pass, raise, return, try, while, with, yield
```

**Source**: `sandbox/grist/identifiers.py:14-127`

---

## Null Handling

### Null/Empty Values by Type

| Type | Null Input | Stored | Output | Display |
|------|-----------|--------|--------|---------|
| Text | `null` | `null` | `null` | Empty cell |
| Numeric | `null` | `null` | `null` | Empty cell |
| Int | `null` | `null` | `null` | Empty cell |
| Bool | `null` | `null` | `null` | Empty cell |
| Date | `null` | `null` | `null` | Empty cell |
| DateTime | `null` | `null` | `null` | Empty cell |
| Choice | `null` | `''` | `''` | Empty cell |
| ChoiceList | `null` | `null` | `null` or `['L']` | Empty cell |
| **Ref** | `null` | **`0`** | **`0`** | Empty cell ⚠️ |
| RefList | `null` | `null` | `null` or `['L']` | Empty cell |
| Attachments | `null` | `null` | `null` or `['L']` | Empty cell |

### Blank Value Detection

`isBlankValue()` considers these as "blank":

```typescript
null
""           // Empty string (after trim)
['L']        // Empty list
['r', 'Table', []]  // Empty reference list
```

**Source**: `app/common/gristTypes.ts:360-367`

---

## Common Pitfalls

### 1. **Ref Null is `0`, Not `null`**

```typescript
// ❌ WRONG
if (cellValue === null) {
  console.log("No reference");
}

// ✅ CORRECT
if (cellValue === 0) {
  console.log("No reference");
}
```

**Why**: Grist uses `0` as the sentinel value for empty references (row IDs start at 1).

---

### 2. **RefList Uses `'L'` Marker, Ref Does NOT**

```typescript
// ❌ WRONG
const refValue = ['R', 123];           // Ref NOT encoded in storage
const refListValue = [1, 2, 3];        // RefList needs marker

// ✅ CORRECT
const refValue = 123;                  // Ref is plain row ID
const refListValue = ['L', 1, 2, 3];  // RefList needs 'L'
```

---

### 3. **Empty Lists: `['L']` OR `null` (Both Valid)**

```typescript
// BOTH valid empty lists:
const empty1 = null;
const empty2 = ['L'];  // Length 1, just marker

// ❌ WRONG
const wrong1 = [];           // Plain empty array not valid
const wrong2 = ['L', null];  // Null inside list not valid
```

---

### 4. **Dates/DateTimes Use SECONDS, Not Milliseconds**

```typescript
// ❌ WRONG
const date = ['d', Date.now()];  // milliseconds!

// ✅ CORRECT
const date = ['d', Math.floor(Date.now() / 1000)];  // seconds
```

---

### 5. **widgetOptions Must Be JSON.stringify'd**

```typescript
// ❌ WRONG
column.widgetOptions = {numMode: 'currency', currency: 'USD'};

// ✅ CORRECT
column.widgetOptions = JSON.stringify({numMode: 'currency', currency: 'USD'});
```

---

### 6. **Reference Columns Don't Have Widget Options**

```typescript
// ❌ WRONG - trying to set format on Ref column
{
  type: 'Ref:People',
  widgetOptions: JSON.stringify({dateFormat: 'YYYY-MM-DD'})  // Ignored!
}

// ✅ CORRECT - format the REFERENCED column instead
{
  type: 'Ref:People',
  visibleCol: nameColumnId,  // Points to column with widget options
  displayCol: nameColumnId
}
```

---

### 7. **visibleCol Placement: Top-Level, NOT in widgetOptions**

```typescript
// ❌ WRONG
{
  type: 'Ref:People',
  widgetOptions: JSON.stringify({visibleCol: 25})  // WRONG!
}

// ✅ CORRECT
{
  type: 'Ref:People',
  visibleCol: 25,  // Top-level field
  widgetOptions: "{}"
}
```

---

### 8. **Column Type Must Include Table for Ref/RefList**

```typescript
// ❌ WRONG
type: 'Ref'        // Missing target table
type: 'RefList'    // Missing target table

// ✅ CORRECT
type: 'Ref:People'
type: 'RefList:Companies'
```

---

### 9. **DateTime Requires Timezone**

```typescript
// ❌ WRONG - missing timezone
const dateTime = ['D', 1704945919];

// ✅ CORRECT - includes timezone
const dateTime = ['D', 1704945919, 'America/New_York'];
const dateTimeUTC = ['D', 1704945919, 'UTC'];
```

---

### 10. **Identifier Names Are Case-Insensitive**

```typescript
// ❌ WRONG - these conflict!
tables: ['Users', 'users']
columns: ['Name', 'name']

// ✅ CORRECT - must be unique case-insensitively
tables: ['Users', 'Companies']
columns: ['Name', 'Email']
```

---

### 11. **Date Columns Store UTC Midnight**

```typescript
// Date column represents UTC midnight:
['d', 1704844800]  // 2024-01-10 00:00:00 UTC

// ❌ WRONG - using local midnight
const localMidnight = new Date('2024-01-10').getTime() / 1000;

// ✅ CORRECT - use UTC midnight
const utcMidnight = Date.UTC(2024, 0, 10) / 1000;
```

---

## Summary Checklist

When implementing Grist integrations:

- [ ] Use `0` for null Ref values (not `null`)
- [ ] Use `['L', ...]` for RefList and ChoiceList
- [ ] Empty lists can be `null` OR `['L']` (both valid)
- [ ] Store dates/times as **seconds** (not milliseconds)
- [ ] JSON.stringify widget options before storing
- [ ] Include table name in Ref/RefList types (`Ref:TableName`)
- [ ] Use Python identifier rules for TableId/ColId
- [ ] Avoid Python keywords in identifiers
- [ ] Check for case-insensitive uniqueness
- [ ] Reference columns inherit formatting from visibleCol
- [ ] visibleCol is top-level, NOT in widgetOptions

---

## Additional Resources

**Key Source Files**:
- `app/plugin/GristData.ts` - Core type definitions
- `app/common/gristTypes.ts` - Type utilities and validation
- `sandbox/grist/identifiers.py` - Identifier validation
- `app/common/ValueConverter.ts` - Type conversion logic
- `app/common/ValueFormatter.ts` - Display formatting
- `app/common/ValueParser.ts` - Input parsing
- `app/common/WidgetOptions.ts` - Widget option types

**Schema Tables**:
- `_grist_Tables` - Table metadata
- `_grist_Tables_column` - Column definitions
- `_grist_Views_section_field` - View field configuration
- `_grist_Attachments` - Attachment metadata

---

**Last Updated**: 2025-11-15  
**Maintainer**: Grist Labs (https://github.com/gristlabs/grist-core)
