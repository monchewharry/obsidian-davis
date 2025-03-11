import { BuiltInLeafTypes, CustomViewTypes } from "@/types/definitions";
import {
	findRelatedNotes,
	getDataOfLeaf,
	getMetadata,
} from "@/lib/utils";
import { App, Editor, MarkdownView, View, WorkspaceLeaf, debounce } from "obsidian";
import { MyItemView } from "@/lib/myItemView";
import { LeafStatDisplay } from "./LeafStatDisplay";


export class NoteInfoView extends MyItemView {
	// Track the last active markdown view
	private lastActiveMarkdownView: MarkdownView | null = null;

	private updateLastActiveMarkdownView(view: View | null) {
		if (view instanceof MarkdownView) {
			this.lastActiveMarkdownView = view;
		}
	}
	private selectedText: string = "";
	private currentParagraph: string = "";
	private currentPage: number = 1;
	private itemsPerPage: number = 5;
	private showingAll: boolean = false;
	private currentLeafType: BuiltInLeafTypes = BuiltInLeafTypes.Markdown;
	private isUpdating: boolean = false;

	private updateCaretParagraph(editor: Editor) {
		const cursor = editor.getCursor();
		const doc = editor.getValue();
		const paragraphs = doc.split("\n\n");
		let currentPos = 0;

		for (const paragraph of paragraphs) {
			const paragraphLength = paragraph.length + 2; // +2 for '\n\n'
			if (
				currentPos <= editor.posToOffset(cursor) &&
				editor.posToOffset(cursor) <= currentPos + paragraphLength
			) {
				this.currentParagraph = paragraph;
				break;
			}
			currentPos += paragraphLength;
		}
		const paragraphSection = this.contentEl.querySelector('.caret-paragraph-section');
		if (paragraphSection) {
			const paragraphText = paragraphSection.querySelector('p');
			if (paragraphText) {
				paragraphText.setText(this.currentParagraph);
			}
		}
	}
	private updateSelection(editor: Editor) {
		const selection = editor.getSelection();
		this.selectedText = selection;
		const selectionSection = this.contentEl.querySelector('.selection-section');
		if (selectionSection) {
			const selectionText = selectionSection.querySelector('p');
			if (selectionText) {
				selectionText.setText(this.selectedText);
			}
		}
	}
	private updateCaretPosition = (editor: Editor) => {
		const cursor = editor.getCursor();
		const positionSection = this.contentEl.querySelector('.cursor-position-section');
		if (positionSection) {
			const posText = positionSection.querySelector('p');
			if (posText) {
				posText.setText(`Line: ${cursor.line + 1}, Column: ${cursor.ch + 1}`);
			}
		}
	};


	constructor(leaf: WorkspaceLeaf) {
		super(leaf, CustomViewTypes.CONSOLE_VIEW_TYPE, "qr-code", "Note Info");

		// register view's workspace-events-based updates
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", async (leaf) => {
				this.updateLastActiveMarkdownView(leaf?.view ?? null);
				await this.updateView();
			})
		);

		// Update cursor position when text cursor changes, more live than editor-change
		this.registerDomEvent(document, 'selectionchange', () => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				debounce(() => {
					this.updateCaretPosition(activeView.editor);
					this.updateCaretParagraph(activeView.editor);
					this.updateSelection(activeView.editor);
				}, 100, true)();
			}
		});
	}

	async onOpen(): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		this.updateLastActiveMarkdownView(activeView);
		await this.updateView();
	}

	private resetPaginationState() {
		this.currentPage = 1;
		this.showingAll = false;
	}

	private async updateView(resetState: boolean = true, animate: boolean = false) {
		// Only reset pagination state when explicitly requested (e.g., when switching notes)
		if (resetState) {
			this.resetPaginationState();
		}

		// Store the existing content element if we're animating
		const existingContent = animate ? this.contentEl.children[0] as HTMLElement : null;
		if (existingContent) {
			existingContent.style.opacity = '0';
			await new Promise(resolve => setTimeout(resolve, 150));
		}

		this.contentEl.empty();

		// Create main container
		const mainContainer = this.contentEl.createDiv({
			cls: "note-info-section",
		});

		// Create header with title and dropdown - Always visible
		const headerDiv = mainContainer.createDiv({ cls: "leaf-section-header" });
		headerDiv.createEl("span", { text: "View Type:", cls: "leaf-section-title" });
		const select = headerDiv.createEl("select", {
			cls: "leaf-type-select",
			attr: {
				"aria-label": "Select view type"
			}
		});

		// Group leaf types by category
		const leafGroups = {
			'Content': [BuiltInLeafTypes.Markdown, BuiltInLeafTypes.Webviewer],
			'Navigation': [BuiltInLeafTypes.FileExplorer, BuiltInLeafTypes.Search, BuiltInLeafTypes.Bookmarks, BuiltInLeafTypes.Tag],
			'References': [BuiltInLeafTypes.Backlink, BuiltInLeafTypes.Outgoing, BuiltInLeafTypes.Outline]
		};

		// Add options grouped by category
		Object.entries(leafGroups).forEach(([category, types]) => {
			const group = select.createEl("optgroup", { attr: { label: category } });
			types.forEach(type => {
				const option = group.createEl("option", {
					value: type,
					text: type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ')
				});
				if (type === this.currentLeafType) {
					option.selected = true;
				}
			});
		});

		// Create content section for leaves data with initial opacity
		const contentSection = mainContainer.createDiv({ cls: "leaf-content-section" });
		contentSection.style.opacity = animate ? "0" : "1";
		if (animate) {
			// Use requestAnimationFrame to ensure the opacity transition works
			requestAnimationFrame(() => {
				contentSection.style.opacity = "1";
			});
		}

		// Add change listener with improved fade animation
		select.addEventListener("change", async (e) => {
			// Prevent multiple simultaneous updates
			if (this.isUpdating) return;
			this.isUpdating = true;

			try {
				// Update content with animation
				this.currentLeafType = (e.target as HTMLSelectElement).value as BuiltInLeafTypes;
				await this.updateView(false, true);
			} finally {
				this.isUpdating = false;
			}
		});

		// Get and display leaves data
		const leavesData = getDataOfLeaf(this.currentLeafType, this.app.workspace);

		if (leavesData.length === 0) {
			const emptyState = contentSection.createDiv({ cls: "empty-state" });
			// Get a descriptive message based on the leaf type
			const getEmptyStateMessage = (type: BuiltInLeafTypes): { title: string; hint: string } => {
				const displayName = type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
				switch (type) {
					case BuiltInLeafTypes.Markdown:
						return {
							title: 'No Markdown documents are open',
							hint: 'Open a markdown file to see its details and metadata'
						};
					case BuiltInLeafTypes.FileExplorer:
						return {
							title: 'No File Explorer is open',
							hint: 'Open the file explorer to browse your vault contents'
						};
					case BuiltInLeafTypes.Search:
						return {
							title: 'No Search panel is open',
							hint: 'Open the search panel to find content across your vault'
						};
					case BuiltInLeafTypes.Backlink:
						return {
							title: 'No Backlinks panel is open',
							hint: 'Open the backlinks panel to see references to the current note'
						};
					case BuiltInLeafTypes.Outgoing:
						return {
							title: 'No Outgoing Links panel is open',
							hint: 'Open the outgoing links panel to see links from the current note'
						};
					case BuiltInLeafTypes.Outline:
						return {
							title: 'No Outline panel is open',
							hint: 'Open the outline panel to see the structure of your note'
						};
					case BuiltInLeafTypes.Tag:
						return {
							title: 'No Tag panel is open',
							hint: 'Open the tag panel to browse notes by tags'
						};
					case BuiltInLeafTypes.Bookmarks:
						return {
							title: 'No Bookmarks panel is open',
							hint: 'Open the bookmarks panel to access your saved notes'
						};
					case BuiltInLeafTypes.Webviewer:
						return {
							title: 'No Web Viewer is open',
							hint: 'Open a web viewer to browse web content within Obsidian'
						};
					default:
						return {
							title: `No ${displayName} leaves are currently open`,
							hint: `Open a ${displayName.toLowerCase()} leaf to see its details here`
						};
				}
			};

			const message = getEmptyStateMessage(this.currentLeafType);
			emptyState.createEl("p", {
				text: message.title,
				cls: "empty-state-text"
			});
			emptyState.createEl("p", {
				text: message.hint,
				cls: "empty-state-hint"
			});
		} else {
			const leafDisplay = new LeafStatDisplay(contentSection, leavesData);
			leafDisplay.render();
		}

		// display a divider here
		this.contentEl.createEl("hr");
		const { cursor, frontmatter, relatedNotes } =
			await this.getDataOfActiveMarkdownView(this.app);

		// Frontmatter section
		const frontmatterSection = this.contentEl.createDiv({
			cls: "note-info-section",
		});
		const frontmatterHeader = frontmatterSection.createEl("div", {
			cls: "leaf-header",
		});
		frontmatterHeader.createEl("span", {
			text: "Frontmatter",
			cls: "leaf-title",
		});
		const frontmatterContent = frontmatterSection.createEl("div", {
			cls: "leaf-content",
		});

		if (frontmatter && Object.keys(frontmatter).length > 0) {
			const list = frontmatterContent.createEl("ul", {
				cls: "leaf-section",
			});
			Object.entries(frontmatter).forEach(([key, value]) => {
				list.createEl("li", {
					text: `${key}: ${typeof value === "object"
						? JSON.stringify(value)
						: value
						}`,
					cls: "frontmatter-item",
				});
			});
		} else {
			frontmatterContent.createEl("p", { text: "No frontmatter found" });
		}

		// Add mousedown handler for frontmatter
		frontmatterHeader.addEventListener("mousedown", (e) => {
			e.preventDefault(); // Prevent focus change
			const isCollapsed = frontmatterContent.hasClass("collapsed");
			frontmatterContent.toggleClass("collapsed", !isCollapsed);
			frontmatterHeader.toggleClass("collapsed", !isCollapsed);
		});

		// Related notes section
		const relatedSection = this.contentEl.createDiv({
			cls: "note-info-section",
		});
		const relatedHeader = relatedSection.createEl("div", {
			cls: "leaf-header",
		});
		relatedHeader.createEl("span", {
			text: "Related Notes",
			cls: "leaf-title",
		});
		const relatedContent = relatedSection.createEl("div", {
			cls: "leaf-content",
		});

		if (relatedNotes.length > 0) {
			const list = relatedContent.createEl("ul", { cls: "leaf-section" });

			// Calculate pagination
			const totalPages = Math.ceil(
				relatedNotes.length / this.itemsPerPage
			);
			const startIndex = this.showingAll
				? 0
				: (this.currentPage - 1) * this.itemsPerPage;
			const endIndex = this.showingAll
				? relatedNotes.length
				: Math.min(startIndex + this.itemsPerPage, relatedNotes.length);

			// Display current page items with animation classes
			const items = relatedNotes.slice(startIndex, endIndex);
			items.forEach(({ file, matchCount }, index) => {
				const li = list.createEl("li", {
					cls: `related-note-item${this.showingAll ? " showing-all" : ""
						}`,
					attr: { style: `animation-delay: ${index * 30}ms` },
				});
				li.createEl("a", {
					text: `${file.basename} (${matchCount} matches)`,
					href: "#",
					cls: "related-note-link",
				}).addEventListener("mousedown", (e) => {
					e.preventDefault(); // Prevent focus change
					this.app.workspace.getLeaf().openFile(file);
				});
			});

			// Add pagination controls if there are multiple pages
			if (totalPages > 1) {
				const paginationDiv = relatedContent.createEl("div", {
					cls: "pagination",
				});

				if (!this.showingAll) {
					// Previous button
					const prevButton = paginationDiv.createEl("button", {
						text: "←",
						cls: "pagination-button",
						attr: { "aria-label": "Previous page" },
					});
					prevButton.disabled = this.currentPage === 1;
					prevButton.addEventListener("mousedown", (e) => {
						e.preventDefault(); // Prevent focus change
						if (this.currentPage > 1) {
							this.currentPage--;
							this.updateView(false); // Don't reset state when paginating
						}
					});

					// Page info with total count
					paginationDiv.createEl("span", {
						text: `${this.currentPage} / ${totalPages} (${relatedNotes.length} notes)`,
						cls: "pagination-info",
					});

					// Next button
					const nextButton = paginationDiv.createEl("button", {
						text: "→",
						cls: "pagination-button",
						attr: { "aria-label": "Next page" },
					});
					nextButton.disabled = this.currentPage === totalPages;
					nextButton.addEventListener("mousedown", (e) => {
						e.preventDefault(); // Prevent focus change
						if (this.currentPage < totalPages) {
							this.currentPage++;
							this.updateView(false); // Don't reset state when paginating
						}
					});
				}

				// Toggle button
				const toggleButton = paginationDiv.createEl("button", {
					text: this.showingAll ? "Show Less" : "Show All",
					cls: "pagination-button toggle-all",
					attr: {
						"aria-label": this.showingAll
							? "Show less notes"
							: "Show all notes",
					},
				});
				toggleButton.addEventListener("mousedown", (e) => {
					e.preventDefault(); // Prevent focus change
					this.showingAll = !this.showingAll;
					this.updateView(false); // Don't reset state when toggling
				});
			}
		} else {
			relatedContent.createEl("p", { text: "No related notes found" });
		}

		// Add click handler for related notes
		relatedHeader.addEventListener("click", () => {
			const isCollapsed = relatedContent.hasClass("collapsed");
			relatedContent.toggleClass("collapsed", !isCollapsed);
			relatedHeader.toggleClass("collapsed", !isCollapsed);
		});

		// Start both sections expanded if they have content
		if (!Object.keys(frontmatter).length) {
			frontmatterContent.addClass("collapsed");
			frontmatterHeader.addClass("collapsed");
		}
		if (!relatedNotes.length) {
			relatedContent.addClass("collapsed");
			relatedHeader.addClass("collapsed");
		}

		// Current paragraph section
		const paragraphSection = this.contentEl.createDiv({
			cls: "note-info-section",
		});
		paragraphSection.addClass('caret-paragraph-section');
		paragraphSection.createEl("h3", { text: "Current Paragraph" });
		if (this.currentParagraph) {
			paragraphSection.createEl("p", { text: this.currentParagraph });
		} else {
			paragraphSection.createEl("p", { text: "No paragraph selected" });
		}

		// Cursor position section
		const positionSection = this.contentEl.createDiv({
			cls: "note-info-section",
		});
		const [line, column] = cursor
			? [cursor.line + 1, cursor.ch + 1]
			: [0, 0];
		positionSection.addClass('cursor-position-section');
		positionSection.createEl("h3", { text: "Cursor Position" });
		positionSection.createEl("p", {
			text: `Line: ${line}, Column: ${column}`,
		});

		// Cursor position section
		const selectionSection = this.contentEl.createDiv({
			cls: "note-info-section",
		});
		selectionSection.addClass('selection-section');
		selectionSection.createEl("h3", { text: "Selected Text" });
		selectionSection.createEl("p", {
			text: this.selectedText,
		});
	}

	private async getDataOfActiveMarkdownView(app: App) {
		// Try to get the current active markdown view first
		const activeView = app.workspace.getActiveViewOfType(MarkdownView);

		// If no active markdown view, use the last active one
		const view = activeView || this.lastActiveMarkdownView;

		// Get data from the view
		const cursor = view?.editor.getCursor();
		const activeFile = view?.file;
		const frontmatter = activeFile ? await getMetadata(activeFile, app) : {};
		const relatedNotes = activeFile
			? await findRelatedNotes(app, activeFile, [{ type: 'tags' }], frontmatter)
			: [];

		return {
			cursor,
			frontmatter,
			relatedNotes,
		};
	}

	async onClose() {
		// Clean up any event listeners
		this.contentEl.empty();
	}
}
