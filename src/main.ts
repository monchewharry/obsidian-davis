import {
	commandList,
	eventRefList,
	ribbonList,
	statusBarList,
	viewList,
} from "@/components/registerList";
import { DavisSettings, DEFAULT_SETTINGS } from '@/lib/config/settings';
import { Notice, Plugin } from "obsidian";
import { isPluginEnabled, loadFormatterConfig } from "@/lib/utils";
import { DataviewApi, getAPI } from "obsidian-dataview";
import { DavisSettingTab } from "@/components/settingTab";
import { BuiltInLeafTypes, CustomViewTypes } from "./types/viewType";

// Settings are now imported from settings.ts

export default class MyPlugin extends Plugin {
	settings: DavisSettings;
	dataviewAPI: DataviewApi | null = null;

	async onload() {
		// Load settings first before anything else
		await this.loadSettings();

		// Then check for dependencies
		["dataview", "obsidian-git"].forEach((pluginId) => {
			isPluginEnabled(this.app, pluginId);
		});
		this.dataviewAPI = getAPI(this.app);
		if (!this.dataviewAPI) {
			new Notice("❌ Could not initialize Dataview API");
			return;
		}

		new Notice("✅ DataView plugin is enabled");
		loadFormatterConfig();
		new Notice("🚀 Plugin loaded successfully");

		ribbonList(this.app).forEach((ribbon) => {
			const ribbonIconEl = this.addRibbonIcon(
				ribbon.icon,
				ribbon.title,
				ribbon.callback
			);
			ribbonIconEl.addClass(ribbon.className ?? "my-plugin-ribbon-class");
		});

		statusBarList.forEach((statusBar) => {
			const statusBarItemEl = this.addStatusBarItem();
			statusBarItemEl.setText(
				statusBar.text instanceof Function
					? statusBar.text()
					: statusBar.text
			);
			statusBarItemEl.addClass(statusBar.className);
		});

		viewList(this).forEach((view) => {
			this.registerView(view.type, view.viewCreator);
		});

		eventRefList(this.app).forEach((ef) => {
			this.registerEvent(ef);
		});

		// Register for Dataview's events
		this.registerEvent(
			this.app.metadataCache.on("dataview:index-ready", () => {
				console.log("Dataview indexing ready");
			})
		);

		this.registerEvent(
			this.app.metadataCache.on("dataview:metadata-change", () => {
				console.log("Dataview metadata changed");
			})
		);

		commandList(this.app, this.settings, this).forEach((c) => {
			this.addCommand(c);
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new DavisSettingTab(this.app, this));
	}

	onunload() {
		new Notice("💥unloading my plugin");
		this.app.workspace.detachLeavesOfType(CustomViewTypes.RESUME_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(CustomViewTypes.IframeViewTypes.CHATBOT_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(BuiltInLeafTypes.Webviewer);
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		new Notice(`✅ Settings loaded ${this.settings.hugobloxPostsPath}`);
	}

}
