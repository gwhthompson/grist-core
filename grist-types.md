# Grist Type System Reference

Complete reference for Grist's type system - column types, CellValue encoding, and widget options.

**Audience:** Developers implementing Grist integrations
**Last Updated:** 2025-11-15
**Schema Version:** 44

---

## Quick Reference: Column Types

| Type | Storage Format | Input | Output | Null Value | Default |
|------|---------------|-------|--------|-----------|---------|
| **Text** | String | Any value | String | `''` (empty string) | `''` |
| **Numeric** | Float/Int | Number string | Number | `null` | `0` |
| **Int** | Integer | Number string | 32-bit signed int | `null` | `0` |
| **Bool** | 0/1 (SQLite) | Boolean-like | `true`/`false` | `null` | `false` (0) |
| **Date** | Timestamp (seconds) | Date string | `["d", timestamp]` | `null` | `null` |
| **DateTime** | Timestamp (seconds) | DateTime string | `["D", timestamp, tz]` | `null` | `null` |
| **Choice** | String | String from choices | String | `null` | `''` |
| **ChoiceList** | Array | Array of strings | `["L", choice1, ...]` | `null` | `null` |
| **Ref** | Integer (row ID) | Reference value | Number | **0** | **0** |
| **RefList** | Array of integers | Array of references | `["L", id1, id2, ...]` | `null` | `null` |
| **Attachments** | Array of integers | Attachment IDs | `["L", id1, id2, ...]` | `null` | `null` |
| **Id** | Integer (auto) | Auto-generated | Number | N/A (never null) | `0` |
| **ManualSortPos** | Float | Position number | Number | N/A (never null) | `Infinity` (1e999) |
| **PositionNumber** | Float | Position number | Number | N/A (never null) | `Infinity` (1e999) |
| **Any** | Varies | Any normal value | Varies | `null` | `null` |
| **Blob** | Bytes | Binary data | Bytes | `null` | `null` |

**Key Files:**
- TypeScript: `app/plugin/GristData.ts` (lines 1-70), `app/common/gristTypes.ts` (lines 22-42)
- Python: `sandbox/grist/usertypes.py` (lines 35-52)

---

## CellValue Encoding

`CellValue` is the universal type for cell content in Grist. It can be a primitive (`number`, `string`, `boolean`, `null`) or an encoded tuple `[code, ...args]`.

### Type Definition

```typescript
type CellValue = number | string | boolean | null | [GristObjCode, ...unknown[]];
```

**Source:** `app/plugin/GristData.ts:46`

### Primitives (Stored Directly)

These types store their values as-is without encoding:

| Type | Storage | Example |
|------|---------|---------|
| Text | String | `"hello"` |
| Numeric | Number | `123.45` |
| Int | Number | `42` |
| Bool | Boolean/Number | `true` or `1` |
| Ref | Number | `17` (row ID) |
| Choice | String | `"Option A"` |

### Encoded Types (Array Tuples)

Complex types are encoded as arrays with a code character followed by arguments:

#### GristObjCode Reference

```typescript
enum GristObjCode {
  List            = 'L',    // ["L", item1, item2, ...]
  LookUp          = 'l',    // ["l", value, options]
  Dict            = 'O',    // ["O", {key: value, ...}]
  DateTime        = 'D',    // ["D", timestamp, timezone]
  Date            = 'd',    // ["d", timestamp]
  Skip            = 'S',    // ["S"]
  Censored        = 'C',    // ["C"]
  Reference       = 'R',    // ["R", table_id, row_id]
  ReferenceList   = 'r',    // ["r", table_id, [row_ids]]
  Exception       = 'E',    // ["E", name, message, details, user_input]
  Pending         = 'P',    // ["P"]
  Unmarshallable  = 'U',    // ["U", text_repr]
  Versions        = 'V',    // ["V", version_obj]
}
```

**Source:** `app/plugin/GristData.ts:4-18`

#### Encoding Examples

```typescript
// Date: January 1, 2024 (midnight UTC)
["d", 1704067200]

// DateTime: January 1, 2024 3:30 PM EST
["D", 1704135000, "America/New_York"]

// ChoiceList: Multiple selections
["L", "Red", "Blue", "Green"]

// RefList: References to rows 1, 5, 10
["L", 1, 5, 10]

// Reference (in Any column): Table "People", row 17
["R", "People", 17]

// ReferenceList (in Any column): Table "Tags", rows [3, 7]
["r", "Tags", [3, 7]]

// Exception: Division by zero
["E", "ZeroDivisionError", "division by zero", null]

// Empty List
["L"]

// Empty ReferenceList
["L"]  // Note: Same as empty List when in RefList column
```

### Critical Gotchas

⚠️ **CRITICAL ENCODING DIFFERENCES:**

1. **RefList vs Reference Encoding**
   - ❌ **WRONG:** RefList uses `"r"` code: `["r", "Table", [1, 2]]`
   - ✅ **CORRECT:** RefList in column uses `"L"` code: `["L", 1, 2, 3]`
   - The `"r"` code is ONLY for ReferenceList values stored in Any columns
   - In actual RefList columns, values are encoded with `"L"` (list of row IDs)

2. **Ref Column Null Representation**
   - ❌ **WRONG:** `null` means no reference
   - ✅ **CORRECT:** `0` means no reference
   - Ref columns use `0` as their null/empty value
   - Actual `null` in a Ref column may cause validation errors

3. **Date/DateTime Timezone Handling**
   - Dates store timestamps at UTC midnight: `["d", timestamp]`
   - DateTimes include timezone: `["D", timestamp, "America/New_York"]`
   - Timestamp is always in **seconds** (not milliseconds)
   - JavaScript Date uses milliseconds, so multiply/divide by 1000

4. **Empty List vs Null**
   - Empty list: `["L"]` (one element: the code)
   - Null: `null` (both are valid for list types)
   - Empty string: `""` (different from null for Text)
   - `isBlankValue()` treats all as blank: `null`, `""`, `["L"]`

5. **ChoiceList Encoding**
   - ChoiceList stores string values: `["L", "Choice1", "Choice2"]`
   - RefList stores integers: `["L", 1, 5, 10]`
   - Both use `"L"` code but different value types

### Encoding/Decoding Functions

**TypeScript:**
- `encodeObject(value)`: Convert object to CellValue - `app/plugin/objtypes.ts:157-194`
- `decodeObject(value)`: Convert CellValue to object - `app/plugin/objtypes.ts:201-229`

**Python:**
- `encode_object(value)`: Convert object to CellValue - `sandbox/grist/objtypes.py:163-220`
- `decode_object(value)`: Convert CellValue to object - `sandbox/grist/objtypes.py:222-257`

### Helper Classes

```typescript
class GristDate extends Date           // Date with YYYY-MM-DD toString()
class GristDateTime extends Date       // DateTime with timezone property
class Reference                        // {tableId, rowId}
class ReferenceList                    // {tableId, rowIds[]}
class RaisedException                  // Formula error wrapper
class PendingValue                     // "Loading..." placeholder
class SkipValue                        // "..." placeholder
class CensoredValue                    // "CENSORED" (access control)
class UnknownValue                     // Fallback for unknown types
```

**Source:** `app/plugin/objtypes.ts:16-149`

---

## Widget Options by Column Type

Widget options control how data is displayed and formatted. They are stored as JSON strings in the database.

### Base Interface

```typescript
interface WidgetOptions extends NumberFormatOptions {
  // Universal options (all types)
  alignment?: 'left' | 'center' | 'right';
  textColor?: string;           // CSS color
  fillColor?: string;           // CSS color (background)
  wrap?: boolean;               // Text wrapping

  // Number formatting
  numMode?: 'currency' | 'decimal' | 'percent' | 'scientific' | null;
  numSign?: 'parens' | null;    // Use () for negative numbers
  decimals?: number | null;      // Min fraction digits (0-20)
  maxDecimals?: number | null;   // Max fraction digits (0-20)
  currency?: string | null;      // Currency code, e.g., 'USD'

  // Date/DateTime formatting
  dateFormat?: string;           // e.g., 'YYYY-MM-DD', 'MM/DD/YYYY'
  timeFormat?: string;           // e.g., 'h:mma', 'HH:mm:ss'

  // Choice/ChoiceList
  choices?: Array<string>;       // Available options
  choiceOptions?: object;        // Per-choice metadata

  // Special widgets
  widget?: 'HyperLink';          // Text as hyperlink
}
```

**Source:** `app/common/WidgetOptions.ts:3-11`, `app/common/NumberFormat.ts:27-38`

### Number Format Options

| Option | Type | Values | Description |
|--------|------|--------|-------------|
| `numMode` | string\|null | `'currency'`, `'decimal'`, `'percent'`, `'scientific'`, `null` | Display mode |
| `numSign` | string\|null | `'parens'`, `null` | Use (123) for negative |
| `decimals` | number\|null | 0-20 | Minimum fraction digits |
| `maxDecimals` | number\|null | 0-20 | Maximum fraction digits |
| `currency` | string\|null | 'USD', 'EUR', etc. | Currency code (ISO 4217) |

**Examples:**

```json
// Currency: $1,234.56
{"numMode": "currency", "currency": "USD", "decimals": 2}

// Percentage: 12.3%
{"numMode": "percent", "decimals": 1}

// Scientific: 1.23E3
{"numMode": "scientific"}

// Decimal with separators: 1,234.56
{"numMode": "decimal", "decimals": 2, "maxDecimals": 2}

// Accounting format: (1,234.56)
{"numMode": "currency", "currency": "USD", "numSign": "parens", "decimals": 2}
```

**Source:** `app/common/NumberFormat.ts:1-92`

### Date/DateTime Format Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dateFormat` | string | `'YYYY-MM-DD'` | Date format string |
| `timeFormat` | string | `'h:mma'` | Time format string |

**Common Date Formats:**
- `'YYYY-MM-DD'` → 2024-01-15
- `'MM/DD/YYYY'` → 01/15/2024
- `'DD MMM YYYY'` → 15 Jan 2024
- `'ddd, MMM D'` → Mon, Jan 15

**Common Time Formats:**
- `'h:mma'` → 3:30pm
- `'HH:mm'` → 15:30
- `'HH:mm:ss'` → 15:30:45
- `'h:mm A'` → 3:30 PM

**Combined DateTime:**
```json
{
  "dateFormat": "YYYY-MM-DD",
  "timeFormat": "HH:mm:ss"
}
```

**Source:** `app/common/ValueFormatter.ts:142-202`

### Choice/ChoiceList Options

```typescript
{
  "choices": ["Option A", "Option B", "Option C"],
  "choiceOptions": {
    "Option A": {"fillColor": "#FF0000", "textColor": "#FFFFFF"},
    "Option B": {"fillColor": "#00FF00"}
  }
}
```

### Widget Type Defaults

| Column Type | Default Widget | Default Options |
|-------------|---------------|-----------------|
| Text | TextBox | `{alignment: 'left'}` |
| Numeric | TextBox | `{decimals: undefined, numMode: undefined}` |
| Int | TextBox | `{decimals: 0}` |
| Bool | CheckBox | `{}` |
| Date | TextBox | `{dateFormat: 'YYYY-MM-DD'}` |
| DateTime | TextBox | `{dateFormat: 'YYYY-MM-DD', timeFormat: 'h:mma'}` |
| Choice | TextBox | `{choices: undefined}` |
| ChoiceList | TextBox | `{choices: undefined}` |
| Ref | Reference | `{alignment: 'left'}` |
| RefList | Reference | `{alignment: 'left'}` |
| Attachments | Attachments | `{height: '36'}` |

**Source:** `app/client/widgets/UserType.ts:38-308`

### Serialization Warning

⚠️ **CRITICAL:** Widget options MUST be JSON-serialized strings in the database.

```python
# Python: Writing widget options
column_spec = {
    "widgetOptions": json.dumps({
        "numMode": "currency",
        "currency": "USD",
        "decimals": 2
    })
}

# NOT this:
column_spec = {
    "widgetOptions": {"numMode": "currency"}  # WRONG: Must be string
}
```

```typescript
// TypeScript: Writing widget options
const widgetOptions = JSON.stringify({
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'h:mma'
});

// Reading widget options
const options = JSON.parse(widgetOptionsString);
```

**Database Schema:** `_grist_Tables_column.widgetOptions` is type `Text`, not JSON object.

---

## Reference Column Properties

Reference columns (Ref and RefList) use two special properties to control display behavior.

### visibleCol

**Purpose:** Points to the column in the referenced table that should be displayed to users.

**Type:** `Ref:_grist_Tables_column` (column ID in the metadata)

**Location:** Set on the Ref/RefList column itself

**Example:**
- Table `Orders` has column `customer` of type `Ref:People`
- `customer.visibleCol` points to `People.name` column
- Users see customer names instead of row IDs

**How It Works:**
1. User creates a Ref column: `Orders.customer → People`
2. Grist prompts: "Which column to display?"
3. User selects: `People.name`
4. `visibleCol` is set to the column ID of `People.name`
5. Grist auto-creates a formula column: `_gristHelper_Display_customer`

**Source:** `app/common/schema.ts:42`, `sandbox/grist/schema.py:82-85`

### displayCol

**Purpose:** Points to the auto-generated formula column that fetches the visible value.

**Type:** `Ref:_grist_Tables_column` (column ID)

**Location:** Set on the Ref/RefList column itself

**Auto-Generated:** Created automatically when `visibleCol` is set

**Example:**
- `Orders.customer` (Ref:People) with `visibleCol` → `People.name`
- Grist creates: `Orders._gristHelper_Display_customer`
- Formula: `$customer.name`
- `displayCol` points to `_gristHelper_Display_customer`

**Why Two Properties?**
- `visibleCol`: Where to look (in the other table)
- `displayCol`: How to fetch it (formula in this table)

**Complete Flow:**

```
Orders Table:
  - customer (Ref:People)
    ├─ visibleCol → People.name (column ID: 15)
    └─ displayCol → Orders._gristHelper_Display_customer (column ID: 28)

  - _gristHelper_Display_customer (Text, formula)
    └─ formula: "$customer.name"

When displaying:
1. Ref value: 42 (row ID in People)
2. Display formula: $customer.name → looks up People[42].name
3. Shows: "John Doe"
```

**Source:** `sandbox/grist/schema.py:80-85`

### Setting Reference Display

**Python Example:**

```python
# Create Ref column with visible column
self.apply_user_action(['AddColumn', 'Orders', 'customer', {
    'type': 'Ref:People',
    'visibleCol': 15  # Column ID of People.name
}])

# The displayCol is created automatically
```

**API Example:**

```json
{
  "columns": {
    "customer": {
      "type": "Ref:People",
      "visibleCol": 15
    }
  }
}
```

### visibleCol Placement in Field vs Column

⚠️ **Important:** `visibleCol` can be set on:
1. **Column level** (`_grist_Tables_column.visibleCol`): Default for all views
2. **Field level** (`_grist_Views_section_field.visibleCol`): Override for specific view

Field-level takes precedence over column-level.

**Source:** `app/common/schema.ts:29-47, 135`

---

## Identifier Validation Rules

Grist enforces strict validation on identifiers to ensure compatibility with Python and SQLite.

### TableId Rules

**Format:** Python identifier, UPPERCASE preference

**Validation:**
1. Must be valid Python identifier: `[a-zA-Z_][a-zA-Z0-9_]*`
2. Cannot be a Python keyword
3. Normalized to remove accents (NFKD normalization)
4. Invalid characters replaced with `_`
5. Prefix `T` added if starts with digit or underscore
6. First letter capitalized

**Generation Function:** `pick_table_ident(ident, avoid=set())`

**Examples:**

```python
# Valid table IDs
"Users"
"ProductCatalog"
"Orders2023"
"T2024_Data"  # Added T prefix (started with digit)

# Sanitization examples
"my table" → "My_table"      # Spaces to underscores, capitalize
"2023Data" → "T2023Data"     # Prefix T (started with digit)
"café" → "Cafe"              # Accent removed
"class" → "Tclass"           # Python keyword, prefix T
"_private" → "T_private"     # Leading underscore, prefix T
```

**Source:** `sandbox/grist/identifiers.py:75-82`

### ColId Rules

**Format:** Python identifier, lowercase preference

**Validation:**
1. Must be valid Python identifier: `[a-zA-Z_][a-zA-Z0-9_]*`
2. Cannot be a Python keyword
3. Normalized to remove accents (NFKD normalization)
4. Invalid characters replaced with `_`
5. Prefix `c` added if starts with digit or underscore
6. Leading underscores removed

**Generation Function:** `pick_col_ident(ident, avoid=set())`

**Reserved Prefixes:**
- `gristHelper_` - Auto-generated helper columns
- `manualSort` - Manual sorting position

**Examples:**

```python
# Valid column IDs
"name"
"email"
"created_date"
"total_2023"
"c2024"  # Added c prefix (started with digit)

# Sanitization examples
"First Name" → "First_Name"
"2023_total" → "c2023_total"   # Prefix c (started with digit)
"über" → "uber"                 # Accent removed
"class" → "cclass"              # Python keyword, prefix c
"_hidden" → "c_hidden"          # Leading underscore, prefix c
```

**Source:** `sandbox/grist/identifiers.py:84-91`

### DocId Format

**Format:** Base58-encoded UUID, 22 characters

**Generation:**
- Standard UUID v4 (128-bit)
- Converted to Base58 (Flickr alphabet)
- Padded to exactly 22 characters with `'1'` (Base58 zero)

**Character Set:** Base58 (no 0, O, I, l for clarity)
`123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`

**Example DocIds:**
```
qYctT4dWLVqQ8n3JVNs3YF
aBcDeFgHiJkLmNoPqRsTuV
1111111111111111111111  // Minimum value (all padding)
```

**URL Usage:**
- Full URL: `https://docs.getgrist.com/qYctT4dWLVqQ8n3JVNs3YF`
- Short URL: First 12+ characters: `https://docs.getgrist.com/qYctT4dWLVqQ`
- Minimum prefix length: 12 characters (`MIN_URLID_PREFIX_LENGTH`)

**Generation Function:** `makeId()` in `app/server/lib/idUtils.ts:8-16`

**Source:** `app/server/lib/idUtils.ts:8-16`, `app/common/gristUrls.ts:82`

### Python Keywords to Avoid

Complete list of Python 3 keywords that cannot be used as identifiers:

```
False      None       True       and        as         assert
async      await      break      class      continue   def
del        elif       else       except     finally    for
from       global     if         import     in         is
lambda     nonlocal   not        or         pass       raise
return     try        while      with       yield
```

**Check Function:** `keyword.iskeyword(ident)` in Python

**Source:** `sandbox/grist/identifiers.py:9, 46-47`

### Case Sensitivity

⚠️ **Important:**
- TableIds and ColIds are **case-insensitive** for conflict detection
- Stored case is preserved
- Comparison uses `ident.upper()` to avoid conflicts
- `Users` and `USERS` would conflict

**Example:**

```python
# These would conflict:
pick_table_ident("Users", avoid={"USERS"})  # Would add suffix: Users2
```

---

## Null Handling by Type

How each type handles null values, both for input and storage.

### Null Acceptance Table

| Type | Accepts Null? | Null Input → Stored → Output | isBlankValue() |
|------|---------------|------------------------------|----------------|
| **Any** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Text** | ✅ Yes | `null` → `''` (default) or `null` | ✅ Yes (if `''` or `null`) |
| **Numeric** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Int** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Bool** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Date** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **DateTime** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Choice** | ✅ Yes | `null` → `''` or `null` | ✅ Yes (if `''` or `null`) |
| **ChoiceList** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Ref** | ❌ **NO** | `null` → **`0`** → `0` | ⚠️ No (uses `0`) |
| **RefList** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Attachments** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |
| **Id** | ❌ No | Auto-generated, never null | No |
| **ManualSortPos** | ❌ No | Auto-generated, never null | No |
| **PositionNumber** | ❌ No | Auto-generated, never null | No |
| **Blob** | ✅ Yes | `null` → `null` → `null` | ✅ Yes |

**Source:** `app/common/gristTypes.ts:196-213`, `sandbox/grist/usertypes.py:136-528`

### Blank Value Detection

`isBlankValue(value)` returns `true` for:
- `null`
- Empty string: `""` (after trim)
- Empty list: `["L"]`
- Empty reference list: `["L"]`

```typescript
// Examples
isBlankValue(null)           // → true
isBlankValue("")             // → true
isBlankValue("  ")           // → true (trimmed)
isBlankValue("text")         // → false
isBlankValue(0)              // → false (zero is not blank)
isBlankValue(["L"])          // → true (empty list)
isBlankValue(["L", "item"])  // → false
```

**Source:** `app/common/gristTypes.ts:360-367`

### Type Checking Functions

```typescript
// Number types
isNumber(v)        // number or boolean
isNumberOrNull(v)  // number, boolean, or null

// Boolean types
isBoolean(v)       // boolean, 1, or 0
isBooleanOrNull(v) // boolean, 1, 0, or null

// List types
isList(v)          // ["L", ...]
isListOrNull(v)    // ["L", ...] or null

// Reference types
isReference(v)     // ["R", tableId, rowId]
isReferenceList(v) // ["L", id1, id2, ...]  (in RefList column)
```

**Source:** `app/common/gristTypes.ts:179-177`

### Critical Null Gotchas

⚠️ **Ref Columns Use 0, Not Null**

```python
# WRONG: Setting reference to null
table.update_record(row_id, customer=None)  # Converts to 0

# CORRECT: Use 0 explicitly
table.update_record(row_id, customer=0)  # No reference

# Checking for empty reference
if record.customer == 0:  # Not 'is None'
    print("No customer assigned")
```

⚠️ **Empty String vs Null in Text**

```python
# Text columns can have both
text_value = ""    # Empty string (default)
text_value = None  # Also valid, treated as blank

# Both are "blank"
isBlankValue("")     # → true
isBlankValue(None)   # → true
```

⚠️ **Position Types Never Null**

```python
# ManualSortPos and PositionNumber default to Infinity
record.manualSort  # → Infinity (or specific position)

# Never None/null
# Used for sorting, always has a value
```

---

## Common Pitfalls

### 1. RefList Encoding Confusion

❌ **WRONG:**
```python
# Using 'r' code in RefList column
ref_list_value = ['r', 'People', [1, 2, 3]]
```

✅ **CORRECT:**
```python
# RefList columns use 'L' code with just the IDs
ref_list_value = ['L', 1, 2, 3]

# The 'r' code is ONLY for ReferenceList in Any columns
any_column_value = ['r', 'People', [1, 2, 3]]
```

**Source:** `app/plugin/GristData.ts:40-41`

---

### 2. Ref Column Null Handling

❌ **WRONG:**
```python
# Treating null as "no reference"
if record.customer is None:
    print("No customer")

# Setting reference to None
table.update_record(row_id, customer=None)
```

✅ **CORRECT:**
```python
# Use 0 for "no reference"
if record.customer == 0:
    print("No customer")

# Set reference to 0
table.update_record(row_id, customer=0)
```

**Source:** `app/common/gristTypes.ts:39`, `sandbox/grist/usertypes.py:405-407`

---

### 3. Date/DateTime Timestamp Units

❌ **WRONG:**
```python
# Using milliseconds (JavaScript habit)
date_value = ['d', 1704067200000]  # WRONG: too many zeros

# JavaScript Date without conversion
const timestamp = new Date().getTime();  // milliseconds
const value = ['D', timestamp, 'UTC'];   // WRONG
```

✅ **CORRECT:**
```python
# Use seconds for timestamps
import time
timestamp = int(time.time())  # seconds
date_value = ['d', timestamp]

# JavaScript: convert to seconds
const timestamp = Math.floor(Date.now() / 1000);
const value = ['D', timestamp, 'UTC'];
```

**Source:** `app/plugin/GristData.ts:36-37`

---

### 4. Widget Options Must Be JSON Strings

❌ **WRONG:**
```python
# Passing object directly
column_spec = {
    "widgetOptions": {
        "numMode": "currency",
        "currency": "USD"
    }
}
```

✅ **CORRECT:**
```python
import json

column_spec = {
    "widgetOptions": json.dumps({
        "numMode": "currency",
        "currency": "USD"
    })
}
```

**Source:** `app/common/schema.ts:34`, `sandbox/grist/schema.py:68`

---

### 5. Python Keywords in Identifiers

❌ **WRONG:**
```python
# Using Python keywords directly
table_id = "class"  # Python keyword
col_id = "import"   # Python keyword
```

✅ **CORRECT:**
```python
from sandbox.grist import identifiers

# Sanitize identifiers
table_id = identifiers.pick_table_ident("class")   # → "Tclass"
col_id = identifiers.pick_col_ident("import")      # → "cimport"

# Or avoid keywords altogether
table_id = "Classes"
col_id = "import_date"
```

**Source:** `sandbox/grist/identifiers.py:46-47`

---

### 6. Empty List Detection

❌ **WRONG:**
```python
# Checking list length incorrectly
if len(value) == 0:  # WRONG for encoded lists
    print("Empty list")

# Treating empty list as falsy
if not value:  # WRONG: ["L"] is truthy
    print("Empty")
```

✅ **CORRECT:**
```python
from app.common.gristTypes import isEmptyList, isBlankValue

# Proper empty list check
if isEmptyList(value):  # ["L"] → true
    print("Empty list")

# Or check for any blank value
if isBlankValue(value):  # null, "", ["L"] → true
    print("Blank")

# Manual check
if value == ["L"]:
    print("Empty list")
```

**Source:** `app/common/gristTypes.ts:168-169, 360-367`

---

### 7. ChoiceList vs RefList Storage

❌ **WRONG:**
```python
# Treating ChoiceList like integers
choice_list = ['L', 1, 2, 3]  # WRONG: choices are strings

# Treating RefList like strings
ref_list = ['L', 'item1', 'item2']  # WRONG: refs are integers
```

✅ **CORRECT:**
```python
# ChoiceList: strings
choice_list = ['L', 'Option A', 'Option B', 'Option C']

# RefList: integers (row IDs)
ref_list = ['L', 1, 5, 10]
```

**Source:** `app/common/gristTypes.ts:210, 212`

---

### 8. visibleCol vs displayCol Confusion

❌ **WRONG:**
```python
# Setting displayCol manually
column_spec = {
    "type": "Ref:People",
    "displayCol": 28  # WRONG: auto-generated
}

# Expecting displayCol to exist immediately
ref_col = get_column("customer")
display = ref_col.displayCol  # May not exist yet
```

✅ **CORRECT:**
```python
# Set visibleCol, displayCol is auto-generated
column_spec = {
    "type": "Ref:People",
    "visibleCol": 15  # Points to People.name column ID
}

# displayCol is created automatically by Grist
# Access it after column creation
```

**Source:** `sandbox/grist/schema.py:80-85`

---

### 9. Case Sensitivity in Identifiers

❌ **WRONG:**
```python
# Assuming case-sensitive uniqueness
pick_table_ident("Users", avoid=set())  # Creates "Users"
pick_table_ident("users", avoid=set())  # Also creates "Users" - conflict!
```

✅ **CORRECT:**
```python
# Track uppercase versions to avoid conflicts
avoid = set()
table1 = pick_table_ident("Users", avoid=avoid)
avoid.add(table1.upper())
table2 = pick_table_ident("users", avoid=avoid)  # → "Users2"
```

**Source:** `sandbox/grist/identifiers.py:72-73, 89-90`

---

### 10. Decimal Precision in Number Formatting

❌ **WRONG:**
```json
// Conflicting decimal settings
{
  "decimals": 5,
  "maxDecimals": 2  // WRONG: max < min
}

// Out of range
{
  "decimals": 25  // WRONG: max is 20
}
```

✅ **CORRECT:**
```json
// maxDecimals must be >= decimals
{
  "decimals": 2,
  "maxDecimals": 5
}

// Use valid range: 0-20
{
  "decimals": 2,
  "maxDecimals": 10
}

// Default behavior
{
  "decimals": 2
  // maxDecimals auto-set if not specified
}
```

**Source:** `app/common/NumberFormat.ts:50-65`

---

### 11. Attachment vs RefList Behavior

❌ **WRONG:**
```python
# Treating Attachments as regular RefList
col_type = "RefList:_grist_Attachments"  # Verbose
```

✅ **CORRECT:**
```python
# Use Attachments shorthand
col_type = "Attachments"  # Automatically maps to RefList:_grist_Attachments

# Both are equivalent
extractInfoFromColType("Attachments")
# → {type: "RefList", tableId: "_grist_Attachments"}
```

**Source:** `app/common/gristTypes.ts:59-60`

---

### 12. Reference Encoding in Any Columns

❌ **WRONG:**
```python
# Storing raw row ID in Any column
any_value = 42  # Loses table context

# Using Ref encoding without table
any_value = ['R', 17]  # Missing table ID
```

✅ **CORRECT:**
```python
# Include table ID in Any column
any_value = ['R', 'People', 17]

# For reference lists
any_value = ['r', 'Tags', [1, 5, 10]]
```

**Source:** `app/plugin/GristData.ts:39-40`, `app/common/gristTypes.ts:76-84`

---

## Additional Resources

### Key Source Files

**TypeScript (Client/Common):**
- `app/plugin/GristData.ts` - Core type definitions
- `app/common/gristTypes.ts` - Type system utilities
- `app/plugin/objtypes.ts` - Encoding/decoding
- `app/common/NumberFormat.ts` - Number formatting
- `app/common/WidgetOptions.ts` - Widget options interface
- `app/common/schema.ts` - Metadata schema
- `app/server/lib/idUtils.ts` - DocId generation

**Python (Sandbox):**
- `sandbox/grist/usertypes.py` - Type implementations
- `sandbox/grist/objtypes.py` - Object encoding
- `sandbox/grist/identifiers.py` - Identifier validation
- `sandbox/grist/schema.py` - Metadata schema

### Type System Flow

```
User Input
    ↓
[Parser] → Raw value
    ↓
[Type Converter] → CellValue (primitives or encoded tuples)
    ↓
[Storage] → SQLite (with type's storage format)
    ↓
[Retrieval] → CellValue
    ↓
[Formatter] → Display string (using widgetOptions)
    ↓
User Display
```

### Schema Version

Current schema version: **44**

Schema changes may affect type behavior. Always check `SCHEMA_VERSION` in `app/common/schema.ts:7`.

---

**End of Reference**

For questions or corrections, please consult the source files listed above or refer to Grist's official documentation.
