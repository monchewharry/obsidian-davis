import { CustomViewTypes } from "@/types/viewType";
import { MyItemView } from "@/lib/myItemView";
import { TFile, WorkspaceLeaf } from "obsidian";
import MyPlugin from "@/main";

export class VideoView extends MyItemView {
    private videoContainerEl?: HTMLElement;
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
