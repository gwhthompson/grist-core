# Grist API Specification Comparison

Comparison between the newly created `grist-api.yml` and the official Grist specification from `gristlabs/grist-help`.

## Summary

Both specifications are comprehensive OpenAPI 3.0 documents covering the Grist REST API, but with different scopes and levels of detail.

---

## ✅ What's in BOTH Specifications

### Core Endpoints (Present in Both)
- **Organizations**: GET, PATCH, DELETE `/orgs/{orgId}`, GET `/orgs`, access management
- **Workspaces**: GET, PATCH, DELETE, create in org
- **Documents**: GET, PATCH, DELETE metadata, access management
- **Tables**: GET, POST, PATCH `/docs/{docId}/tables`
- **Records**: GET, POST, PATCH, PUT `/docs/{docId}/tables/{tableId}/records`
- **Table Data**: GET, POST, PATCH `/docs/{docId}/tables/{tableId}/data` (column format)
- **Columns**: GET, POST, PATCH, PUT, DELETE `/docs/{docId}/tables/{tableId}/columns`
- **SQL**: GET, POST `/docs/{docId}/sql` with query parameters
- **Webhooks**: GET, POST, PATCH, DELETE `/docs/{docId}/webhooks`
- **Attachments**: Basic upload/download/list operations

### Common Components
- **Authentication**: Bearer token via `Authorization` header
- **Schemas**: Organizations, Workspaces, Documents, Records, Webhooks
- **Parameters**: docId, tableId, orgId, workspaceId, filter, sort, limit
- **Query Filtering**: JSON-based filter format
- **Webhook Fields**: URL, eventTypes, tableId, enabled, etc.

---

## 🆕 What's ONLY in the NEW Specification (grist-api.yml)

### 1. **Enhanced CellValue Documentation** ⭐
- **Comprehensive encoding guide** for all Grist object types:
  - Lists: `["L", item1, item2, ...]`
  - DateTime: `["D", timestamp, timezone]` with timezone info
  - Date: `["d", timestamp]`
  - References: `["R", table_id, row_id]`
  - ReferenceList: `["r", table_id, [row_ids]]`
  - Dictionary: `["O", {key: value}]`
  - Exception, Pending, Censored, Unmarshallable types
- **Examples and format notes** for each type
- **Documentation on timestamp formats** (seconds vs milliseconds)

### 2. **User Actions Endpoint** ⭐⭐⭐
```yaml
POST /docs/{docId}/apply
```
**Critical endpoint** for applying low-level user actions:
- AddTable, RemoveTable, RenameTable
- AddColumn, RemoveColumn, ModifyColumn
- BulkAddRecord, BulkUpdateRecord, BulkRemoveRecord
- And many more document modification operations
- Full `ApplyUAResult` schema with action history tracking

### 3. **Additional Query Parameters**
- `noparse`: Control string parsing behavior
- `noadd`: Prevent adds in upsert operations
- `noupdate`: Prevent updates in upsert operations
- `onmany`: Control multiple-match handling (first/none/all)
- `allow_empty_require`: Allow empty require fields in upserts

### 4. **Clearer Organization**
- Comprehensive tags for endpoint grouping
- More detailed descriptions for each endpoint
- Better structured reusable components
- More extensive parameter documentation

---

## 📚 What's ONLY in the OFFICIAL Specification (gristlabs/grist-help)

### 1. **Document Management Operations**
```yaml
POST /docs/{docId}/copy              # Copy/fork document
POST /docs/{docId}/force-reload      # Force reload from storage
POST /docs/{docId}/recover           # Set recovery mode
PATCH /docs/{docId}/move             # Move to different workspace
```

### 2. **Import/Export Endpoints**
```yaml
POST /workspaces/{workspaceId}/import    # Import existing document
GET /docs/{docId}/download               # Download SQLite
GET /docs/{docId}/download/xlsx          # Export to Excel
GET /docs/{docId}/download/csv           # Export to CSV
GET /docs/{docId}/download/table-schema  # Export table schema
```

### 3. **Advanced Attachment Operations**
```yaml
GET /docs/{docId}/attachments/archive        # Download all as archive
POST /docs/{docId}/attachments/transferAll   # Transfer to new storage
GET /docs/{docId}/attachments/transferStatus # Transfer progress
GET /docs/{docId}/attachments/store          # Get storage type
POST /docs/{docId}/attachments/store         # Set storage type
GET /docs/{docId}/attachments/stores         # List available stores
POST /docs/{docId}/attachments/removeUnused  # Clean up unused files
```

### 4. **Document State Management**
```yaml
POST /docs/{docId}/states/remove    # Remove document states/snapshots
```

### 5. **Additional Features**
- **Header parameters**: `X-Sort`, `X-Limit` (in addition to query params)
- **Hidden records parameter**: `hidden` query param to include hidden records
- **More detailed examples**: Inline examples for many request/response bodies
- **Access levels documentation**: Full role hierarchy (owners, editors, viewers, members)
- **SCIM endpoints**: User provisioning (mentioned but not fully documented)

### 6. **Richer Schema Definitions**
- More detailed field examples with real data
- Nullable field documentation
- Format specifications (date-time, uri, uuid, etc.)
- More granular required fields

---

## 🔍 Key Differences in Approach

### CellValue Handling
- **NEW spec**: Extensive inline documentation of encoding formats with examples
- **OFFICIAL spec**: Links to external documentation (`support.getgrist.com/code/modules/GristData/#cellvalue`)

### Endpoint Coverage
- **NEW spec**: Focuses on data manipulation (records, tables, columns, user actions)
- **OFFICIAL spec**: Broader coverage including document lifecycle, import/export, recovery

### Documentation Style
- **NEW spec**: More tutorial-style with inline encoding guides
- **OFFICIAL spec**: More reference-style with external links

### Target Audience
- **NEW spec**: Developers building API clients, code generators
- **OFFICIAL spec**: Comprehensive reference for all API consumers

---

## 📊 Endpoint Count Comparison

| Category | NEW Spec | Official Spec |
|----------|----------|---------------|
| Organizations | 3 | 4 |
| Workspaces | 4 | 4 |
| Documents (metadata) | 3 | 8+ |
| Tables | 3 | 3 |
| Records | 4 | 4 |
| Columns | 5 | 5 |
| User Actions | 1 ⭐ | 0 |
| SQL | 2 | 2 |
| Attachments | 3 | 10+ |
| Webhooks | 6 | 6 |
| **Total** | ~35 | ~50+ |

---

## 💡 Recommendations

### For the NEW Specification

**Should Add:**
1. ✅ Document copy/fork endpoint
2. ✅ Document move endpoint
3. ✅ Import/export endpoints (download, xlsx, csv)
4. ✅ Force-reload and recovery endpoints
5. ✅ Advanced attachment management endpoints
6. ✅ Header parameters (`X-Sort`, `X-Limit`)
7. ✅ `hidden` query parameter
8. ✅ More inline examples in schemas

**Should Keep:**
1. ⭐ **Excellent CellValue documentation** (major value-add)
2. ⭐⭐⭐ **User Actions endpoint** (critical for advanced use cases)
3. ⭐ Enhanced query parameters (noparse, noadd, noupdate, onmany)
4. Good organization and structure

### For Integration

**The IDEAL specification would combine:**
- CellValue documentation from the NEW spec
- User Actions endpoint from the NEW spec
- Complete endpoint coverage from the OFFICIAL spec
- Examples and detail from both

---

## 🎯 Action Items

To make the new specification production-ready and comprehensive:

1. **Add missing endpoints** from official spec:
   - Document management (copy, move, force-reload, recover)
   - Import/export (download formats)
   - Advanced attachments (archive, transfer, storage management)
   - Document states

2. **Enhance parameter coverage**:
   - Add `X-Sort` and `X-Limit` header parameters
   - Add `hidden` query parameter
   - Document header-based alternatives to query params

3. **Add more examples**:
   - Request/response examples for complex operations
   - Real-world use cases

4. **Keep unique value-adds**:
   - Maintain detailed CellValue documentation
   - Keep User Actions endpoint
   - Keep enhanced query parameters

5. **Version alignment**:
   - Update version to match or exceed official spec (1.0.1+)
   - Add changelog/version history

---

## ✨ Unique Value Propositions

### NEW Specification Strengths
- **Best-in-class CellValue documentation** - No external links needed
- **User Actions endpoint** - Enables advanced document manipulation
- **Code generator friendly** - More explicit schemas and types
- **Self-contained** - All documentation inline

### Official Specification Strengths
- **Complete feature coverage** - All documented endpoints
- **Production-tested** - Used by Grist community
- **Import/Export support** - Critical for data portability
- **More mature** - Versioned at 1.0.1

---

## 📝 Conclusion

Both specifications have unique strengths:

- **Use the NEW spec** if you need detailed CellValue encoding documentation or want to use User Actions for advanced manipulation
- **Use the OFFICIAL spec** for comprehensive endpoint coverage including import/export and document management
- **Combine both** for the most complete API reference

The new specification provides **excellent foundational documentation** with unique value in its CellValue encoding guide and User Actions support. Adding the missing endpoints from the official spec would make it a superior comprehensive reference.
