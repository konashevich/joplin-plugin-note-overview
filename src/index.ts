import joplin from "api";
import { noteoverview } from "./noteoverview"; // Keep internal namespace for now

joplin.plugins.register({
  onStart: async function () {
    // Command registration
    await joplin.commands.register({
      name: "getUpdateTilesFeed", // New command name
      label: "Get/Update Tiles Feed", // New label (will be replaced by i18n later)
      execute: async () => {
        // Call the main update function from noteoverview namespace
        // The internal namespace 'noteoverview' and its functions like 'updateAll'
        // are kept for now to minimize internal refactoring until renaming is fully decided.
        // The user-facing command and menu items are what's changing primarily.
        await noteoverview.updateAll(true);
      },
    });

    // Menu item registration
    await joplin.views.menuItems.create(
      "menuItemToolsGetUpdateTilesFeed", // New menu item name
      "getUpdateTilesFeed", // New command name to link to
      MenuItemLocation.Tools
    );

    // Initialize the core logic (which might register settings, etc.)
    await noteoverview.init();
  },
});
