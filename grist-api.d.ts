/**
 * Grist API Type Definitions - v2.0.0
 * 
 * Complete, validated TypeScript definitions extracted from Grist source code.
 * Covers Plugin API, Custom Widget API, REST API, and all data structures.
 * 
 * @see https://support.getgrist.com/api
 * @see https://support.getgrist.com/widget-custom
 */

// ============================================================================
// Core Data Types
// ============================================================================

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
 * Cell value: primitive or [GristObjCode, ...args] tuple
 * Examples: 123, "text", true, ["L", "a", "b"], ["D", 1704945919, "UTC"]
 */
export type CellValue = number | string | boolean | null | [GristObjCode, ...unknown[]];

export interface BulkColValues {
  [colId: string]: CellValue[];
}

export interface RowRecord {
  id: number;
  [colId: string]: CellValue;
}

export interface RowRecords {
  id: number[];
  [colId: string]: CellValue[];
}

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
// Widget Options (Validated from UserType.ts)
// ============================================================================

export interface FormatOptions {
  [option: string]: unknown;
}

export type NumMode = 'currency' | 'decimal' | 'percent' | 'scientific';
export type NumSign = 'parens';

export interface NumberFormatOptions extends FormatOptions {
  numMode?: NumMode | null;
  numSign?: NumSign | null;
  decimals?: number | null;
  maxDecimals?: number | null;
  currency?: string | null;
}

export interface ChoiceOption {
  textColor?: string;
  fillColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  fontStrikethrough?: boolean;
}

export interface ChoiceOptions {
  [choice: string]: ChoiceOption;
}

// ============================================================================
// Column-Type-Specific Widget Options (Type-Safe)
// ============================================================================

/** Base options for text-based columns */
interface BaseTextOptions extends FormatOptions {
  alignment?: 'left' | 'center' | 'right';
  wrap?: boolean;
}

/** Options for Any column type */
export interface AnyWidgetOptions extends BaseTextOptions {}

/** Options for Text column type (TextBox, Markdown, HyperLink widgets) */
export interface TextWidgetOptions extends BaseTextOptions {
  /** Set to 'Markdown' or 'HyperLink' to use those widgets */
  widget?: 'Markdown' | 'HyperLink';
}

/** Options for Numeric column type (TextBox, Spinner widgets) */
export interface NumericWidgetOptions extends BaseTextOptions, NumberFormatOptions {}

/** Options for Int column type (TextBox, Spinner widgets) */
export interface IntWidgetOptions extends BaseTextOptions, NumberFormatOptions {
  /** Defaults to 0 for integers */
  decimals?: number | null;
}

/** Options for Bool column type (TextBox, CheckBox, Switch widgets) */
export interface BoolWidgetOptions extends FormatOptions {
  /** Only for TextBox widget */
  alignment?: 'left' | 'center' | 'right';
  /** Only for TextBox widget */
  wrap?: boolean;
}

/** Options for Date column type (TextBox widget only) */
export interface DateWidgetOptions extends FormatOptions {
  dateFormat?: string;
  isCustomDateFormat?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

/** Options for DateTime column type (TextBox widget only) */
export interface DateTimeWidgetOptions extends FormatOptions {
  dateFormat?: string;
  timeFormat?: string;
  isCustomDateFormat?: boolean;
  isCustomTimeFormat?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

/** Options for Choice column type (TextBox widget only) */
export interface ChoiceWidgetOptions extends BaseTextOptions {
  choices?: string[];
  choiceOptions?: ChoiceOptions;
}

/** Options for ChoiceList column type (TextBox widget only) */
export interface ChoiceListWidgetOptions extends BaseTextOptions {
  choices?: string[];
  choiceOptions?: ChoiceOptions;
}

/** Options for Ref column type (Reference widget only) */
export interface RefWidgetOptions extends BaseTextOptions {}

/** Options for RefList column type (Reference widget only) */
export interface RefListWidgetOptions extends BaseTextOptions {}

/** Options for Attachments column type (Attachments widget only) */
export interface AttachmentsWidgetOptions extends FormatOptions {
  height?: string;
}

/**
 * Generic widget options covering all column types.
 * For type-safe options, use column-specific interfaces above.
 */
export interface WidgetOptions extends FormatOptions {
  // Common
  alignment?: 'left' | 'center' | 'right';
  wrap?: boolean;
  widget?: string;

  // Numeric, Int
  numMode?: NumMode | null;
  numSign?: NumSign | null;
  decimals?: number | null;
  maxDecimals?: number | null;
  currency?: string | null;

  // Date, DateTime
  dateFormat?: string;
  timeFormat?: string;
  isCustomDateFormat?: boolean;
  isCustomTimeFormat?: boolean;

  // Choice, ChoiceList
  choices?: string[];
  choiceOptions?: ChoiceOptions;

  // Attachments
  height?: string;

  // Conditional styling (applies to all types)
  textColor?: string;
  fillColor?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  fontStrikethrough?: boolean;
}

/**
 * Map of Grist column types to their valid widget options.
 * Use this for type-safe widget option handling.
 *
 * @example
 * ```typescript
 * // Type-safe usage
 * const numericOptions: NumericWidgetOptions = {
 *   alignment: 'right',
 *   numMode: 'currency',
 *   currency: 'USD',
 *   decimals: 2
 * };
 *
 * // Or get options by column type
 * function getOptionsForType<T extends GristType>(
 *   type: T
 * ): WidgetOptionsByType[T] {
 *   // Returns type-safe options for the column type
 * }
 * ```
 */
export interface WidgetOptionsByType {
  Any: AnyWidgetOptions;
  Text: TextWidgetOptions;
  Numeric: NumericWidgetOptions;
  Int: IntWidgetOptions;
  Bool: BoolWidgetOptions;
  Date: DateWidgetOptions;
  DateTime: DateTimeWidgetOptions;
  Choice: ChoiceWidgetOptions;
  ChoiceList: ChoiceListWidgetOptions;
  Ref: RefWidgetOptions;
  RefList: RefListWidgetOptions;
  Attachments: AttachmentsWidgetOptions;
  // These types typically don't have custom widget options
  Blob: FormatOptions;
  Id: FormatOptions;
  ManualSortPos: FormatOptions;
  PositionNumber: FormatOptions;
}

/**
 * WIDGET OPTIONS REFERENCE TABLE
 * ===============================
 *
 * Shows which widget options are valid for each column type.
 * ✓ = Valid option for this type
 *
 * | Option              | Any | Text | Numeric | Int | Bool | Date | DateTime | Choice | ChoiceList | Ref | RefList | Attachments |
 * |---------------------|-----|------|---------|-----|------|------|----------|--------|------------|-----|---------|-------------|
 * | alignment           |  ✓  |  ✓   |    ✓    |  ✓  |  ✓*  |  ✓   |    ✓     |   ✓    |     ✓      |  ✓  |    ✓    |             |
 * | wrap                |  ✓  |  ✓   |    ✓    |  ✓  |  ✓*  |      |          |   ✓    |     ✓      |  ✓  |    ✓    |             |
 * | numMode             |     |      |    ✓    |  ✓  |      |      |          |        |            |     |         |             |
 * | numSign             |     |      |    ✓    |  ✓  |      |      |          |        |            |     |         |             |
 * | decimals            |     |      |    ✓    |  ✓  |      |      |          |        |            |     |         |             |
 * | maxDecimals         |     |      |    ✓    |  ✓  |      |      |          |        |            |     |         |             |
 * | currency            |     |      |    ✓    |  ✓  |      |      |          |        |            |     |         |             |
 * | dateFormat          |     |      |         |     |      |  ✓   |    ✓     |        |            |     |         |             |
 * | timeFormat          |     |      |         |     |      |      |    ✓     |        |            |     |         |             |
 * | isCustomDateFormat  |     |      |         |     |      |  ✓   |    ✓     |        |            |     |         |             |
 * | isCustomTimeFormat  |     |      |         |     |      |      |    ✓     |        |            |     |         |             |
 * | choices             |     |      |         |     |      |      |          |   ✓    |     ✓      |     |         |             |
 * | choiceOptions       |     |      |         |     |      |      |          |   ✓    |     ✓      |     |         |             |
 * | height              |     |      |         |     |      |      |          |        |            |     |         |      ✓      |
 * | widget              |     |  ✓** |         |     |      |      |          |        |            |     |         |             |
 *
 * Notes:
 * - ✓* = Only valid for TextBox widget (not CheckBox/Switch)
 * - ✓** = Set to 'Markdown' or 'HyperLink' to use those widgets
 * - Conditional styling (textColor, fillColor, font*) can be applied to all types via conditional rules
 *
 * AVAILABLE WIDGETS PER COLUMN TYPE:
 * - Any: TextBox
 * - Text: TextBox, Markdown, HyperLink
 * - Numeric: TextBox, Spinner
 * - Int: TextBox, Spinner
 * - Bool: TextBox, CheckBox, Switch
 * - Date: TextBox
 * - DateTime: TextBox
 * - Choice: TextBox
 * - ChoiceList: TextBox
 * - Ref: Reference
 * - RefList: Reference
 * - Attachments: Attachments
 */

/** Available widget types per column type (from UserType.ts) */
export type CellWidgetType =
  | 'TextBox'     // All types
  | 'Markdown'    // Text only
  | 'HyperLink'   // Text only
  | 'Spinner'     // Numeric, Int
  | 'CheckBox'    // Bool
  | 'Switch'      // Bool
  | 'Reference'   // Ref, RefList
  | 'Attachments';// Attachments

export type ViewWidgetType =
  | 'record'           // Table
  | 'detail'           // Card List
  | 'single'           // Card
  | 'chart'            // Chart
  | 'custom'           // Custom Widget
  | 'form'             // Form
  | 'custom.calendar'; // Calendar

// ============================================================================
// UI Types
// ============================================================================

export type UIRowId = number | 'new';

export interface CursorPos {
  rowId?: UIRowId;
  rowIndex?: number;
  fieldIndex?: number;
  sectionId?: number;
  linkingRowIds?: UIRowId[];
}

// ============================================================================
// Core Plugin API
// ============================================================================

export type ComponentKind = 'safeBrowser' | 'safePython' | 'unsafeNode';
export type RenderTarget = 'fullscreen' | number;

export interface RenderOptions {
  height?: string;
}

export interface GristAPI {
  render(path: string, target: RenderTarget, options?: RenderOptions): Promise<number>;
  dispose(procId: number): Promise<void>;
  subscribe(tableId: string): Promise<void>;
  unsubscribe(tableId: string): Promise<void>;
}

// ============================================================================
// Document API
// ============================================================================

export interface AccessTokenOptions {
  readOnly?: boolean;
}

export interface AccessTokenResult {
  token: string;
  baseUrl: string;
  ttlMsecs: number;
}

export interface ApplyUAOptions {
  desc?: string;
  otherId?: number;
  linkId?: number;
  parseStrings?: boolean;
}

export interface ApplyUAResult {
  actionNum: number;
  actionHash: string | null;
  retValues: unknown[];
  isModification: boolean;
}

export interface GristDocAPI {
  getDocName(): Promise<string>;
  listTables(): Promise<string[]>;
  fetchTable(tableId: string): Promise<RowRecords>;
  applyUserActions(actions: unknown[][], options?: ApplyUAOptions): Promise<ApplyUAResult>;
  getAccessToken(options: AccessTokenOptions): Promise<AccessTokenResult>;
}

// ============================================================================
// View API
// ============================================================================

export interface FetchSelectedOptions {
  keepEncoded?: boolean;
  format?: 'rows' | 'columns';
  includeColumns?: 'shown' | 'normal' | 'all';
  expandRefs?: boolean;
}

export interface GristView {
  fetchSelectedTable(options?: FetchSelectedOptions): Promise<RowRecords | RowRecord[]>;
  fetchSelectedRecord(rowId: number, options?: FetchSelectedOptions): Promise<RowRecord>;
  allowSelectBy(): Promise<void>;
  setSelectedRows(rowIds: number[] | null): Promise<void>;
  setCursorPos(pos: CursorPos): Promise<void>;
}

// ============================================================================
// Custom Widget API
// ============================================================================

export interface ColumnToMap {
  name: string;
  title?: string | null;
  description?: string | null;
  type?: string;
  optional?: boolean;
  allowMultiple?: boolean;
  strictType?: boolean;
}

export type ColumnsToMap = (string | ColumnToMap)[];

export interface InteractionOptionsRequest {
  requiredAccess?: string;
  hasCustomOptions?: boolean;
  columns?: ColumnsToMap;
  allowSelectBy?: boolean;
}

export interface InteractionOptions {
  accessLevel: string;
}

export interface WidgetColumnMap {
  [key: string]: string | string[] | null;
}

export interface CustomSectionAPI {
  configure(customOptions: InteractionOptionsRequest): Promise<void>;
  mappings(): Promise<WidgetColumnMap | null>;
}

export interface WidgetAPI {
  getOptions(): Promise<object | null>;
  setOptions(options: { [key: string]: unknown }): Promise<void>;
  clearOptions(): Promise<void>;
  setOption(key: string, value: unknown): Promise<void>;
  getOption(key: string): Promise<unknown>;
}

// ============================================================================
// Table Operations (CRUD)
// ============================================================================

export type RecordId = number;

export interface MinimalRecord {
  id: number;
}

export interface NewRecord {
  fields?: { [colId: string]: CellValue };
}

export interface Record {
  id: number;
  fields: { [colId: string]: CellValue };
}

export interface AddOrUpdateRecord {
  require: { [colId: string]: CellValue } & { id?: number };
  fields?: { [colId: string]: CellValue };
}

export interface OpOptions {
  parseStrings?: boolean;
}

export interface UpsertOptions extends OpOptions {
  add?: boolean;
  update?: boolean;
  onMany?: 'none' | 'first' | 'all';
  allowEmptyRequire?: boolean;
}

export interface TableOperations {
  create(records: NewRecord, options?: OpOptions): Promise<MinimalRecord>;
  create(records: NewRecord[], options?: OpOptions): Promise<MinimalRecord[]>;
  update(records: Record | Record[], options?: OpOptions): Promise<void>;
  destroy(recordIds: RecordId | RecordId[]): Promise<void>;
  upsert(records: AddOrUpdateRecord | AddOrUpdateRecord[], options?: UpsertOptions): Promise<void>;
  getTableId(): Promise<string>;
}

// ============================================================================
// Table Metadata
// ============================================================================

export interface GristColumn {
  id: string;
  type: string;
}

export interface GristTable {
  table_name: string | null;
  column_metadata: GristColumn[];
  table_data: unknown[][];
}

export interface GristTables {
  tables: GristTable[];
}

// ============================================================================
// Import/Export
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
  options?: string | Buffer;
  description?: string;
}

export interface ImportSourceAPI {
  getImportSource(): Promise<ImportSource | undefined>;
}

export interface ImportProcessorAPI {
  processImport(source: ImportSource): Promise<GristTable[]>;
}

export interface FileSource {
  path: string;
  origName: string;
}

export interface ParseOptions {
  NUM_ROWS?: number;
  SCHEMA?: ParseOptionSchema[];
  WARNING?: string;
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
// Storage
// ============================================================================

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

export interface ColValues {
  [colId: string]: CellValue;
}

export interface ColInfo {
  type: string;
  isFormula: boolean;
  formula: string;
}

export interface ColInfoWithId extends ColInfo {
  id: string;
}

export interface TableColValues {
  id: number[];
  [colId: string]: CellValue[];
}

export interface TableRecordValue {
  id: number | string;
  fields: { [colId: string]: CellValue };
}

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
  | AddRecord | BulkAddRecord | RemoveRecord | BulkRemoveRecord
  | UpdateRecord | BulkUpdateRecord | ReplaceTableData | TableDataAction
  | AddColumn | RemoveColumn | RenameColumn | ModifyColumn
  | AddTable | RemoveTable | RenameTable;

export type UserAction = Array<string | number | object | boolean | null | undefined>;

// ============================================================================
// Webhooks
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
  lastEventBatch?: {
    size: number;
    errorMessage: string | null;
    httpStatus: number | null;
    status: WebhookBatchStatus;
    attempts: number;
  } | null;
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
// Roles & Permissions
// ============================================================================

export type BasicRole = 'owners' | 'editors' | 'viewers';
export type NonMemberRole = BasicRole | 'guests';
export type NonGuestRole = BasicRole | 'members';
export type Role = NonMemberRole | 'members';

// ============================================================================
// REST API Types
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
// User Preferences
// ============================================================================

export type SortPref = 'name' | 'date';
export type ViewPref = 'list' | 'icons';
export type ThemeAppearance = 'light' | 'dark';
export type ThemeName = 'GristLight' | 'GristDark' | 'HighContrastLight';

export interface ThemePrefs {
  appearance: ThemeAppearance;
  syncWithOS: boolean;
  colors: {
    light: ThemeName;
    dark: ThemeName;
  };
}

export type BehavioralPrompt =
  | 'referenceColumns' | 'referenceColumnsConfig' | 'rawDataPage'
  | 'accessRules' | 'filterButtons' | 'nestedFiltering'
  | 'pageWidgetPicker' | 'pageWidgetPickerSelectBy'
  | 'editCardLayout' | 'addNew' | 'rickRow' | 'calendarConfig';

export interface BehavioralPromptPrefs {
  dontShowTips: boolean;
  dismissedTips: BehavioralPrompt[];
}

export type DismissedPopup =
  | 'deleteRecords' | 'deleteFields' | 'formulaHelpInfo'
  | 'formulaAssistantInfo' | 'supportGrist'
  | 'publishForm' | 'unpublishForm' | 'upgradeNewAssistant';

export type WelcomePopup = 'coachingCall';

export interface DismissedReminder {
  id: WelcomePopup;
  lastDismissedAt: number;
  nextAppearanceAt: number | null;
  timesDismissed: number;
}

export interface UserPrefs {
  showNewUserQuestions?: boolean;
  theme?: ThemePrefs;
  dismissedPopups?: DismissedPopup[];
  behavioralPrompts?: BehavioralPromptPrefs;
  dismissedWelcomePopups?: DismissedReminder[];
  locale?: string;
  onlyShowDocuments?: boolean;
}

export interface UserOrgPrefs {
  docMenuSort?: SortPref;
  docMenuView?: ViewPref;
  seenExamples?: number[];
  showGristTour?: boolean;
  seenDocTours?: string[];
}

export interface OrgPrefs {
  customLogoUrl?: string | null;
}

export interface DocPrefs {
  notifications?: object;
}

export interface FullDocPrefs {
  docDefaults: DocPrefs;
  currentUser: DocPrefs;
}

// ============================================================================
// Organizations, Workspaces, Documents
// ============================================================================

export interface CommonProperties {
  name: string;
  createdAt: string;
  updatedAt: string;
  removedAt?: string;
  public?: boolean;
}

export type DocumentType = null | 'template' | 'tutorial';

export interface DocumentIcon {
  backgroundColor?: string;
  color?: string;
  emoji?: string | null;
}

export interface DocumentAppearance {
  icon?: DocumentIcon | null;
}

export interface TutorialMetadata {
  lastSlideIndex?: number;
  percentComplete?: number;
}

export interface DocumentOptions {
  description?: string | null;
  icon?: string | null;
  openMode?: 'default' | 'fork' | null;
  externalId?: string | null;
  tutorial?: TutorialMetadata | null;
  appearance?: DocumentAppearance | null;
  allowIndex?: boolean;
}

export interface DocumentProperties extends CommonProperties {
  isPinned: boolean;
  urlId: string | null;
  trunkId: string | null;
  type: DocumentType | null;
  options: DocumentOptions | null;
}

export interface FullUser {
  id: number;
  email: string;
  name: string;
  picture?: string | null;
  anonymous?: boolean;
  loginEmail?: string;
  loginMethod?: string;
  locale?: string;
  ref?: string | null;
  prefs?: UserPrefs;
  createdAt?: string;
  firstLoginAt?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  picture?: string;
  anonymous?: boolean;
  loginEmail?: string;
  loginMethod?: string;
  locale?: string;
}

export interface Features {
  vanityDomain?: boolean;
  workspaces?: boolean;
  [key: string]: unknown;
}

export interface Product {
  id: number;
  name: string;
  features: Features;
}

export interface BillingAccount {
  id: number;
  individual: boolean;
  product: Product;
  stripePlanId: string;
  isManager: boolean;
  inGoodStanding: boolean;
  features?: Features;
  externalOptions?: {
    invoiceId?: string;
  };
}

export interface OrganizationProperties extends CommonProperties {
  domain: string | null;
  userOrgPrefs?: UserOrgPrefs;
  orgPrefs?: OrgPrefs;
  userPrefs?: UserPrefs;
}

export interface Organization extends OrganizationProperties {
  id: number;
  owner: FullUser | null;
  billingAccount?: BillingAccount;
  host: string | null;
  access: Role;
}

export interface WorkspaceProperties extends CommonProperties {}

export interface Fork {
  id: string;
  trunkId: string;
  updatedAt: string;
  options: DocumentOptions | null;
}

export interface Workspace extends WorkspaceProperties {
  id: number;
  docs: Document[];
  org: Organization;
  orgDomain?: string;
  access: Role;
  owner?: FullUser;
  isSupportWorkspace?: boolean;
}

export interface Document extends DocumentProperties {
  id: string;
  workspace: Workspace;
  access: Role;
  trunkAccess?: Role | null;
  forks?: Fork[];
}

// ============================================================================
// Custom Widget Configuration
// ============================================================================

export enum AccessLevel {
  none = 'none',
  read_table = 'read table',
  full = 'full',
}

export interface WidgetAuthor {
  name: string;
  url?: string;
}

export interface ICustomWidget {
  name: string;
  widgetId: string;
  url: string;
  accessLevel?: AccessLevel;
  renderAfterReady?: boolean;
  published?: boolean;
  source?: {
    pluginId: string;
    name: string;
  };
  description?: string;
  authors?: WidgetAuthor[];
  lastUpdatedAt?: string;
  isGristLabsMaintained?: boolean;
}

// ============================================================================
// Query & Transform
// ============================================================================

export interface QueryFilters {
  [colId: string]: CellValue[];
}

export type QueryOperation = 'in' | 'intersects' | 'empty';
export type DestId = string | null | '';

export interface TransformColumn {
  label: string;
  colId: string | null;
  type: string;
  formula: string;
  widgetOptions: string;
}

export interface TransformRule {
  destTableId: DestId;
  destCols: TransformColumn[];
  sourceCols: string[];
}

export interface TransformRuleMap {
  [origTableName: string]: TransformRule;
}

export interface MergeStrategy {
  type: 'replace-with-nonblank-source' | 'replace-all-fields' | 'replace-blank-fields-only';
}

export interface MergeOptions {
  mergeCols: string[];
  mergeStrategy: MergeStrategy;
}

export interface ImportOptions {
  parseOptions?: ParseOptions;
  mergeOptionMaps?: { [origTableName: string]: MergeOptions | undefined }[];
}

// ============================================================================
// Main Plugin API (global `grist` object)
// ============================================================================

export interface ReadyPayload extends Omit<InteractionOptionsRequest, 'hasCustomOptions'> {
  onEditOptions?: () => unknown;
}

export interface GristPluginAPI {
  readonly api: GristAPI;
  readonly docApi: GristDocAPI & GristView;
  readonly viewApi: GristView;
  readonly widgetApi: WidgetAPI;
  readonly sectionApi: CustomSectionAPI;
  readonly selectedTable: TableOperations;

  ready(settings?: ReadyPayload): void;
  getTable(tableId?: string): TableOperations;
  getAccessToken(options?: AccessTokenOptions): Promise<AccessTokenResult>;
  fetchSelectedTable(options?: FetchSelectedOptions): Promise<RowRecords | RowRecord[]>;
  fetchSelectedRecord(rowId: number, options?: FetchSelectedOptions): Promise<RowRecord>;
  onRecord(callback: (data: RowRecord | null, mappings: WidgetColumnMap | null) => unknown, options?: FetchSelectedOptions): void;
  onNewRecord(callback: (mappings: WidgetColumnMap | null) => unknown): void;
  onRecords(callback: (data: RowRecord[], mappings: WidgetColumnMap | null) => unknown, options?: FetchSelectedOptions): void;
  onOptions(callback: (options: unknown, settings: InteractionOptions) => unknown): void;
  allowSelectBy(): Promise<void>;
  setSelectedRows(rowIds: number[] | null): Promise<void>;
  setCursorPos(pos: CursorPos): Promise<void>;
  getOption(key: string): Promise<unknown>;
  setOption(key: string, value: unknown): Promise<void>;
  setOptions(options: { [key: string]: unknown }): Promise<void>;
  getOptions(): Promise<object | null>;
  clearOptions(): Promise<void>;
  mapColumnNames(data: unknown, options?: { columns?: ColumnsToMap; mappings?: WidgetColumnMap | null; reverse?: boolean }): unknown;
  mapColumnNamesBack(data: unknown, options?: { columns?: ColumnsToMap; mappings?: WidgetColumnMap | null }): unknown;
}

declare global {
  const grist: GristPluginAPI;
}

export {};
