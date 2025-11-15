# Grist Schema Documentation

Complete API and schema documentation for Grist.

## Core Documentation

### [grist-actions.md](grist-actions.md)
**Grist Actions Complete Reference** - All 43 UserActions for modifying Grist documents programmatically via the `/apply` endpoint.

- Table, Record, Column, View, and Document operations
- Type definitions and examples
- Common patterns and pitfalls
- Complete action index

---

### [grist-types.md](grist-types.md)
**Grist Type System Reference** - Complete guide to column types, encoding, and widget options.

- All column types (Text, Numeric, Date, Ref, RefList, etc.)
- CellValue encoding (GristObjCode)
- Widget options for all types
- Reference column configuration
- Identifier validation rules
- Null handling by type

---

### [grist-schema.md](grist-schema.md)
**Grist Schema Reference** - Metadata tables that define document structure (schema v44).

- Core tables (_grist_Tables, _grist_Tables_column)
- View tables (_grist_Views, _grist_Pages)
- Access control (_grist_ACLRules, _grist_ACLResources)
- Feature tables (_grist_Triggers, _grist_Attachments)
- Data types and relationships
- SQL query examples

---

### [grist-api.d.ts](grist-api.d.ts)
**TypeScript API Definitions** - Complete TypeScript type definitions for all Grist APIs.

- Core data types (CellValue, ColInfo, etc.)
- Plugin API interfaces
- Document API interfaces
- Widget API interfaces

---

### [grist-api.yml](grist-api.yml)
**OpenAPI 3.0 Specification** - REST API specification for Grist.

- All REST endpoints
- Request/response schemas
- Authentication
- Examples

---

## Quick Start

**For API Usage**:
1. Start with [grist-api.yml](grist-api.yml) or [grist-api.d.ts](grist-api.d.ts) for endpoints
2. Reference [grist-actions.md](grist-actions.md) for the `/apply` endpoint
3. Use [grist-types.md](grist-types.md) for column types and encoding

**For Schema Understanding**:
1. Read [grist-schema.md](grist-schema.md) for table structure
2. Reference [grist-types.md](grist-types.md) for data types

**For Integration Development**:
1. Study [grist-actions.md](grist-actions.md) for making changes
2. Consult [grist-types.md](grist-types.md) for proper encoding
3. Check [grist-schema.md](grist-schema.md) for metadata queries

---

## Schema Version

Current schema version: **44**

Last updated: **2025-11-15**

---

## Additional Resources

- **Source Code**: [gristlabs/grist-core](https://github.com/gristlabs/grist-core)
- **Documentation**: [docs.getgrist.com](https://docs.getgrist.com)
- **API Endpoint**: `POST /api/docs/:docId/apply`

---

## File Index

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `grist-actions.md` | UserActions reference | ~1,429 | ✅ Complete |
| `grist-types.md` | Type system reference | ~705 | ✅ Complete |
| `grist-schema.md` | Metadata tables reference | ~719 | ✅ Complete |
| `grist-api.d.ts` | TypeScript definitions | ~1,217 | ✅ Complete |
| `grist-api.yml` | OpenAPI specification | ~2,091 | ✅ Complete |

**Total**: 5 core documentation files, ~6,161 lines

---

*Maintained by Grist Labs*
