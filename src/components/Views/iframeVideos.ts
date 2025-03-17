import { CustomViewTypes } from "@/types/viewType";
import { MyItemView } from "@/lib/myItemView";
import { TFile, WorkspaceLeaf, parseYaml } from "obsidian";
import MyPlugin from "@/main";

export class IframeVideoCollectionView extends MyItemView {
	private videoContainerEl?: HTMLElement;
	private plugin: MyPlugin;
	private selectedVideos: Set<string> = new Set();
	private isInCinemaMode: boolean = false;
	private cinemaContainer?: HTMLElement;
	private videosFilePath: string;
	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf, CustomViewTypes.IFRAME_VIDEO_VIEW_TYPE, "play-circle", "Iframe Videos");
		this.plugin = plugin;
		this.videosFilePath = this.plugin.settings.iframeVideoPath;
	}

	async onOpen() {
		this.addStyles();
		await this.loadVideos();
	}

	private addStyles() {
		const container = this.containerEl.children[1];
		container.empty();
		this.videoContainerEl = container.createDiv({ cls: "bilibili-videos-container" });

		// Add custom styles
		const style = document.createElement("style");
		style.textContent = `
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
            .cinema-mode-container.single-video {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            .cinema-mode-container.two-videos {
                grid-template-columns: repeat(2, 1fr);
                padding: 20px;
            }
            .cinema-mode-container.multi-videos {
                grid-template-columns: repeat(auto-fit, minmax(45vw, 1fr));
                grid-auto-rows: 1fr;
            }
            .cinema-mode-video-wrapper {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .cinema-mode-video-wrapper iframe {
                width: 100%;
                height: 100%;
                max-height: calc(100vh - 40px);
            }
            .cinema-mode-controls {
                position: fixed;
                top: 20px;
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
            .bilibili-videos-container {
                padding: 20px;
                max-width: 100%;
                margin: 0 auto;
            }
            .bilibili-videos-category {
                margin-bottom: 30px;
            }
            .bilibili-videos-category-title {
                font-size: 1.5em;
                margin-bottom: 15px;
                color: var(--text-normal);
            }
            .bilibili-videos-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }
            .bilibili-video-item {
                background: var(--background-secondary);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .bilibili-video-wrapper {
                position: relative;
                padding-top: 56.25%; /* 16:9 Aspect Ratio */
                width: 100%;
                background: var(--background-primary);
            }
            .bilibili-video-wrapper iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
            }
            .bilibili-video-info {
                padding: 10px;
            }
            .bilibili-video-title {
                font-weight: bold;
                margin-bottom: 5px;
                color: var(--text-normal);
            }
            .bilibili-video-meta {
                font-size: 0.9em;
                color: var(--text-muted);
            }
        `;
		document.head.appendChild(style);
	}

	async loadVideos() {
		if (!this.videoContainerEl) return;
		this.videoContainerEl.empty();

		// Add cinema mode button if there are selected videos
		if (this.selectedVideos.size > 0) {
			const cinemaButton = this.videoContainerEl.createEl('button', {
				cls: 'cinema-mode-button',
				text: 'Enter Cinema Mode'
			});
			cinemaButton.addEventListener('click', () => this.enterCinemaMode());
		}

		try {
			const file = this.app.vault.getAbstractFileByPath(this.videosFilePath);
			if (!(file instanceof TFile)) {
				throw new Error("Bilibili videos file not found");
			}

			const content = await this.app.vault.read(file);
			const frontmatter = this.extractFrontmatter(content);

			if (!frontmatter || !frontmatter.shortsURL) {
				throw new Error("Invalid frontmatter format");
			}

			frontmatter.shortsURL.forEach((category: any) => {
				const [categoryName, iframes] = Object.entries(category)[0];

				const categoryContainer = this.videoContainerEl!.createDiv({ cls: "bilibili-videos-category" });
				categoryContainer.createEl("h2", {
					cls: "bilibili-videos-category-title",
					text: this.formatCategoryName(categoryName)
				});

				const videosGrid = categoryContainer.createDiv({ cls: "bilibili-videos-grid" });

				if (Array.isArray(iframes)) {
					iframes.forEach((iframeHtml: string, index: number) => {
						const videoItem = videosGrid.createDiv({ cls: "bilibili-video-item" });
						const wrapper = videoItem.createDiv({ cls: "bilibili-video-wrapper" });

						// Add checkbox container
						const checkboxContainer = wrapper.createDiv({ cls: 'video-checkbox-container' });
						const checkbox = checkboxContainer.createEl('input', {
							type: 'checkbox',
							cls: 'video-checkbox'
						});

						// Parse the iframe HTML to extract src and other attributes
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = iframeHtml;
						const iframeEl = tempDiv.querySelector('iframe');

						if (iframeEl) {
							const src = iframeEl.getAttribute('src');
							const videoId = this.extractVideoId(src || "");
							if (videoId) {
								checkbox.checked = this.selectedVideos.has(videoId);
								checkbox.addEventListener('change', () => this.toggleVideoSelection(videoId));
							}
							wrapper.createEl("iframe", {
								attr: {
									src: src?.startsWith("https://") ? src + '&autoplay=0&loop=1&high_quality=1&danmaku=0&as_wide=1' :
										'https:' + src + '&autoplay=0&loop=1&high_quality=1&danmaku=0&as_wide=1',
									scrolling: "no",
									border: "0",
									frameborder: "no",
									framespacing: "0",
									allowfullscreen: "true"
								}
							});

							const info = videoItem.createDiv({ cls: "bilibili-video-info" });
							info.createEl("div", {
								cls: "bilibili-video-title",
								text: `Video #${index + 1}`
							});
							const metaDiv = info.createEl("div", { cls: "bilibili-video-meta" });
							if (videoId) {
								const [platform, id] = videoId.split(':');
								let text, href;
								
								if (platform === 'bilibili') {
									text = `BV${id}`;
									href = `https://www.bilibili.com/video/BV${id}`;
								} else if (platform === 'youtube') {
									text = `YouTube: ${id}`;
									href = `https://www.youtube.com/watch?v=${id}`;
								}

								if (text && href) {
									metaDiv.createEl("a", {
										text,
										href,
										attr: {
											target: "_blank",
											rel: "noopener"
										}
									});
								}
							}
						}
					});
				}
			});

		} catch (error) {
			console.error("Error loading Bilibili videos:", error);
			this.videoContainerEl.createEl("p", {
				text: "Error loading videos: " + error.message
			});
		}
	}

	private extractFrontmatter(content: string): any {
		const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
		const match = content.match(frontmatterRegex);

		if (!match) return null;

		try {
			return parseYaml(match[1]);
		} catch (e) {
			console.error("Error parsing frontmatter:", e);
			return null;
		}
	}

	private formatCategoryName(name: string): string {
		return name
			.replace(/([A-Z])/g, ' $1')
			.replace(/([0-9])/g, ' $1')
			.replace(/_/g, ' ')
			.replace(/^./, str => str.toUpperCase())
			.trim();
	}

	private extractVideoId(url: string): string | null {
		// Handle Bilibili videos
		const bvidMatch = url.match(/bvid=([^&]+)/i);
		if (bvidMatch && bvidMatch[1]) {
			return 'bilibili:' + bvidMatch[1].replace(/^BV/, '');
		}

		// Handle YouTube videos
		const youtubeMatch = url.match(/youtube.com\/embed\/([^?]+)/);
		if (youtubeMatch && youtubeMatch[1]) {
			return 'youtube:' + youtubeMatch[1];
		}

		return null;
	}

	private toggleVideoSelection(videoId: string) {
		if (this.selectedVideos.has(videoId)) {
			this.selectedVideos.delete(videoId);
		} else {
			this.selectedVideos.add(videoId);
		}
		this.loadVideos();
	}

	private enterCinemaMode() {
		if (this.selectedVideos.size === 0) return;
		this.isInCinemaMode = true;

		// Create cinema mode container
		this.cinemaContainer = document.body.createDiv({ cls: 'cinema-mode-container' });

		// Add appropriate class based on number of videos
		if (this.selectedVideos.size === 1) {
			this.cinemaContainer.addClass('single-video');
		} else if (this.selectedVideos.size === 2) {
			this.cinemaContainer.addClass('two-videos');
		} else {
			this.cinemaContainer.addClass('multi-videos');
		}

		// Add selected videos
		this.selectedVideos.forEach(videoId => {
			const wrapper = this.cinemaContainer!.createDiv({ cls: 'cinema-mode-video-wrapper' });
			const [platform, id] = videoId.split(':');
			
			let src = '';
			if (platform === 'bilibili') {
				src = `https://player.bilibili.com/player.html?bvid=BV${id}&autoplay=0&loop=1&high_quality=1&danmaku=0&as_wide=1`;
			} else if (platform === 'youtube') {
				src = `https://www.youtube.com/embed/${id}`;
			}

			wrapper.createEl('iframe', {
				attr: {
					src,
					allowfullscreen: 'true',
					frameborder: 'no',
					scrolling: 'no'
				}
			});
		});

		// Add controls
		const controls = this.cinemaContainer.createDiv({ cls: 'cinema-mode-controls' });
		const exitButton = controls.createEl('button', {
			cls: 'cinema-mode-button',
			text: 'Exit Cinema Mode'
		});
		exitButton.addEventListener('click', () => this.exitCinemaMode());

		// Add keyboard shortcut for exit
		const escHandler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') this.exitCinemaMode();
		};
		document.addEventListener('keydown', escHandler);
	}

	private exitCinemaMode() {
		if (!this.isInCinemaMode || !this.cinemaContainer) return;
		this.cinemaContainer.remove();
		this.cinemaContainer = undefined;
		this.isInCinemaMode = false;
	}
}
