<!-- markdownlint-disable MD033 -->
<!-- markdownlint-disable MD028 -->
<!-- markdownlint-disable MD007 -->
<!-- markdownlint-disable MD045 -->

# Joplin Plugin: Note overview <img src=img/icon_32.png>

A note overview is created based on the defined search and the specified fields.

<img src=img/main.png>
<!-- TOC -->

- [Installation](#installation)
  - [Automatic](#automatic)
  - [Manual](#manual)
    - [Manual via file system](#manual-via-file-system)
    - [Manual via file via GUI](#manual-via-file-via-gui)
- [Usage](#usage)
  - [Default Behavior](#default-behavior)
  - [Limitations](#limitations)
- [Codeblock options](#codeblock-options)
  - [search](#search)
    - [search variable date](#search-variable-date)
  - [fields](#fields)
  - [sort](#sort)
  - [limit](#limit)
  - [view](#view)
  - [tile](#tile)
  - [alias](#alias)
  - [datetime](#datetime)
  - [image](#image)
  - [excerpt](#excerpt)
  - [details](#details)
  - [count](#count)
  - [listview](#listview)
  - [link](#link)
  - [status](#status)
- [Tile View and Color-Coding](#tile-view-and-color-coding)
  - [Tile View](#tile-view)
  - [Color-Coding Tiles](#color-coding-tiles)
- [Examples](#examples)
  - [ToDo Overview](#todo-overview)
  - [Show all ToDos with status](#show-all-todos-with-status)
  - [Open ToDos for the next 7 days and overdue ToDos](#open-todos-for-the-next-7-days-and-overdue-todos)
  - [Exclude ToDos with no due date](#exclude-todos-with-no-due-date)
  - [Show all ToDos with no due date](#show-all-todos-with-no-due-date)
  - [Rename fields](#rename-fields)
  - [Notes without a tag](#notes-without-a-tag)
  - [Notes created last 7 days](#notes-created-last-7-days)
  - [Cooking recipes overview](#cooking-recipes-overview)
  - [Tile View Examples](#tile-view-examples)
  - [Details option](#details-option)
  - [Change count for single overview](#change-count-for-single-overview)
  - [Change to listview no linbreak](#change-to-listview-no-linbreak)
  - [Combine notes dynamically](#combine-notes-dynamically)
  - [Show all uncompleted checkboxes ToDos](#show-all-uncompleted-checkboxes-todos)
  - [Disable automatic note overview update for one note overview](#disable-automatic-note-overview-update-for-one-note-overview)
  - [Show the last 5 edited notes](#show-the-last-5-edited-notes)
- [Plugin options](#plugin-options)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [FAQ](#faq)
  - [The note overview is not updated](#the-note-overview-is-not-updated)
  - [Error: Nested mappings are not allowed in compact mappings](#error-nested-mappings-are-not-allowed-in-compact-mappings)
  - [Error: Implicit map keys need to be followed by map values](#error-implicit-map-keys-need-to-be-followed-by-map-values)
  - [Error: All collection items must start at the same column](#error-all-collection-items-must-start-at-the-same-column)
  - [Error: e.slice is not a function](#error-eslice-is-not-a-function)
- [Develop](#develop)
  - [Build](#build)
  - [Updating the plugin framework](#updating-the-plugin-framework)
- [Changelog](#changelog)
- [Links](#links)

<!-- /TOC -->

## Installation

### Automatic

- Go to `Tools > Options > Plugins`
- Search for `Note overview`
- Click Install plugin
- Restart Joplin to enable the plugin

### Manual

#### Manual via file system

- Download the latest released JPL package (`io.github.jackgruber.note-overview.jpl`) from [here](https://github.com/JackGruber/joplin-plugin-note-overview/releases/latest)
- Close Joplin
- Copy the downloaded JPL package in your profile `plugins` folder
- Start Joplin

#### Manual via file via GUI

- Download the latest released JPL package (`io.github.jackgruber.notelistpreview.jpl`) from [here](https://github.com/JackGruber/joplin-plugin-notelistpreview/releases/latest)
- Go to `Tools > Options > Plugins`
- Click on the gear wheel and select `Install from file`
- Select the downloaded JPL file
- Restart Joplin

## Usage

Create one or more notes with the following content:

```yml
<!-- note-overview-plugin
search: -tag:*
fields: updated_time, title
alias: updated_time AS Last edit, title AS Title
sort: title DESC
-->
```

Several of these blocks can be included in one note, also between text.

The note content is updated every x minutes (depending on your setting) or manualy by `Tools > Create Note overview`.

### Default Behavior

If you create an overview block without specifying any options, or if the `search` option is empty, the plugin will automatically display an overview of the **100 most recently updated notes** in a **tile view**.
The default fields shown for these tiles will be: `image, title, excerpt, tags`.

Example of a minimal block invoking default behavior:
```yml
<!-- note-overview-plugin
-->
```

### Limitations

> ⚠ Adding and editing the code block does not work in the **Rich Text (WYSIWYG)** editor!

> ⚠ When the note is edited in `Rich Text` (WYSIWYG) editor, the note code block is not preserved!

> ⚠ The manual refresh of the note ist not working in the `Rich Text` (WYSIWYG) editor, to update the note chnage to markdown editor, viewer or a other note and trigger the note overview update again.

> With an automatic update, the currently displayed note opened in the `markdown` or `Rich Text` (WYSIWYG) editor is not updated to prevent data loss during editing!

## Codeblock options

Options that can be specified in the in the code block using YAML syntax.

### search

The search filter which will be used to create the overview.
[Documentation of search filters](https://joplinapp.org/help/apps/search#search-filters).
If this option is omitted or empty, a default search for the 100 most recently updated notes will be performed (see [Default Behavior](#default-behavior)).

```yml
search: type:todo
```

#### search variable date

To search for date texts the variable `{{moments:<FORMAT>}}` is available, replace the `<FORMAT>` with the [moments formatting](https://momentjs.com/docs/#/displaying/)

```yml
search: Logbook {{moments:YYYY}}
```

The date can be manipulated with `modify:<MANIPULATION>`, for `<MANIPULATION>` the syntax is `<+ or -><amount><Key>` and the following key. This syntax can be repeated comma separated.

| Modification | Key |
| ------------ | --- |
| years        | y   |
| quarters     | Q   |
| months       | M   |
| weeks        | w   |
| days         | d   |
| hours        | h   |
| minutes      | m   |

```yml
search: Logbook {{moments:DD-MM-YYYY modify:+1m,-1d}}
```

### fields

Which fields should be output in the table or tiles.
All fields of the note are available, a complete list of all field can be found [here](https://joplinapp.org/api/references/rest_api/#properties).

In addition to the Joplin fields, there are the following virtual fields:

- `status`: for todo status
- `file`: List of all attachments
- `file_size`: List of all attachments including their size
- `size`: Size of the note, including attachments
- `tags`: Assigned tags of the note
- `notebook`: Folder in which the note is stored
- `breadcrumb`: Folder breadcrumb (Folder path)
- `image`: In this field a image resource from the note will be displayed. This field can be configured using the `image` option. For the `tiles` view, this is used to display the first image.
- `excerpt`: Displays an excerpt of the note body. For the `tiles` view, this is used for the snippet.
- `link`: Display the `source_url`. This field can be configured using the `link` option

If this option is omitted:
- For `tiles` view, it defaults to `image, title, excerpt, tags`.
- For `table` and `list` views, it defaults to `updated_time, title`.

```yml
fields: todo_due, title, tags, notebook
```

### sort

By which field the output should be sorted. It can be only sorted by one field and it's not possible to sort by a virtual field!
If `search` is omitted or empty, this defaults to `updated_time DESC`. Otherwise, it defaults to `title ASC`.

```yml
sort: todo_due ASC
```

### limit

Displays only the first x hits of the search.
If `search` is omitted or empty and `limit` is not specified, this defaults to `100`. Otherwise, if not specified, all results are displayed.

```yml
limit: 5
```

### view

Determines the layout of the note overview.

- `table`: (Default if `search` is specified) Displays notes in a markdown table.
- `list`: Displays notes in a list format (requires `listview` options to be configured).
- `tiles`: Displays notes in a Google Keep-style tile layout. Each tile shows title, first image (if any), an excerpt, and tags. (Default if `search` is not specified).

Example:
```yml
view: tiles
```

### tile

Specific options for the `tiles` view.

```yml
tile:
  maxTitleLength: 50  # Max characters for tile title (default 50)
  maxSnippetLength: 100 # Max characters for tile snippet (default 100)
```

### alias

This allows renaming the fields in the output.

Syntax: `<field> AS <new field name>`, multiple fields comma seperated.

```yml
alias: todo_due AS Due Date, notebook AS Folder
```

### datetime

Customize datetime format for a single overview.

```yml
datetime:
  date: "YYYY-MM-DD"
  time: "HH:mm"
```

- `date`: Set date format. Default is Joplin global settings on `Tools` > `Options` > `General` > `Date format`
- `time`: Set time format. Default is Joplin global settings on `Tools` > `Options` > `General` > `Time format`

Complete list of format can be found [here](https://momentjs.com/docs/#/displaying/format/).

You can also set datetime to [humanize](https://momentjs.com/docs/#/durations/humanize/) format, to display a length of time. You can do that by adding `humanize` settings.

```yml
datetime:
  date: "YYYY-MM-DD"
  time: "HH:mm"
  humanize:
    enabled: [true | false]
    withSuffix: [true | false]
```

- `enabled` : set `true` to enable humanize format. Default is `false`.
- `withSuffix` : set `false`, to remove oriented duration (ex: `a month`). Default is `true`, it will add oriented duration (ex: `in a month`, `a month ago`).

### image

This allows you to control the image displayed in the `image` field.

- `nr`: Which image should be displayed
- `exactnr`:
  `false` = If the image number is not found, the last available one is used.
  `true` = Only the exact image number is used.
- `width`: The image is reduced to this width. (Not applicable for `tiles` view)
- `height`: The image is reduced to this height. (Not applicable for `tiles` view)

```yml
image:
  nr: 1
  exactnr: true
  width: 200
  height: 200
```

### excerpt

Displays an excerpt of the note body, the length of the excerpt can be configured using `maxlength` or you can use a RegEx to select data for the excerpt.

```yml
excerpt:
  maxlength: 200
  removenewline: [true | false]
  removemd: [true | false]
  regex: ^.*Joplin.*$
  regexflags: gmi
```

- `maxlength`: Maximum length for the excerpt. For `tiles` view, this can also be set via `tile.maxSnippetLength`.
- `removenewline`: Remove new lines from excerpt, default `true`
- `removemd`: Remove markdown from excerpt, default `true`
- `regex`: Regular expression to match content for the excerpt. `maxlength` will be ignored if this option is used.
- `regexflags`: Regular expression flags for the `regex` match

### details

Add the overview into a details section that can open and close on demand.
In the summary the variable `{{count}}` can be used, to display the number of matched notes.

```yml
details:
  open: [true | false]
  summary: {{count}} notes without a Tag
```

### count

Customize note count field for a single overview.

```yml
count:
  enable: [true | false]
  position: [above | below]
  text: Note count: {{count}}
```

### listview

Option to display the overview as list instead of a table.
For the field `text` all fields can be used, all used Joplin fields must be specified in the `fields`!

```yml
fields: title
listview:
  text: "{{title}} in {{notebook}}"
  linebreak: [true | false]
  separator: " | "
  prefix: ==
  suffix: ==
```

### link

This allows you to control the output displayed in the `link` field.

- `caption`: The text to display for the link (default = `Link`).
- `html`:
  `false` = Output is a markdown link (default)
  `true` = Output is a HTML link

```yml
link:
  caption: "Jump to"
  html: true
```

### status

Customize note status field for a single overview.

```yml
status:
  note: ""
  todo:
    open: ☐
    done: 🗹
    overdue: ⚠
```

## Tile View and Color-Coding

### Tile View

The `tiles` view mode provides a visual layout inspired by Google Keep. Each note is displayed as a "tile" containing:
- The note's title (truncated if it exceeds `tile.maxTitleLength`).
- The first image found in the note body (if any).
- A short snippet from the note body (length controlled by `tile.maxSnippetLength` or `excerpt.maxlength`).
- Tags associated with the note.

This view is particularly useful for a more visual overview of notes, especially those with images.

### Color-Coding Tiles

Note tiles can be color-coded by adding specific tags to the notes. This allows for quick visual differentiation.
- **Supported Color Tags:** "Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Black", "White", "Pink", "Brown", "Gray" (or "Grey").
- **Application:** If a note has one of these tags, the corresponding tile will be styled with that color. The border will be the full color, and the background will be a lighter, semi-transparent version of the color.
- **Priority:** If multiple color tags are present on a single note, the first one encountered (based on the order of tags fetched from Joplin) will determine the tile's color.
- **Example:** To make a note tile appear red, add the tag `Red` to the note in Joplin. For a yellow tile, add the tag `Yellow`.

Special considerations for text and tag visibility are made for "White" and "Black" tiles to ensure readability against the Joplin theme.

## Examples

### ToDo Overview

```yml
<!-- note-overview-plugin
search: type:todo iscompleted:0
fields: todo_due, title, tags, notebook
sort: todo_due ASC
-->
```

### Show all ToDos with status

```yml
<!-- note-overview-plugin
search: type:todo
fields: status, todo_due, title
sort: todo_completed ASC
-->
```

### Open ToDos for the next 7 days and overdue ToDos

```yml
<!-- note-overview-plugin
search: -due:day+7 iscompleted:0
fields: todo_due, title
sort: todo_due ASC
-->
```

### Exclude ToDos with no due date

```yml
<!-- note-overview-plugin
search: due:19700201 iscompleted:0
fields: todo_due, title
sort: todo_due ASC
-->
```

### Show all ToDos with no due date

```yml
<!-- note-overview-plugin
search: -due:19700201 iscompleted:0
fields: todo_due, title
sort: todo_due ASC
-->
```

### Rename fields

```yml
<!-- note-overview-plugin
search: "*"
fields: updated_time, title
alias: updated_time AS Modified
-->

```

### Notes without a tag

```yml
<!-- note-overview-plugin
search: -tag:*
fields: updated_time, title
-->
```

### Notes created last 7 days

```yml
<!-- note-overview-plugin
search: created:day-7
fields: title, updated_time
sort: title DESC
-->
```

### Cooking recipes overview

This example uses the default table view.
```yml
<!-- note-overview-plugin
search: notebook:Cooking
fields: title, image, tags
image:
  width: 200
  height: 200
-->
```

<img src="img/example_image.jpg">

### Tile View Examples

#### Basic Tile View

This example shows important project notes as tiles.
```yml
<!-- note-overview-plugin
search: notebook:"Projects" tag:important
view: tiles
fields: image, title, excerpt, tags
sort: updated_time DESC
-->
```

#### Tile View with Colored Note

This example uses the tile view and highlights a specific note with a "Red" tag.
```yml
<!-- note-overview-plugin
search: notebook:"Projects"
view: tiles
tile:
  maxTitleLength: 40
  maxSnippetLength: 80
-->
```
*(To make a tile red, ensure one of the notes found by `notebook:"Projects"` has the tag `Red`)*

#### Default Tile View (No Search Specified)

This will show the 100 most recently updated notes in a tile view.
```yml
<!-- note-overview-plugin
-->
```

### Details option

```yml
<!-- note-overview-plugin
search: -tag:*
fields: title
details:
  open: false
  summary: All notes without a Tag
-->
```

<img src="img/example_option_details.jpg">

### Change count for single overview

```yml
<!-- note-overview-plugin
search: -tag:*
fields: title
count:
  enable: true
  position: above
  text: For the query {{count}} notes where found
-->

```

### Change to listview (no linbreak)

```yml
<!-- note-overview-plugin
search: -tag:*
fields: title, updated_time
listview:
  text: "{{title}}"
  linebreak: false
  separator: " | "
  prefix: ==
  suffix: ==
-->
```

<img src="img/example_option_listview_nolb.jpg">

### Combine notes dynamically

```yml
<!-- note-overview-plugin
search: notebook:"Welcome! (Desktop)"
fields: body
listview:
  text: "{{body}}"
  separator: ---
-->
```

### Show all uncompleted checkboxes (ToDos)

```yml
<!-- note-overview-plugin
search: tag:todo
fields: title, excerpt
listview:
  text: |-

    {{title}}
    {{excerpt}}
excerpt:
  regex: ^.*- \[( )\].*$
  regexflags: gmi
  removenewline: false
  removemd: false
-->
```

<img src="img/example_option_excerpt_regex_checkbox.png">

### Disable automatic note overview update for one note overview

When you set the `update` option to `manual`, then note overview is only updated when you select the note and trigger a update.

```yml
<!-- note-overview-plugin
search: tag:todo
fields: title, excerpt
update: manual
-->
```

### Show the last 5 edited notes

```yml
<!-- note-overview-plugin
search: /*
fields: title, updated_time
sort: updated_time DESC
limit: 5
-->
```

## Plugin options

Settings for the plugin, accessible at `Tools > Options > Note overview`.

## Keyboard Shortcuts

Under `Options > Keyboard Shortcuts` you can assign a keyboard shortcut for the following commands:

- `Create note overview`

## FAQ

### The note overview is not updated

See the [limitations](#limitations) section.

### Error: Nested mappings are not allowed in compact mappings

This error message occurs when a colon is used in the option value and an space character follows the colon. Just enclose the value of the option in quotes like `alias: "title AS : Title :"`.

### Error: Implicit map keys need to be followed by map values

There is a space missing between the `<option>:` and the value. The option should looks like `<option>: <value>`.

### Error: All collection items must start at the same column

If an option value starts with a `{`, the text must be enclosed by quotes.
For example change `text: {{title}} match` to `text: "{{title}} match"`

### Error: e.slice is not a function

If an option value starts with a `{` and and ends with a `}` the text is interpreted as object. Enclose the value with quotes.
For example change `text: {{title}}` to `text: "{{title}}"`

## Develop

### Build

To build your one version of the plugin, install node.js and run the following command `npm run dist`

### Updating the plugin framework

To update the plugin framework, run `npm run update`

## Changelog

See [Changelog](CHANGELOG.md)

## Links

- [Joplin - Getting started with plugin development](https://joplinapp.org/api/get_started/plugins/)
- [Joplin - Plugin API reference](https://joplinapp.org/api/references/plugin_api/classes/joplin.html)
- [Joplin - Data API reference](https://joplinapp.org/api/references/rest_api/)
- [Joplin - Plugin examples](https://github.com/laurent22/joplin/tree/dev/packages/app-cli/tests/support/plugins)
