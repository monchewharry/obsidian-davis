import { CustomViewTypes } from "@/types/viewType";
import { MyItemView } from "@/lib/myItemView";
import { TFile, WorkspaceLeaf, parseYaml } from "obsidian";
import MyPlugin from "@/main";

export class YoutubeShortView extends MyItemView {
	private shortContainerEl?: HTMLElement;
	private plugin: MyPlugin;
	private readonly SHORTS_FILE_PATH = "private/twitter/video-archive/YoutubeShorts.md";

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf, CustomViewTypes.YOUTUBE_SHORT_VIEW_TYPE, "youtube-short", "YouTube Shorts");
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
		this.shortContainerEl = containerEl.createDiv({ cls: "youtube-shorts-container" });

		// Load and display shorts
		await this.loadShorts();
	}

	private addStyles() {
		const styleEl = document.createElement('style');
		styleEl.textContent = `
            .youtube-shorts-container {
                padding: 16px;
                height: 100%;
                overflow-y: auto;
                background: var(--background-primary);
                display: flex;
                flex-direction: column;
                gap: 48px;
            }
            .youtube-shorts-category {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .youtube-shorts-category-title {
                font-size: 24px;
                font-weight: 600;
                color: var(--text-normal);
                padding-bottom: 8px;
                border-bottom: 2px solid var(--background-modifier-border);
            }
            .youtube-shorts-grid {
                display: flex;
                flex-direction: row;
                gap: 16px;
                overflow-x: auto;
                padding-bottom: 8px;
            }
            .youtube-shorts-grid::-webkit-scrollbar {
                height: 8px;
            }
            .youtube-shorts-grid::-webkit-scrollbar-track {
                background: var(--background-modifier-border);
                border-radius: 4px;
            }
            .youtube-shorts-grid::-webkit-scrollbar-thumb {
                background: var(--text-muted);
                border-radius: 4px;
            }
            .youtube-short-item {
                background: var(--background-secondary);
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                height: calc(100vh - 200px);
                min-width: 340px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                flex-shrink: 0;
            }
            .youtube-short-wrapper {
                position: relative;
                flex: 1;
                background: black;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
                aspect-ratio: 9/16;
            }
            .youtube-short-iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            .youtube-short-info {
                padding: 12px;
                background: var(--background-secondary);
            }
            .youtube-short-title {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
                color: var(--text-normal);
            }
            .youtube-short-meta {
                font-size: 12px;
                color: var(--text-muted);
            }
            .youtube-short-meta a {
                color: var(--text-accent);
                text-decoration: none;
                transition: color 0.2s ease;
            }
            .youtube-short-meta a:hover {
                color: var(--text-accent-hover);
                text-decoration: underline;
            }
        `;
		document.head.appendChild(styleEl);
	}

	private async loadShorts() {
		if (!this.shortContainerEl) return;

		// Clear existing content
		this.shortContainerEl.empty();

		try {
			const shortsFile = this.app.vault.getAbstractFileByPath(this.SHORTS_FILE_PATH);

			if (!shortsFile || !(shortsFile instanceof TFile)) {
				this.shortContainerEl.createEl("p", {
					text: "YouTube Shorts file not found at " + this.SHORTS_FILE_PATH
				});
				return;
			}

			const content = await this.app.vault.read(shortsFile);
			const frontmatter = this.extractFrontmatter(content);

			if (!frontmatter || !frontmatter.shortsURL || !Array.isArray(frontmatter.shortsURL)) {
				this.shortContainerEl.createEl("p", {
					text: "No shorts URLs found in frontmatter"
				});
				return;
			}

			frontmatter.shortsURL.forEach((category: any) => {
				const [categoryName, urls] = Object.entries(category)[0];
				
				const categoryContainer = this.shortContainerEl!.createDiv({ cls: "youtube-shorts-category" });
				categoryContainer.createEl("h2", {
					cls: "youtube-shorts-category-title",
					text: this.formatCategoryName(categoryName)
				});

				const shortsGrid = categoryContainer.createDiv({ cls: "youtube-shorts-grid" });

				if (Array.isArray(urls)) {
					urls.forEach((url: string, index: number) => {
				const videoId = this.extractVideoId(url);
				if (!videoId) return;

				const shortItem = shortsGrid.createDiv({ cls: "youtube-short-item" });

				const wrapper = shortItem.createDiv({ cls: "youtube-short-wrapper" });
				const iframe = wrapper.createEl("iframe", {
					cls: "youtube-short-iframe",
					attr: {
						src: `https://www.youtube.com/embed/${videoId}?rel=0`,
						allowfullscreen: "",
						allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					}
				});

				const info = shortItem.createDiv({ cls: "youtube-short-info" });
				info.createEl("div", {
					cls: "youtube-short-title",
					text: `Short #${index + 1}`
				});
				const metaDiv = info.createEl("div", { cls: "youtube-short-meta" });
				metaDiv.createEl("a", {
					text: url,
					href: url,
					attr: {
						target: "_blank",
						rel: "noopener"
					}
				});
					});
				}
			});

		} catch (error) {
			console.error("Error loading shorts:", error);
			this.shortContainerEl.createEl("p", {
				text: "Error loading shorts: " + error.message
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
		// Convert names like 'star1' to 'Star 1'
		return name
			.replace(/([A-Z])/g, ' $1') // Add space before capital letters
			.replace(/([0-9])/g, ' $1') // Add space before numbers
			.replace(/^./, str => str.toUpperCase()) // Capitalize first letter
			.trim();
	}

	private extractVideoId(url: string): string | null {
		const patterns = [
			/youtube\.com\/shorts\/([^?&]+)/i,
			/youtu\.be\/([^?&]+)/i,
			/youtube\.com\/watch\?v=([^&]+)/i
		];

		for (const pattern of patterns) {
			const match = url.match(pattern);
			if (match && match[1]) {
				return match[1];
			}
		}

		return null;
	}
}
