import { CustomViewTypes } from "@/types/definitions";
import html2pdf from "html2pdf.js";
import { ButtonComponent, WorkspaceLeaf } from "obsidian";
import { MyItemView } from "@/lib/myItemView";

export const RESUME_VIEW_TYPE = "resume-preview";

export class ResumeView extends MyItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(
			leaf,
			CustomViewTypes.RESUME_VIEW_TYPE,
			"file-user",
			"Resume Preview"
		);
	}

	private exportButton: ButtonComponent;

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();

		// Create toolbar
		const toolbar = container.createEl("div", {
			cls: "resume-toolbar",
			attr: {
				style: "padding: 8px; border-bottom: 1px solid var(--background-modifier-border); display: flex; justify-content: space-between; align-items: center;",
			},
		});

		// Add status text container
		const statusContainer = toolbar.createEl("div", {
			cls: "status-text",
			attr: { style: "color: var(--text-muted); font-size: 0.8em;" },
		});

		// Add export PDF button
		this.exportButton = new ButtonComponent(toolbar)
			.setButtonText("Export PDF")
			.setClass("mod-cta")
			.onClick(async () => {
				try {
					await this.exportPDF();
					statusContainer.setText("PDF exported successfully!");
					setTimeout(() => statusContainer.empty(), 3000);
				} catch (error) {
					statusContainer.setText(`Error: ${error.message}`);
					setTimeout(() => statusContainer.empty(), 5000);
				}
			});

		// Create iframe for resume preview
		container.createEl("iframe", {
			attr: {
				style: "width: 100%; height: calc(100% - 45px); border: none;",
				srcdoc: this.getContent(),
			},
		});
	}

	private async exportPDF() {
		const iframe = this.containerEl.querySelector("iframe");
		if (!iframe) throw new Error("Preview not ready");

		// Get the iframe document
		const iframeDoc = iframe.contentDocument;
		if (!iframeDoc) throw new Error("Could not access iframe content");

		// Update button state
		this.exportButton.setButtonText("Preparing...").setDisabled(true);

		try {
			// Get the HTML content of the iframe
			const htmlContent = iframeDoc.documentElement;

			// Use html2pdf to generate the PDF
			const opt = {
				margin: 1,
				filename: "resume.pdf",
				image: { type: "jpeg", quality: 0.98 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: {
					unit: "in",
					format: "letter",
					orientation: "portrait",
				},
			};

			await html2pdf().from(htmlContent).set(opt).save();

			// Update button text
			this.exportButton.setButtonText("Export PDF").setDisabled(false);
		} catch (error) {
			// Handle error
			this.exportButton.setButtonText("Export PDF").setDisabled(false);
			throw error;
		} finally {
			// Reset button state
			setTimeout(() => {
				this.exportButton
					.setButtonText("Export PDF")
					.setDisabled(false);
			}, 1000);
		}
	}

	setContent(content: string) {
		const container = this.containerEl.children[1];
		const iframe = container.querySelector("iframe");
		if (iframe) {
			iframe.srcdoc = content;
		}
	}

	private getContent(): string {
		// Return a placeholder message when no content is set
		return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div>Open a resume note and click "Generate Resume" to preview</div>
            </body>
            </html>
        `;
	}
}
