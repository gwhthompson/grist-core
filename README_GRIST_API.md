# Grist API TypeScript Definitions

## Overview

This document outlines the comprehensive TypeScript definitions provided in `grist-api.d.ts` for the Grist Plugin API and REST API.

## Current Coverage Status

### ✅ Fully Covered
- Core data types (CellValue, RowRecord, GristType, etc.)
- Plugin API (GristAPI, GristDocAPI, GristView)
- Custom Widget API (CustomSectionAPI, WidgetAPI)
- Table Operations (CRUD methods)
- Document Actions (AddRecord, UpdateRecord, etc.)
- Webhooks/Triggers
- Basic roles and permissions
- Global `grist` object interface

### ⚠️ Additional Types Needed

The following types are available in the Grist codebase but not yet included in the standalone definitions file:

#### Widget and Formatting Options
- **WidgetOptions** - Cell formatting options (textColor, fillColor, alignment, dateFormat, timeFormat, widget, choices)
- **NumberFormatOptions** - Number formatting (numMode, numSign, decimals, maxDecimals, currency)

#### User Preferences
- **UserPrefs** - User-level preferences (theme, locale, showNewUserQuestions, etc.)
- **UserOrgPrefs** - User+org preferences (docMenuSort, docMenuView, seenExamples)
- **OrgPrefs** - Organization preferences (customLogoUrl)
- **DocPrefs** - Document preferences (notifications)
- **ThemePrefs** - Theme configuration (appearance, syncWithOS, colors)

#### Custom Widgets
- **ICustomWidget** - Complete custom widget manifest
- **AccessLevel** enum - Widget access levels ('none', 'read_table', 'full')
- **WidgetAuthor** - Widget author information

#### REST API Types (from UserAPI)
- **Organization** - Full org structure with access, billing, preferences
- **Workspace** - Workspace with docs array and org reference
- **Document** - Document with workspace, options, forks
- **BillingAccount** - Billing account details
- **PermissionData** - Detailed permission information
- **UserAccessData** - User access details
- **DocumentOptions** - Non-core document options (description, icon, externalId, tutorial, appearance)

####Import/Export and Data Transformation
- **QueryFilters** - Query filtering options
- **TransformRule** - Data transformation rules for imports
- **TransformColumn** - Column transformation details
- **MergeOptions** - Options for merging data during imports
- **ImportOptions** - Import configuration
- **ParseOptions** - File parsing options

#### Active Document API
- **ApplyUAOptions** - Options for applying user actions
- **QueryFilters** - Advanced query filtering
- **ClientQuery** / **ServerQuery** - Query interfaces
- **FormulaTimingInfo** - Formula performance timing
- **AttachmentTransferStatus** - Attachment migration status

## Usage

```typescript
import type * as Grist from './grist-api';

// Plugin/Custom Widget Example
grist.ready({
  requiredAccess: 'read_table',
  columns: ['Name', 'Email']
});

grist.onRecord((record: Grist.RowRecord) => {
  console.log(record.Name);
});

// Table Operations Example
const table = grist.getTable('Employees');
await table.create({
  fields: {
    Name: 'Alice',
    Department: 'Engineering'
  }
});
```

## Extension Recommendation

For production use with access to advanced features, consider creating an extended definitions file that imports from the actual Grist source:

```typescript
// grist-api-extended.d.ts
export * from './grist-api';

// Additional imports from Grist source for advanced usage
export type { WidgetOptions } from 'app/common/WidgetOptions';
export type { NumberFormatOptions } from 'app/common/NumberFormat';
export type { UserPrefs, UserOrgPrefs, OrgPrefs } from 'app/common/Prefs';
export type { ICustomWidget, AccessLevel } from 'app/common/CustomWidget';
// ... etc
```

## Contributing

To add missing types to the standalone definitions file:

1. Identify the source file in `app/plugin/` or `app/common/`
2. Extract the interface/type definition
3. Add comprehensive JSDoc comments
4. Place in the appropriate section of `grist-api.d.ts`
5. Update this README with the new coverage

## Version

- **Current Version**: 1.0.0
- **Last Updated**: 2025
- **Grist Version Compatibility**: grist-core (latest)
