import { App, MarkdownView, TFile } from "obsidian";
import { needsFormatting, processContent } from "@/lib/utils";



/**
 * Format a note's content. Can accept either a MarkdownView or TFile.
 * Returns true if formatting was applied, false if no formatting was needed or if an error occurred.
 */
export const formatNote = async (input: MarkdownView | TFile, app: App): Promise<boolean> => {
	try {
		// Only process markdown files
		if (input instanceof TFile && !input.extension.toLowerCase().endsWith('md')) {
			return false;
		}
		let content: string;

		// Get content based on input type
		if (input instanceof TFile) {
			content = await app.vault.read(input);
		} else {
			content = input.editor.getValue();
		}

		// Check if formatting is needed
		if (!needsFormatting(content)) {
			return false; // No formatting needed
		}

		// Apply formatting
		const formattedContent = processContent(content);

		// Save formatted content
		if (input instanceof TFile) {
			await app.vault.modify(input, formattedContent);
		} else {
			input.editor.setValue(formattedContent);
		}

		return true;
	} catch (error) {
		console.error('Error formatting note:', error);
		return false;
	}
};
