# Grist Type System Reference

A complete reference for Grist's type system - column types, CellValue encoding, widget options, and validation rules for developers implementing Grist integrations.

---

## Quick Reference: Column Types

| Type | Storage Format | Input Example | Output Example | Default Value | Null/Empty | Notes |
|------|----------------|---------------|----------------|---------------|------------|-------|
| **Text** | `string` | `"hello"` | `"hello"` | `''` | `''` or `null` | Plain text |
| **Numeric** | `number` | `123.45` | `123.45` | `0` | `null` | Double precision float |
| **Int** | `number` | `42` | `42` | `0` | `null` | 32-bit integer |
| **Bool** | `boolean` | `true` | `true` | `false` | `null` | Stored as 0/1 in SQLite |
| **Date** | `number` (seconds) | `1704844800` | `['d', 1704844800]` | `null` | `null` | Days since epoch (as seconds) |
| **DateTime** | `['D', secs, tz]` | `['D', 1704945919, 'UTC']` | `['D', 1704945919, 'UTC']` | `null` | `null` | Seconds since epoch + timezone |
| **Choice** | `string` | `"option1"` | `"option1"` | `''` | `''` | Single selection |
| **ChoiceList** | `['L', ...]` | `['L', 'a', 'b']` | `['L', 'a', 'b']` | `null` | `null` | Multiple selections |
| **Ref** | `number` (row ID) | `17` | `17` | `0` | `0` | Reference to row ⚠️ |
| **RefList** | `['L', ...]` | `['L', 1, 2, 3]` | `['L', 1, 2, 3]` | `null` | `null` | Multiple row references |
| **Attachments** | `['L', ...]` | `['L', 123, 456]` | `['L', 123, 456]` | `null` | `null` | Special RefList to `_grist_Attachments` |
| **Blob** | Binary data | (binary) | (binary) | `null` | `null` | Rarely used, for binary data |
| **Any** | Various | Any type | Any type | `null` | `null` | For formula columns |
| **Id** | `number` | `1` | `1` | `0` | `0` | Row ID (auto-generated, read-only) |
| **PositionNumber** | `number` | `1.5` | `1.5` | `Infinity` | `Infinity` | Internal sorting position |
| **ManualSortPos** | `number` | `1.5` | `1.5` | `Infinity` | `Infinity` | Manual sort position |

### Default vs Null Values

**Important distinction:**
- **Default Value**: What gets inserted for new records (from `gristTypes.ts:22-42`)
- **Null/Empty**: What represents "no value" or empty cell

**Key differences:**
- `Text`, `Choice`: Default is `''` (empty string), which is also the empty representation
- `Numeric`, `Int`: Default is `0`, but `null` represents empty/no value
- `Bool`: Default is `false`, but `null` represents empty/no value
- `Ref`: Both default AND empty are `0` (zero means "no reference")
- Most others: Both default and empty are `null`

**Key Source Files:**
- `app/plugin/GristData.ts:67-69` - GristType definition
- `app/common/gristTypes.ts:22-42` - Default values per type (see `_defaultValues` map)
- `app/client/widgets/UserType.ts:38-308` - Widget mappings

---

## CellValue Encoding

CellValues use either **primitives** (`string`, `number`, `boolean`, `null`) or **encoded tuples** (`[code, ...args]`) for complex types.

### Encoding Reference (GristObjCode)

| Code | Type | Format | Example | Used For |
|------|------|--------|---------|----------|
| *none* | **Primitive** | Raw value | `123`, `"text"`, `true`, `null` | Simple types |
| **`L`** | **List** | `['L', ...values]` | `['L', 'a', 'b']` | ChoiceList, RefList |
| **`D`** | **DateTime** | `['D', seconds, timezone]` | `['D', 1704945919, 'America/New_York']` | DateTime with timezone |
| **`d`** | **Date** | `['d', seconds]` | `['d', 1704844800]` | Date (UTC midnight) |
| **`R`** | **Reference** | `['R', tableId, rowId]` | `['R', 'People', 17]` | Ref (decoded form) |
| **`r`** | **ReferenceList** | `['r', tableId, rowIds]` | `['r', 'People', [1, 2]]` | RefList (decoded form) |
| **`l`** | **LookUp** | `['l', value, options]` | `['l', 'John', {column: 'name'}]` | Reference lookup (temp) |
| **`O`** | **Dict** | `['O', {key: value}]` | `['O', {name: 'John'}]` | Structured data |
| **`E`** | **Exception** | `['E', name, msg, details]` | `['E', 'ValueError', 'Invalid']` | Formula errors |
| **`P`** | **Pending** | `['P']` | `['P']` | Formula calculating |
| **`S`** | **Skip** | `['S']` | `['S']` | Skipped value (displays as `'...'`) |
| **`C`** | **Censored** | `['C']` | `['C']` | Access control hidden |
| **`U`** | **Unmarshallable** | `['U', repr]` | `['U', '<object>']` | Cannot serialize |
| **`V`** | **Versions** | `['V', version_obj]` | `['V', {...}]` | Multi-version comparison |

**Key Source Files:**
- `app/plugin/GristData.ts:1-18` - GristObjCode enum (including Skip at line 10)
- `app/plugin/objtypes.ts:132-136` - SkipValue class (displays as `'...'`)
- `app/plugin/objtypes.ts:157-244` - encode/decode functions

### Encoding Details by Type

#### Primitives (Text, Numeric, Int, Bool)
```typescript
// Stored and transmitted as-is
"hello"     // Text
123.45      // Numeric
42          // Int
true        // Bool
null        // Any null value
```

#### Date
```typescript
// Stored as seconds since Unix epoch (for UTC midnight on that date)
['d', 1704844800]  // January 10, 2024 00:00:00 UTC
// Note: NOT milliseconds!
```

#### DateTime
```typescript
// Stored as seconds + timezone string
['D', 1704945919, 'America/New_York']  // Specific instant with timezone
['D', 1704945919, 'UTC']                // UTC time
// Note: Seconds, not milliseconds!
```

#### ChoiceList
```typescript
// Stored as list marker + choices
['L', 'option1', 'option2', 'option3']  // Multiple selections
['L']                                    // Empty list (length 1)
null                                     // Also represents empty
```

#### RefList
```typescript
// Stored as list marker + row IDs
['L', 17, 42, 99]    // References to rows 17, 42, 99
['L']                // Empty list
null                 // Also represents empty

// Internal/lookup form (temporary):
['l', [17, 42], {column: 'visibleColId'}]
```

#### Ref (Reference)
```typescript
// Stored as plain row ID (not a tuple!)
17      // Valid reference to row 17
0       // NULL/empty reference ⚠️ NOT null!

// Decoded/lookup form:
['R', 'TableName', 17]                     // Explicit table reference
['l', 'John Smith', {column: 'name'}]      // Lookup by visible column
```

**Key Source Files:**
- `app/common/ValueConverter.ts:30-82` - Conversion logic
- `app/common/gristTypes.ts:75-85` - Reencoding

### Critical Gotchas

#### 1. **RefList uses `'L'` code, Ref is a plain number**
```typescript
// ❌ WRONG
const refValue = ['R', 123];      // Ref is NOT encoded like this in storage!

// ✅ CORRECT
const refValue = 123;             // Ref is stored as plain row ID
const refListValue = ['L', 1, 2]; // RefList uses 'L' marker
```

#### 2. **Ref null is `0`, not `null`**
```typescript
// ❌ WRONG
if (refValue === null) { /* empty ref */ }

// ✅ CORRECT
if (refValue === 0) { /* empty ref */ }
```

#### 3. **Empty list is `['L']` (length 1) OR `null`**
```typescript
// Both are valid empty lists:
['L']   // Empty list with marker only
null    // Also represents empty

// ❌ WRONG
[]      // Plain empty array is NOT valid
```

#### 4. **Dates/DateTimes use SECONDS, not milliseconds**
```typescript
// ❌ WRONG
const date = ['d', Date.now()];                    // milliseconds

// ✅ CORRECT
const date = ['d', Math.floor(Date.now() / 1000)]; // seconds
```

**Key Source Files:**
- `app/common/gristTypes.ts:196-213` - Type validators
- `app/common/gristTypes.ts:360-367` - isBlankValue function

---

## Widget Options by Column Type

Widget options control display formatting and behavior. They are **stored as JSON strings** in the database.

### Universal Options (All Types)

```typescript
{
  alignment?: 'left' | 'center' | 'right',  // Cell text alignment
  textColor?: string,                        // CSS color (e.g., '#FF0000')
  fillColor?: string,                        // Background CSS color
  wrap?: true | false | undefined            // Text wrapping
}
```

**Note:** The `WidgetOptions` interface in `app/common/WidgetOptions.ts:4-5` has a TypeScript bug where `textColor` and `fillColor` are typed as the literal `'string'` instead of the type `string`. This documentation shows the correct semantic types. The runtime behavior treats these as `string` values (CSS colors).

### Numeric Options (Numeric, Int)

```typescript
{
  numMode: 'currency' | 'decimal' | 'percent' | 'scientific' | undefined,
  numSign: 'parens' | undefined,   // Use (123) for negative numbers
  decimals: number,                 // Min fraction digits (0-20)
  maxDecimals: number,              // Max fraction digits (0-20)
  currency: string                  // ISO 4217 code, e.g., 'USD' (requires numMode: 'currency')
}
```

**Example:**
```typescript
{
  numMode: 'currency',
  currency: 'USD',
  decimals: 2,
  maxDecimals: 2
}
// Displays: $1,234.56
```

### Date/DateTime Options

```typescript
{
  dateFormat: string,              // moment.js format (default: 'YYYY-MM-DD')
  timeFormat: string,              // moment.js format (default: 'h:mma') [DateTime only]
  isCustomDateFormat: boolean,     // Whether using custom format
  isCustomTimeFormat: boolean      // Whether using custom time format [DateTime only]
}
```

**Common Date Formats:**
- `'YYYY-MM-DD'` → 2024-01-10
- `'MM/DD/YYYY'` → 01/10/2024
- `'DD/MM/YYYY'` → 10/01/2024
- `'MMMM D, YYYY'` → January 10, 2024

**Common Time Formats:**
- `'h:mma'` → 3:45pm
- `'HH:mm:ss'` → 15:45:30
- `'h:mm A'` → 3:45 PM

### Choice/ChoiceList Options

```typescript
{
  choices: string[],                          // Available choice values
  choiceOptions: {
    order: 'custom' | 'alphabetical'         // Sort order
  }
}
```

**Example:**
```typescript
{
  choices: ['Red', 'Green', 'Blue'],
  choiceOptions: { order: 'custom' }
}
```

### Reference Options (Ref, RefList)

Reference columns **do not have their own widget options**. Display formatting is determined by:
1. The `visibleCol` field (which column to use for lookups)
2. The `displayCol` field (which column to display)
3. Widget options come from the **referenced column**, not the reference column itself

See "Reference Column Properties" section below.

### Attachment Options

```typescript
{
  height: string   // Display height in pixels (e.g., '36')
}
```

### Text Options (Special Widgets)

```typescript
{
  widget: 'HyperLink' | undefined   // Make text clickable as link
}
```

### Serialization Warning ⚠️

Widget options **MUST be JSON.stringify'd** when stored in the database:

```typescript
// ❌ WRONG
column.widgetOptions = { numMode: 'currency', currency: 'USD' };

// ✅ CORRECT
column.widgetOptions = JSON.stringify({ numMode: 'currency', currency: 'USD' });
```

**Key Source Files:**
- `app/common/WidgetOptions.ts:1-11` - WidgetOptions interface
- `app/common/NumberFormat.ts:28-38` - Numeric options
- `app/client/widgets/UserType.ts:38-308` - Default options per type
- `app/client/models/entities/ViewFieldRec.ts:65-69` - widgetOptionsJson

---

## Reference Column Properties

Reference columns (`Ref:TableName`, `RefList:TableName`) store row IDs but display values from other columns.

### How References Work

```
Ref column (stores)   →   visibleCol (lookup)   →   displayCol (display)
       17            →   'name' in People table  →   "John Smith"
```

### Column Metadata Fields

Stored in `_grist_Tables_column` table:

```typescript
{
  type: "Ref:People",          // Column type with target table
  visibleCol: 45,              // Row ID of column to use for lookups (e.g., 'name' column)
  displayCol: 47,              // Row ID of column to display (e.g., 'fullName' formula column)
  widgetOptions: "{...}"       // JSON (usually empty for Ref columns)
}
```

### visibleCol vs displayCol

| Field | Purpose | Example | When Different |
|-------|---------|---------|----------------|
| **visibleCol** | Column to match user input against | `name` column | User types "John" to find record |
| **displayCol** | Column to display in cell | `fullName` formula | Display "John Smith" (computed) |

**Common Pattern:**
- **Simple case**: `visibleCol` and `displayCol` are the same (e.g., both point to `name`)
- **Computed display**: `visibleCol` = `name`, `displayCol` = formula like `$firstName + " " + $lastName`

### Field Overrides

View fields (in `_grist_Views_section_field`) can override column defaults:

```typescript
{
  colRef: 35,           // Column being displayed
  visibleCol: 45,       // Override column's visibleCol (optional)
  displayCol: 47        // Override column's displayCol (optional)
}
```

### Attachments Special Case

Attachments is a special `RefList` type:
- **Always** references `_grist_Attachments` system table
- Each attachment is a row with metadata (filename, size, etc.)
- Stored as: `['L', attachmentId1, attachmentId2, ...]`

**Key Source Files:**
- `app/common/schema.ts:29-47,128-138` - Column/field schema
- `app/common/ValueParser.ts:121-213` - Reference parsing
- `app/common/gristTypes.ts:59-60` - Attachments handling

---

## Identifier Validation Rules

### TableId Rules

**Validation** (from `sandbox/grist/identifiers.py`):
- Characters: `[a-zA-Z0-9_]+` (alphanumeric + underscore)
- Must start with a **letter** (not digit or underscore)
- Auto-generated tables are **capitalized** (e.g., `Table1`, `People`)
- Must not be a **Python keyword**
- Case-insensitive uniqueness (e.g., `Users` and `users` conflict)

**Auto-generation**:
```python
# Pattern: Capitalize first letter, add suffix if needed
"people" → "People"
"user data" → "UserData"
"123" → "T123"
""  → "Table1"
```

**Reserved Prefixes**:
- `_grist_*` - System metadata tables (e.g., `_grist_Tables`)
- `GristHidden_*` - User-created hidden tables

### ColId Rules

**Validation** (from `sandbox/grist/identifiers.py`):
- Characters: `[a-zA-Z0-9_]+`
- Must start with a **letter** (not digit or underscore)
- Must not be a **Python keyword**
- Case-insensitive uniqueness within table

**Auto-generation**:
```python
# Pattern: Lowercase, prepend 'c' if needed, Excel-style (A, B, ..., Z, AA, AB)
"name" → "name"
"first name" → "first_name"
"123" → "c123"
""  → "A"  (then "B", "C", ..., "Z", "AA", "AB", ...)
```

**Reserved Names**:
- `gristHelper_*` - System-generated helper columns
- `manualSort` - Manual sort order column
- `id` - Row ID column (always present)

### Python Keywords (Must Avoid)

```
False, None, True, and, as, assert, async, await, break, class, continue,
def, del, elif, else, except, finally, for, from, global, if, import, in,
is, lambda, nonlocal, not, or, pass, raise, return, try, while, with, yield
```

**Example Conflicts**:
```python
# ❌ INVALID
"class" → "c_class"  # 'class' is a keyword
"for" → "c_for"      # 'for' is a keyword
"_private" → "c_private"  # starts with underscore

# ✅ VALID
"Class" → "Class"
"For" → "For"
"my_class" → "my_class"
```

### DocId Format

- No strict validation in application code
- Typically UUID or human-readable identifier
- Format depends on deployment (SQLite, PostgreSQL, etc.)

**Key Source Files:**
- `sandbox/grist/identifiers.py:14-127` - All identifier validation
- `app/common/gristTypes.ts:14-19` - Hidden column detection
- `app/common/isHiddenTable.ts` - Hidden table detection

---

## Null Handling by Type

**Note:** This section describes null/empty value handling. For default values inserted into new records, see the "Default vs Null Values" section in Quick Reference above.

| Type | Null Input | Stored As | Output | Display | Notes |
|------|-----------|-----------|--------|---------|-------|
| **Text** | `null` | `null` | `null` | Empty cell | |
| **Numeric** | `null` | `null` | `null` | Empty cell | |
| **Int** | `null` | `null` | `null` | Empty cell | |
| **Bool** | `null` | `null` | `null` | Empty cell | |
| **Date** | `null` | `null` | `null` | Empty cell | |
| **DateTime** | `null` | `null` | `null` | Empty cell | |
| **Choice** | `null` | `''` | `''` | Empty/first choice | ⚠️ Empty string, not null |
| **ChoiceList** | `null` | `null` | `null` | Empty cell | `['L']` also valid |
| **Ref** | `null` | `0` | `0` | Empty cell | ⚠️ **Zero, not null!** |
| **RefList** | `null` | `null` | `null` | Empty cell | `['L']` also valid |
| **Attachments** | `null` | `null` | `null` | Empty cell | |
| **Any** | `null` | `null` | `null` | Empty cell | |

### Blank Value Detection

`isBlankValue()` considers these as "blank":
```typescript
// From gristTypes.ts:360-367
null
""           // Empty string (after trim)
['L']        // Empty list
['r', 'Table', []]  // Empty reference list
```

### Conversion Rules

```typescript
// Ref → RefList
0 → null         // No ref becomes no refs

// RefList → Ref
null → 0         // No refs becomes no ref
['L'] → 0        // Empty list becomes no ref
['L', 17] → 17   // Single ref extracted
['L', 1, 2] → "1, 2"  // Multiple refs become text (error)
```

**Key Source Files:**
- `app/common/gristTypes.ts:22-42` - Default values
- `app/common/gristTypes.ts:360-367` - isBlankValue
- `app/common/ValueConverter.ts:218-263` - Conversion with nulls

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

**Why:** Grist uses `0` as the sentinel value for empty references to maintain consistency with row IDs (which start at 1).

---

### 2. **RefList Uses `'L'` Marker, Ref Does Not**

```typescript
// ❌ WRONG
const refValue = ['R', 123];           // Ref stored as tuple
const refListValue = [1, 2, 3];         // RefList as plain array

// ✅ CORRECT
const refValue = 123;                   // Ref is plain row ID
const refListValue = ['L', 1, 2, 3];   // RefList needs 'L' marker
```

---

### 3. **Empty Lists Can Be `['L']` OR `null`**

```typescript
// Both are valid empty lists:
const empty1 = null;
const empty2 = ['L'];  // Length 1, just the marker

// ❌ WRONG - these are NOT valid empty lists:
const wrong1 = [];
const wrong2 = ['L', null];
```

---

### 4. **Dates Use Seconds, Not Milliseconds**

```typescript
// ❌ WRONG
const date = ['d', Date.now()];  // milliseconds!

// ✅ CORRECT
const date = ['d', Math.floor(Date.now() / 1000)];  // seconds
```

---

### 5. **Widget Options Must Be JSON.stringify'd**

```typescript
// ❌ WRONG
column.widgetOptions = { numMode: 'currency', currency: 'USD' };

// ✅ CORRECT
column.widgetOptions = JSON.stringify({ numMode: 'currency', currency: 'USD' });
```

**Reading:**
```typescript
const options = JSON.parse(column.widgetOptions || '{}');
```

---

### 6. **Reference Columns Don't Have Widget Options**

```typescript
// ❌ WRONG - trying to set format on Ref column
{
  type: 'Ref:People',
  widgetOptions: JSON.stringify({ dateFormat: 'YYYY-MM-DD' })  // Ignored!
}

// ✅ CORRECT - format the REFERENCED column instead
{
  type: 'Ref:People',
  visibleCol: nameColumnId,  // Points to column with widget options
  displayCol: nameColumnId
}
```

---

### 7. **ChoiceList Parsing: Strings Aren't Auto-Split**

```typescript
// Converting from Text to ChoiceList:

// ❌ WRONG - assumes comma splitting happens automatically
"Red, Green, Blue"  → ['L', 'Red, Green, Blue']  // Single choice!

// ✅ CORRECT - parse explicitly if needed
const parser = createParser('ChoiceList', options);
parser.parse("Red, Green, Blue")  → ['L', 'Red', 'Green', 'Blue']
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

### 11. **Hidden Columns/Tables Need Special Prefixes**

```typescript
// To hide a column:
colId: 'gristHelper_Display'  // Hidden from UI

// To hide a table:
tableId: 'GristHidden_Temp'   // User-created hidden table
tableId: '_grist_Custom'      // System table (reserved)
```

---

### 12. **Date Columns Store Days as Seconds (UTC Midnight)**

```typescript
// Date column value represents UTC midnight:
['d', 1704844800]  // 2024-01-10 00:00:00 UTC

// ❌ WRONG - using local midnight
const localMidnight = new Date('2024-01-10').getTime() / 1000;

// ✅ CORRECT - use UTC midnight
const utcMidnight = Date.UTC(2024, 0, 10) / 1000;
```

---

## Summary Checklist

When implementing Grist integrations, remember:

- [ ] Use `0` for null Ref values (not `null`)
- [ ] Use `['L', ...]` for RefList and ChoiceList
- [ ] Store dates/times as **seconds** (not milliseconds)
- [ ] JSON.stringify widget options before storing
- [ ] Include table name in Ref/RefList types (`Ref:TableName`)
- [ ] Use Python identifier rules for TableId/ColId
- [ ] Avoid Python keywords in identifiers
- [ ] Check for case-insensitive uniqueness
- [ ] Empty lists can be `null` or `['L']`
- [ ] Reference columns inherit formatting from visibleCol

---

## Additional Resources

**Key Source Files:**
- `app/plugin/GristData.ts` - Core type definitions
- `app/common/gristTypes.ts` - Type utilities and validation
- `sandbox/grist/identifiers.py` - Identifier validation
- `app/common/ValueConverter.ts` - Type conversion logic
- `app/common/ValueFormatter.ts` - Display formatting
- `app/common/ValueParser.ts` - Input parsing
- `app/common/WidgetOptions.ts` - Widget option types
- `documentation/grist-data-format.md` - Data format specification

**Schema Tables:**
- `_grist_Tables` - Table metadata
- `_grist_Tables_column` - Column definitions
- `_grist_Views_section_field` - View field configuration
- `_grist_Attachments` - Attachment metadata

---

*This reference was generated from Grist source code analysis. For the latest information, consult the source files listed above.*
