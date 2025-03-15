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

        // Create main container
        this.videoContainerEl = containerEl.createDiv({ cls: "video-archive-container" });
        
        // Add styles
        this.addStyles();
        
        // Load and display videos
        await this.loadVideos();
    }

    private addStyles() {
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .video-archive-container {
                padding: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }
            .video-item {
                background: var(--background-secondary);
                border-radius: 8px;
                overflow: hidden;
                transition: transform 0.2s;
            }
            .video-item:hover {
                transform: translateY(-2px);
            }
            .video-item {
                display: flex;
                flex-direction: column;
            }
            .video-wrapper {
                position: relative;
                width: 100%;
                background: var(--background-primary);
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 150px;
            }
            .video-item video {
                max-width: 100%;
                max-height: 400px;
                width: auto;
                height: auto;
            }
            .video-info {
                padding: 10px;
            }
            .video-title {
                font-size: 14px;
                margin-bottom: 5px;
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

        // Add load event listener to handle video dimensions
        videoEl.addEventListener('loadedmetadata', () => {
            const aspectRatio = videoEl.videoWidth / videoEl.videoHeight;
            
            // If video is wider than tall, constrain by width
            if (aspectRatio > 1) {
                videoEl.style.width = '100%';
                videoEl.style.height = 'auto';
            } 
            // If video is taller than wide, constrain by height
            else {
                videoEl.style.width = 'auto';
                videoEl.style.height = '400px';
            }
        });

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
