import { App, PluginSettingTab, Setting } from 'obsidian';
import DavisPlugin from './main';

export interface DavisSettings {
	hugobloxPostsPath: string;
	hugobloxPostHeaders?: any;
}

export const DEFAULT_SETTINGS: DavisSettings = {
	hugobloxPostsPath: '/Users/dingxiancao/monchewharry.github.io/content/blogs/draft'
};

export class DavisSettingTab extends PluginSettingTab {
	plugin: DavisPlugin;

	constructor(app: App, plugin: DavisPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Hugo Posts Directory')
			.setDesc('Path to your Hugo website posts directory')
			.addText(text => text
				.setPlaceholder('Enter path...')
				.setValue(this.plugin.settings.hugobloxPostsPath)
				.onChange(async (value) => {
					this.plugin.settings.hugobloxPostsPath = value;
					await this.plugin.saveSettings();
					new Notice('✅ Hugo posts directory path updated');
				}));
	}
}
