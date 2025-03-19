import { App, TFolder, TFile } from "obsidian";
import { MetadataMode } from "@/components/Modals/batchMetadataModal";
/**
 * Extract YAML frontmatter, inline tags or inline fields (dataview) from a markdown file
 * @param file The markdown file to process
 * @param app Obsidian App instance
 * @returns Object containing all metadata (frontmatter, tags and inline fields)
 */
export const getMetadata = async (
	file: TFile,
	app: App,
	includeInlineTags: boolean = true,
	includeDV: boolean = false,
): Promise<Record<string, any>> => {
	const metadata: Record<string, any> = {};
	if (file.extension !== "md") {
		return metadata;
	}
	try {
		// Get from CachedMetadata
		const fileCache = app.metadataCache.getFileCache(file);
		const { frontmatter, tags: inlineTags } = fileCache || {};
		if (frontmatter) {
			Object.assign(metadata, frontmatter);
		}
		// merge inline tags
		if (inlineTags && includeInlineTags) {
			const inlineTagsString = inlineTags.map((t) => t.tag);
			if (metadata.tags && Array.isArray(metadata.tags)) {
				metadata.tags = [
					...new Set([...metadata.tags, ...inlineTagsString]),
				];
			} else {
				metadata.tags = inlineTagsString;
			}
		}
		if (!includeDV) {
			return metadata;
		}
		// Process dataview inline fields
		const content = await app.vault.cachedRead(file);
		// Match inline fields with Key:: Value pattern
		// Supports both wrapped ([Key:: Value]) and unwrapped formats
		const inlineFieldRegex =
			/(?:\[|\()?([^\]\s][^:]*?):: ([^\]\)\n]*?)(?:\]|\))?/g;
		let match;
		console.log("checking dv metas");
		while ((match = inlineFieldRegex.exec(content)) !== null) {
			const [_, key, value] = match;
			if (key && value) {
				const trimmedKey = key.trim();
				console.log("checking key", trimmedKey);
				// Convert value to appropriate type
				let parsedValue: any = value;
				if (!isNaN(Number(value))) {
					parsedValue = Number(value);
				} else if (value.toLowerCase() === "true") {
					parsedValue = true;
				} else if (value.toLowerCase() === "false") {
					parsedValue = false;
				}

				metadata[trimmedKey] = parsedValue;
			}
		}
		return metadata;
	} catch (error) {
		console.error(`Error reading frontmatter from ${file.path}:`, error);
		return metadata;
	}
};
/**
 * Get existing frontmatter keys from a folder
 * @param folder The folder to search
 * @returns An array of existing frontmatter keys
 */
export async function getFolderFrontmatterKeys(
	app: App,
	folder: TFolder
): Promise<string[]> {
	const keys = new Set<string>();

	const processFile = async (file: TFile) => {
		if (file.extension === "md") {
			try {
				const frontmatter = await getMetadata(file, app);
				if (frontmatter) {
					Object.keys(frontmatter).forEach((key) => keys.add(key));
				}
			} catch (error) {
				console.error(
					`Error reading frontmatter from ${file.path}:`,
					error
				);
			}
		}
	};

	const processFolder = async (currentFolder: TFolder) => {
		for (const child of currentFolder.children) {
			if (child instanceof TFile) {
				await processFile(child);
			} else if (child instanceof TFolder) {
				await processFolder(child);
			}
		}
	};

	await processFolder(folder);
	return Array.from(keys).sort();
}