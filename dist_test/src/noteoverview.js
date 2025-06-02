"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = exports.logging = exports.noteoverview = void 0;
const moment = require("moment");
const api_1 = __importDefault(require("api"));
const naturalCompare = __importStar(require("string-natural-compare"));
const YAML = __importStar(require("yaml"));
const remark = __importStar(require("remark"));
const strip = __importStar(require("strip-markdown"));
const settings_1 = require("./settings");
const helper_1 = require("./helper");
const electron_log_1 = __importDefault(require("electron-log"));
exports.logging = electron_log_1.default;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const i18n_1 = require("i18n");
let noteoverviewDialog = null;
let timer = null;
let globalSettings = {};
const consoleLogLevel = "verbose";
let firstSyncCompleted = false;
let joplinNotebooks = null;
let logFile = null;
let i18n;
exports.i18n = i18n;
// Helper function to escape HTML characters
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string')
        return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
var noteoverview;
(function (noteoverview) {
    const SUPPORTED_COLORS = {
        "red": "red", "blue": "blue", "yellow": "yellow", "green": "green",
        "orange": "orange", "purple": "purple", "black": "black", "white": "white",
        "pink": "pink", "brown": "brown", "gray": "gray", "grey": "gray"
    };
    const DEFAULT_SEARCH_QUERY = "";
    const DEFAULT_SORT_ORDER = "updated_time DESC";
    const DEFAULT_LIMIT = 100;
    const DEFAULT_FIELDS_FOR_TILES = "image,title,excerpt,tags";
    const VALID_NOTE_PROPERTIES = [
        'id', 'parent_id', 'title', 'body', 'created_time', 'updated_time',
        'is_conflict', 'latitude', 'longitude', 'altitude', 'author',
        'source_application', 'source_url', 'is_todo', 'todo_due', 'todo_completed',
        'source', 'order', 'user_created_time', 'user_updated_time',
        'encryption_cipher_text', 'encryption_applied', 'markup_language',
        'is_shared', 'share_id', 'conflict_original_id', 'master_key_id',
    ];
    function getImageNr(body, imagrNr, imageSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("func: getImageNr");
            const regExresourceId = /(!\[([^\]]+|)\]\(|<img([^>]+)src=["']):\/(?<resourceId>[\da-z]{32})/g;
            let ids = [];
            let imageId = null;
            let regExMatch = null;
            if (typeof body !== 'string')
                body = '';
            while ((regExMatch = regExresourceId.exec(body)) != null) {
                ids.push(regExMatch["groups"]["resourceId"]);
            }
            const exactnr = (imageSettings === null || imageSettings === void 0 ? void 0 : imageSettings.exactnr) !== undefined ? imageSettings.exactnr : true;
            const width = (imageSettings === null || imageSettings === void 0 ? void 0 : imageSettings.width) || "200";
            const height = (imageSettings === null || imageSettings === void 0 ? void 0 : imageSettings.height) || "200";
            const noDimensions = (imageSettings === null || imageSettings === void 0 ? void 0 : imageSettings.noDimensions) || false;
            const imgClass = (imageSettings === null || imageSettings === void 0 ? void 0 : imageSettings.class) || "";
            const altText = (imageSettings === null || imageSettings === void 0 ? void 0 : imageSettings.alt) || "Note image";
            if (ids && ids.length > 0) {
                if (ids.length >= imagrNr) {
                    imageId = ids[imagrNr - 1];
                }
                else if (exactnr === false) {
                    imageId = ids[ids.length - 1];
                }
                if (imageId) {
                    const classAttribute = imgClass ? ` class="${escapeHtml(imgClass)}"` : "";
                    const altAttribute = ` alt="${escapeHtml(altText)}"`;
                    if (noDimensions) {
                        return `<img src=':/${imageId}'${classAttribute}${altAttribute}>`;
                    }
                    else if (width && height) {
                        return `<img src=':/${imageId}' width='${escapeHtml(String(width))}' height='${escapeHtml(String(height))}'${classAttribute}${altAttribute}>`;
                    }
                    else {
                        if (regExresourceId.source.includes("<img")) {
                            return `<img src=':/${imageId}'${classAttribute}${altAttribute}>`;
                        }
                        return `![](:/${imageId})`;
                    }
                }
            }
            return "";
        });
    }
    noteoverview.getImageNr = getImageNr;
    function getTags(noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tagNames = [];
            let pageNum = 1;
            let tagsResult;
            do {
                try {
                    tagsResult = yield api_1.default.data.get(["notes", noteId, "tags"], {
                        fields: "id, title, parent_id",
                        limit: 50,
                        page: pageNum++,
                    });
                }
                catch (e) {
                    electron_log_1.default.error("getTags " + e);
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
        });
    }
    noteoverview.getTags = getTags;
    function createSettingsBlock(overviewSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            let settingsToSave = Object.assign({}, overviewSettings);
            if (settingsToSave['searchWithVars']) {
                settingsToSave.search = settingsToSave['searchWithVars'];
                delete settingsToSave['searchWithVars'];
            }
            delete settingsToSave.orderBy;
            delete settingsToSave.orderDir;
            delete settingsToSave.statusText;
            if (settingsToSave.imageSettings) {
                settingsToSave.image = settingsToSave.imageSettings;
                delete settingsToSave.imageSettings;
            }
            if (settingsToSave.excerptSettings) {
                settingsToSave.excerpt = settingsToSave.excerptSettings;
                delete settingsToSave.excerptSettings;
            }
            const yamlBlock = YAML.stringify(settingsToSave);
            return `<!-- tiles-plugin\n${yamlBlock.trimEnd()}\n-->`;
        });
    }
    noteoverview.createSettingsBlock = createSettingsBlock;
    function showError(noteTitle, info = null, noteoverviewSettingsText = null) {
        return __awaiter(this, void 0, void 0, function* () {
            yield api_1.default.views.dialogs.setButtons(noteoverviewDialog, [{ id: "ok" }]);
            let msg = [];
            msg.push('<div id="tiles-feed-dialog-error">');
            msg.push("<h3>Tiles Feed Plugin Error</h3>");
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
                msg.push(escapeHtml(noteoverviewSettingsText).replace(/\n/g, "<br/>").replace(/\s/g, "&nbsp;"));
                msg.push("</div>");
            }
            msg.push("</div>");
            // Removed addScript for webview.css as it will be embedded
            yield api_1.default.views.dialogs.setHtml(noteoverviewDialog, msg.join("\n"));
            yield api_1.default.views.dialogs.open(noteoverviewDialog);
        });
    }
    noteoverview.showError = showError;
    function getDateFormated(epoch, dateFormat, timeFormat) {
        return __awaiter(this, void 0, void 0, function* () {
            if (epoch !== 0) {
                const dateObject = new Date(epoch);
                const date = moment(dateObject.getTime()).format(dateFormat);
                const newTimeFormat = timeFormat === "" ? "[]" : timeFormat;
                const time = moment(dateObject.getTime()).format(newTimeFormat);
                const datetime = [date];
                if (time !== "") {
                    datetime.push(time);
                }
                return datetime.join(" ");
            }
            else {
                return "";
            }
        });
    }
    noteoverview.getDateFormated = getDateFormated;
    function getDateHumanized(epoch, withSuffix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (epoch !== 0) {
                const dateObject = new Date(epoch);
                const dateString = moment
                    .duration(moment(dateObject.getTime()).diff(moment()))
                    .humanize(withSuffix);
                return dateString;
            }
            else {
                return "";
            }
        });
    }
    noteoverview.getDateHumanized = getDateHumanized;
    function getToDoDateColor(coloring, todo_due, todo_completed, type) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("func: getToDoDateColor");
            const now = new Date();
            let colorType = "";
            if (!coloring || !coloring.todo)
                return "";
            if (todo_due === 0 && todo_completed === 0) {
                colorType = "open_nodue";
            }
            else if (todo_due === 0 && todo_completed !== 0) {
                colorType = "done_nodue";
            }
            else if (todo_due > now.getTime() &&
                todo_completed === 0 &&
                coloring.todo.warningHours !== 0 &&
                todo_due - 3600 * coloring.todo.warningHours * 1000 < now.getTime()) {
                colorType = "warning";
            }
            else if (todo_due > now.getTime() && todo_completed === 0) {
                colorType = "open";
            }
            else if (todo_due < now.getTime() && todo_completed === 0) {
                colorType = "open_overdue";
            }
            else if (todo_due > todo_completed) {
                colorType = "done";
            }
            else if (todo_due < todo_completed) {
                colorType = "done_overdue";
            }
            else {
                return "";
            }
            let color = coloring.todo[colorType];
            if (typeof color === 'string') {
                if (color.indexOf(";") !== -1) {
                    color = color.split(";");
                }
                else if (color.indexOf(",") !== -1) {
                    color = color.split(",");
                }
                else {
                    color = [color, color];
                }
            }
            else {
                color = ["", ""];
            }
            if (type === "todo_due")
                return color[0];
            else if (type === "todo_completed")
                return color[1];
            else
                return "";
        });
    }
    noteoverview.getToDoDateColor = getToDoDateColor;
    function getDefaultColoring() {
        return __awaiter(this, void 0, void 0, function* () {
            let coloring = {
                todo: {
                    open_nodue: "",
                    open: yield api_1.default.settings.value("colorTodoOpen"),
                    warning: yield api_1.default.settings.value("colorTodoWarning"),
                    warningHours: yield api_1.default.settings.value("todoWarningHours"),
                    open_overdue: yield api_1.default.settings.value("colorTodoOpenOverdue"),
                    done: yield api_1.default.settings.value("colorTodoDone"),
                    done_overdue: yield api_1.default.settings.value("colorTodoDoneOverdue"),
                    done_nodue: yield api_1.default.settings.value("colorTodoDoneNodue"),
                },
            };
            return coloring;
        });
    }
    noteoverview.getDefaultColoring = getDefaultColoring;
    function humanFrendlyStorageSize(size) {
        return __awaiter(this, void 0, void 0, function* () {
            if (size < 1024) {
                return size + " Byte";
            }
            else if (size < 1024 * 500) {
                return (size / 1024).toFixed(2) + " KiB";
            }
            else if (size < 1024 * 1024 * 500) {
                return (size / 1024 / 1024).toFixed(2) + " MiB";
            }
            else {
                return (size / 1024 / 1024 / 1024).toFixed(2) + " GiB";
            }
        });
    }
    noteoverview.humanFrendlyStorageSize = humanFrendlyStorageSize;
    function getFileNames(noteId, getSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let pageNum = 1;
            let files = [];
            let resources;
            do {
                try {
                    resources = yield api_1.default.data.get(["notes", noteId, "resources"], {
                        fields: "id, size, title",
                        limit: 50,
                        page: pageNum++,
                        sort: "title ASC",
                    });
                }
                catch (e) {
                    electron_log_1.default.error("getFileNames " + e);
                    return files;
                }
                if (resources && resources.items) {
                    for (const resource of resources.items) {
                        let size = yield noteoverview.humanFrendlyStorageSize(resource.size);
                        files.push(resource.title + (getSize === true ? " - " + size : ""));
                    }
                }
            } while (resources && resources.has_more);
            return files;
        });
    }
    noteoverview.getFileNames = getFileNames;
    function getToDoStatus(todo_due, todo_completed) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("func: getToDoStatus");
            const now = new Date();
            if (todo_completed === 0 && todo_due !== 0 && todo_due < now.getTime())
                return "overdue";
            else if (todo_completed !== 0)
                return "done";
            else if (todo_completed === 0)
                return "open";
            else
                return "";
        });
    }
    noteoverview.getToDoStatus = getToDoStatus;
    function getDefaultStatusText() {
        return __awaiter(this, void 0, void 0, function* () {
            let status = {
                note: yield api_1.default.settings.value("noteStatus"),
                todo: {
                    overdue: yield api_1.default.settings.value("todoStatusOverdue"),
                    open: yield api_1.default.settings.value("todoStatusOpen"),
                    done: yield api_1.default.settings.value("todoStatusDone"),
                },
            };
            return status;
        });
    }
    noteoverview.getDefaultStatusText = getDefaultStatusText;
    function getMarkdownExcerpt(markdown, excerptSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const maxExcerptLength = (excerptSettings === null || excerptSettings === void 0 ? void 0 : excerptSettings.maxlength) || 200;
            const excerptRegex = (excerptSettings === null || excerptSettings === void 0 ? void 0 : excerptSettings.regex) || false;
            const excerptRegexFlags = (excerptSettings === null || excerptSettings === void 0 ? void 0 : excerptSettings.regexflags) || false;
            const removeMd = (excerptSettings === null || excerptSettings === void 0 ? void 0 : excerptSettings.removemd) !== undefined ? excerptSettings.removemd : true;
            const imageName = (excerptSettings === null || excerptSettings === void 0 ? void 0 : excerptSettings.imagename) || false;
            const removeNewLine = (excerptSettings === null || excerptSettings === void 0 ? void 0 : excerptSettings.removenewline) !== undefined ? excerptSettings.removenewline : true;
            let contentText = markdown;
            if (typeof contentText !== 'string')
                contentText = '';
            let excerpt = "";
            if (excerptRegex) {
                let matchRegex = null;
                if (excerptRegexFlags) {
                    matchRegex = new RegExp(excerptRegex, excerptRegexFlags);
                }
                else {
                    matchRegex = new RegExp(excerptRegex);
                }
                const hits = contentText.match(matchRegex);
                const excerptArray = [];
                if (hits == null)
                    return "";
                for (let match of hits) {
                    excerptArray.push(match);
                }
                excerpt = yield cleanExcerpt(excerptArray.join("\n"), removeMd, imageName, removeNewLine);
                return excerpt;
            }
            else {
                contentText = yield cleanExcerpt(contentText, removeMd, imageName, removeNewLine);
                excerpt = contentText.slice(0, maxExcerptLength);
                if (contentText.length > maxExcerptLength) {
                    return excerpt + "...";
                }
                return excerpt;
            }
        });
    }
    noteoverview.getMarkdownExcerpt = getMarkdownExcerpt;
    function cleanExcerpt(content, removeMd, imageName, removeNewLine) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof content !== 'string')
                content = '';
            if (imageName === false) {
                content = content.replace(/(!\[)([^\]]+)(\]\([^\)]+\))/g, "$1$3");
            }
            if (removeMd === true) {
                let processedMd = remark.default().use(strip.default).processSync(content);
                content = (processedMd === null || processedMd === void 0 ? void 0 : processedMd["contents"]) ? processedMd["contents"].toString() : "";
                if (content.length > 0)
                    content = content.substring(0, content.length - 1);
                content = content.replace(/(\s\\?~~|~~\s)/g, " ");
                content = content.replace(/(\s\\?==|==\s)/g, " ");
                content = content.replace(/(\s\\?\+\+|\+\+\s)/g, " ");
            }
            if (removeNewLine === false) {
                content = content.trim().replace(/(\t| )+/g, " ");
            }
            else {
                content = content.trim().replace(/\s+/g, " ");
            }
            return content;
        });
    }
    noteoverview.cleanExcerpt = cleanExcerpt;
    function getNotebookName(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (joplinNotebooks && joplinNotebooks[id]) {
                return joplinNotebooks[id].title;
            }
            else {
                return "n/a";
            }
        });
    }
    noteoverview.getNotebookName = getNotebookName;
    function getNotebookBreadcrumb(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (joplinNotebooks && joplinNotebooks[id]) {
                return joplinNotebooks[id].path.join(" > ");
            }
            else {
                return "n/a";
            }
        });
    }
    noteoverview.getNotebookBreadcrumb = getNotebookBreadcrumb;
    function loadNotebooks(reload = false) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("Func: loadNotebooks");
            if (reload === true || joplinNotebooks === null) {
                electron_log_1.default.verbose("load notebooks");
                joplinNotebooks = {};
                let queryFolders;
                let pageQuery = 1;
                do {
                    try {
                        queryFolders = yield api_1.default.data.get(["folders"], {
                            fields: "id, parent_id, title",
                            limit: 50,
                            page: pageQuery++,
                        });
                    }
                    catch (error) {
                        electron_log_1.default.error(error.message);
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
                const getParentName = (id, notebookPath) => {
                    if (id === "" || !joplinNotebooks[id])
                        return;
                    if (joplinNotebooks[id].parent_id !== "" && joplinNotebooks[joplinNotebooks[id].parent_id]) {
                        getParentName(joplinNotebooks[id].parent_id, notebookPath);
                    }
                    notebookPath.push(joplinNotebooks[id].title);
                };
                for (const key in joplinNotebooks) {
                    const notebookPath = [];
                    if (joplinNotebooks[key].path && joplinNotebooks[key].path.length > 0)
                        continue;
                    getParentName(joplinNotebooks[key].id, notebookPath);
                    joplinNotebooks[key].path = notebookPath;
                }
            }
        });
    }
    noteoverview.loadNotebooks = loadNotebooks;
    function getNoteSize(noteId) {
        return __awaiter(this, void 0, void 0, function* () {
            let size = 0;
            let note;
            try {
                note = yield api_1.default.data.get(["notes", noteId], {
                    fields: "id, body",
                });
            }
            catch (e) {
                electron_log_1.default.error("getNoteSize " + e);
                return "n/a";
            }
            size = note && note.body ? note.body.length : 0;
            let pageNum = 1;
            let resources;
            do {
                try {
                    resources = yield api_1.default.data.get(["notes", noteId, "resources"], {
                        fields: "id, size",
                        limit: 50,
                        page: pageNum++,
                    });
                }
                catch (e) {
                    electron_log_1.default.error("getNoteSize resources " + e);
                    return "n/a";
                }
                if (resources && resources.items) {
                    for (const resource of resources.items) {
                        size += Number.parseInt(resource.size) || 0;
                    }
                }
            } while (resources && resources.has_more);
            return yield noteoverview.humanFrendlyStorageSize(size);
        });
    }
    noteoverview.getNoteSize = getNoteSize;
    function removeNewLineAt(content, begin, end) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof content !== 'string')
                return '';
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
        });
    }
    noteoverview.removeNewLineAt = removeNewLineAt;
    function loadGlobalSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            globalSettings = {};
            globalSettings.dateFormat = yield api_1.default.settings.globalValue("dateFormat");
            globalSettings.timeFormat = yield api_1.default.settings.globalValue("timeFormat");
            globalSettings.statusText = yield noteoverview.getDefaultStatusText();
            globalSettings.coloring = yield noteoverview.getDefaultColoring();
            const showNoteCount = yield api_1.default.settings.value("showNoteCount");
            if (showNoteCount !== "off") {
                globalSettings.showNoteCount = {
                    enable: true,
                    position: showNoteCount,
                    text: yield api_1.default.settings.value("showNoteCountText"),
                };
            }
            else {
                globalSettings.showNoteCount = { enable: false };
            }
        });
    }
    noteoverview.loadGlobalSettings = loadGlobalSettings;
    function updateAll(userTriggerd) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.info("check all overviews");
            yield noteoverview.loadGlobalSettings();
            yield noteoverview.loadNotebooks(true);
            let pageNum = 1;
            let overviewNotes = null;
            const tilesPluginIdentifier = '/"<!-- tiles-plugin"';
            do {
                overviewNotes = yield api_1.default.data.get(["search"], {
                    query: tilesPluginIdentifier,
                    fields: "id",
                    limit: 10,
                    page: pageNum++,
                });
                if (overviewNotes && overviewNotes.items) {
                    for (let overviewNotesKey in overviewNotes.items) {
                        const noteId = overviewNotes.items[overviewNotesKey].id;
                        yield noteoverview.update(noteId, userTriggerd);
                    }
                }
            } while (overviewNotes && overviewNotes.has_more);
            electron_log_1.default.info("all overviews checked");
        });
    }
    noteoverview.updateAll = updateAll;
    function validateExcerptRegEx(settings, title) {
        return __awaiter(this, void 0, void 0, function* () {
            if (settings && settings.excerpt && settings.excerpt.regex) {
                const flags = settings.excerpt.regexflags;
                try {
                    if (flags)
                        new RegExp(settings.excerpt.regex, flags);
                    else
                        new RegExp(settings.excerpt.regex);
                }
                catch (error) {
                    electron_log_1.default.error("RegEx parse error: " + error.message);
                    yield noteoverview.showError(title, (i18n ? i18n.__("msg.error.regexParseError") : "RegEx parse error") + "</br>" + error.message, settings.excerpt.regex);
                    return false;
                }
            }
            return true;
        });
    }
    noteoverview.validateExcerptRegEx = validateExcerptRegEx;
    function update(noteId, userTriggerd) {
        return __awaiter(this, void 0, void 0, function* () {
            const note = yield api_1.default.data.get(["notes", noteId], {
                fields: ["id", "title", "body", "markup_language"],
            });
            if (!note) {
                electron_log_1.default.warn(`Note not found: ${noteId}`);
                return;
            }
            electron_log_1.default.info(`check note: ${note.title} (${note.id})`);
            const tilesPluginRegEx = /(?<!```\n)(?<!``` \n)(<!--\s?tiles-plugin(?<settings>[\w\W]*?)-->)([\w\W]*?)(<!--endoverview-->|(?=<!--\s?tiles-plugin)|$)/gi;
            let regExMatch = null;
            let lastProcessedIndex = 0;
            let newNoteBodyParts = [];
            const currentNoteBody = note.body || "";
            let finalNoteMarkupLanguage = 2; // Always HTML now
            while ((regExMatch = tilesPluginRegEx.exec(currentNoteBody)) != null) {
                const settingsContent = regExMatch["groups"]["settings"];
                const startIndex = regExMatch.index;
                const endIndex = startIndex + regExMatch[0].length;
                let parsedYamlSettings = {};
                try {
                    const parsed = YAML.parse(settingsContent);
                    if (parsed === null || typeof parsed !== 'object') {
                        parsedYamlSettings = {};
                    }
                    else {
                        parsedYamlSettings = parsed;
                    }
                }
                catch (error) {
                    electron_log_1.default.error("YAML parse error: " + error.message);
                    yield noteoverview.showError(note.title, (i18n ? i18n.__("msg.error.yamlParseError") : "YAML parse error") + "</br>" + error.message, settingsContent);
                    newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
                    newNoteBodyParts.push(regExMatch[0]);
                    lastProcessedIndex = endIndex;
                    continue;
                }
                if (parsedYamlSettings['update'] === 'manual' && !userTriggerd) {
                    electron_log_1.default.verbose("skip update for manual block, not user triggerd");
                    newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
                    newNoteBodyParts.push(regExMatch[0]);
                    lastProcessedIndex = endIndex;
                    continue;
                }
                const selectedNote = yield api_1.default.workspace.selectedNote();
                if (parsedYamlSettings['update'] === 'manual' && userTriggerd && selectedNote && noteId !== selectedNote.id) {
                    electron_log_1.default.verbose("skip update for manual block, selected note " + selectedNote.id + " <> " + noteId);
                    newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
                    newNoteBodyParts.push(regExMatch[0]);
                    lastProcessedIndex = endIndex;
                    continue;
                }
                if ((yield validateExcerptRegEx(parsedYamlSettings, note.title)) === false) {
                    newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
                    newNoteBodyParts.push(regExMatch[0]);
                    lastProcessedIndex = endIndex;
                    continue;
                }
                if (lastProcessedIndex < startIndex) {
                    newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex, startIndex));
                }
                const currentBlockOptions = yield noteoverview.getOptions(parsedYamlSettings);
                const newSettingsComment = yield noteoverview.createSettingsBlock(currentBlockOptions);
                newNoteBodyParts.push(newSettingsComment);
                const viewContentArray = yield noteoverview.getOverviewContent(note.id, note.title, parsedYamlSettings);
                const viewContentString = viewContentArray.join('\n');
                newNoteBodyParts.push(viewContentString);
                lastProcessedIndex = endIndex;
            }
            if (lastProcessedIndex < currentNoteBody.length) {
                newNoteBodyParts.push(currentNoteBody.substring(lastProcessedIndex));
            }
            let newNoteBodyStr = newNoteBodyParts.join("\n");
            // Embed CSS
            const pluginDir = yield api_1.default.plugins.installationDir();
            const cssFilePath = path.join(pluginDir, 'webview.css');
            let cssString = "";
            try {
                cssString = yield fs.readFile(cssFilePath, 'utf8');
                newNoteBodyStr = `<style>\n${cssString}\n</style>\n${newNoteBodyStr}`;
            }
            catch (readError) {
                electron_log_1.default.error(`Failed to read webview.css at ${cssFilePath}:`, readError);
                // Optionally show an error to the user or proceed without custom styles if critical
            }
            if (currentNoteBody !== newNoteBodyStr || note.markup_language !== finalNoteMarkupLanguage) {
                electron_log_1.default.info(`Updating note ${note.id}. Setting markup_language to: ${finalNoteMarkupLanguage}`);
                yield api_1.default.data.put(['notes', note.id], null, {
                    body: newNoteBodyStr,
                    markup_language: finalNoteMarkupLanguage,
                });
                const selectedNote = yield api_1.default.workspace.selectedNote();
                if (selectedNote && selectedNote.id === note.id) {
                    electron_log_1.default.info(`Forcing re-open of note ${note.id} to refresh view after markup_language change.`);
                    yield api_1.default.commands.execute('openNote', note.id);
                    // It might also be useful to re-focus an element to ensure the view is active
                    // await joplin.commands.execute('focusElement', 'noteTitle'); // Or 'noteBody'
                }
            }
            else {
                electron_log_1.default.info(`Note ${note.id} content and markup_language unchanged. No update needed.`);
            }
        });
    }
    noteoverview.update = update;
    function getOptions(overviewSettingsFromYaml) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("func: getOptions, input overviewSettingsFromYaml:", overviewSettingsFromYaml);
            const settings = {};
            const userSettings = overviewSettingsFromYaml || {};
            const isSearchEmpty = !userSettings['search'] || String(userSettings['search']).trim() === "";
            if (isSearchEmpty) {
                settings.search = DEFAULT_SEARCH_QUERY;
                settings.sort = userSettings['sort'] || DEFAULT_SORT_ORDER;
                settings.limit = (userSettings['limit'] === undefined || userSettings['limit'] === null) ? DEFAULT_LIMIT : Number(userSettings['limit']);
            }
            else {
                settings.search = userSettings['search'];
                settings.sort = userSettings['sort'] || "updated_time DESC";
                settings.limit = (userSettings['limit'] === undefined || userSettings['limit'] === null) ? -1 : Number(userSettings['limit']);
            }
            if (userSettings['search'] && String(userSettings['search']).includes("{{moments:")) {
                settings['searchWithVars'] = userSettings['search'];
            }
            settings.search = yield noteoverview.replaceSearchVars(String(settings.search || ""));
            const sortArray = (settings.sort || "").toLowerCase().split(" ");
            settings.orderBy = sortArray[0] || "updated_time";
            settings.orderDir = (sortArray[1] || "desc").toUpperCase();
            if (!userSettings['fields'] || String(userSettings['fields']).trim() === "") {
                settings.fields = DEFAULT_FIELDS_FOR_TILES;
            }
            else {
                settings.fields = userSettings['fields'];
            }
            settings.statusText = (yield (0, helper_1.mergeObject)(globalSettings.statusText, userSettings['status'] || null));
            settings.alias = userSettings['alias'] || "";
            settings.image = userSettings['image'] || {};
            settings.excerpt = userSettings['excerpt'] || {};
            settings.details = userSettings['details'] || null;
            settings.count = userSettings['count'] || null;
            settings.link = userSettings['link'] || null;
            settings.update = userSettings['update'];
            settings.coloring = yield (0, helper_1.mergeObject)(globalSettings.coloring, userSettings['coloring']);
            settings.datetimeSettings = (yield (0, helper_1.mergeObject)({
                date: globalSettings.dateFormat,
                time: globalSettings.timeFormat,
                humanize: { enabled: false, withSuffix: true },
            }, userSettings['datetime']));
            settings.tile = (yield (0, helper_1.mergeObject)({ maxTitleLength: 50, maxSnippetLength: 100, }, userSettings['tile'] || {}));
            settings.imageSettings = settings.image;
            settings.excerptSettings = settings.excerpt;
            electron_log_1.default.verbose("Processed options:", settings);
            return settings;
        });
    }
    noteoverview.getOptions = getOptions;
    function getOverviewContent(noteId, noteTitle, overviewSettingsFromYaml) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const options = yield noteoverview.getOptions(overviewSettingsFromYaml);
            electron_log_1.default.verbose(`func: getOverviewContent for note ${noteTitle} (${noteId}), search: '${options.search}', sort: ${options.orderBy} ${options.orderDir}, limit: ${options.limit}`);
            const query = options.search;
            let finalContentLayout = [];
            if (query) {
                const userRequestedDisplayFields = (options.fields || DEFAULT_FIELDS_FOR_TILES).toLowerCase().replace(/\s/g, "").split(",");
                let dbFieldsToQuery = [
                    'id', 'parent_id', 'title',
                    'is_todo', 'todo_due', 'todo_completed',
                    'updated_time', 'user_updated_time', 'user_created_time',
                    'body', 'source_url'
                ];
                userRequestedDisplayFields.forEach(field => {
                    if (field === 'image' || field === 'excerpt') {
                        if (!dbFieldsToQuery.includes('body'))
                            dbFieldsToQuery.push('body');
                    }
                    else if (field === 'link') {
                        if (!dbFieldsToQuery.includes('source_url'))
                            dbFieldsToQuery.push('source_url');
                    }
                    else if (field === 'status') {
                        if (!dbFieldsToQuery.includes('is_todo'))
                            dbFieldsToQuery.push('is_todo');
                        if (!dbFieldsToQuery.includes('todo_due'))
                            dbFieldsToQuery.push('todo_due');
                        if (!dbFieldsToQuery.includes('todo_completed'))
                            dbFieldsToQuery.push('todo_completed');
                    }
                    else if (VALID_NOTE_PROPERTIES.includes(field)) {
                        if (!dbFieldsToQuery.includes(field))
                            dbFieldsToQuery.push(field);
                    }
                });
                if (options.orderBy && VALID_NOTE_PROPERTIES.includes(options.orderBy) && !dbFieldsToQuery.includes(options.orderBy)) {
                    dbFieldsToQuery.push(options.orderBy);
                }
                dbFieldsToQuery = [...new Set(dbFieldsToQuery)];
                electron_log_1.default.verbose("Requesting DB fields:", dbFieldsToQuery.join(","));
                let noteCount = 0;
                let joplinQueryLimit = 50;
                let desiredNoteLimit = (_a = options.limit) !== null && _a !== void 0 ? _a : -1;
                if (desiredNoteLimit !== -1 && desiredNoteLimit < joplinQueryLimit) {
                    joplinQueryLimit = desiredNoteLimit;
                }
                let queryNotesResult = null;
                let pageQueryNotes = 1;
                const collectedNotes = [];
                do {
                    try {
                        queryNotesResult = yield api_1.default.data.get(["search"], {
                            query: query,
                            fields: dbFieldsToQuery.join(","),
                            order_by: options.orderBy,
                            order_dir: options.orderDir,
                            limit: joplinQueryLimit,
                            page: pageQueryNotes++,
                        });
                    }
                    catch (error) {
                        electron_log_1.default.error(`Error searching notes: ${error.message}. Query: ${query}, Fields: ${dbFieldsToQuery.join(",")}`);
                        yield noteoverview.showError(noteTitle, `Error during search: ${error.message}. Requested DB fields: ${dbFieldsToQuery.join(",")}. Please check your 'fields' option for valid note properties.`, "");
                        return [];
                    }
                    if (queryNotesResult && queryNotesResult.items) {
                        for (const item of queryNotesResult.items) {
                            if (item.id === noteId)
                                continue;
                            if (desiredNoteLimit !== -1 && collectedNotes.length >= desiredNoteLimit)
                                break;
                            collectedNotes.push(item);
                        }
                    }
                } while (queryNotesResult && queryNotesResult.has_more && (desiredNoteLimit === -1 || collectedNotes.length < desiredNoteLimit));
                noteCount = collectedNotes.length;
                const tileEntries = [];
                for (const noteItem of collectedNotes) {
                    tileEntries.push(yield noteoverview.getNoteInfoAsTile(noteItem, options));
                }
                finalContentLayout.push('<div class="note-overview-container">');
                finalContentLayout.push(...tileEntries);
                finalContentLayout.push('</div>');
                yield addNoteCount(finalContentLayout, noteCount, options);
                yield addHTMLDetailsTag(finalContentLayout, noteCount, options);
            }
            return finalContentLayout;
        });
    }
    noteoverview.getOverviewContent = getOverviewContent;
    function addHTMLDetailsTag(overview, noteCount, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.details && options.details.summary) {
                const summary = options.details.summary.replace("{{count}}", noteCount.toString());
                overview.unshift(`<summary>${escapeHtml(summary)}</summary>`);
                overview.unshift(`<details ` + (options.details.open === true ? ` open` : ``) + `>`);
                overview.push("</details>");
            }
        });
    }
    noteoverview.addHTMLDetailsTag = addHTMLDetailsTag;
    function addNoteCount(overview, count, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.count &&
                (options.count.enable || options.count.enable !== false)) {
                const text = options.count.text && options.count.text !== ""
                    ? `${options.count.text} `
                    : ``;
                const countStr = text.replace("{{count}}", count.toString());
                if (options.count.position === "above") {
                    const detailsTagIndex = overview.findIndex(line => line.startsWith("<details"));
                    if (detailsTagIndex !== -1 && overview.findIndex(line => line.startsWith("<summary>")) !== -1) {
                        const summaryIndex = overview.findIndex(line => line.startsWith("<summary>"));
                        overview.splice(summaryIndex + 1, 0, escapeHtml(countStr));
                    }
                    else if (detailsTagIndex !== -1) {
                        overview.splice(detailsTagIndex + 1, 0, escapeHtml(countStr));
                    }
                    else {
                        overview.unshift(escapeHtml(countStr));
                    }
                }
                else {
                    const detailsCloseTagIndex = overview.findIndex(line => line.startsWith("</details>"));
                    if (detailsCloseTagIndex !== -1) {
                        overview.splice(detailsCloseTagIndex, 0, escapeHtml(countStr));
                    }
                    else {
                        overview.push(escapeHtml(countStr));
                    }
                }
            }
        });
    }
    noteoverview.addNoteCount = addNoteCount;
    function replaceFieldPlaceholder(text, noteFields, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const asyncStringReplace = (str, regex, aReplacer) => __awaiter(this, void 0, void 0, function* () {
                const substrs = [];
                let match;
                let i = 0;
                while ((match = regex.exec(str)) !== null) {
                    substrs.push(str.slice(i, match.index));
                    substrs.push(aReplacer(...match));
                    i = regex.lastIndex;
                }
                substrs.push(str.slice(i));
                return (yield Promise.all(substrs)).join("");
            });
            try {
                return yield asyncStringReplace(text, /{{([^}]+)}}/g, (match, groups) => __awaiter(this, void 0, void 0, function* () {
                    return yield noteoverview.getFieldValue(groups, noteFields, options);
                }));
            }
            catch (error) {
                electron_log_1.default.error(error.message);
                yield noteoverview.showError("", error.message, "");
                throw error;
            }
        });
    }
    noteoverview.replaceFieldPlaceholder = replaceFieldPlaceholder;
    function getNoteInfoAsTile(noteFields, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose(`func: getNoteInfoAsTile for note ${noteFields.id}`);
            let title = noteFields.title ? noteFields.title : '';
            const maxTitleLength = ((_a = options.tile) === null || _a === void 0 ? void 0 : _a.maxTitleLength) || 50;
            let truncatedTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + "..." : title;
            let imageHtml = "";
            if (noteFields.body) {
                const imageSettings = {
                    nr: 1,
                    exactnr: true,
                    noDimensions: true,
                    class: "note-tile-image",
                    alt: `Image for note: ${title.substring(0, 30)}...`
                };
                const imgSrc = yield noteoverview.getImageNr(noteFields.body, imageSettings.nr, options.image || imageSettings);
                if (imgSrc && !imgSrc.startsWith("![]")) {
                    imageHtml = imgSrc;
                }
            }
            let snippet = "";
            if (noteFields.body) {
                const maxSnippetLength = ((_b = options.tile) === null || _b === void 0 ? void 0 : _b.maxSnippetLength) || 100;
                const excerptSettings = Object.assign({ maxlength: maxSnippetLength, removemd: true, removenewline: true }, (options.excerpt || {}));
                snippet = yield noteoverview.getMarkdownExcerpt(noteFields.body, excerptSettings);
                snippet = escapeHtml(snippet);
            }
            const noteTags = yield noteoverview.getTags(noteFields.id);
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
        });
    }
    noteoverview.getNoteInfoAsTile = getNoteInfoAsTile;
    function removeNoteoverviewCode(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof data !== 'string')
                return '';
            data = data.replace(/(?<!```\n)(?<!``` \n)(<!--\s?tiles-plugin([\w\W]*?)-->)/gi, "REMOVE_TILES_PLUGIN_LINE");
            data = data.replace(/(<!--endoverview-->)(?!\n```)/gi, "REMOVE_TILES_PLUGIN_LINE");
            const lines = data.split("\n");
            let newLines = [];
            for (const line of lines) {
                if (line.match("REMOVE_TILES_PLUGIN_LINE") === null) {
                    newLines.push(line);
                }
            }
            return newLines.join("\n");
        });
    }
    noteoverview.removeNoteoverviewCode = removeNoteoverviewCode;
    function getFieldValue(field, fields, options) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("func: getFieldValue for " + field);
            let value = "";
            if (!fields)
                return " ";
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
                    value = yield noteoverview.getDateFormated(dateObject.getTime(), options.datetimeSettings.date, options.datetimeSettings.time);
                    const htmlAttr = [];
                    if (value !== "" && options.datetimeSettings.humanize.enabled) {
                        htmlAttr.push(`title="${escapeHtml(value)}"`);
                        value = yield noteoverview.getDateHumanized(dateObject.getTime(), options.datetimeSettings.humanize.withSuffix);
                    }
                    if (field === "todo_due" || field === "todo_completed") {
                        const color = yield noteoverview.getToDoDateColor(options.coloring, fields["todo_due"], fields["todo_completed"], field);
                        if (color !== "") {
                            htmlAttr.push(`color="${escapeHtml(color)}"`);
                        }
                    }
                    if (htmlAttr.length) {
                        value = `<font ${htmlAttr.join(" ")}>${escapeHtml(value)}</font>`;
                    }
                    else {
                        value = escapeHtml(value);
                    }
                    break;
                case "status":
                    if (options.statusText && options.statusText.todo && options.statusText.note) {
                        if (!!fields["is_todo"]) {
                            const status = yield noteoverview.getToDoStatus(fields["todo_due"], fields["todo_completed"]);
                            value = options.statusText.todo[status];
                        }
                        else {
                            value = options.statusText.note;
                        }
                    }
                    value = escapeHtml(String(value));
                    break;
                case "excerpt":
                    value = yield noteoverview.getMarkdownExcerpt(fields["body"], options.excerptSettings);
                    value = escapeHtml(value);
                    break;
                case "image":
                    value = yield noteoverview.getImageNr(fields["body"], ((_a = options.imageSettings) === null || _a === void 0 ? void 0 : _a.nr) || 1, options.imageSettings);
                    break;
                case "file":
                    value = (yield noteoverview.getFileNames(fields["id"], false)).map(f => escapeHtml(f)).join("<br>");
                    break;
                case "file_size":
                    value = (yield noteoverview.getFileNames(fields["id"], true)).map(f => escapeHtml(f)).join("<br>");
                    break;
                case "size":
                    value = yield noteoverview.getNoteSize(fields["id"]);
                    value = escapeHtml(value);
                    break;
                case "tags":
                    value = (yield noteoverview.getTags(fields["id"])).map(t => escapeHtml(t)).join(", ");
                    break;
                case "notebook":
                    value = yield noteoverview.getNotebookName(fields["parent_id"]);
                    value = escapeHtml(value);
                    break;
                case "breadcrumb":
                    value = yield noteoverview.getNotebookBreadcrumb(fields["parent_id"]);
                    value = escapeHtml(value);
                    break;
                case "link":
                    const caption = ((_b = options.link) === null || _b === void 0 ? void 0 : _b.caption) || "Link";
                    const htmlLink = ((_c = options.link) === null || _c === void 0 ? void 0 : _c.html) || false; // Though this is always HTML now
                    const sourceUrl = fields["source_url"] || "";
                    value = `<a href="${escapeHtml(sourceUrl)}">${escapeHtml(caption)}</a>`;
                    break;
                default:
                    value = fields[field] !== undefined && fields[field] !== null ? fields[field].toString() : "";
                    value = escapeHtml(value);
            }
            if (value === "" || value === undefined || value === null)
                value = " ";
            return String(value);
        });
    }
    noteoverview.getFieldValue = getFieldValue;
    function getSubNoteContent(body, fromIndex, toIndex, posIsAfterOverviewSection) {
        return __awaiter(this, void 0, void 0, function* () {
            const orgContent = body.substring(fromIndex, toIndex);
            let stripe;
            if (posIsAfterOverviewSection === false) {
                if (fromIndex === 0) {
                    stripe = [false, true];
                }
                else {
                    stripe = [true, true];
                }
            }
            else {
                stripe = [true, false];
            }
            return yield noteoverview.removeNewLineAt(orgContent, stripe[0], stripe[1]);
        });
    }
    noteoverview.getSubNoteContent = getSubNoteContent;
    function setupLogging() {
        return __awaiter(this, void 0, void 0, function* () {
            const logFormatFile = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
            const logFormatConsole = "[{level}] {text}";
            try {
                logFile = path.join(yield api_1.default.plugins.installationDir(), "tiles-feed.log");
                const levelFile = yield api_1.default.settings.value("fileLogLevel");
                electron_log_1.default.transports.file.format = logFormatFile;
                electron_log_1.default.transports.file.level = levelFile;
                electron_log_1.default.transports.file.resolvePath = () => logFile;
                electron_log_1.default.transports.console.level = consoleLogLevel;
                electron_log_1.default.transports.console.format = logFormatConsole;
            }
            catch (e) {
                electron_log_1.default.error("Error setting up logging: " + e.message);
            }
        });
    }
    noteoverview.setupLogging = setupLogging;
    function deleteLogFile() {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("Delete log file");
            if (logFile && fs.existsSync(logFile)) {
                try {
                    yield fs.unlinkSync(logFile);
                }
                catch (e) {
                    electron_log_1.default.error("deleteLogFile: " + e.message);
                }
            }
        });
    }
    noteoverview.deleteLogFile = deleteLogFile;
    function init() {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.info("Tiles Feed plugin started!");
            yield noteoverview.configureTranslation();
            yield settings_1.settings.register();
            yield noteoverview.setupLogging();
            yield noteoverview.deleteLogFile();
            noteoverviewDialog = yield api_1.default.views.dialogs.create("tilesFeedDialog");
        });
    }
    noteoverview.init = init;
    function updateOnSyncComplete() {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("onSyncComplete Event");
            electron_log_1.default.verbose("updateOnSync: " + (yield api_1.default.settings.value("updateOnSync")));
            if (!firstSyncCompleted) {
                electron_log_1.default.verbose("firstSyncCompleted event processing");
                firstSyncCompleted = true;
                yield noteoverview.updateAll(false);
                const updateInterval = yield api_1.default.settings.value("updateInterval");
                if (updateInterval > 0) {
                    yield noteoverview.setTimer(updateInterval);
                }
            }
            else if ((yield api_1.default.settings.value("updateOnSync")) === "yes") {
                yield noteoverview.updateAll(false);
            }
        });
    }
    noteoverview.updateOnSyncComplete = updateOnSyncComplete;
    function settingsChanged(event) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("Settings changed");
            if (event.keys.indexOf("updateInterval") !== -1) {
                yield noteoverview.setTimer(yield api_1.default.settings.value("updateInterval"));
            }
            if (event.keys.indexOf("fileLogLevel") !== -1) {
                yield noteoverview.setupLogging();
            }
        });
    }
    noteoverview.settingsChanged = settingsChanged;
    function setTimer(updateInterval) {
        return __awaiter(this, void 0, void 0, function* () {
            if (timer)
                clearTimeout(timer);
            timer = null;
            if (updateInterval > 0) {
                electron_log_1.default.verbose("timer set to " + updateInterval + " minutes");
                timer = setTimeout(noteoverview.runTimed, 1000 * 60 * updateInterval);
            }
            else {
                electron_log_1.default.verbose("timer cleared (updateInterval <= 0)");
            }
        });
    }
    noteoverview.setTimer = setTimer;
    function runTimed() {
        return __awaiter(this, void 0, void 0, function* () {
            const updateInterval = yield api_1.default.settings.value("updateInterval");
            if (updateInterval > 0) {
                electron_log_1.default.verbose("run timed update");
                yield noteoverview.updateAll(false);
                yield noteoverview.setTimer(updateInterval);
            }
            else {
                if (timer)
                    clearTimeout(timer);
                timer = null;
                electron_log_1.default.verbose("Timed run skipped, interval is 0 or timer cleared.");
            }
        });
    }
    noteoverview.runTimed = runTimed;
    function replaceSearchVars(query) {
        return __awaiter(this, void 0, void 0, function* () {
            electron_log_1.default.verbose("replaceSearchVars input query: " + query);
            if (typeof query !== 'string')
                return '';
            const joplinLocale = yield api_1.default.settings.globalValue("locale");
            const momentsLocale = joplinLocale ? joplinLocale.split("_")[0] : 'en';
            const finalQuery = query.replace(/{{moments:(?<format>[^}]+)}}/g, (match, formatString) => {
                let now = new Date(Date.now());
                let momentDate = moment(now);
                if (momentsLocale)
                    momentDate.locale(momentsLocale);
                const modifyDateRegEx = /( modify:)(?<modify>.*)/;
                const modifyDateMatch = formatString.match(modifyDateRegEx);
                let actualFormatString = formatString.replace(modifyDateRegEx, "");
                if (modifyDateMatch && modifyDateMatch.groups && modifyDateMatch.groups.modify) {
                    let actions = [];
                    if (modifyDateMatch.groups.modify.match(",") !== null) {
                        actions = modifyDateMatch.groups.modify.split(",");
                    }
                    else {
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
                                    momentDate.subtract(quantity, type);
                                }
                                else if (operation == "+") {
                                    momentDate.add(quantity, type);
                                }
                            }
                            catch (e) {
                                electron_log_1.default.error("Error modifying date with moment: " + e);
                            }
                        }
                    }
                }
                return momentDate.format(actualFormatString);
            });
            electron_log_1.default.verbose("replaceSearchVars output query: " + finalQuery);
            return finalQuery;
        });
    }
    noteoverview.replaceSearchVars = replaceSearchVars;
    function configureTranslation() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const joplinLocale = (yield api_1.default.settings.globalValue("locale")) || "en_US";
                const installationDir = yield api_1.default.plugins.installationDir();
                exports.i18n = i18n = new i18n_1.I18n({
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
            }
            catch (e) {
                electron_log_1.default.error("Error configuring translation: " + e.message);
                exports.i18n = i18n = {
                    setLocale: () => { },
                    getLocale: () => "en_US",
                    __: (str) => str,
                };
                moment.locale("en");
            }
        });
    }
    noteoverview.configureTranslation = configureTranslation;
})(noteoverview = exports.noteoverview || (exports.noteoverview = {}));
