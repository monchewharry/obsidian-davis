import { MyItemView } from "@/lib/myItemView";
import { CustomViewTypes } from "@/types/viewType";
import { WorkspaceLeaf, Menu, Notice, TFile } from "obsidian";
import MyPlugin from "@/main";
import { TranscriptBlock, TranscriptResponse } from "@/types/ytTranscrpt";
import { formatTimestamp, getTranscriptBlocks, highlightText, YoutubeTranscript, YoutubeTranscriptError } from "@/lib/utils/ytTranscript";
export class TranscriptView extends MyItemView {
	private url: string;
	isDataLoaded: boolean;
	plugin: MyPlugin;

	loaderContainerEl?: HTMLElement;
	dataContainerEl?: HTMLElement;
	errorContainerEl?: HTMLElement;

	videoTitle?: string;
	videoData?: TranscriptResponse[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf, CustomViewTypes.TRANSCRIPT_TYPE_VIEW, "scroll", "YouTube Transcript");
		this.plugin = plugin;
		this.isDataLoaded = false;
	}

	private formatTranscriptForExport(data: TranscriptResponse): string {
		// Join all lines with proper spacing and formatting
		return data.lines
			.map(line => line.text.trim())
			.join(' ')
			// Remove multiple spaces
			.replace(/\s+/g, ' ')
			// Add paragraph breaks at natural sentence endings
			.replace(/([.!?])\s/g, '$1\n\n')
			.trim();
	}

	private async exportToNewFile() {
		if (!this.videoData || !this.videoData.length) {
			new Notice('No transcript data available to export.');
			return;
		}

		const data = this.videoData[0]; // Get the first transcript
		const formattedText = this.formatTranscriptForExport(data);

		// Create a sanitized filename from the video title
		const sanitizedTitle = (this.videoTitle || 'YouTube Transcript')
			.replace(/[^a-zA-Z0-9]/g, ' ') // Replace non-alphanumeric chars with space
			.replace(/\s+/g, ' ')        // Replace multiple spaces with single space
			.trim()
			.replace(/\s/g, '-')        // Replace spaces with hyphens
			.toLowerCase();

		// Create the file content with YAML frontmatter
		const timestamp = new Date().toISOString().split('T')[0];
		const exportContent = [
			'---',
			'ytURL: ' + this.url,
			'title: ' + (this.videoTitle || 'YouTube Transcript'),
			'date: ' + timestamp,
			'type: youtube-transcript',
			'---',
			'',
			`![](${this.url})`,
			formattedText,
		].join('\n');

		try {
			// Create unique filename
			let filename = `${sanitizedTitle}.md`;
			let number = 1;

			// Check if file exists and increment number until we find a unique name
			while (await this.app.vault.adapter.exists(filename)) {
				filename = `${sanitizedTitle}-${number}.md`;
				number++;
			}

			// Create the file in the vault root
			await this.app.vault.create(filename, exportContent);

			// Open the newly created file
			const file = this.app.vault.getAbstractFileByPath(filename);
			if (file instanceof TFile) {
				await this.app.workspace.getLeaf().openFile(file);
			}

			new Notice(`Transcript exported to ${filename}`);
		} catch (error) {
			console.error('Failed to export transcript:', error);
			new Notice('Failed to export transcript. Check console for details.');
		}
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Create header container
		const headerContainer = contentEl.createEl('div', { cls: 'transcript-header' });

		// Add title and export button in the same row
		const titleRow = headerContainer.createEl('div', { cls: 'transcript-title-row' });
		titleRow.createEl('h4', { text: 'Transcript', cls: 'transcript-title' });

		const exportButton = titleRow.createEl('button', {
			text: 'Export to Note',
			cls: 'transcript-export-button'
		});
		exportButton.addEventListener('click', () => this.exportToNewFile());

		// Add styles
		const style = document.createElement('style');
		style.textContent = `
			.transcript-header { margin-bottom: 20px; }
			.transcript-title-row { 
				display: flex; 
				justify-content: space-between; 
				align-items: center;
				margin-bottom: 10px;
			}
			.transcript-title { margin: 0; }
			.transcript-export-button {
				padding: 4px 8px;
				border-radius: 4px;
				cursor: pointer;
			}
			.yt-transcript__transcript-block {
				margin-bottom: 16px;
				line-height: 1.5;
			}
			.yt-transcript__transcript-block span {
				margin-left: 8px;
			}
		`;
		document.head.appendChild(style);
	}

	async onClose() {
		const leafIndex = this.getLeafIndex();
		this.plugin.settings.leafUrls.splice(leafIndex, 1);
	}

	/**
	 * Gets the leaf index out of all of the open leaves
	 * This assumes that the leaf order shouldn't changed, which is a fair assumption
	 */
	private getLeafIndex(): number {
		const leaves = this.app.workspace.getLeavesOfType(CustomViewTypes.TRANSCRIPT_TYPE_VIEW);
		return leaves.findIndex((leaf) => leaf === this.leaf);
	}

	/**
	 * Adds a div with loading text to the view content
	 */
	private renderLoader() {
		if (this.loaderContainerEl !== undefined) {
			this.loaderContainerEl.createEl("div", {
				text: "Loading...",
			});
		}
	}

	/**
	 * Adds a text input to the view content
	 */
	private renderSearchInput(
		url: string,
		data: TranscriptResponse,
		timestampMod: number,
	) {
		const searchInputEl = this.contentEl.createEl("input");
		searchInputEl.type = "text";
		searchInputEl.placeholder = "Search...";
		searchInputEl.style.marginBottom = "20px";
		searchInputEl.addEventListener("input", (e) => {
			const searchFilter = (e.target as HTMLInputElement).value;
			this.renderTranscriptionBlocks(
				url,
				data,
				timestampMod,
				searchFilter,
			);
		});
	}

	/**
	 * Adds a div with the video title to the view content
	 * @param title - the title of the video
	 */
	private renderVideoTitle(title: string) {
		const titleEl = this.contentEl.createEl("div");
		titleEl.innerHTML = title;
		titleEl.style.fontWeight = "bold";
		titleEl.style.marginBottom = "20px";
	}

	private formatContentToPaste(url: string, blocks: TranscriptBlock[]) {
		return blocks
			.map((block) => {
				const { quote, quoteTimeOffset } = block;
				const href = url + "&t=" + Math.floor(quoteTimeOffset / 1000);
				const formattedBlock = `[${formatTimestamp(
					quoteTimeOffset,
				)}](${href}) ${quote}`;

				return formattedBlock;
			})
			.join("\n");
	}

	/**
	 * Add a transcription blocks to the view content
	 * @param url - the url of the video
	 * @param data - the transcript data
	 * @param timestampMod - the number of seconds between each timestamp
	 * @param searchValue - the value to search for in the transcript
	 */
	private renderTranscriptionBlocks(
		url: string,
		data: TranscriptResponse,
		timestampMod: number,
		searchValue: string,
	) {
		const dataContainerEl = this.dataContainerEl;
		if (dataContainerEl !== undefined) {
			//Clear old data before rerendering
			dataContainerEl.empty();

			// TODO implement drag and drop
			// const handleDrag = (quote: string) => {
			// 	return (event: DragEvent) => {
			// 		event.dataTransfer?.setData("text/plain", quote);
			// 	};
			// };

			const transcriptBlocks = getTranscriptBlocks(
				data.lines,
				timestampMod,
			);

			//Filter transcript blocks based on
			const filteredBlocks = transcriptBlocks.filter((block) =>
				block.quote.toLowerCase().includes(searchValue.toLowerCase()),
			);

			filteredBlocks.forEach((block) => {
				const { quote, quoteTimeOffset } = block;
				const blockContainerEl = createEl("div", {
					cls: "yt-transcript__transcript-block",
				});
				blockContainerEl.draggable = true;

				const linkEl = createEl("a", {
					text: formatTimestamp(quoteTimeOffset),
					attr: {
						href: url + "&t=" + Math.floor(quoteTimeOffset / 1000),
					},
				});
				linkEl.style.marginBottom = "5px";

				const span = dataContainerEl.createEl("span", {
					text: quote,
					title: "Click to copy",
				});

				span.addEventListener("click", (event) => {
					const target = event.target as HTMLElement;
					if (target !== null) {
						navigator.clipboard.writeText(target.textContent ?? "");
					}
				});

				//Highlight any match search terms
				if (searchValue !== "") highlightText(span, searchValue);

				// TODO implement drag and drop
				// span.setAttr("draggable", "true");
				// span.addEventListener("dragstart", handleDrag(quote));

				blockContainerEl.appendChild(linkEl);
				blockContainerEl.appendChild(span);
				blockContainerEl.addEventListener(
					"dragstart",
					(event: DragEvent) => {
						event.dataTransfer?.setData(
							"text/html",
							blockContainerEl.innerHTML,
						);
					},
				);

				blockContainerEl.addEventListener(
					"contextmenu",
					(event: MouseEvent) => {
						const menu = new Menu();
						menu.addItem((item) =>
							item.setTitle("Copy all").onClick(() => {
								navigator.clipboard.writeText(
									this.formatContentToPaste(
										url,
										filteredBlocks,
									),
								);
							}),
						);
						menu.showAtPosition({
							x: event.clientX,
							y: event.clientY,
						});
					},
				);

				dataContainerEl.appendChild(blockContainerEl);
			});
		}
	}

	/**
	 * Sets the state of the view
	 * This is called when the view is loaded
	 */
	async setEphemeralState(state: unknown): Promise<void> {
		// Type guard to ensure state has url property
		if (!state || typeof state !== 'object' || !('url' in state)) {
			return;
		}
		const urlState = state as { url: string };
		this.url = urlState.url;
		//If we switch to another view and then switch back, we don't want to reload the data
		if (this.isDataLoaded) return;

		const leafIndex = this.getLeafIndex();

		//The state.url is not null when we call setEphermeralState from the command
		//in this case, we will save the url to the settings for future look up
		if (urlState.url) {
			this.plugin.settings.leafUrls[leafIndex] = urlState.url;
			await this.plugin.saveSettings();
		}

		const { lang, country, timestampMod, leafUrls } = this.plugin.settings;
		const url = leafUrls[leafIndex];

		try {
			//If it's the first time loading the view, initialize our containers
			//otherwise, clear the existing data for rerender
			if (this.loaderContainerEl === undefined) {
				this.loaderContainerEl = this.contentEl.createEl("div");
			} else {
				this.loaderContainerEl.empty();
			}

			//Clear all containers for rerender and render loader
			this.renderLoader();

			//Get the youtube video title and transcript at the same time
			const data = await YoutubeTranscript.fetchTranscript(url, {
				lang,
				country,
			});

			if (!data) throw Error();

			this.isDataLoaded = true;
			this.loaderContainerEl.empty();

			// Store the data for export functionality
			this.videoData = [data];
			this.videoTitle = data.title;

			this.renderVideoTitle(data.title);
			this.renderSearchInput(url, data, timestampMod);

			if (this.dataContainerEl === undefined) {
				this.dataContainerEl = this.contentEl.createEl("div");
			} else {
				this.dataContainerEl.empty();
			}

			//If there was already an error clear it
			if (this.errorContainerEl !== undefined) {
				this.errorContainerEl.empty();
			}

			if (data.lines.length === 0) {
				this.dataContainerEl.createEl("h4", {
					text: "No transcript found",
				});
				this.dataContainerEl.createEl("div", {
					text: "Please check if video contains any transcript or try adjust language and country in plugin settings.",
				});
			} else {
				this.renderTranscriptionBlocks(url, data, timestampMod, "");
			}
		} catch (err: unknown) {
			let errorMessage = "";
			if (err instanceof YoutubeTranscriptError) {
				errorMessage = err.message;
			}

			this.loaderContainerEl?.empty();

			if (this.errorContainerEl === undefined) {
				this.errorContainerEl = this.contentEl.createEl("h5");
			} else {
				this.errorContainerEl.empty();
			}
			const titleEl = this.errorContainerEl.createEl("div", {
				text: "Error loading transcript",
			});
			titleEl.style.marginBottom = "5px";

			const messageEl = this.errorContainerEl.createEl("div", {
				text: errorMessage,
			});
			messageEl.style.color = "var(--text-muted)";
			messageEl.style.fontSize = "var(--font-ui-small)";
		}
	}
}