import { CustomViewTypes } from "@/types/viewType";
import { MyItemView } from "@/lib/myItemView";
import { Menu, TFile, WorkspaceLeaf, Notice } from "obsidian";
import { exec } from "child_process";
import MyPlugin from "@/main";

export class VideoView extends MyItemView {
	private videoContainerEl?: HTMLElement;
	private consoleEl?: HTMLElement;
	private currentVideoFile?: TFile;
	private plugin: MyPlugin;
	private selectedVideos: Set<string> = new Set();
	private isInCinemaMode: boolean = false;
	private cinemaContainer?: HTMLElement;

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
                position: relative;
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
            .video-checkbox-container {
                position: absolute;
                top: 12px;
                left: 12px;
                z-index: 10;
                background-color: var(--background-primary);
                padding: 6px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.9;
            }
            .video-wrapper:hover .video-checkbox-container {
                opacity: 1;
            }
            .video-checkbox {
                transform: scale(1.5);
                cursor: pointer;
                margin: 0;
                accent-color: var(--interactive-accent);
            }
            .cinema-mode-container {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: black;
                z-index: 1000;
                display: grid;
                gap: 10px;
                padding: 10px;
                overflow: hidden;
                width: 100vw;
                height: 100vh;
            }
            /* Single video layout */
            .cinema-mode-container.single-video {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            /* Two videos layout */
            .cinema-mode-container.two-videos {
                grid-template-columns: repeat(2, 1fr);
                padding: 20px;
            }
            /* Three or more portrait videos */
            .cinema-mode-container.portrait-videos:not(.single-video):not(.two-videos) {
                grid-template-columns: repeat(3, 1fr);
                align-items: center;
            }
            /* Three or more landscape videos */
            .cinema-mode-container.landscape-videos:not(.single-video):not(.two-videos) {
                grid-template-columns: repeat(auto-fit, minmax(45vw, 1fr));
            }
            .cinema-mode-video-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .cinema-mode-video {
                width: 100%;
                height: 100%;
                object-fit: contain;
                max-height: calc(100vh - 100px);
            }
            .cinema-mode-controls {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 10px 20px;
                border-radius: 5px;
                display: flex;
                gap: 10px;
                z-index: 1001;
            }
            .cinema-mode-button {
                background: var(--interactive-accent);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
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
            .ffmpeg-title {
                font-size: 16px;
                font-weight: 500;
                color: var(--text-normal);
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .ffmpeg-title-icon {
                color: var(--text-muted);
                font-size: 14px;
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

		// Exit cinema mode if active
		this.exitCinemaMode();

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

		// Add cinema mode button
		const cinemaButton = this.videoContainerEl.createEl('button', {
			cls: 'cinema-mode-button',
			text: 'Enter Cinema Mode'
		});
		cinemaButton.addEventListener('click', () => this.enterCinemaMode());

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

		// Create a container for the checkbox
		const checkboxContainer = videoWrapper.createDiv({ cls: 'video-checkbox-container' });

		// Add checkbox for video selection
		const checkbox = checkboxContainer.createEl('input', {
			type: 'checkbox',
			cls: 'video-checkbox',
			attr: {
				title: 'Select video for cinema mode'
			}
		});
		checkbox.addEventListener('change', (e) => {
			if ((e.target as HTMLInputElement).checked) {
				this.selectedVideos.add(file.path);
			} else {
				this.selectedVideos.delete(file.path);
			}
		});
		// Restore checkbox state if video was previously selected
		if (this.selectedVideos.has(file.path)) {
			checkbox.checked = true;
		}

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

		// Add title with video name
		const titleArea = this.consoleEl.createDiv({ cls: 'ffmpeg-title' });
		titleArea.createSpan({ cls: 'ffmpeg-title-icon', text: '🎬' });
		titleArea.createSpan({ text: `Processing: ${file.basename}` });

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
			exec(fullCommand, async (error, stdout, stderr) => {
				if (error) {
					output.setText(`Error: ${error.message}\n${stderr}`);
					return;
				}
				output.setText(`Command completed successfully!\n${stdout}\n${stderr}`);
				new Notice('FFmpeg command completed');

				// Give the file system a moment to finish writing
				await new Promise(resolve => setTimeout(resolve, 1000));

				// Refresh the video list
				await this.loadVideos();
			});
		});
	}

	private enterCinemaMode(): void {
		if (this.selectedVideos.size === 0) {
			new Notice('Please select at least one video');
			return;
		}

		this.isInCinemaMode = true;

		// Create cinema mode container
		this.cinemaContainer = document.createElement('div');
		this.cinemaContainer.className = 'cinema-mode-container';
		document.body.appendChild(this.cinemaContainer);

		// Check if all videos are portrait mode
		let allPortrait = true;
		const checkVideoOrientation = (video: HTMLVideoElement) => {
			if (video.videoHeight <= video.videoWidth) {
				allPortrait = false;
			}
		};

		// Create a promise that resolves when video metadata is loaded
		const videoLoadPromises: Promise<void>[] = [];

		// Add selected videos and check their orientation
		this.selectedVideos.forEach((path) => {
			const promise = new Promise<void>((resolve) => {
			const file = this.app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) {
				const videoUrl = this.app.vault.getResourcePath(file);
				// Create wrapper for better video positioning
				const videoWrapper = document.createElement('div');
				videoWrapper.className = 'cinema-mode-video-wrapper';

				const video = document.createElement('video');
				video.className = 'cinema-mode-video';
				video.src = videoUrl;
				video.controls = true;
				video.loop = true; // Enable looping for each video

				// Check video orientation once metadata is loaded
				video.addEventListener('loadedmetadata', () => {
					checkVideoOrientation(video);
					resolve();
				});

				videoWrapper.appendChild(video);
				this.cinemaContainer?.appendChild(videoWrapper);

				// Only sync play state, not pause
				video.addEventListener('play', () => {
					this.cinemaContainer?.querySelectorAll('video').forEach(v => {
						if (v !== video && v.paused) v.play();
					});
				});
			}
			});
			videoLoadPromises.push(promise);
		});

		// Wait for all videos to load their metadata, then set the appropriate layout
		Promise.all(videoLoadPromises).then(() => {
			// Add class based on number of videos
			if (this.selectedVideos.size === 1) {
				this.cinemaContainer?.classList.add('single-video');
			} else if (this.selectedVideos.size === 2) {
				this.cinemaContainer?.classList.add('two-videos');
			} else if (allPortrait) {
				this.cinemaContainer?.classList.add('portrait-videos');
			} else {
				this.cinemaContainer?.classList.add('landscape-videos');
			}
		});

		// Add controls
		const controls = document.createElement('div');
		controls.className = 'cinema-mode-controls';

		const exitButton = document.createElement('button');
		exitButton.textContent = 'Exit Cinema Mode';
		exitButton.className = 'ffmpeg-close';
		exitButton.onclick = () => this.exitCinemaMode();
		controls.appendChild(exitButton);

		const playAllButton = document.createElement('button');
		playAllButton.textContent = 'Play All';
		playAllButton.className = 'ffmpeg-run';
		playAllButton.onclick = () => {
			this.cinemaContainer?.querySelectorAll('video').forEach(v => v.play());
		};
		controls.appendChild(playAllButton);

		const pauseAllButton = document.createElement('button');
		pauseAllButton.textContent = 'Pause All';
		pauseAllButton.className = 'ffmpeg-run';
		pauseAllButton.onclick = () => {
			this.cinemaContainer?.querySelectorAll('video').forEach(v => v.pause());
		};
		controls.appendChild(pauseAllButton);

		document.body.appendChild(controls);
	}

	private exitCinemaMode(): void {
		if (!this.isInCinemaMode) return;

		this.cinemaContainer?.remove();
		document.querySelector('.cinema-mode-controls')?.remove();
		this.cinemaContainer = undefined;
		this.isInCinemaMode = false;
	}

	async onClose() {
		// Exit cinema mode if active
		this.exitCinemaMode();
		// Remove custom styles
		const styleEl = document.head.querySelector('style');
		if (styleEl) {
			styleEl.remove();
		}
		// Clear container
		this.containerEl.empty();
	}
}
