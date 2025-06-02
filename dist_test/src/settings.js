"use strict";
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
exports.settings = void 0;
const api_1 = __importDefault(require("api"));
const types_1 = require("api/types");
const noteoverview_1 = require("./noteoverview"); // Keep i18n import for now
var settings;
(function (settings) {
    function register() {
        return __awaiter(this, void 0, void 0, function* () {
            yield api_1.default.settings.registerSection("tilesFeedSection", {
                label: "Tiles Feed",
                iconName: "fas fa-th-large", // Changed icon to something more tile-like
            });
            yield api_1.default.settings.registerSettings({
                updateInterval: {
                    value: 5,
                    minimum: 0,
                    maximum: 2880,
                    type: types_1.SettingItemType.Int,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.updateInterval.label"),
                    description: noteoverview_1.i18n.__("settings.updateInterval.description"),
                },
                updateOnSync: {
                    value: "no",
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    isEnum: true,
                    public: true,
                    label: noteoverview_1.i18n.__("settings.updateOnSync.label"),
                    options: {
                        yes: noteoverview_1.i18n.__("settings.updateOnSync.values.yes"),
                        no: noteoverview_1.i18n.__("settings.updateOnSync.values.no"),
                    },
                    description: noteoverview_1.i18n.__("settings.updateOnSync.description"),
                },
                showNoteCount: {
                    value: "off",
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    isEnum: true,
                    public: true,
                    label: noteoverview_1.i18n.__("settings.showNoteCount.label"),
                    options: {
                        off: noteoverview_1.i18n.__("settings.showNoteCount.values.off"),
                        above: noteoverview_1.i18n.__("settings.showNoteCount.values.above"),
                        below: noteoverview_1.i18n.__("settings.showNoteCount.values.below"),
                    },
                    description: noteoverview_1.i18n.__("settings.showNoteCount.description"),
                },
                showNoteCountText: {
                    value: "Note count: {{count}}",
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    advanced: true,
                    label: noteoverview_1.i18n.__("settings.showNoteCountText.label"),
                    description: noteoverview_1.i18n.__("settings.showNoteCountText.description", "{{count}}"),
                },
                noteStatus: {
                    value: "",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.noteStatus.label", "note"),
                    description: noteoverview_1.i18n.__("settings.noteStatus.description"),
                },
                todoStatusOpen: {
                    value: "",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.todoStatusOpen.label", "open todo"),
                    description: noteoverview_1.i18n.__("settings.todoStatusOpen.description"),
                },
                todoStatusDone: {
                    value: "✔",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.todoStatusDone.label", "todo completed"),
                    description: noteoverview_1.i18n.__("settings.todoStatusDone.description"),
                },
                todoStatusOverdue: {
                    value: "❗",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.todoStatusOverdue.label", "todo over due"),
                    description: noteoverview_1.i18n.__("settings.todoStatusOverdue.description"),
                },
                colorTodoOpen: {
                    value: "",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.colorTodoOpen.label", "todo [open]"),
                    description: noteoverview_1.i18n.__("settings.colorTodoOpen.description", "due_date"),
                },
                colorTodoWarning: {
                    value: "",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.colorTodoWarning.label", "todo [warning]"),
                    description: noteoverview_1.i18n.__("settings.colorTodoWarning.description", "due_date"),
                },
                todoWarningHours: {
                    value: 0,
                    minimum: 0,
                    maximum: 2880,
                    type: types_1.SettingItemType.Int,
                    section: "tilesFeedSection",
                    advanced: true,
                    public: true,
                    label: noteoverview_1.i18n.__("settings.todoWarningHours.label", "todo [warning]"),
                    description: noteoverview_1.i18n.__("settings.todoWarningHours.description", "due_date"),
                },
                colorTodoOpenOverdue: {
                    value: "red",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.colorTodoOpenOverdue.label", "todo [open_overdue]"),
                    description: noteoverview_1.i18n.__("settings.colorTodoOpenOverdue.description", "due_date"),
                },
                colorTodoDone: {
                    value: "limegreen,limegreen",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.colorTodoDone.label", "todo [done]"),
                    description: noteoverview_1.i18n.__("settings.colorTodoDone.description", {
                        field_due_date: "due_date",
                        field_todo_completed: "todo_completed",
                    }),
                },
                colorTodoDoneOverdue: {
                    value: "orange,orange",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.colorTodoDoneOverdue.label", "todo [done_overdue]"),
                    description: noteoverview_1.i18n.__("settings.colorTodoDoneOverdue.description", {
                        field_due_date: "due_date",
                        field_todo_completed: "todo_completed",
                    }),
                },
                colorTodoDoneNodue: {
                    value: "",
                    advanced: true,
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    public: true,
                    label: noteoverview_1.i18n.__("settings.colorTodoDoneNodue.label", "todo [done_nodue]"),
                    description: noteoverview_1.i18n.__("settings.colorTodoDoneNodue.description", "todo_completed"),
                },
                fileLogLevel: {
                    value: "info",
                    type: types_1.SettingItemType.String,
                    section: "tilesFeedSection",
                    advanced: true,
                    isEnum: true,
                    public: true,
                    label: noteoverview_1.i18n.__("settings.fileLogLevel.label"),
                    description: noteoverview_1.i18n.__("settings.fileLogLevel.description"),
                    options: {
                        false: noteoverview_1.i18n.__("settings.fileLogLevel.values.false"),
                        verbose: noteoverview_1.i18n.__("settings.fileLogLevel.values.verbose"),
                        info: noteoverview_1.i18n.__("settings.fileLogLevel.values.info"),
                        warn: noteoverview_1.i18n.__("settings.fileLogLevel.values.warn"),
                        error: noteoverview_1.i18n.__("settings.fileLogLevel.values.error"),
                    },
                },
            });
        });
    }
    settings.register = register;
})(settings = exports.settings || (exports.settings = {}));
