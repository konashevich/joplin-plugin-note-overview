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
exports.i18n = exports.logging = exports.noteoverview = void 0;
const api_1 = __importDefault(require("api"));
const types_1 = require("api/types"); // Added this line
const noteoverview_1 = require("./noteoverview"); // Keep internal namespace for now
Object.defineProperty(exports, "noteoverview", { enumerable: true, get: function () { return noteoverview_1.noteoverview; } });
Object.defineProperty(exports, "logging", { enumerable: true, get: function () { return noteoverview_1.logging; } });
Object.defineProperty(exports, "i18n", { enumerable: true, get: function () { return noteoverview_1.i18n; } });
api_1.default.plugins.register({
    onStart: function () {
        return __awaiter(this, void 0, void 0, function* () {
            // Command registration
            yield api_1.default.commands.register({
                name: "getUpdateTilesFeed",
                label: "Get/Update Tiles Feed",
                execute: () => __awaiter(this, void 0, void 0, function* () {
                    // Call the main update function from noteoverview namespace
                    // The internal namespace 'noteoverview' and its functions like 'updateAll'
                    // are kept for now to minimize internal refactoring until renaming is fully decided.
                    // The user-facing command and menu items are what's changing primarily.
                    yield noteoverview_1.noteoverview.updateAll(true);
                }),
            });
            // Menu item registration
            yield api_1.default.views.menuItems.create("menuItemToolsGetUpdateTilesFeed", // New menu item name
            "getUpdateTilesFeed", // New command name to link to
            types_1.MenuItemLocation.Tools);
            // Initialize the core logic (which might register settings, etc.)
            yield noteoverview_1.noteoverview.init();
        });
    },
});
