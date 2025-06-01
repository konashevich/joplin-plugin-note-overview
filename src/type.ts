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
  link?: LinkSettings;         // Link field settings
  status?: StatusSettings;     // Status text customization
  update?: 'manual' | string; // Update mode, e.g., "manual"
  tile?: TileSettings;         // Tile view specific settings

  // Processed/derived settings (mostly mandatory after processing in getOptions)
  statusText: any;
  orderBy: string;
  orderDir: string;
  imageSettings: any;
  excerptSettings: any;
  coloring: any;
  datetimeSettings: ProcessedDatetimeSettings;
  // Removed: view, listview, escapeForTable
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
  width?: number | string;
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
  imagename?: boolean;
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

// ListViewSettings removed

export interface LinkSettings {
  caption?: string;
  html?: boolean;
}

export interface StatusSettings {
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
