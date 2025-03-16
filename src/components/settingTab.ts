import { PluginSettingTab, App, Setting, Notice } from "obsidian";
import DavisPlugin from '@/main';
export class DavisSettingTab extends PluginSettingTab {
	plugin: DavisPlugin;

	constructor(app: App, plugin: DavisPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('my-setting-tab');
		containerEl.createEl('h4', { text: 'Video Archive Settings' });
		new Setting(containerEl)
			.setName('Video Archive Directory')
			.setDesc('Path to your video archive directory within the vault')
			.addText(text => text
				.setPlaceholder('Enter path...')
				.setValue(this.plugin.settings.videoArchivePath)
				.onChange(async (value) => {
					this.plugin.settings.videoArchivePath = value;
					await this.plugin.saveSettings();
					new Notice('✅ Video archive path updated');
				}));

		new Setting(containerEl)
			.setName('FFmpeg Path')
			.setDesc('Full path to ffmpeg executable (e.g., /opt/homebrew/bin/ffmpeg)')
			.addText(text => text
				.setPlaceholder('Enter ffmpeg path...')
				.setValue(this.plugin.settings.ffmpegPath)
				.onChange(async (value) => {
					this.plugin.settings.ffmpegPath = value;
					await this.plugin.saveSettings();
					new Notice('✅ FFmpeg path updated');
				}));

		new Setting(containerEl)
			.setName('YouTube Shorts File')
			.setDesc('Path to your YouTube Shorts markdown file within the vault')
			.addText(text => text
				.setPlaceholder('Enter path...')
				.setValue(this.plugin.settings.youtubeShortsPath)
				.onChange(async (value) => {
					this.plugin.settings.youtubeShortsPath = value;
					await this.plugin.saveSettings();
					new Notice('✅ YouTube Shorts file path updated');
				}));

		containerEl.createEl('h4', { text: 'Hugo Blox Settings' });
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

		containerEl.createEl('h4', { text: 'Regular Expression Settings' });
		new Setting(containerEl)
			.setName('Case Insensitive')
			.setDesc('When using regular expressions, apply the \'/i\' modifier for case insensitive search)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.caseInsensitive)
				.onChange(async (value) => {
					this.plugin.settings.caseInsensitive = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Process \\n as line break')
			.setDesc('When \'\\n\' is used in the replace field, a \'line break\' will be inserted accordingly')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.processLineBreak)
				.onChange(async (value) => {
					this.plugin.settings.processLineBreak = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Prefill Find Field')
			.setDesc('Copy the currently selected text (if any) into the \'Find\' text field. This setting is only applied if the selection does not contain linebreaks')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.prefillFind)
				.onChange(async (value) => {
					this.plugin.settings.prefillFind = value;
					await this.plugin.saveSettings();
				}));


		containerEl.createEl("h4", { text: "Settings for Youtube Transcript" });

		new Setting(containerEl)
			.setName("Timestamp interval")
			.setDesc(
				"Indicates how often timestamp should occur in text (1 - every line, 10 - every 10 lines)",
			)
			.addText((text) =>
				text
					.setValue(this.plugin.settings.timestampMod.toFixed())
					.onChange(async (value) => {
						const v = Number.parseInt(value);
						this.plugin.settings.timestampMod = Number.isNaN(v)
							? 5
							: v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Language")
			.setDesc("Preferred transcript language")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.lang)
					.onChange(async (value) => {
						this.plugin.settings.lang = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Country")
			.setDesc("Preferred transcript country code")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.country)
					.onChange(async (value) => {
						this.plugin.settings.country = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}