import * as moment from "moment";
import joplin from "api";
import * as naturalCompare from "string-natural-compare";
import * as YAML from "yaml";
import * as remark from "remark";
import * as strip from "strip-markdown";
import { settings as pluginSettingsModule } from "./settings";
import { MenuItemLocation } from "api/types";
import { mergeObject } from "./helper";
import logging from "electron-log";
import * as path from "path";
import { OverviewOptions, DatetimeSettings, ImageSettings, ExcerptSettings, DetailsSettings, CountSettings, ListViewSettings, LinkSettings, StatusSettings, TileSettings, ProcessedDatetimeSettings } from "./type";
import * as fs from "fs-extra";
import { I18n } from "i18n";

let noteoverviewDialog = null;
let timer = null;
let globalSettings: any = {};
const consoleLogLevel = "verbose";
let firstSyncCompleted = false;
let joplinNotebooks: any = null;
let logFile = null;
let i18n: any;

// Helper function to escape HTML characters
function escapeHtml(unsafe: string): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export namespace noteoverview {

  const SUPPORTED_COLORS: { [key: string]: string } = {
    "red": "red", "blue": "blue", "yellow": "yellow", "green": "green",
    "orange": "orange", "purple": "purple", "black": "black", "white": "white",
    "pink": "pink", "brown": "brown", "gray": "gray", "grey": "gray"
  };

  const DEFAULT_SEARCH_QUERY = "*";
  const DEFAULT_SORT_ORDER = "updated_time DESC";
  const DEFAULT_LIMIT = 100;
  const DEFAULT_VIEW_MODE = 'tiles';
  const DEFAULT_FIELDS_FOR_TILES = "image,title,excerpt,tags";
  const DEFAULT_FIELDS_FOR_TABLE_LIST = "updated_time,title";


  export async function getImageNr(
    body: string,
    imagrNr: number,
    imageSettings: ImageSettings
  ): Promise<string> {
    logging.verbose("func: getImageNr");
    const regExresourceId =
      /(!\[([^\]]+|)\]\(|<img([^>]+)src=["']):\/(?<resourceId>[\da-z]{32})/g;
    let ids = [];
    let imageId = null;
    let regExMatch = null;
    if (typeof body !== 'string') body = '';
    while ((regExMatch = regExresourceId.exec(body)) != null) {
      ids.push(regExMatch["groups"]["resourceId"]);
    }

    const exactnr = imageSettings?.exactnr !== undefined ? imageSettings.exactnr : true;
    const width = imageSettings?.width || "200";
    const height = imageSettings?.height || "200";
    const noDimensions = imageSettings?.noDimensions || false;
    const imgClass = imageSettings?.class || "";
    const altText = imageSettings?.alt || "Note image";

    if (ids && ids.length > 0) {
      if (ids.length >= imagrNr) {
        imageId = ids[imagrNr - 1];
      } else if (exactnr === false) {
        imageId = ids[ids.length - 1];
      }

      if (imageId) {
        const classAttribute = imgClass ? ` class="${escapeHtml(imgClass)}"` : "";
        const altAttribute = ` alt="${escapeHtml(altText)}"`;

        if (noDimensions) {
          return `<img src=':/${imageId}'${classAttribute}${altAttribute}>`;
        } else if (width && height) {
          return `<img src=':/${imageId}' width='${escapeHtml(String(width))}' height='${escapeHtml(String(height))}'${classAttribute}${altAttribute}>`;
        } else {
           if (regExresourceId.source.includes("<img")) {
            return `<img src=':/${imageId}'${classAttribute}${altAttribute}>`;
          }
          return `![](:/${imageId})`;
        }
      }
    }
    return "";
  }

  export async function getTags(noteId): Promise<string[]> {
    const tagNames: string[] = [];
    let pageNum = 1;
    let tagsResult;
    do {
      try {
        tagsResult = await joplin.data.get(["notes", noteId, "tags"], {
          fields: "id, title, parent_id",
          limit: 50,
          page: pageNum++,
        });
      } catch (e) {
        logging.error("getTags " + e);
        return [];
      }
      if (tagsResult && tagsResult.items) {
        for (const tag of tagsResult.items) {
            tagNames.push(tag.title);
        }
      }
    } while (tagsResult && tagsResult.has_more);

    tagNames.sort((a, b) => {
      return naturalCompare(a, b, { caseInsensitive: true });
    });
    return tagNames;
  }

  export async function createSettingsBlock(
    noteoverviewSettings: Partial<OverviewOptions>
  ): Promise<string> {
    let settingsToSave = {...noteoverviewSettings};
    if (settingsToSave['searchWithVars']) {
      settingsToSave.search = settingsToSave['searchWithVars'];
      delete settingsToSave['searchWithVars'];
    }
    delete settingsToSave.orderBy;
    delete settingsToSave.orderDir;
    delete settingsToSave.statusText;
    delete settingsToSave.escapeForTable;
    if (settingsToSave.imageSettings) {
        settingsToSave.image = settingsToSave.imageSettings;
        delete settingsToSave.imageSettings;
    }
    if (settingsToSave.excerptSettings) {
        settingsToSave.excerpt = settingsToSave.excerptSettings;
        delete settingsToSave.excerptSettings;
    }

    const yamlBlock = YAML.stringify(settingsToSave);
    return `<!-- note-overview-plugin\n${yamlBlock.trimEnd()}\n-->`;
  }

  export async function showError(
    noteTitle: string,
    info: string = null,
    noteoverviewSettingsText: string = null
  ) {
    await joplin.views.dialogs.setButtons(noteoverviewDialog, [{ id: "ok" }]);
    let msg = [];
    msg.push('<div id="noteoverview">');
    msg.push("<h3>Noteoverview error</h3>");
    msg.push("<p><b>Note:</b>");
    msg.push(escapeHtml(noteTitle));
    msg.push("</p>");
    if (info) {
      msg.push("<p>");
      msg.push(info);
      msg.push("</p>");
    }
    if (noteoverviewSettingsText) {
      msg.push("<div>");
      msg.push(
        escapeHtml(noteoverviewSettingsText).replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;")
      );
      msg.push("</div>");
    }
    msg.push("</div>");
    await joplin.views.dialogs.addScript(noteoverviewDialog, "./webview.css");
    await joplin.views.dialogs.setHtml(noteoverviewDialog, msg.join("\n"));
    await joplin.views.dialogs.open(noteoverviewDialog);
  }

  export async function escapeForTable(str: string): Promise<string> {
    if (str !== undefined) {
      return str
        .toString()
        .replace(/(?:\|)/g, "\\|")
        .replace(/(?:\r\n|\r|\n)/g, "");
    } else {
      return "";
    }
  }

  export async function getDateFormated(
    epoch: number,
    dateFormat: string,
    timeFormat: string
  ): Promise<string> {
    if (epoch !== 0) {
      const dateObject = new Date(epoch);
      const date: string = moment(dateObject.getTime()).format(dateFormat);
      const newTimeFormat: string = timeFormat === "" ? "[]" : timeFormat;
      const time: string = moment(dateObject.getTime()).format(newTimeFormat);
      const datetime: string[] = [date];
      if (time !== "") {
        datetime.push(time);
      }
      return datetime.join(" ");
    } else {
      return "";
    }
  }

  export async function getDateHumanized(
    epoch: number,
    withSuffix: boolean
  ): Promise<string> {
    if (epoch !== 0) {
      const dateObject = new Date(epoch);
      const dateString = moment
        .duration(moment(dateObject.getTime()).diff(moment()))
        .humanize(withSuffix);
      return dateString;
    } else {
      return "";
    }
  }

  export async function getToDoDateColor(
    coloring: any,
    todo_due: number,
    todo_completed: number,
    type: string
  ): Promise<string> {
    logging.verbose("func: getToDoDateColor");
    const now = new Date();
    let colorType = "";
    if (!coloring || !coloring.todo) return "";

    if (todo_due === 0 && todo_completed === 0) {
      colorType = "open_nodue";
    } else if (todo_due === 0 && todo_completed !== 0) {
      colorType = "done_nodue";
    } else if (
      todo_due > now.getTime() &&
      todo_completed === 0 &&
      coloring.todo.warningHours !== 0 &&
      todo_due - 3600 * coloring.todo.warningHours * 1000 < now.getTime()
    ) {
      colorType = "warning";
    } else if (todo_due > now.getTime() && todo_completed === 0) {
      colorType = "open";
    } else if (todo_due < now.getTime() && todo_completed === 0) {
      colorType = "open_overdue";
    } else if (todo_due > todo_completed) {
      colorType = "done";
    } else if (todo_due < todo_completed) {
      colorType = "done_overdue";
    } else {
      return "";
    }
    let color = coloring.todo[colorType];
    if (typeof color === 'string') {
        if (color.indexOf(";") !== -1) {
        color = color.split(";");
        } else if (color.indexOf(",") !== -1) {
        color = color.split(",");
        } else {
        color = [color, color];
        }
    } else {
        color = ["", ""];
    }
    if (type === "todo_due") return color[0];
    else if (type === "todo_completed") return color[1];
    else return "";
  }

  export async function getDefaultColoring(): Promise<any> {
    let coloring = {
      todo: {
        open_nodue: "",
        open: await joplin.settings.value("colorTodoOpen"),
        warning: await joplin.settings.value("colorTodoWarning"),
        warningHours: await joplin.settings.value("todoWarningHours"),
        open_overdue: await joplin.settings.value("colorTodoOpenOverdue"),
        done: await joplin.settings.value("colorTodoDone"),
        done_overdue: await joplin.settings.value("colorTodoDoneOverdue"),
        done_nodue: await joplin.settings.value("colorTodoDoneNodue"),
      },
    };
    return coloring;
  }

  export async function humanFrendlyStorageSize(size: number): Promise<string> {
    if (size < 1024) {
      return size + " Byte";
    } else if (size < 1024 * 500) {
      return (size / 1024).toFixed(2) + " KiB";
    } else if (size < 1024 * 1024 * 500) {
      return (size / 1024 / 1024).toFixed(2) + " MiB";
    } else {
      return (size / 1024 / 1024 / 1024).toFixed(2) + " GiB";
    }
  }

  export async function getFileNames(
    noteId: string,
    getSize: boolean
  ): Promise<Array<string>> {
    let pageNum = 1;
    let files = [];
    let resources;
    do {
      try {
        resources = await joplin.data.get(["notes", noteId, "resources"], {
          fields: "id, size, title",
          limit: 50,
          page: pageNum++,
          sort: "title ASC",
        });
      } catch (e) {
        logging.error("getFileNames " + e);
        return files;
      }
      if (resources && resources.items) {
        for (const resource of resources.items) {
            let size = await noteoverview.humanFrendlyStorageSize(resource.size);
            files.push(resource.title + (getSize === true ? " - " + size : ""));
        }
      }
    } while (resources && resources.has_more);
    return files;
  }

  export async function getToDoStatus(
    todo_due: number,
    todo_completed: number
  ) {
    logging.verbose("func: getToDoStatus");
    const now = new Date();
    if (todo_completed === 0 && todo_due !== 0 && todo_due < now.getTime())
      return "overdue";
    else if (todo_completed !== 0) return "done";
    else if (todo_completed === 0) return "open";
    else return "";
  }

  export async function getDefaultStatusText(): Promise<StatusSettings> {
    let status: StatusSettings = {
      note: await joplin.settings.value("noteStatus"),
      todo: {
        overdue: await joplin.settings.value("todoStatusOverdue"),
        open: await joplin.settings.value("todoStatusOpen"),
        done: await joplin.settings.value("todoStatusDone"),
      },
    };
    return status;
  }

  export async function getMarkdownExcerpt(
    markdown: string,
    excerptSettings: ExcerptSettings
  ): Promise<string> {
    const maxExcerptLength = excerptSettings?.maxlength || 200;
    const excerptRegex = excerptSettings?.regex || false;
    const excerptRegexFlags = excerptSettings?.regexflags || false;
    const removeMd = excerptSettings?.removemd !== undefined ? excerptSettings.removemd : true;
    const imageName = excerptSettings?.imagename || false;
    const removeNewLine = excerptSettings?.removenewline !== undefined ? excerptSettings.removenewline : true;

    let contentText = markdown;
    if (typeof contentText !== 'string') contentText = '';

    let excerpt = "";

    if (excerptRegex) {
      let matchRegex = null;
      if (excerptRegexFlags) {
        matchRegex = new RegExp(excerptRegex, excerptRegexFlags as string);
      } else {
        matchRegex = new RegExp(excerptRegex);
      }
      const hits = contentText.match(matchRegex);
      const excerptArray = [];
      if (hits == null) return "";
      for (let match of hits) {
        excerptArray.push(match);
      }
      excerpt = await cleanExcerpt(
        excerptArray.join("\n"),
        removeMd,
        imageName,
        removeNewLine
      );
      return excerpt;
    } else {
      contentText = await cleanExcerpt(
        contentText,
        removeMd,
        imageName,
        removeNewLine
      );
      excerpt = contentText.slice(0, maxExcerptLength);
      if (contentText.length > maxExcerptLength) {
        return excerpt + "...";
      }
      return excerpt;
    }
  }

  export async function cleanExcerpt(
    content: string,
    removeMd: boolean,
    imageName: boolean,
    removeNewLine: boolean
  ): Promise<string> {
    if (typeof content !== 'string') content = '';
    if (imageName === false) {
      content = content.replace(/(!\[)([^\]]+)(\]\([^\)]+\))/g, "$1$3");
    }
    if (removeMd === true) {
      let processedMd = remark().use(strip).processSync(content);
      content = processedMd?.["contents"] ? processedMd["contents"].toString() : "";
      if (content.length > 0) content = content.substring(0, content.length - 1);
      content = content.replace(/(\s\\?~~|~~\s)/g, " ");
      content = content.replace(/(\s\\?==|==\s)/g, " ");
      content = content.replace(/(\s\\?\+\+|\+\+\s)/g, " ");
    }
    if (removeNewLine === false) {
      content = content.trim().replace(/(\t| )+/g, " ");
    } else {
      content = content.trim().replace(/\s+/g, " ");
    }
    return content;
  }

  export async function getHeaderFields(
    aliasStr: string,
    fields: any[]
  ): Promise<any[]> {
    let fieldAlias: {[key:string]: string} = {};
    if (aliasStr && aliasStr.trim() !== "") {
      aliasStr = aliasStr.replace(/ AS /gi, " AS ");
      const aliasArry = aliasStr.trim().split(",");
      for (let field of aliasArry) {
        let alias = field.trim().split(" AS ");
        if (alias.length == 2) {
          fieldAlias[alias[0].trim()] = alias[1].trim();
        }
      }
      const newFields = [...fields];
      for (let i=0; i < newFields.length; i++) {
        if (fieldAlias[newFields[i]] !== undefined) {
          newFields[i] = fieldAlias[newFields[i]];
        }
      }
      return newFields;
    }
    return fields;
  }

  export async function getNotebookName(id): Promise<string> {
    if (joplinNotebooks && joplinNotebooks[id]) {
      return joplinNotebooks[id].title;
    } else {
      return "n/a";
    }
  }

  export async function getNotebookBreadcrumb(id): Promise<string> {
    if (joplinNotebooks && joplinNotebooks[id]) {
      return joplinNotebooks[id].path.join(" > ");
    } else {
      return "n/a";
    }
  }

  export async function loadNotebooks(reload = false) {
    logging.verbose("Func: loadNotebooks");
    if (reload === true || joplinNotebooks === null) {
      logging.verbose("load notebooks");
      joplinNotebooks = {};
      let queryFolders;
      let pageQuery = 1;
      do {
        try {
          queryFolders = await joplin.data.get(["folders"], {
            fields: "id, parent_id, title",
            limit: 50,
            page: pageQuery++,
          });
        } catch (error) {
          logging.error(error.message);
          queryFolders = null;
        }
        if (queryFolders && queryFolders.items) {
            for (let queryFolderKey in queryFolders.items) {
            const id = queryFolders.items[queryFolderKey].id;
            joplinNotebooks[id] = {
                id: id,
                title: queryFolders.items[queryFolderKey].title,
                parent_id: queryFolders.items[queryFolderKey].parent_id,
                path: []
            };
            }
        }
      } while (queryFolders && queryFolders.has_more);
      const getParentName = (id: string, notebookPath: string[]) => {
        if (id === "" || !joplinNotebooks[id]) return;
        if (joplinNotebooks[id].parent_id !== "" && joplinNotebooks[joplinNotebooks[id].parent_id]) {
            getParentName(joplinNotebooks[id].parent_id, notebookPath);
        }
        notebookPath.push(joplinNotebooks[id].title);
      };
      for (const key in joplinNotebooks) {
        const notebookPath: string[] = [];
        if (joplinNotebooks[key].path && joplinNotebooks[key].path.length > 0) continue;
        getParentName(joplinNotebooks[key].id, notebookPath);
        joplinNotebooks[key].path = notebookPath;
      }
    }
  }

  export async function getNoteSize(noteId): Promise<string> {
    let size = 0;
    let note;
    try {
      note = await joplin.data.get(["notes", noteId], {
        fields: "id, body",
      });
    } catch (e) {
      logging.error("getNoteSize " + e);
      return "n/a";
    }
    size = note && note.body ? note.body.length : 0;
    let pageNum = 1;
    let resources;
    do {
      try {
        resources = await joplin.data.get(["notes", noteId, "resources"], {
          fields: "id, size",
          limit: 50,
          page: pageNum++,
        });
      } catch (e) {
        logging.error("getNoteSize resources " + e);
        return "n/a";
      }
      if (resources && resources.items) {
        for (const resource of resources.items) {
            size += Number.parseInt(resource.size) || 0;
        }
      }
    } while (resources && resources.has_more);
    return await noteoverview.humanFrendlyStorageSize(size);
  }

  export async function removeNewLineAt(
    content: string,
    begin: boolean,
    end: boolean
  ): Promise<string> {
    if (typeof content !== 'string') return '';
    if (end === true && content.length > 0) {
      if (content.charCodeAt(content.length - 1) == 10) {
        content = content.substring(0, content.length - 1);
      }
      if (content.length > 0 && content.charCodeAt(content.length - 1) == 13) {
        content = content.substring(0, content.length - 1);
      }
    }
    if (begin === true && content.length > 0) {
      if (content.charCodeAt(0) == 10) {
        content = content.substring(1, content.length);
      }
      if (content.length > 0 && content.charCodeAt(0) == 13) {
        content = content.substring(1, content.length);
      }
    }
    return content;
  }

  export async function loadGlobalSettings() {
    globalSettings = {};
    globalSettings.dateFormat = await joplin.settings.globalValue("dateFormat");
    globalSettings.timeFormat = await joplin.settings.globalValue("timeFormat");
    globalSettings.statusText = await noteoverview.getDefaultStatusText();
    globalSettings.coloring = await noteoverview.getDefaultColoring();
    const showNoteCount = await joplin.settings.value("showNoteCount");
    if (showNoteCount !== "off") {
      globalSettings.showNoteCount = {
        enable: true,
        position: showNoteCount,
        text: await joplin.settings.value("showNoteCountText"),
      };
    } else {
      globalSettings.showNoteCount = { enable: false };
    }
  }

  export async function updateAll(userTriggerd: boolean) {
    logging.info("check all overviews");
    await noteoverview.loadGlobalSettings();
    await noteoverview.loadNotebooks(true);
    let pageNum = 1;
    let overviewNotes = null;
    do {
      overviewNotes = await joplin.data.get(["search"], {
        query: '/"<!-- note-overview-plugin"',
        fields: "id",
        limit: 10,
        page: pageNum++,
      });
      if (overviewNotes && overviewNotes.items) {
        for (let overviewNotesKey in overviewNotes.items) {
            const noteId: string = overviewNotes.items[overviewNotesKey].id;
            await noteoverview.update(noteId, userTriggerd);
        }
      }
    } while (overviewNotes && overviewNotes.has_more);
    logging.info("all overviews checked");
  }

  export async function validateExcerptRegEx(
    settings: Partial<OverviewOptions>,
    title: string
  ): Promise<Boolean> {
    if (
      settings && settings.excerpt && settings.excerpt.regex
    ) {
      const flags = settings.excerpt.regexflags;
      try {
        if (flags) new RegExp(settings.excerpt.regex, flags);
        else new RegExp(settings.excerpt.regex);
      } catch (error) {
        logging.error("RegEx parse error: " + error.message);
        await noteoverview.showError(
          title,
          (i18n ? i18n.__("msg.error.regexParseError") : "RegEx parse error") + "</br>" + error.message,
          settings.excerpt.regex
        );
        return false;
      }
    }
    return true;
  }

  export async function update(noteId: string, userTriggerd: boolean) {
    const note = await joplin.data.get(["notes", noteId], {
      fields: ["id", "title", "body", "markup_language"], // Added markup_language
    });
    if (!note) {
        logging.warn(`Note not found: ${noteId}`);
        return;
    }
    logging.info(`check note: ${note.title} (${note.id})`);
    const noteOverviewRegEx =
      /(?<!```\n)(?<!``` \n)(<!--\s?note-overview-plugin(?<settings>[\w\W]*?)-->)([\w\W]*?)(<!--endoverview-->|(?=<!--\s?note-overview-plugin)|$)/gi;

    let regExMatch = null;
    let lastProcessedIndex = 0;
    let newNoteBodyParts: string[] = [];
    const currentNoteBody = note.body || "";
    let finalNoteMarkupLanguage = note.markup_language || 1; // Default to Markdown if not set

    while ((regExMatch = noteOverviewRegEx.exec(currentNoteBody)) != null) {
      const settingsCommentString = regExMatch[1]; // The <!-- note-overview-plugin ... --> part
      const settingsContent = regExMatch["groups"]["settings"]; // Content inside the YAML block
      const startIndex = regExMatch.index;
      const endIndex = startIndex + regExMatch[0].length; // End of the full matched block (<!-- settings --> old_content <!-- endoverview -->)

      let parsedYamlSettings: any = {};
      try {
        const parsed = YAML.parse(settingsContent);
        if (parsed === null || typeof parsed !== 'object') {
          parsedYamlSettings = {};
        } else {
          parsedYamlSettings = parsed;
        }
      } catch (error) {
        logging.error("YAML parse error: " + error.message);
        await noteoverview.showError(
          note.title,
          (i18n ? i18n.__("msg.error.yamlParseError") : "YAML parse error") + "</br>" + error.message,
          settingsContent
        );
        // If YAML is invalid, skip this block and preserve original content for this block
        newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
        newNoteBodyParts.push(regExMatch[0]); // Push the entire original block
        lastProcessedIndex = endIndex;
        continue;
      }

      if (parsedYamlSettings['update'] === 'manual' && !userTriggerd) {
        logging.verbose("skip update for manual block, not user triggerd");
        newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
        newNoteBodyParts.push(regExMatch[0]);
        lastProcessedIndex = endIndex;
        continue;
      }
      const selectedNote = await joplin.workspace.selectedNote();
      if (parsedYamlSettings['update'] === 'manual' && userTriggerd && selectedNote && noteId !== selectedNote.id) {
        logging.verbose("skip update for manual block, selected note " + selectedNote.id + " <> " + noteId );
        newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
        newNoteBodyParts.push(regExMatch[0]);
        lastProcessedIndex = endIndex;
        continue;
      }

      if ((await validateExcerptRegEx(parsedYamlSettings, note.title)) === false) {
        // Error already shown by validateExcerptRegEx, preserve block and skip.
        newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
        newNoteBodyParts.push(regExMatch[0]);
        lastProcessedIndex = endIndex;
        continue;
      }

      // Add original content before this overview block
      if (lastProcessedIndex < startIndex) {
        newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
      }

      const currentBlockOptions = await noteoverview.getOptions(parsedYamlSettings);
      const isCurrentBlockTileView = currentBlockOptions.view === 'tiles';

      if (isCurrentBlockTileView) {
        finalNoteMarkupLanguage = 2; // Joplin.MARKUP_LANGUAGE_HTML
      }

      // Add the settings comment block (re-created to ensure it's clean)
      newNoteBodyParts.push(await noteoverview.createSettingsBlock(parsedYamlSettings));

      const viewContentArray = await noteoverview.getOverviewContent(note.id, note.title, parsedYamlSettings);
      const viewContentString = viewContentArray.join('\n');
      newNoteBodyParts.push(viewContentString);

      if (!isCurrentBlockTileView) {
        newNoteBodyParts.push("<!--endoverview-->");
      }
      lastProcessedIndex = endIndex;
    }

    if (lastProcessedIndex < currentNoteBody.length) {
      newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex));
    }

    const newNoteBodyStr = newNoteBodyParts.join("\n");

    if (currentNoteBody !== newNoteBodyStr || note.markup_language !== finalNoteMarkupLanguage) {
      logging.info(`Updating note ${note.id}. Setting markup_language to: ${finalNoteMarkupLanguage}`);
      await joplin.data.put(['notes', note.id], null, {
          body: newNoteBodyStr,
          markup_language: finalNoteMarkupLanguage,
      });
    } else {
        logging.info(`Note ${note.id} content and markup_language unchanged. No update needed.`);
    }
  }

  export async function getOptions(
    overviewSettingsFromYaml: any
  ): Promise<OverviewOptions> {
    logging.verbose("func: getOptions, input overviewSettingsFromYaml:", overviewSettingsFromYaml);
    const settings: Partial<OverviewOptions> = {};
    const userSettings = overviewSettingsFromYaml || {};

    const isSearchEmpty = !userSettings['search'] || String(userSettings['search']).trim() === "";

    if (isSearchEmpty) {
      settings.search = DEFAULT_SEARCH_QUERY;
      settings.sort = userSettings['sort'] || DEFAULT_SORT_ORDER;
      settings.limit = (userSettings['limit'] === undefined || userSettings['limit'] === null) ? DEFAULT_LIMIT : Number(userSettings['limit']);
    } else {
      settings.search = userSettings['search'];
      settings.sort = userSettings['sort'] || "updated_time DESC";
      settings.limit = (userSettings['limit'] === undefined || userSettings['limit'] === null) ? -1 : Number(userSettings['limit']);
    }

    if (userSettings['search'] && String(userSettings['search']).includes("{{moments:")) {
        settings['searchWithVars'] = userSettings['search'];
    }
    settings.search = await noteoverview.replaceSearchVars(settings.search);

    const sortArray = (settings.sort || "").toLowerCase().split(" ");
    settings.orderBy = sortArray[0] || "updated_time";
    settings.orderDir = (sortArray[1] || "desc").toUpperCase();

    settings.view = userSettings['view'] || (isSearchEmpty ? DEFAULT_VIEW_MODE : 'table');

    if (!userSettings['fields'] || String(userSettings['fields']).trim() === "") {
      settings.fields = (settings.view === 'tiles') ? DEFAULT_FIELDS_FOR_TILES : DEFAULT_FIELDS_FOR_TABLE_LIST;
    } else {
      settings.fields = userSettings['fields'];
    }

    settings.statusText = await mergeObject(
      globalSettings.statusText,
      userSettings['status'] || null
    ) as StatusSettings;
    settings.alias = userSettings['alias'] || "";

    settings.image = userSettings['image'] || {};
    settings.excerpt = userSettings['excerpt'] || {};
    settings.details = userSettings['details'] || null;
    settings.count = userSettings['count'] || null;
    settings.listview = userSettings['listview'] || null;
    settings.link = userSettings['link'] || null;
    settings.update = userSettings['update'];

    settings.coloring = await mergeObject(
      globalSettings.coloring,
      userSettings['coloring']
    );
    settings.datetimeSettings = await mergeObject(
      {
        date: globalSettings.dateFormat,
        time: globalSettings.timeFormat,
        humanize: { enabled: false, withSuffix: true },
      },
      userSettings['datetime']
    ) as ProcessedDatetimeSettings;

    settings.tile = await mergeObject(
        { maxTitleLength: 50, maxSnippetLength: 100, },
        userSettings['tile'] || {}
    ) as TileSettings;

    settings.escapeForTable = settings.view === 'table';
    settings.imageSettings = settings.image;
    settings.excerptSettings = settings.excerpt;

    logging.verbose("Processed options:", settings);
    return settings as OverviewOptions;
  }


  export async function getAdditionalFields(
    fields: string[]
  ): Promise<string[]> {
    const additionalFields: string[] = [];
    if (!fields) return additionalFields;
    if (fields.includes("todo_due")) {
      additionalFields.push("todo_completed");
    }
    if (fields.includes("todo_completed")) {
      additionalFields.push("todo_due");
    }
    if (fields.includes("status")) {
      additionalFields.push("todo_due");
      additionalFields.push("todo_completed");
      additionalFields.push("is_todo");
    }
    if (fields.includes("image") || fields.includes("excerpt")) {
      additionalFields.push("body");
    }
    if (fields.includes("link")) {
      additionalFields.push("source_url");
    }
    return additionalFields;
  }

  export async function getOverviewContent(
    noteId: string,
    noteTitle: string,
    overviewSettingsFromYaml: any
  ): Promise<string[]> {
    const options = await noteoverview.getOptions(overviewSettingsFromYaml);
    logging.verbose(`func: getOverviewContent for note ${noteTitle} (${noteId}), view: ${options.view}, search: '${options.search}', sort: ${options.orderBy} ${options.orderDir}, limit: ${options.limit}`);

    const query = options.search;
    let finalContentLayout: string[] = [];

    if (query) {
      let fields = [];
      if (options.fields) {
        fields = options.fields.toLowerCase().replace(/\s/g, "").split(",");
      } else {
        fields = options.view === 'tiles' ? DEFAULT_FIELDS_FOR_TILES.split(',') : DEFAULT_FIELDS_FOR_TABLE_LIST.split(',');
      }

      const headerFields = await noteoverview.getHeaderFields(options.alias, [...fields]);
      let dbFieldsArray = [...fields];
      dbFieldsArray = dbFieldsArray.filter(
        (el) =>
          [
            "notebook", "breadcrumb", "tags", "size", "file",
            "file_size", "status", "image", "excerpt", "link",
          ].indexOf(el) === -1
      );
      dbFieldsArray = [...new Set([...dbFieldsArray, ...(await noteoverview.getAdditionalFields(fields))])];

      let noteCount = 0;
      let joplinQueryLimit = 50;
      let desiredNoteLimit = options.limit;

      if (desiredNoteLimit !== -1 && desiredNoteLimit < joplinQueryLimit) {
        joplinQueryLimit = desiredNoteLimit;
      }

      let queryNotesResult = null;
      let pageQueryNotes = 1;
      const collectedNotes: any[] = [];

      do {
        try {
          queryNotesResult = await joplin.data.get(["search"], {
            query: query,
            fields: "id, parent_id, " + dbFieldsArray.join(","),
            order_by: options.orderBy,
            order_dir: options.orderDir,
            limit: joplinQueryLimit,
            page: pageQueryNotes++,
          });
        } catch (error) {
          logging.error(error.message);
          let errorMsg = error.message.replace(/(.*)(:\sSELECT.*)/g, "$1");
          await noteoverview.showError(noteTitle, errorMsg, "");
          return [];
        }

        if (queryNotesResult && queryNotesResult.items) {
          for (const item of queryNotesResult.items) {
            if (item.id === noteId) continue;
            if (desiredNoteLimit !== -1 && collectedNotes.length >= desiredNoteLimit) break;
            collectedNotes.push(item);
          }
        }
      } while (queryNotesResult && queryNotesResult.has_more && (desiredNoteLimit === -1 || collectedNotes.length < desiredNoteLimit));

      noteCount = collectedNotes.length;
      let generatedViewSpecificContent: string[] = [];

      if (options.view === 'tiles') {
        const tileEntries: string[] = [];
        for (const noteItem of collectedNotes) {
          tileEntries.push(await noteoverview.getNoteInfoAsTile(noteItem, options));
        }
        generatedViewSpecificContent.push('<div class="note-overview-container">');
        generatedViewSpecificContent.push(...tileEntries);
        generatedViewSpecificContent.push('</div>');
      } else if (options.listview) {
        const listEntries: string[] = [];
        for (const noteItem of collectedNotes) {
          listEntries.push(await noteoverview.getNoteInfoAsListView(noteItem, options));
        }
        if (options.listview.separator) {
          for (let i = 0; i < listEntries.length - 1; i++) {
            listEntries[i] += options.listview.separator;
          }
        }
        if (options.listview.prefix) listEntries.unshift(options.listview.prefix);
        if (options.listview.suffix) listEntries.push(options.listview.suffix);
        generatedViewSpecificContent = options.listview.linebreak === false ? [listEntries.join("")] : listEntries;
      } else {
        const tableEntries: string[] = [];
        for (const noteItem of collectedNotes) {
          tableEntries.push(await noteoverview.getNoteInfoAsTable(fields, noteItem, options));
        }
        generatedViewSpecificContent = [...(await noteoverview.getTableHeader(headerFields)), ...tableEntries];
      }

      finalContentLayout.push(...generatedViewSpecificContent);
      await addNoteCount(finalContentLayout, noteCount, options);
      await addHTMLDetailsTag(finalContentLayout, noteCount, options);
    }
    return finalContentLayout;
  }

  export async function addHTMLDetailsTag(
    overview: string[],
    noteCount: number,
    options: OverviewOptions
  ) {
    if (options.details && options.details.summary) {
      const summary = options.details.summary.replace(
        "{{count}}",
        noteCount.toString()
      );
      overview.unshift(`<summary>${escapeHtml(summary)}</summary>`);
      overview.unshift(`<details ` + (options.details.open === true ? ` open` : ``) + `>`);
      overview.push("</details>");
    }
  }

  export async function addNoteCount(
    overview: string[],
    count: number,
    options: OverviewOptions
  ) {
    if (
      options.count &&
      (options.count.enable || options.count.enable !== false)
    ) {
      const text =
        options.count.text && options.count.text !== ""
          ? `${options.count.text} `
          : ``;
      const countStr = text.replace("{{count}}", count.toString());
      if (options.count.position === "above") {
        const detailsTagIndex = overview.findIndex(line => line.startsWith("<details"));
        if (detailsTagIndex !== -1 && overview.findIndex(line => line.startsWith("<summary>")) !== -1) {
            const summaryIndex = overview.findIndex(line => line.startsWith("<summary>"));
            overview.splice(summaryIndex + 1, 0, escapeHtml(countStr));
        } else if (detailsTagIndex !== -1) {
            overview.splice(detailsTagIndex + 1, 0, escapeHtml(countStr));
        }
        else {
            overview.unshift(escapeHtml(countStr));
        }
      } else {
        const detailsCloseTagIndex = overview.findIndex(line => line.startsWith("</details>"));
        if (detailsCloseTagIndex !== -1) {
            overview.splice(detailsCloseTagIndex, 0, escapeHtml(countStr));
        } else {
            overview.push(escapeHtml(countStr));
        }
      }
    }
  }

  export async function replaceFieldPlaceholder(
    text: string,
    noteFields: any,
    options: OverviewOptions
  ): Promise<string> {
    const asyncStringReplace = async (
      str: string,
      regex: RegExp,
      aReplacer: any
    ) => {
      const substrs = [];
      let match;
      let i = 0;
      while ((match = regex.exec(str)) !== null) {
        substrs.push(str.slice(i, match.index));
        substrs.push(aReplacer(...match));
        i = regex.lastIndex;
      }
      substrs.push(str.slice(i));
      return (await Promise.all(substrs)).join("");
    };
    try {
      return await asyncStringReplace(
        text,
        /{{([^}]+)}}/g,
        async (match, groups) => {
          return await noteoverview.getFieldValue(groups, noteFields, options);
        }
      );
    } catch (error) {
      logging.error(error.message);
      await noteoverview.showError("", error.message, "");
      throw error;
    }
  }

  export async function getTableHeader(header: string[]) {
    const mdTableHeader: string[] = [];
    if (!header) return mdTableHeader;
    mdTableHeader.push("| " + header.map(h => escapeHtml(h)).join(" | ") + " |");
    mdTableHeader.push("|" + " --- |".repeat(header.length));
    return mdTableHeader;
  }

  export async function getNoteInfoAsListView(
    noteFields: any,
    options: OverviewOptions
  ): Promise<string> {
    let info = options.listview && options.listview.text
      ? options.listview.text
      : "[{{title}}](/:{{id}})";
    info = await noteoverview.replaceFieldPlaceholder(
      info,
      noteFields,
      options
    );
    return info;
  }

  export async function getNoteInfoAsTable(
    fields: string[],
    noteFields: any,
    options: OverviewOptions
  ): Promise<string> {
    const info: string[] = [];
    options.escapeForTable = true;
    if (!fields) return "|" + info.join("|") + "|";
    for (let field of fields) {
      info.push(await noteoverview.getFieldValue(field, noteFields, options));
    }
    return "|" + info.join("|") + "|";
  }

  export async function getNoteInfoAsTile(noteFields: any, options: OverviewOptions): Promise<string> {
    logging.verbose(`func: getNoteInfoAsTile for note ${noteFields.id}`);
    let title = noteFields.title ? noteFields.title : '';
    const maxTitleLength = options.tile?.maxTitleLength || 50;
    let truncatedTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + "..." : title;
    let imageHtml = "";
    if (noteFields.body) {
      const imageSettings: ImageSettings = {
        nr: 1,
        exactnr: true,
        noDimensions: true,
        class: "note-tile-image",
        alt: `Image for note: ${title.substring(0,30)}...`
      };
      const imgSrc = await noteoverview.getImageNr(noteFields.body, imageSettings.nr, options.image || imageSettings);
      if (imgSrc && !imgSrc.startsWith("![]")) {
        imageHtml = imgSrc;
      }
    }
    let snippet = "";
    if (noteFields.body) {
      const maxSnippetLength = options.tile?.maxSnippetLength || 100;
      const excerptSettings: ExcerptSettings = {
        maxlength: maxSnippetLength,
        removemd: true,
        removenewline: true,
        ...(options.excerpt || {})
      };
      snippet = await noteoverview.getMarkdownExcerpt(noteFields.body, excerptSettings);
      snippet = escapeHtml(snippet);
    }
    const noteTags = await noteoverview.getTags(noteFields.id);
    let tagsHtml = "";
    let tileColorClass = "";
    if (noteTags && noteTags.length > 0) {
      for (const tag of noteTags) {
        const lowerTag = tag.toLowerCase();
        if (SUPPORTED_COLORS[lowerTag]) {
          tileColorClass = `note-tile-color-${SUPPORTED_COLORS[lowerTag]}`;
          break;
        }
      }
      tagsHtml = noteTags.map(tag => `<span class="note-tile-tag">${escapeHtml(tag)}</span>`).join(" ");
    }
    const finalClass = `note-tile ${tileColorClass}`.trim();
    const tileHtml = `
      <div class="${finalClass}" data-note-id="${escapeHtml(noteFields.id || '')}">
        ${imageHtml}
        <h3 class="note-tile-title"><a href=":/${escapeHtml(noteFields.id || '')}">${escapeHtml(truncatedTitle)}</a></h3>
        <p class="note-tile-snippet">${snippet}</p>
        <div class="note-tile-tags">
          ${tagsHtml}
        </div>
      </div>
    `;
    return tileHtml.trim();
  }

  export async function removeNoteoverviewCode(data: string): Promise<string> {
    if (typeof data !== 'string') return '';
    data = data.replace(
      /(?<!```\n)(?<!``` \n)(<!--\s?note-overview-plugin([\w\W]*?)-->)/gi,
      "REMOVE_NOTOVERVIEW_LINE"
    );
    data = data.replace(
      /(<!--endoverview-->)(?!\n```)/gi,
      "REMOVE_NOTOVERVIEW_LINE"
    );
    const lines = data.split("\n");
    let newLines = [];
    for (const line of lines) {
      if (line.match("REMOVE_NOTOVERVIEW_LINE") === null) {
        newLines.push(line);
      }
    }
    return newLines.join("\n");
  }

  export async function getFieldValue(
    field: string,
    fields: any,
    options: OverviewOptions
  ): Promise<string> {
    logging.verbose("func: getFieldValue for " + field);
    let value: any = "";
    if (!fields) return " ";
    switch (field) {
      case "title":
        value = `[${escapeHtml(fields.title || '')}](:/${fields.id || ''})`;
        break;
      case "created_time":
      case "updated_time":
      case "user_created_time":
      case "user_updated_time":
      case "todo_due":
      case "todo_completed":
        const dateValue = fields[field];
        if (!dateValue) {
            value = "";
            break;
        }
        const dateObject = new Date(dateValue);
        value = await noteoverview.getDateFormated(
          dateObject.getTime(),
          options.datetimeSettings.date,
          options.datetimeSettings.time
        );
        const htmlAttr: string[] = [];
        if (value !== "" && options.datetimeSettings.humanize.enabled) {
          htmlAttr.push(`title="${escapeHtml(value)}"`);
          value = await noteoverview.getDateHumanized(
            dateObject.getTime(),
            options.datetimeSettings.humanize.withSuffix
          );
        }
        switch (field) {
          case "todo_due":
          case "todo_completed":
            const color = await noteoverview.getToDoDateColor(
              options.coloring,
              fields["todo_due"],
              fields["todo_completed"],
              field
            );
            if (color !== "") {
              htmlAttr.push(`color="${escapeHtml(color)}"`);
            }
            break;
        }
        if (htmlAttr.length) {
          value = `<font ${htmlAttr.join(" ")}>${escapeHtml(value)}</font>`;
        } else {
          value = escapeHtml(value);
        }
        break;
      case "status":
        if (options.statusText && options.statusText.todo && options.statusText.note) {
            if (!!fields["is_todo"]) {
            const status: string = await noteoverview.getToDoStatus(
                fields["todo_due"],
                fields["todo_completed"]
            );
            value = options.statusText.todo[status];
            } else {
            value = options.statusText.note;
            }
        }
        value = escapeHtml(String(value));
        break;
      case "excerpt":
        value = await noteoverview.getMarkdownExcerpt(
          fields["body"],
          options.excerptSettings
        );
        value = escapeHtml(value);
        break;
      case "image":
        value = await noteoverview.getImageNr(
          fields["body"],
          options.imageSettings?.nr || 1,
          options.imageSettings
        );
        break;
      case "file":
        value = (await noteoverview.getFileNames(fields["id"], false)).map(f => escapeHtml(f)).join(
          "<br>"
        );
        break;
      case "file_size":
        value = (await noteoverview.getFileNames(fields["id"], true)).map(f => escapeHtml(f)).join(
          "<br>"
        );
        break;
      case "size":
        value = await noteoverview.getNoteSize(fields["id"]);
        value = escapeHtml(value);
        break;
      case "tags":
        value = (await noteoverview.getTags(fields["id"])).map(t => escapeHtml(t)).join(", ");
        break;
      case "notebook":
        value = await noteoverview.getNotebookName(fields["parent_id"]);
        value = escapeHtml(value);
        break;
      case "breadcrumb":
        value = await noteoverview.getNotebookBreadcrumb(fields["parent_id"]);
        value = escapeHtml(value);
        break;
      case "link":
        const caption = options.link?.caption || "Link";
        const htmlLink = options.link?.html || false;
        const sourceUrl = fields["source_url"] || "";
        if (htmlLink) {
          value = `<a href="${escapeHtml(sourceUrl)}">${escapeHtml(caption)}</a>`;
        } else {
          value = `[${escapeHtml(caption)}](${escapeHtml(sourceUrl)})`;
        }
        break;
      default:
        value = fields[field] !== undefined && fields[field] !== null ? fields[field].toString() : "";
        value = escapeHtml(value);
    }
    if (options.escapeForTable === true && !field.match(/^(image|link)$/)) {
      value = await noteoverview.escapeForTable(value);
    }
    if (value === "" || value === undefined || value === null) value = " ";
    return String(value);
  }

  export async function getSubNoteContent(
    body: string,
    fromIndex: number,
    toIndex: number,
    posIsAfterOverviewSection: boolean
  ) {
    const orgContent = body.substring(fromIndex, toIndex);
    let stripe: boolean[];
    if (posIsAfterOverviewSection === false) {
      if (fromIndex === 0) {
        stripe = [false, true];
      } else {
        stripe = [true, true];
      }
    } else {
      stripe = [true, false];
    }
    return await noteoverview.removeNewLineAt(orgContent, stripe[0], stripe[1]);
  }

  export async function setupLogging() {
    const logFormatFile = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
    const logFormatConsole = "[{level}] {text}";
    try {
        logFile = path.join(
        await joplin.plugins.installationDir(),
        "noteoverview.log"
        );
        const levelFile = await joplin.settings.value("fileLogLevel");
        logging.transports.file.format = logFormatFile;
        logging.transports.file.level = levelFile;
        logging.transports.file.resolvePath = () => logFile;
        logging.transports.console.level = consoleLogLevel;
        logging.transports.console.format = logFormatConsole;
    } catch (e) {
        logging.error("Error setting up logging: " + e.message);
    }
  }

  export async function deleteLogFile() {
    logging.verbose("Delete log file");
    if (logFile && fs.existsSync(logFile)) {
      try {
        await fs.unlinkSync(logFile);
      } catch (e) {
        logging.error("deleteLogFile: " + e.message);
      }
    }
  }

  export async function init() {
    logging.info("Note overview plugin started!");
    await noteoverview.configureTranslation();
    await pluginSettingsModule.register();
    await noteoverview.setupLogging();
    await noteoverview.deleteLogFile();
    noteoverviewDialog = await joplin.views.dialogs.create(
      "noteoverviewDialog"
    );
    await joplin.commands.register({
      name: "createNoteOverview",
      label: i18n ? i18n.__("command.createNoteOverview") : "Create Note Overview",
      execute: async () => {
        noteoverview.updateAll(true);
      },
    });
    await joplin.views.menuItems.create(
      "menuItemToolsCreateNoteOverview",
      "createNoteOverview",
      MenuItemLocation.Tools
    );
    joplin.settings.onChange(async (event: any) => {
      await noteoverview.settingsChanged(event);
    });
    const syncTarget = await joplin.settings.globalValue("sync.target");
    const updateInterval = await joplin.settings.value("updateInterval");
    if (syncTarget === 0 && updateInterval > 0) {
      logging.verbose("set first update on timer (no sync or file system sync)");
      await noteoverview.setTimer(1);
    } else if (syncTarget !==0 ) {
        logging.verbose("set update on onSyncComplete event");
        joplin.workspace.onSyncComplete(async () => {
            await noteoverview.updateOnSyncComplete();
        });
        if (!firstSyncCompleted) {
            logging.verbose("Performing initial update check as firstSyncCompleted is false.");
            await noteoverview.updateAll(false);
        }
    } else {
        logging.verbose("Update on demand only (no sync target configured and update interval is 0).");
    }
  }

  export async function updateOnSyncComplete() {
    logging.verbose("onSyncComplete Event");
    logging.verbose(
      "updateOnSync: " + (await joplin.settings.value("updateOnSync"))
    );
    if (!firstSyncCompleted) {
      logging.verbose("firstSyncCompleted event processing");
      firstSyncCompleted = true;
      await noteoverview.updateAll(false);
      const updateInterval = await joplin.settings.value("updateInterval");
      if (updateInterval > 0) {
        await noteoverview.setTimer(updateInterval);
      }
    } else if ((await joplin.settings.value("updateOnSync")) === "yes") {
      await noteoverview.updateAll(false);
    }
  }

  export async function settingsChanged(event: any) {
    logging.verbose("Settings changed");
    if (event.keys.indexOf("updateInterval") !== -1) {
      await noteoverview.setTimer(
        await joplin.settings.value("updateInterval")
      );
    }
    if (event.keys.indexOf("fileLogLevel") !== -1) {
      await noteoverview.setupLogging();
    }
  }

  export async function setTimer(updateInterval: number) {
    if (timer) clearTimeout(timer);
    timer = null;
    if (updateInterval > 0) {
      logging.verbose("timer set to " + updateInterval + " minutes");
      timer = setTimeout(noteoverview.runTimed, 1000 * 60 * updateInterval);
    } else {
      logging.verbose("timer cleared (updateInterval <= 0)");
    }
  }

  export async function runTimed() {
    const updateInterval = await joplin.settings.value("updateInterval");
    if (updateInterval > 0) {
      logging.verbose("run timed update");
      await noteoverview.updateAll(false);
      await noteoverview.setTimer(updateInterval);
    } else {
      if (timer) clearTimeout(timer);
      timer = null;
      logging.verbose("Timed run skipped, interval is 0 or timer cleared.");
    }
  }

  export async function replaceSearchVars(query: string): Promise<string> {
    logging.verbose("replaceSearchVars input query: " + query);
    if (typeof query !== 'string') return '';

    const joplinLocale = await joplin.settings.globalValue("locale");
    const momentsLocale = joplinLocale ? joplinLocale.split("_")[0] : 'en';

    const finalQuery = query.replace(/{{moments:(?<format>[^}]+)}}/g, (match, formatString) => {
      let now = new Date(Date.now());
      let momentDate = moment(now);
      if (momentsLocale) momentDate.locale(momentsLocale);
      const modifyDateRegEx = /( modify:)(?<modify>.*)/;
      const modifyDateMatch = formatString.match(modifyDateRegEx);
      let actualFormatString = formatString.replace(modifyDateRegEx, "");
      if (modifyDateMatch && modifyDateMatch.groups && modifyDateMatch.groups.modify) {
        let actions = [];
        if (modifyDateMatch.groups.modify.match(",") !== null) {
          actions = modifyDateMatch.groups.modify.split(",");
        } else {
          actions.push(modifyDateMatch.groups.modify);
        }
        for (const action of actions) {
          let operation = action.substring(0, 1);
          let quantityStr = action.substring(1, action.length - 1);
          let type = action.substring(action.length - 1, action.length);
          let quantity = parseInt(quantityStr, 10);
          if (!isNaN(quantity)) {
            try {
              if (operation == "-") {
                momentDate.subtract(quantity, type as moment.unitOfTime.DurationConstructor);
              } else if (operation == "+") {
                momentDate.add(quantity, type as moment.unitOfTime.DurationConstructor);
              }
            } catch (e) {
              logging.error("Error modifying date with moment: " + e);
            }
          }
        }
      }
      return momentDate.format(actualFormatString);
    });
    logging.verbose("replaceSearchVars output query: " + finalQuery);
    return finalQuery;
  }

  export async function configureTranslation() {
    try {
        const joplinLocale = await joplin.settings.globalValue("locale") || "en_US";
        const installationDir = await joplin.plugins.installationDir();
        i18n = new I18n({
        locales: ["en_US", "de_DE"],
        defaultLocale: "en_US",
        fallbacks: { "en_*": "en_US", "de_*": "de_DE" },
        updateFiles: false,
        retryInDefaultLocale: true,
        syncFiles: true,
        directory: path.join(installationDir, "locales"),
        objectNotation: true,
        });
        i18n.setLocale(joplinLocale);
        moment.locale(joplinLocale.split('_')[0]);
    } catch (e) {
        logging.error("Error configuring translation: " + e.message);
        i18n = {
            setLocale: () => {},
            getLocale: () => "en_US",
            __: (str) => str,
        };
        moment.locale("en");
    }
  }
}
export { logging, i18n };
