import { CustomViewTypes } from "@/types/viewType";
import { MyItemView } from "@/lib/myItemView";
import { TFile, WorkspaceLeaf, parseYaml } from "obsidian";
import MyPlugin from "@/main";

export class BilibiliView extends MyItemView {
	private videoContainerEl?: HTMLElement;
	private plugin: MyPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf, CustomViewTypes.BILIBILI_VIEW_TYPE, "bilibili", "Bilibili Videos");
		this.plugin = plugin;
	}

	videosFilePath(): string {
		return "private/twitter/video-archive/bilibili.md";
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

		try {
			const file = this.app.vault.getAbstractFileByPath(this.videosFilePath());
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

						// Parse the iframe HTML to extract src and other attributes
						const tempDiv = document.createElement('div');
						tempDiv.innerHTML = iframeHtml;
						const iframeEl = tempDiv.querySelector('iframe');

						if (iframeEl) {
							const src = iframeEl.getAttribute('src');
							wrapper.createEl("iframe", {
								attr: {
									src: 'https:' + src,
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
							const videoId = this.extractVideoId(src || "");
							if (videoId) {
								metaDiv.createEl("a", {
									text: `BV${videoId}`,
									href: `https://www.bilibili.com/video/BV${videoId}`,
									attr: {
										target: "_blank",
										rel: "noopener"
									}
								});
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
		const bvidMatch = url.match(/bvid=([^&]+)/i);
		if (bvidMatch && bvidMatch[1]) {
			return bvidMatch[1].replace(/^BV/, '');
		}
		return null;
	}
}
