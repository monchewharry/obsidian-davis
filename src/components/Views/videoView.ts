import { CustomViewTypes } from "@/types/viewType";
import { MyItemView } from "@/lib/myItemView";
import { Menu, TFile, WorkspaceLeaf, Notice } from "obsidian";
import { exec } from "child_process";
import MyPlugin from "@/main";
import { error } from "console";

export class VideoView extends MyItemView {
	private videoContainerEl?: HTMLElement;
	private consoleEl?: HTMLElement;
	private currentVideoFile?: TFile;
	private plugin: MyPlugin;

	get targetFolder(): string {
		return this.plugin.settings.videoArchivePath;
	}

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf, CustomViewTypes.VIDEO_VIEW_TYPE, "video", "Video Archive");
		this.plugin = plugin;
	}

	async onOpen() {
		const { containerEl } = this;
		containerEl.empty();

		// Add styles
		this.addStyles();

		// Set container to fill available space
		containerEl.style.display = 'flex';
		containerEl.style.flexDirection = 'column';
		containerEl.style.height = '100%';
		containerEl.style.overflow = 'hidden';

		// Create main container
		this.videoContainerEl = containerEl.createDiv({ cls: "video-archive-container" });

		// Create console container
		this.consoleEl = containerEl.createDiv({ cls: "ffmpeg-console" });
		this.consoleEl.style.display = 'none';

		// Load and display videos
		await this.loadVideos();
	}

	private addStyles() {
		const styleEl = document.createElement('style');
		styleEl.textContent = `
            .video-archive-container {
                padding: 0;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
                gap: 1px;
                height: 100%;
                overflow-y: auto;
                background: var(--background-modifier-border);
            }
            .video-item {
                background: var(--background-primary);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: calc(100vh - 100px);
            }
            .video-wrapper {
                position: relative;
                flex: 1;
                background: var(--background-secondary);
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }
            .video-menu-button {
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(0, 0, 0, 0.5);
                color: white;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                z-index: 10;
                opacity: 0;
                transition: opacity 0.2s;
            }
            .video-wrapper:hover .video-menu-button {
                opacity: 1;
            }
            .ffmpeg-console {
                background: var(--background-primary);
                border-top: 1px solid var(--background-modifier-border);
                padding: 16px;
                display: flex;
				flex-direction: column;
                gap: 12px;
                height: 240px;
            }
            .ffmpeg-input {
				width: 70%;
                display: flex;
            }
            .ffmpeg-input input {
                padding: 8px 12px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                font-size: 14px;
            }
            .ffmpeg-button-group {
                display: flex;
                flex-direction: row;
            }
            .ffmpeg-button-group button {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                min-width: 80px;
                transition: opacity 0.2s;
            }
            .ffmpeg-run {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
            }
            .ffmpeg-run:hover {
                opacity: 0.9;
            }
            .ffmpeg-close {
                background-color: red;
                color: white;
            }
            .ffmpeg-close:hover {
                color: var(--text-on-accent);
            }
            .ffmpeg-output {
                flex: 1;
                overflow-y: auto;
                font-family: monospace;
                font-size: 12px;
                padding: 12px;
                background: var(--background-secondary);
                border-radius: 4px;
                white-space: pre-wrap;
                line-height: 1.4;
            }
            .video-item video {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .video-info {
                padding: 12px;
                background: var(--background-primary);
                border-top: 1px solid var(--background-modifier-border);
            }
            .video-title {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
                color: var(--text-normal);
            }
            .video-meta {
                font-size: 12px;
                color: var(--text-muted);
            }
        `;
		document.head.appendChild(styleEl);
	}

	private async loadVideos() {
		if (!this.videoContainerEl) return;

		// Clear existing content
		this.videoContainerEl.empty();

		// Get all files in the target folder
		const files = this.app.vault.getFiles()
			.filter(file => {
				const isInTargetFolder = file.path.startsWith(this.targetFolder);
				const isVideo = file.extension.match(/^(mp4|webm|mov)$/i);
				return isInTargetFolder && isVideo;
			});

		if (files.length === 0) {
			this.videoContainerEl.createEl("p", {
				text: "No videos found in " + this.targetFolder
			});
			return;
		}

		// Create video elements for each file
		for (const file of files) {
			await this.createVideoElement(file);
		}
	}

	private async createVideoElement(file: TFile) {
		if (!this.videoContainerEl) return;

		const itemEl = this.videoContainerEl.createDiv({ cls: "video-item" });

		// Create video wrapper
		const videoWrapper = itemEl.createDiv({ cls: "video-wrapper" });

		// Add menu button
		const menuButton = videoWrapper.createDiv({ cls: "video-menu-button", text: "⋮" });
		menuButton.addEventListener("click", (event) => {
			const menu = new Menu();
			menu.addItem((item) => {
				item
					.setTitle("Edit")
					.setIcon("edit")
					.onClick(() => this.showFfmpegConsole(file));
			});
			menu.addItem((item) => {
				item
					.setTitle("Score")
					.setIcon("star")
					.setDisabled(true);
			});
			menu.showAtMouseEvent(event);
		});

		// Create video element
		const videoEl = videoWrapper.createEl("video", {
			attr: {
				controls: "",
				preload: "metadata",
				loop: "true"
			}
		});

		// Get video URL
		const videoUrl = this.app.vault.getResourcePath(file);
		videoEl.src = videoUrl;



		// Create info section
		const infoEl = itemEl.createDiv({ cls: "video-info" });
		infoEl.createDiv({
			cls: "video-title",
			text: file.basename
		});
		infoEl.createDiv({
			cls: "video-meta",
			text: `Last modified: ${new Date(file.stat.mtime).toLocaleDateString()}`
		});
	}

	private showFfmpegConsole(file: TFile) {
		if (!this.consoleEl) return;

		// Show console and store current video
		this.consoleEl.style.display = 'flex';
		this.currentVideoFile = file;
		this.consoleEl.empty();

		// Create input area with template selector
		const inputArea = this.consoleEl.createDiv({ cls: 'ffmpeg-input' });

		// Template selector
		const templateArea = inputArea.createDiv({ cls: 'ffmpeg-template' });
		templateArea.createSpan({ text: 'Template:' });
		const templateSelect = templateArea.createEl('select');
		const templates = [
			{ name: 'Custom Command', value: 'custom' },
			{ name: 'Trim Video', value: 'trim' },
			{ name: 'Scale Video', value: 'scale' },
			{ name: 'Extract Audio', value: 'audio' },
			{ name: 'Change Format', value: 'format' },
		];

		templates.forEach(template => {
			const option = templateSelect.createEl('option', {
				value: template.value,
				text: template.name
			});
		});

		// Parameter inputs
		const paramsArea = inputArea.createDiv({ cls: 'ffmpeg-params' });
		const commandInput = inputArea.createEl('input', {
			cls: 'ffmpeg-command',
			attr: {
				type: 'text',
				placeholder: 'FFmpeg command will appear here...',
				readonly: true
			}
		});

		// Handle template changes
		const updateCommand = () => {
			const template = templateSelect.value;
			paramsArea.empty();

			switch (template) {
				case 'trim': {
					paramsArea.createSpan({ text: 'Start Time:' });
					const startInput = paramsArea.createEl('input', {
						attr: { type: 'text', placeholder: '00:00:00' }
					});

					paramsArea.createSpan({ text: 'End Time:' });
					const endInput = paramsArea.createEl('input', {
						attr: { type: 'text', placeholder: '00:01:00' }
					});

					const updateTrimCommand = () => {
						commandInput.value = `-ss ${startInput.value} -to ${endInput.value} -c:v copy -c:a copy`;
					};
					startInput.addEventListener('input', updateTrimCommand);
					endInput.addEventListener('input', updateTrimCommand);
					break;
				}
				case 'scale': {
					paramsArea.createSpan({ text: 'Width:' });
					const widthInput = paramsArea.createEl('input', {
						attr: { type: 'text', placeholder: '1280' }
					});

					paramsArea.createSpan({ text: 'Height:' });
					const heightInput = paramsArea.createEl('input', {
						attr: { type: 'text', placeholder: '720' }
					});

					const updateScaleCommand = () => {
						commandInput.value = `-vf "scale=${widthInput.value || 'iw'}:${heightInput.value || 'ih'}"`;
					};
					widthInput.addEventListener('input', updateScaleCommand);
					heightInput.addEventListener('input', updateScaleCommand);
					break;
				}
				case 'audio': {
					paramsArea.createSpan({ text: 'Format:' });
					const formatSelect = paramsArea.createEl('select');
					['mp3', 'aac', 'wav'].forEach(format => {
						formatSelect.createEl('option', { value: format, text: format.toUpperCase() });
					});

					const updateAudioCommand = () => {
						commandInput.value = `-vn -acodec ${formatSelect.value}`;
					};
					formatSelect.addEventListener('change', updateAudioCommand);
					updateAudioCommand();
					break;
				}
				case 'format': {
					paramsArea.createSpan({ text: 'Format:' });
					const formatSelect = paramsArea.createEl('select');
					['mp4', 'webm', 'mov', 'gif'].forEach(format => {
						formatSelect.createEl('option', { value: format, text: format.toUpperCase() });
					});

					const updateFormatCommand = () => {
						commandInput.value = `-c:v copy -c:a copy`;
					};
					formatSelect.addEventListener('change', updateFormatCommand);
					updateFormatCommand();
					break;
				}
				default: {
					commandInput.removeAttribute('readonly');
					commandInput.placeholder = 'Enter custom ffmpeg command (e.g., -vf "scale=1280:720")';
				}
			}
		};

		templateSelect.addEventListener('change', updateCommand);
		updateCommand(); // Initialize with default template

		// Create button row
		const buttonArea = this.consoleEl.createDiv({ cls: 'ffmpeg-button-group' });

		const closeButton = buttonArea.createEl('button', {
			cls: 'ffmpeg-close',
			text: 'Close'
		});
		closeButton.addEventListener('click', () => {
			if (this.consoleEl) {
				this.consoleEl.style.display = 'none';
				this.currentVideoFile = undefined;
			}
		});

		const runButton = buttonArea.createEl('button', {
			cls: 'ffmpeg-run',
			text: 'Run'
		});

		// Create output area
		const output = this.consoleEl.createDiv({ cls: 'ffmpeg-output' });
		// Handle command execution
		runButton.addEventListener('click', () => {
			const command = commandInput.value.trim();
			if (!command) {
				new Notice('Please enter a ffmpeg command');
				return;
			}

			if (!this.currentVideoFile) {
				new Notice('No video selected');
				return;
			}

			// Get file paths
			const inputPath = this.app.vault.adapter.getFullPath(this.currentVideoFile.path);
			if (!inputPath) {
				new Notice('Could not get video file path');
				return;
			}

			// Validate command for safety
			if (command.includes('&&') || command.includes(';') || command.includes('|')) {
				new Notice('Command chaining is not allowed for security reasons');
				return;
			}

			// Handle output path based on template
			const template = templateSelect.value;
			let outputPath = inputPath;

			if (template === 'audio') {
				// For audio extraction, change extension based on format
				const format = paramsArea.querySelector('select')?.value || 'mp3';
				outputPath = inputPath.replace(/\.[^.]+$/, `_audio.${format}`);
			} else if (template === 'format') {
				// For format conversion, change extension to target format
				const format = paramsArea.querySelector('select')?.value || 'mp4';
				outputPath = inputPath.replace(/\.[^.]+$/, `.${format}`);
			} else {
				// For other operations, append _output to the filename
				outputPath = inputPath.replace(/\.[^.]+$/, '_output$&');
			}

			// Get ffmpeg path from settings
			const ffmpegPath = this.plugin.settings.ffmpegPath;
			if (!ffmpegPath) {
				new Notice('FFmpeg path not configured. Please set it in plugin settings.');
				return;
			}

			// Construct full command with overwrite flag
			const fullCommand = `${ffmpegPath} -y -i "${inputPath}" ${command} "${outputPath}"`;

			// Execute command
			output.setText('Running ffmpeg command...');
			exec(fullCommand, (error, stdout, stderr) => {
				if (error) {
					output.setText(`Error: ${error.message}\n${stderr}`);
					return;
				}
				output.setText(`Command completed successfully!\n${stdout}\n${stderr}`);
				new Notice('FFmpeg command completed');
			});
		});
	}

	async onClose() {
		// Remove custom styles
		const styleEl = document.head.querySelector('style');
		if (styleEl) {
			styleEl.remove();
		}
		// Clear container
		this.containerEl.empty();
	}
}
