const Module = require('module');
const path = require('path');
const fs = require('fs-extra'); // fs-extra is used in the plugin

// --- Joplin API Mocking ---
let registeredPlugin = null; // To capture the plugin object

const mockJoplinApi = {
  settings: {
    globalValue: async (key) => {
      console.log(`Mock joplin.settings.globalValue: key=${key}`);
      if (key === 'dateFormat') return 'YYYY-MM-DD';
      if (key === 'timeFormat') return 'HH:mm';
      if (key === 'locale') return 'en_US';
      return null;
    },
    value: async (key) => {
      console.log(`Mock joplin.settings.value: key=${key}`);
      if (key === 'showNoteCount') return 'off';
      if (key === 'fileLogLevel') return 'info';
      if (key === 'todoWarningHours') return 48;
      if (key === 'updateInterval') return 0;
      // settings from pluginSettingsModule.register() in src/settings.ts
      if (key === 'noteStatus') return '';
      if (key === 'todoStatusOpen') return '';
      if (key === 'todoStatusDone') return '✔';
      if (key === 'todoStatusOverdue') return '❗';
      if (key === 'colorTodoOpen') return '';
      if (key === 'colorTodoWarning') return '';
      if (key === 'colorTodoOpenOverdue') return 'red';
      if (key === 'colorTodoDone') return 'limegreen,limegreen';
      if (key === 'colorTodoDoneOverdue') return 'orange,orange';
      if (key === 'colorTodoDoneNodue') return '';


      return null;
    },
    registerSection: async () => {},
    registerSettings: async () => {},
  },
  plugins: {
    installationDir: async () => {
      console.log("Mock joplin.plugins.installationDir called");
      return process.cwd(); // Use current working directory for the test
    },
    register: (plugin) => {
      console.log("Mock joplin.plugins.register called");
      registeredPlugin = plugin;
    },
  },
  data: {
    get: async (pathArray, query) => {
      console.log(`Mock joplin.data.get: path=${JSON.stringify(pathArray)}, query=${JSON.stringify(query)}`);
      if (pathArray[0] === 'notes' && pathArray.length === 2) {
        const noteId = pathArray[1];
        if (noteId === 'overviewNoteId123') {
          return global.mockOverviewNote;
        }
        if (noteId === 'sourceNoteId1') {
          return global.mockSourceNote1;
        }
      }
      if (pathArray[0] === 'search' && query && query.query) {
         if (query.query.includes('Source Note 1') || query.query.includes('notebook:*')) {
           return { items: [global.mockSourceNote1], has_more: false };
         }
      }
      if (pathArray[0] === 'notes' && pathArray[2] === 'tags') {
        return { items: [], has_more: false };
      }
      if (pathArray[0] === 'folders') {
        return { items: [{id: 'notebookId1', title: 'Test Notebook', parent_id: ''}], has_more: false };
      }
      return { items: [], has_more: false };
    },
    put: async (pathArray, _params, body) => {
      console.log(`Mock joplin.data.put: path=${JSON.stringify(pathArray)}, body=${JSON.stringify(body)}`);
      if (pathArray[0] === 'notes' && pathArray[1] === 'overviewNoteId123') {
        global.mockOverviewNote.body = body.body;
        global.mockOverviewNote.markup_language = body.markup_language;
      }
    },
  },
  views: {
    dialogs: {
      create: async (_id) => 'mockDialogId',
      setButtons: async () => {},
      setHtml: async () => {},
      open: async () => {},
    },
    menuItems: {
        create: async () => {}
    }
  },
  workspace: {
    selectedNote: async () => global.mockOverviewNote,
    onNoteSelectionChange: async () => {},
    onSyncComplete: async () => {},
  },
  commands: {
    register: async () => {},
    execute: async (command, ...args) => {
      console.log(`Mock joplin.commands.execute: ${command} ${JSON.stringify(args)}`);
    },
  },
  require: () => { // Mock for joplin.require used by electron-log
    return {
        setLocale: () => {},
        getLocale: () => "en_US",
        __: (str) => str,
    };
  }
};

// --- Intercept require for 'api' ---
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === 'api') {
    console.log("Mocking require('api') for plugin");
    return mockJoplinApi;
  }
  if (request === 'api/types') {
    console.log("Mocking require('api/types') for plugin - returning MenuItemLocation");
    return {
      MenuItemLocation: {
        File: 'file',
        Edit: 'edit',
        View: 'view',
        Note: 'note',
        Tools: 'tools',
        Help: 'help',
        Context: 'context',
        NoteListContextMenu: 'noteListContextMenu',
        EditorContextMenu: 'editorContextMenu',
        FolderContextMenu: 'folderContextMenu',
        TagContextMenu: 'tagContextMenu',
      },
      SettingItemType: {
        Int: 1,
        String: 2,
        Bool: 3,
        Array: 4,
        Object: 5,
        Button: 6,
      },
      SettingStorage: {
        Database: 1,
        File: 2,
      },
      AppType: {
        Desktop: 'desktop',
        Mobile: 'mobile',
        Cli: 'cli',
      },
      SettingItemSubType: {
        FilePathAndArgs: 'file_path_and_args',
        FilePath: 'file_path',
        DirectoryPath: 'directory_path',
      }
    };
  }
  // If the compiled noteoverview or its helpers try to require './helper', './type', etc.
  // from within dist_test/src, we need to adjust the path or ensure those are also
  // correctly resolved/mocked if not compiled alongside.
  // However, tsc with outDir should handle local relative paths correctly.
  return originalRequire.apply(this, arguments);
};

// --- Require the compiled testable module ---
// This should now point to the output from `tsc -p tsconfig.test.json`
const plugin = require('./dist_test/src/index.js'); // Adjusted path
const { noteoverview, logging, i18n } = plugin;


// --- Test Data ---
global.mockSourceNote1 = {
  id: 'sourceNoteId1',
  parent_id: 'notebookId1', // Added for notebook name/breadcrumb
  title: 'Source Note 1',
  body: 'Content for tile 1. This is some excerpt text. ![image.png](:/resourceId123)', // Added image
  markup_language: 1, // Markdown
  updated_time: Date.now(),
  created_time: Date.now(),
  is_todo: 0,
  todo_due: 0,
  todo_completed: 0,
  source_url: 'https://example.com/source1'
};

global.mockOverviewNote = {
  id: 'overviewNoteId123',
  title: 'Overview Note',
  body: `<!-- tiles-plugin
search: "notebook:*"
fields: "title,excerpt,image,tags,notebook,breadcrumb,link,created_time,updated_time,size,status,file,file_size"
limit: 5
sort: title DESC
-->
<!--endoverview-->`,
  markup_language: 1, // Markdown
};

// --- Test Execution ---
async function runTest() {
  let errorOccurred = null;
  let finalOverviewNote = null;

  try {
    // 1. Initialize plugin environment by calling onStart
    if (registeredPlugin && registeredPlugin.onStart) {
      console.log("Calling plugin onStart...");
      await registeredPlugin.onStart(); // This should call noteoverview.init()
                                        // which in turn calls setupLogging, configureTranslation
    } else {
      throw new Error("Plugin did not register onStart via mock");
    }
    // loadGlobalSettings is called by updateAll, so not strictly needed here if updateAll is called.
    // But calling it directly for sanity check is fine.
    console.log("Loading global settings for noteoverview...");
    await noteoverview.loadGlobalSettings();
    console.log("Loading notebooks for noteoverview...");
    await noteoverview.loadNotebooks(true); // Force reload

    // 2. Source note is defined globally
    // 3. Overview note is defined globally

    // 4. YAML block is in mockOverviewNote.body

    // 5. Get ID of overview note
    const overviewNoteId = global.mockOverviewNote.id;

    // 6. Call noteoverview.update
    console.log(`Calling noteoverview.update for note ID: ${overviewNoteId}`);
    await noteoverview.update(overviewNoteId, true);

    // 7. Fetch the overview note again (it's updated in global.mockOverviewNote by the mock joplin.data.put)
    finalOverviewNote = global.mockOverviewNote;

  } catch (e) {
    console.error('Error during test execution:', e);
    errorOccurred = e;
  }

  // 8. Report
  console.log("\n--- Test Report ---");
  if (errorOccurred) {
    console.log("Error Occurred:", errorOccurred.message);
    if(errorOccurred.stack) console.log("Stack:", errorOccurred.stack);
  } else {
    console.log("No errors during test execution reported by try/catch.");
  }

  if (finalOverviewNote) {
    console.log("Overview Note Markup Language:", finalOverviewNote.markup_language);
    console.log("Overview Note Body (first ~300 chars):", finalOverviewNote.body ? finalOverviewNote.body.substring(0, 300) + (finalOverviewNote.body.length > 300 ? "..." : "") : "N/A");
    if (finalOverviewNote.body && !finalOverviewNote.body.startsWith('<style>')) {
        console.log("WARNING: Overview note body does not start with <style>");
    }
     if (finalOverviewNote.markup_language !== 2) {
        console.log(`WARNING: Overview note markup_language is ${finalOverviewNote.markup_language}, expected 2 (HTML)`);
    }
  } else {
    console.log("Could not fetch/update final overview note.");
  }
  console.log("--- End Test Report ---");
}

// Create dummy webview.css if it doesn't exist, so fs.readFile doesn't fail
async function ensureDummyCss() {
    try {
        const pluginDir = await mockJoplinApi.plugins.installationDir();
        const cssFilePath = path.join(pluginDir, 'webview.css');
        if (!fs.existsSync(cssFilePath)) {
            console.log(`Creating dummy webview.css at ${cssFilePath} for test purposes.`);
            await fs.ensureFile(cssFilePath);
            await fs.writeFile(cssFilePath, '/* Dummy CSS for testing */ body { background-color: #f0f0f0; }');
        }
    } catch(e) {
        console.error("Error creating dummy webview.css", e);
    }
}

ensureDummyCss().then(runTest);
