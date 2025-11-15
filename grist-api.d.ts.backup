/**
 * Grist API Type Definitions
 *
 * Complete TypeScript definitions for the Grist Plugin API and Custom Widget API.
 * This file provides type-safe access to Grist's plugin system, custom widgets,
 * table operations, and document data.
 *
 * Usage:
 * ```typescript
 * import type * as Grist from './grist-api';
 *
 * // In your custom widget:
 * grist.ready();
 * grist.onRecord((record, mappings) => {
 *   console.log(record);
 * });
 * ```
 *
 * @version 1.0.0
 */

// ============================================================================
// Core Data Types
// ============================================================================

/**
 * Letter codes for {@link CellValue} types encoded as [code, args...] tuples.
 */
export enum GristObjCode {
  List = 'L',
  LookUp = 'l',
  Dict = 'O',
  DateTime = 'D',
  Date = 'd',
  Skip = 'S',
  Censored = 'C',
  Reference = 'R',
  ReferenceList = 'r',
  Exception = 'E',
  Pending = 'P',
  Unmarshallable = 'U',
  Versions = 'V',
}

/**
 * Possible types of cell content.
 *
 * Each `CellValue` may either be a primitive (e.g. `true`, `123`, `"hello"`, `null`)
 * or a tuple (JavaScript Array) representing a Grist object. The first element of the tuple
 * is a string character representing the object code. For example, `["L", "foo", "bar"]`
 * is a `CellValue` of a Choice List column, where `"L"` is the type, and `"foo"` and
 * `"bar"` are the choices.
 *
 * ### Grist Object Types
 *
 * | Code | Type           |
 * | ---- | -------------- |
 * | `L`  | List, e.g. `["L", "foo", "bar"]` or `["L", 1, 2]` |
 * | `l`  | LookUp, as `["l", value, options]` |
 * | `O`  | Dict, as `["O", {key: value, ...}]` |
 * | `D`  | DateTimes, as `["D", timestamp, timezone]`, e.g. `["D", 1704945919, "UTC"]` |
 * | `d`  | Date, as `["d", timestamp]`, e.g. `["d", 1704844800]` |
 * | `C`  | Censored, as `["C"]` |
 * | `R`  | Reference, as `["R", table_id, row_id]`, e.g. `["R", "People", 17]` |
 * | `r`  | ReferenceList, as `["r", table_id, row_id_list]`, e.g. `["r", "People", [1,2]]` |
 * | `E`  | Exception, as `["E", name, ...]`, e.g. `["E", "ValueError"]` |
 * | `P`  | Pending, as `["P"]` |
 * | `U`  | Unmarshallable, as `["U", text_representation]` |
 * | `V`  | Version, as `["V", version_obj]` |
 */
export type CellValue = number | string | boolean | null | [GristObjCode, ...unknown[]];

/**
 * Map of column ids to arrays of {@link CellValue}.
 */
export interface BulkColValues {
  [colId: string]: CellValue[];
}

/**
 * Map of column ids to {@link CellValue}'s (for a single record).
 */
export interface RowRecord {
  id: number;
  [colId: string]: CellValue;
}

/**
 * Map of column ids to {@link CellValue} arrays, where array indexes correspond to rows.
 */
export interface RowRecords {
  id: number[];
  [colId: string]: CellValue[];
}

/**
 * Grist column types.
 */
export type GristType =
  | 'Any'
  | 'Attachments'
  | 'Blob'
  | 'Bool'
  | 'Choice'
  | 'ChoiceList'
  | 'Date'
  | 'DateTime'
  | 'Id'
  | 'Int'
  | 'ManualSortPos'
  | 'Numeric'
  | 'PositionNumber'
  | 'Ref'
  | 'RefList'
  | 'Text';

// ============================================================================
// UI Types
// ============================================================================

/**
 * Represents the id of a row in a table. The value of the `id` column.
 * Might be a number or 'new' value for a new row.
 */
export type UIRowId = number | 'new';

/**
 * Represents the position of an active cursor on a page.
 */
export interface CursorPos {
  /**
   * The rowId (value of the `id` column) of the current cursor position,
   * or 'new' if the cursor is on a new row.
   */
  rowId?: UIRowId;
  /**
   * The index of the current row in the current view.
   */
  rowIndex?: number;
  /**
   * The index of the selected field in the current view.
   */
  fieldIndex?: number;
  /**
   * The id of a section that this cursor is in.
   * Ignored when setting a cursor position for a particular view.
   */
  sectionId?: number;
  /**
   * When in a linked section, CursorPos may include which rows in the controlling sections are
   * selected: the rowId in the linking-source section, in _that_ section's linking source, etc.
   */
  linkingRowIds?: UIRowId[];
}

// ============================================================================
// Core Plugin API
// ============================================================================

export type ComponentKind = 'safeBrowser' | 'safePython' | 'unsafeNode';

/**
 * Where to append the content that a plugin renders.
 */
export type RenderTarget = 'fullscreen' | number;

/**
 * Options for the `grist.render` function.
 */
export interface RenderOptions {
  height?: string;
}

/**
 * Core Grist API for plugins.
 */
export interface GristAPI {
  /**
   * Render the file at `path` into the `target` location in Grist. `path` must be relative to the
   * root of the plugin's directory and point to an html that is contained within the plugin's
   * directory. `target` is a predefined location of the Grist UI, it could be `fullscreen` or
   * identifier for an inline target. Grist provides inline target identifiers in certain call
   * plugins. E.g. ImportSourceAPI.getImportSource is given a target identifier to allow render UI
   * inline in the import dialog. Returns the procId which can be used to dispose the view.
   */
  render(path: string, target: RenderTarget, options?: RenderOptions): Promise<number>;

  /**
   * Dispose the process with id procId. If the process was embedded into the UI, removes the
   * corresponding element from the view.
   */
  dispose(procId: number): Promise<void>;

  /**
   * Subscribes to actions for `tableId`. Actions of all subscribed tables are sent as rpc
   * messages.
   */
  subscribe(tableId: string): Promise<void>;

  /**
   * Unsubscribe from actions for `tableId`.
   */
  unsubscribe(tableId: string): Promise<void>;
}

// ============================================================================
// Document API
// ============================================================================

/**
 * Options for {@link GristDocAPI.getAccessToken}.
 */
export interface AccessTokenOptions {
  /** Restrict use of token to reading only */
  readOnly?: boolean;
}

/**
 * Access token information, including the token string itself, a base URL for
 * API calls for which the access token can be used, and the time-to-live the
 * token was created with.
 */
export interface AccessTokenResult {
  /**
   * The token string, which can currently be provided in an api call as a
   * query parameter called "auth"
   */
  token: string;

  /**
   * The base url of the API for which the token can be used. Currently tokens
   * are associated with a single document, so the base url will be something
   * like `https://..../api/docs/DOCID`
   *
   * Access tokens currently only grant access to endpoints dealing with the
   * internal content of a document (such as tables and cells) and not its
   * metadata (such as the document name or who it is shared with).
   */
  baseUrl: string;

  /**
   * Number of milliseconds the access token will remain valid for
   * after creation. This will be several minutes.
   */
  ttlMsecs: number;
}

/**
 * Options for applying user actions.
 */
export interface ApplyUAOptions {
  /** Description of the action. */
  desc?: string;
  /** ID of another user action to link to. */
  otherId?: number;
  /** Link ID for grouping related actions. */
  linkId?: number;
  /** Whether to parse strings based on column type. Defaults to true. */
  parseStrings?: boolean;
}

/**
 * Result of applying user actions.
 */
export interface ApplyUAResult {
  /** The action number assigned to the action. */
  actionNum: number;
  /** Hash of the action. */
  actionHash: string;
  /** Return values from the action. */
  retValues: unknown[];
  /** Whether the action modified the document. */
  isModification: boolean;
}

/**
 * Allows getting information from and interacting with the Grist document to which a plugin or widget is attached.
 */
export interface GristDocAPI {
  /**
   * Returns an identifier for the document.
   */
  getDocName(): Promise<string>;

  /**
   * Returns a sorted list of table IDs.
   */
  listTables(): Promise<string[]>;

  /**
   * Returns a complete table of data as {@link RowRecords}, including the
   * 'id' column. Do not modify the returned arrays in-place, especially if used
   * directly (not over RPC).
   */
  fetchTable(tableId: string): Promise<RowRecords>;

  /**
   * Applies an array of user actions.
   */
  applyUserActions(actions: unknown[][], options?: ApplyUAOptions): Promise<ApplyUAResult>;

  /**
   * Get a token for out-of-band access to the document.
   */
  getAccessToken(options: AccessTokenOptions): Promise<AccessTokenResult>;
}

// ============================================================================
// View API
// ============================================================================

/**
 * Options for functions which fetch data from the selected table or record:
 *
 * - {@link onRecords}
 * - {@link onRecord}
 * - {@link fetchSelectedRecord}
 * - {@link fetchSelectedTable}
 * - {@link GristView.fetchSelectedRecord}
 * - {@link GristView.fetchSelectedTable}
 *
 * The different methods have different default values for `keepEncoded` and `format`.
 */
export interface FetchSelectedOptions {
  /**
   * - `true`: the returned data will contain raw {@link CellValue}'s.
   * - `false`: the values will be decoded, replacing e.g. `['D', timestamp]` with a moment date.
   */
  keepEncoded?: boolean;

  /**
   * - `rows`: the returned data will be an array of objects, one per row, with column names as keys.
   * - `columns`: the returned data will be an object with column names as keys, and arrays of values.
   */
  format?: 'rows' | 'columns';

  /**
   * - `shown` (default): return only columns that are explicitly shown
   *   in the right panel configuration of the widget. This is the only value that doesn't require full access.
   * - `normal`: return all 'normal' columns, regardless of whether the user has shown them.
   * - `all`: also return special invisible columns like `manualSort` and display helper columns.
   */
  includeColumns?: 'shown' | 'normal' | 'all';

  /**
   * - `true` (default): the returned data will show the contents of references, not their rowIds
   * - `false`: the returned data will only display rowIds for references
   */
  expandRefs?: boolean;
}

/**
 * Interface for the data backing a single widget.
 */
export interface GristView {
  /**
   * Like {@link GristDocAPI.fetchTable}, but gets data for the custom section specifically, if there is any.
   * By default, `options.keepEncoded` is `true` and `format` is `columns`.
   */
  fetchSelectedTable(options?: FetchSelectedOptions): Promise<RowRecords | RowRecord[]>;

  /**
   * Fetches selected record by its `rowId`. By default, `options.keepEncoded` is `true`.
   */
  fetchSelectedRecord(rowId: number, options?: FetchSelectedOptions): Promise<RowRecord>;

  /**
   * Deprecated now. It was used for filtering selected table by `setSelectedRows` method.
   * Now the preferred way is to use ready message.
   */
  allowSelectBy(): Promise<void>;

  /**
   * Set the list of selected rows to be used against any linked widget.
   */
  setSelectedRows(rowIds: number[] | null): Promise<void>;

  /**
   * Sets the cursor position to a specific row and field. `sectionId` is ignored. Used for widget linking.
   */
  setCursorPos(pos: CursorPos): Promise<void>;
}

// ============================================================================
// Custom Section / Widget API
// ============================================================================

/**
 * Column configuration for custom widgets with column mapping.
 */
export interface ColumnToMap {
  /**
   * Column name that Widget expects. Must be a valid JSON property name.
   */
  name: string;
  /**
   * Title or short description of a column (used as a label in section mapping).
   */
  title?: string | null;
  /**
   * Optional long description of a column (used as a help text in section mapping).
   */
  description?: string | null;
  /**
   * Column types (as comma separated list), by default "Any", which means that any type is
   * allowed (unless strictType is true).
   */
  type?: string;
  /**
   * Mark column as optional; all columns are required by default.
   */
  optional?: boolean;
  /**
   * Allow multiple column assignment; the result will be list of mapped table column names.
   */
  allowMultiple?: boolean;
  /**
   * Match column type strictly, so "Any" will require "Any" and not any other type.
   */
  strictType?: boolean;
}

/**
 * Tells Grist what columns a Custom Widget expects and allows users to map between existing column names
 * and those requested by the Custom Widget.
 */
export type ColumnsToMap = (string | ColumnToMap)[];

/**
 * Initial message sent by the CustomWidget with initial requirements.
 */
export interface InteractionOptionsRequest {
  /**
   * Required access level. If it wasn't granted already, Grist will prompt user to change the current access
   * level.
   */
  requiredAccess?: string;
  /**
   * Instructs Grist to show additional menu options that will trigger onEditOptions callback, that Widget
   * can use to show custom options screen.
   */
  hasCustomOptions?: boolean;
  /**
   * Tells Grist what columns Custom Widget expects and allows user to map between existing column names
   * and those requested by Custom Widget.
   */
  columns?: ColumnsToMap;
  /**
   * Show widget as linking source.
   */
  allowSelectBy?: boolean;
}

/**
 * Widget configuration set and approved by Grist, sent as part of ready message.
 */
export interface InteractionOptions {
  /**
   * Granted access level.
   */
  accessLevel: string;
}

/**
 * Current columns mapping between viewFields in section and Custom widget.
 */
export interface WidgetColumnMap {
  [key: string]: string | string[] | null;
}

/**
 * Interface for the mapping of a custom widget.
 */
export interface CustomSectionAPI {
  /**
   * Initial request from a Custom Widget that wants to declare its requirements.
   */
  configure(customOptions: InteractionOptionsRequest): Promise<void>;

  /**
   * Returns current widget configuration (if requested through configuration method).
   */
  mappings(): Promise<WidgetColumnMap | null>;
}

// ============================================================================
// Widget State API
// ============================================================================

/**
 * API to manage Custom Widget state.
 */
export interface WidgetAPI {
  /**
   * Gets all options stored by the widget. Options are stored as plain JSON object.
   */
  getOptions(): Promise<object | null>;

  /**
   * Replaces all options stored by the widget.
   */
  setOptions(options: { [key: string]: unknown }): Promise<void>;

  /**
   * Clears all the options.
   */
  clearOptions(): Promise<void>;

  /**
   * Store single value in the Widget options object (and create it if necessary).
   */
  setOption(key: string, value: unknown): Promise<void>;

  /**
   * Get single value from Widget options object.
   */
  getOption(key: string): Promise<unknown>;
}

// ============================================================================
// Table Operations (CRUD API)
// ============================================================================

/**
 * Row ID type.
 */
export type RecordId = number;

/**
 * The row id of a record, without any of its content.
 */
export interface MinimalRecord {
  id: number;
}

/**
 * JSON schema for POST /records endpoint - adding new records.
 */
export interface NewRecord {
  /**
   * Initial values of cells in record. Optional, if not set cells are left blank.
   */
  fields?: { [colId: string]: CellValue };
}

/**
 * JSON schema for PATCH /records endpoint - updating existing records.
 */
export interface Record {
  id: number;
  fields: { [colId: string]: CellValue };
}

/**
 * JSON schema for PUT /records endpoint - adding or updating records (upsert).
 */
export interface AddOrUpdateRecord {
  /**
   * The values we expect to have in particular columns, either by matching with
   * an existing record, or creating a new record.
   */
  require: { [colId: string]: CellValue } & { id?: number };

  /**
   * The values we will place in particular columns, either overwriting values in
   * an existing record, or setting initial values in a new record.
   */
  fields?: { [colId: string]: CellValue };
}

/**
 * General options for table operations.
 */
export interface OpOptions {
  /** Whether to parse strings based on the column type. Defaults to true. */
  parseStrings?: boolean;
}

/**
 * Extra options for upserts.
 */
export interface UpsertOptions extends OpOptions {
  /** Permit inserting a record. Defaults to true. */
  add?: boolean;
  /** Permit updating a record. Defaults to true. */
  update?: boolean;
  /** Whether to update none, one, or all matching records. Defaults to "first". */
  onMany?: 'none' | 'first' | 'all';
  /** Allow "wildcard" operation. Defaults to false. */
  allowEmptyRequire?: boolean;
}

/**
 * Offer CRUD-style operations on a table.
 */
export interface TableOperations {
  /**
   * Create a record or records.
   */
  create(records: NewRecord, options?: OpOptions): Promise<MinimalRecord>;
  create(records: NewRecord[], options?: OpOptions): Promise<MinimalRecord[]>;

  /**
   * Update a record or records.
   */
  update(records: Record | Record[], options?: OpOptions): Promise<void>;

  /**
   * Delete a record or records.
   */
  destroy(recordIds: RecordId | RecordId[]): Promise<void>;

  /**
   * Add or update a record or records.
   */
  upsert(
    records: AddOrUpdateRecord | AddOrUpdateRecord[],
    options?: UpsertOptions
  ): Promise<void>;

  /**
   * Determine the tableId of the table.
   */
  getTableId(): Promise<string>;
}

// ============================================================================
// Table and Column Metadata
// ============================================================================

/**
 * Metadata about a single column.
 */
export interface GristColumn {
  id: string;
  type: string;
}

/**
 * Metadata and data for a table.
 */
export interface GristTable {
  table_name: string | null;
  column_metadata: GristColumn[];
  table_data: unknown[][];
}

/**
 * Multiple tables.
 */
export interface GristTables {
  tables: GristTable[];
}

// ============================================================================
// Import/Export API
// ============================================================================

export interface FileContent {
  content: unknown;
  name: string;
}

export interface FileListItem {
  kind: 'fileList';
  files: FileContent[];
}

export interface URL {
  kind: 'url';
  url: string;
}

export interface ImportSource {
  item: FileListItem | URL;
  /**
   * The options are only passed within this plugin, nothing else needs to know how they are
   * serialized. Using JSON.stringify/JSON.parse is a simple approach.
   */
  options?: string | Buffer;
  /**
   * The short description that shows in the import dialog after source has been selected.
   */
  description?: string;
}

export interface ImportSourceAPI {
  /**
   * Returns a promise that resolves to an `ImportSource` which is then passed for import to the
   * import modal dialog. `undefined` interrupts the workflow and prevents the modal from showing up,
   * but not an empty list of `ImportSourceItem`, which is a valid import source and is used in
   * cases where only options are to be sent to an `ImportProcessAPI` implementation.
   */
  getImportSource(): Promise<ImportSource | undefined>;
}

export interface ImportProcessorAPI {
  processImport(source: ImportSource): Promise<GristTable[]>;
}

export interface FileSource {
  /**
   * The path is often a temporary file, so its name is meaningless. Access to the file depends on
   * the type of plugin. For instance, for `safePython` plugins file is directly available at
   * `/importDir/path`.
   */
  path: string;

  /**
   * Plugins that want to know the original filename should use origName. Depending on the source
   * of the data, it may or may not be meaningful.
   */
  origName: string;
}

export interface ParseOptions {
  NUM_ROWS?: number;
  SCHEMA?: ParseOptionSchema[];
  WARNING?: string; // Only on response, includes a warning from parsing, if any.
}

export interface ParseOptionSchema {
  name: string;
  type: string;
  visible: boolean;
}

export interface ParseFileResult extends GristTables {
  parseOptions: ParseOptions;
}

export interface EditOptionsAPI {
  getParseOptions(parseOptions?: ParseOptions): Promise<ParseOptions>;
}

export interface ParseFileAPI {
  parseFile(file: FileSource, parseOptions?: ParseOptions): Promise<ParseFileResult>;
}

// ============================================================================
// Storage API
// ============================================================================

/**
 * Subset of WebStorage API for plugin storage.
 */
export interface Storage {
  getItem(key: string): unknown;
  hasItem(key: string): boolean;
  setItem(key: string, value: unknown): void;
  removeItem(key: string): void;
  clear(): void;
}

// ============================================================================
// Document Actions
// ============================================================================

/**
 * Map of column ids to cell values (for a single record).
 */
export interface ColValues {
  [colId: string]: CellValue;
}

/**
 * Column metadata.
 */
export interface ColInfo {
  type: string;
  isFormula: boolean;
  formula: string;
}

/**
 * Column metadata with ID.
 */
export interface ColInfoWithId extends ColInfo {
  id: string;
}

/**
 * Multiple records in column-oriented format.
 */
export interface TableColValues {
  id: number[];
  [colId: string]: CellValue[];
}

/**
 * Single record value.
 */
export interface TableRecordValue {
  id: number | string;
  fields: {
    [colId: string]: CellValue;
  };
}

/**
 * Multiple records in record-oriented format.
 */
export interface TableRecordValues {
  records: TableRecordValue[];
}

export type AddRecord = ['AddRecord', string, number, ColValues];
export type BulkAddRecord = ['BulkAddRecord', string, number[], BulkColValues];
export type RemoveRecord = ['RemoveRecord', string, number];
export type BulkRemoveRecord = ['BulkRemoveRecord', string, number[]];
export type UpdateRecord = ['UpdateRecord', string, number, ColValues];
export type BulkUpdateRecord = ['BulkUpdateRecord', string, number[], BulkColValues];
export type ReplaceTableData = ['ReplaceTableData', string, number[], BulkColValues];
export type TableDataAction = ['TableData', string, number[], BulkColValues];

export type AddColumn = ['AddColumn', string, string, ColInfo];
export type RemoveColumn = ['RemoveColumn', string, string];
export type RenameColumn = ['RenameColumn', string, string, string];
export type ModifyColumn = ['ModifyColumn', string, string, Partial<ColInfo>];

export type AddTable = ['AddTable', string, ColInfoWithId[]];
export type RemoveTable = ['RemoveTable', string];
export type RenameTable = ['RenameTable', string, string];

export type DocAction =
  | AddRecord
  | BulkAddRecord
  | RemoveRecord
  | BulkRemoveRecord
  | UpdateRecord
  | BulkUpdateRecord
  | ReplaceTableData
  | TableDataAction
  | AddColumn
  | RemoveColumn
  | RenameColumn
  | ModifyColumn
  | AddTable
  | RemoveTable
  | RenameTable;

export type UserAction = Array<string | number | object | boolean | null | undefined>;

// ============================================================================
// Webhooks / Triggers
// ============================================================================

export interface WebhookFields {
  url: string;
  authorization?: string;
  eventTypes: Array<'add' | 'update'>;
  tableId: string;
  watchedColIds?: string[];
  enabled?: boolean;
  isReadyColumn?: string | null;
  name?: string;
  memo?: string;
}

export interface WebhookSubscribe {
  url: string;
  authorization?: string;
  eventTypes: Array<'add' | 'update'>;
  watchedColIds?: string[];
  enabled?: boolean;
  isReadyColumn?: string | null;
  name?: string;
  memo?: string;
}

export type WebhookBatchStatus = 'success' | 'failure' | 'rejected';
export type WebhookStatus = 'idle' | 'sending' | 'retrying' | 'postponed' | 'error' | 'invalid';

export interface WebhookUsage {
  numWaiting: number;
  status: WebhookStatus;
  updatedTime?: number | null;
  lastSuccessTime?: number | null;
  lastFailureTime?: number | null;
  lastErrorMessage?: string | null;
  lastHttpStatus?: number | null;
  lastEventBatch?: null | {
    size: number;
    errorMessage: string | null;
    httpStatus: number | null;
    status: WebhookBatchStatus;
    attempts: number;
  };
  numSuccess?: {
    pastHour: number;
    past24Hours: number;
  };
}

export interface WebhookSummary {
  id: string;
  fields: {
    url: string;
    authorization?: string;
    unsubscribeKey: string;
    eventTypes: string[];
    isReadyColumn: string | null;
    tableId: string;
    watchedColIds?: string[];
    enabled: boolean;
    name: string;
    memo: string;
  };
  usage: WebhookUsage | null;
}

export interface WebhookSummaryCollection {
  webhooks: WebhookSummary[];
}

export interface WebhookUpdate {
  id: string;
  fields: {
    url?: string;
    authorization?: string;
    eventTypes?: Array<'add' | 'update'>;
    tableId?: string;
    watchedColIds?: string[];
    enabled?: boolean;
    isReadyColumn?: string | null;
    name?: string;
    memo?: string;
  };
}

// ============================================================================
// Roles and Permissions
// ============================================================================

export type BasicRole = 'owners' | 'editors' | 'viewers';
export type NonMemberRole = BasicRole | 'guests';
export type NonGuestRole = BasicRole | 'members';
export type Role = NonMemberRole | 'members';

// ============================================================================
// REST API Request/Response Types
// ============================================================================

export interface RecordsPost {
  records: [NewRecord, ...NewRecord[]];
}

export interface RecordsPatch {
  records: [Record, ...Record[]];
}

export interface RecordsPut {
  records: [AddOrUpdateRecord, ...AddOrUpdateRecord[]];
}

export interface SqlPost {
  sql: string;
  args?: unknown[] | null;
  timeout?: number;
}

export type AttachmentStore = 'internal' | 'external';

// ============================================================================
// Main Plugin API Exports (Global `grist` object)
// ============================================================================

/**
 * Options when initializing connection to Grist.
 */
export interface ReadyPayload extends Omit<InteractionOptionsRequest, 'hasCustomOptions'> {
  /**
   * Handler that will be called by Grist to open additional configuration panel inside the Custom Widget.
   */
  onEditOptions?: () => unknown;
}

/**
 * Main Grist Plugin API.
 *
 * This is the primary interface available as `window.grist` in custom widgets
 * and plugins running in sandboxed contexts.
 */
export interface GristPluginAPI {
  /**
   * The core API stub.
   */
  readonly api: GristAPI;

  /**
   * Document API for reading and modifying document data.
   */
  readonly docApi: GristDocAPI & GristView;

  /**
   * View API for interacting with the current view/widget.
   */
  readonly viewApi: GristView;

  /**
   * Widget state management API.
   */
  readonly widgetApi: WidgetAPI;

  /**
   * Custom section configuration API.
   */
  readonly sectionApi: CustomSectionAPI;

  /**
   * The currently selected table (for custom widgets).
   */
  readonly selectedTable: TableOperations;

  /**
   * Declare that a component is prepared to receive messages from the outside world.
   * Grist will not attempt to communicate with it until this method is called.
   */
  ready(settings?: ReadyPayload): void;

  /**
   * Get access to a table in the document. If no tableId specified, this
   * will use the current selected table (for custom widgets).
   */
  getTable(tableId?: string): TableOperations;

  /**
   * Get an access token for making API calls outside of the custom widget API.
   */
  getAccessToken(options?: AccessTokenOptions): Promise<AccessTokenResult>;

  /**
   * Same as {@link GristView.fetchSelectedTable}, but `keepEncoded` is `false` by default.
   */
  fetchSelectedTable(options?: FetchSelectedOptions): Promise<RowRecords | RowRecord[]>;

  /**
   * Same as {@link GristView.fetchSelectedRecord}, but `keepEncoded` is `false` by default.
   */
  fetchSelectedRecord(rowId: number, options?: FetchSelectedOptions): Promise<RowRecord>;

  /**
   * For custom widgets, add a handler that will be called whenever the
   * row with the cursor changes.
   */
  onRecord(
    callback: (data: RowRecord | null, mappings: WidgetColumnMap | null) => unknown,
    options?: FetchSelectedOptions
  ): void;

  /**
   * For custom widgets, add a handler that will be called whenever the
   * new (blank) row is selected.
   */
  onNewRecord(callback: (mappings: WidgetColumnMap | null) => unknown): void;

  /**
   * For custom widgets, add a handler that will be called whenever the
   * selected records change.
   */
  onRecords(
    callback: (data: RowRecord[], mappings: WidgetColumnMap | null) => unknown,
    options?: FetchSelectedOptions
  ): void;

  /**
   * For custom widgets, add a handler that will be called whenever the
   * widget options change (and on initial ready message).
   */
  onOptions(callback: (options: unknown, settings: InteractionOptions) => unknown): void;

  /**
   * Shortcut for {@link GristView.allowSelectBy}.
   */
  allowSelectBy(): Promise<void>;

  /**
   * Shortcut for {@link GristView.setSelectedRows}.
   */
  setSelectedRows(rowIds: number[] | null): Promise<void>;

  /**
   * Shortcut for {@link GristView.setCursorPos}.
   */
  setCursorPos(pos: CursorPos): Promise<void>;

  /**
   * Shortcut for {@link WidgetAPI.getOption}.
   */
  getOption(key: string): Promise<unknown>;

  /**
   * Shortcut for {@link WidgetAPI.setOption}.
   */
  setOption(key: string, value: unknown): Promise<void>;

  /**
   * Shortcut for {@link WidgetAPI.setOptions}.
   */
  setOptions(options: { [key: string]: unknown }): Promise<void>;

  /**
   * Shortcut for {@link WidgetAPI.getOptions}.
   */
  getOptions(): Promise<object | null>;

  /**
   * Shortcut for {@link WidgetAPI.clearOptions}.
   */
  clearOptions(): Promise<void>;

  /**
   * Rename columns in the result using columns mapping configuration.
   */
  mapColumnNames(
    data: unknown,
    options?: {
      columns?: ColumnsToMap;
      mappings?: WidgetColumnMap | null;
      reverse?: boolean;
    }
  ): unknown;

  /**
   * Map data with renamed columns back into the form used in the original table.
   */
  mapColumnNamesBack(
    data: unknown,
    options?: {
      columns?: ColumnsToMap;
      mappings?: WidgetColumnMap | null;
    }
  ): unknown;
}

/**
 * Global `grist` object available in custom widgets and plugins.
 */
declare global {
  const grist: GristPluginAPI;
}

export {};
