import { App, Notice } from "obsidian";
/**
 * Check if a plugin is enabled in Obsidian
 * @param app The Obsidian App instance
 * @param pluginId The id of the plugin to check (e.g. "dataview" for the Dataview plugin)
 * @returns True if the plugin is enabled
 * @throws Error if the plugin is not found
 */
export const isPluginEnabled = (app: App, pluginId: string): boolean => {
	const result = app.plugins.enabledPlugins.has(pluginId);
	if (!result) {
		new Notice(`❌ ${pluginId} plugin is not enabled`);
	}
	return result;
};

export const runOtherPluginCommand = (app: App, pluginId: string, commandId: string) => {
	if (!isPluginEnabled(app, pluginId)) {
		new Notice(`❌ ${pluginId} plugin is not enabled`);
		return;
	}
	const actualCommandId = `${pluginId}:${commandId}`;
	app.commands.executeCommandById(actualCommandId);
};