import { App } from "obsidian";
/**
 * Check if a plugin is enabled in Obsidian
 * @param app The Obsidian App instance
 * @param pluginName The name of the plugin to check (e.g. "dataview" for the Dataview plugin)
 * @returns True if the plugin is enabled
 * @throws Error if the plugin is not found
 */
export const isPluginEnabled = (app: App, pluginName: string): boolean => {
	return app.plugins.enabledPlugins.has(pluginName);
};
