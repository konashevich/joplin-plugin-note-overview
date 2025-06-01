// Defines the main options structure for a note overview
export interface OverviewOptions {
  // User-provided settings from YAML (all optional)
  search?: string;          // Joplin search query
  fields?: string;          // Comma-separated list of fields to display
  sort?: string;            // Sort order string, e.g., "updated_time DESC"
  limit?: number;           // Max number of notes to display
  alias?: string;           // Field aliasing, e.g., "updated_time AS Modified"
  datetime?: DatetimeSettings; // Date/time formatting options
  image?: ImageSettings;       // Image display settings
  excerpt?: ExcerptSettings;   // Excerpt generation settings
  details?: DetailsSettings;   // <details> tag settings
  count?: CountSettings;       // Note count display settings
  listview?: ListViewSettings; // List view specific settings
  link?: LinkSettings;         // Link field settings
  status?: StatusSettings;     // Status text customization
  update?: 'manual' | string; // Update mode, e.g., "manual"
  view?: 'table' | 'list' | 'tiles'; // Display view: table, list, or tiles
  tile?: TileSettings;         // Tile view specific settings

  // Processed/derived settings (mostly mandatory after processing in getOptions)
  statusText: any; // TODO: Define specific type
  // fields: string; // Already in user-provided, becomes mandatory after defaulting
  // sortStr: string; // This was intermediate, now directly use sort and parse to orderBy/Dir
  orderBy: string;
  orderDir: string;
  // alias: string; // Already in user-provided
  imageSettings: any; // Processed from image, TODO: Define specific type
  excerptSettings: any; // Processed from excerpt, TODO: Define specific type
  coloring: any; // TODO: Define specific type for coloring rules (e.g. for todos)
  // count: CountSettings; // Already in user-provided
  // details: DetailsSettings; // Already in user-provided
  // listview: ListViewSettings; // Already in user-provided
  escapeForTable: boolean; // Internal flag, set based on view
  // link: LinkSettings; // Already in user-provided
  datetimeSettings: ProcessedDatetimeSettings; // Processed from datetime
  // tile: TileSettings; // Already in user-provided
}

// Specific settings structures for complex options

export interface DatetimeSettings {
  date?: string;
  time?: string;
  humanize?: {
    enabled?: boolean;
    withSuffix?: boolean;
  };
}

// For internal use after merging with global date/time formats
export interface ProcessedDatetimeSettings {
  date: string;
  time: string;
  humanize: {
    enabled: boolean;
    withSuffix: boolean;
  };
}

export interface ImageSettings {
  nr?: number;
  exactnr?: boolean;
  width?: number | string; // Allow string for potential "auto" or % values if CSS handles it
  height?: number | string;
  noDimensions?: boolean;
  class?: string;
  alt?: string;
}

export interface ExcerptSettings {
  maxlength?: number;
  removenewline?: boolean;
  removemd?: boolean;
  regex?: string;
  regexflags?: string;
  imagename?: boolean; // From original code, check if still needed
}

export interface DetailsSettings {
  summary?: string;
  open?: boolean;
}

export interface CountSettings {
  enable?: boolean;
  text?: string;
  position?: 'above' | 'below';
}

export interface ListViewSettings {
  separator?: string;
  text?: string;
  linebreak?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface LinkSettings {
  caption?: string;
  html?: boolean;
}

export interface StatusSettings { // For customizing status text for notes/todos
  note?: string;
  todo?: {
    open?: string;
    done?: string;
    overdue?: string;
  };
}

export interface TileSettings {
  maxTitleLength?: number;
  maxSnippetLength?: number;
}
