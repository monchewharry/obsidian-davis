import {
	commandList,
	eventRefList,
	ribbonList,
	statusBarList,
	viewList,
} from "@/components/registerList";
import SampleSettingTab from "@/components/settingTab";
import { type MyPluginSettings } from "@/types/pluginSettings";
import { Notice, Plugin, type EventRef } from "obsidian";
import { isPluginEnabled, loadFormatterConfig } from "@/lib/utils";
import { DataviewApi, getAPI } from "obsidian-dataview";

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	dataviewAPI: DataviewApi | null = null;

	async onload() {
		await this.checkLoading();

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

		viewList.forEach((view) => {
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

		commandList(this.app).forEach((c) => {
			this.addCommand(c);
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, "click", (evt: MouseEvent) => {
		// 	console.log("click", evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		// );
	}

	onunload() {
		new Notice("💥unloading my plugin");
		console.log("unloading my plugin");
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
	}
	private async checkLoading() {
		if (!isPluginEnabled(this.app, "dataview")) {
			new Notice(
				"❌ This plugin requires obsidian-dataview to be enabled"
			);
			return;
		}
		this.dataviewAPI = getAPI(this.app);
		if (!this.dataviewAPI) {
			new Notice("❌ Could not initialize Dataview API");
			return;
		}

		new Notice("✅ DataView plugin is enabled");


		await this.loadSettings();
		await loadFormatterConfig(this.app);
		new Notice("🚀my plugin loaded");
	}
}
