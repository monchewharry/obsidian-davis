import { BuiltInLeafTypes } from "@/types/definitions";
import { App, TFile, TFolder, Workspace } from "obsidian";
/**
 * set and activate view in right side bar by type
 * @param viewType
 */
export async function activateSideBarView(
	app: App,
	viewType: string,
	state?: Record<string, unknown>
) {
	const newLeaf = await app.workspace.ensureSideLeaf(viewType, "right");
	await newLeaf.setViewState({ type: viewType, active: true, state });
	app.workspace.revealLeaf(newLeaf);
}

export function getDataOfLeaf(
	leafType: BuiltInLeafTypes,
	workspace: Workspace
) {
	const leaves = workspace.getLeavesOfType(leafType);
	return leaves.map((leaf) => {
		return {
			DisplayText: leaf.getDisplayText(),
			ViewState: leaf.getViewState(),
			EphemeralState: leaf.getEphemeralState(),
		};
	});
}


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

export interface MatchStrategy {
	type: 'frontmatter' | 'content' | 'tags' | 'links';
	config?: {
		fields?: string[];
		minMatchCount?: number;
		includeSubfields?: boolean;
	};
}

export interface RelatedNoteResult {
	file: TFile;
	matchCount: number;
	matchDetails?: {
		strategy: string;
		matches: string[];
	};
}

// Find related notes using configurable matching strategies
export async function findRelatedNotes(
	app: App,
	currentFile: TFile,
	strategies: MatchStrategy[] = [{ type: 'frontmatter' }],
	sourceData?: Record<string, any>
): Promise<RelatedNoteResult[]> {
	const relatedNotes = new Map<string, RelatedNoteResult>();
	const files = app.vault.getMarkdownFiles();

	for (const file of files) {
		if (file === currentFile) continue;

		for (const strategy of strategies) {
			const result = await matchFileWithStrategy(file, strategy, app, currentFile, sourceData);
			if (result && result.matchCount > 0) {
				const existing = relatedNotes.get(file.path);
				if (existing) {
					existing.matchCount += result.matchCount;
					if (existing.matchDetails && result.matchDetails) {
						existing.matchDetails.matches.push(...result.matchDetails.matches);
					}
				} else {
					relatedNotes.set(file.path, result);
				}
			}
		}
	}

	return Array.from(relatedNotes.values()).sort((a, b) => b.matchCount - a.matchCount);
}

async function matchFileWithStrategy(
	file: TFile,
	strategy: MatchStrategy,
	app: App,
	currentFile: TFile,
	sourceData?: Record<string, any>
): Promise<RelatedNoteResult | null> {
	switch (strategy.type) {
		case 'frontmatter': {
			const fileFrontmatter = await getMetadata(file, app);
			const sourceFrontmatter = sourceData || await getMetadata(currentFile, app);
			if (!fileFrontmatter || !sourceFrontmatter) return null;

			const matches: string[] = [];
			let matchCount = 0;

			const fields = strategy.config?.fields || Object.keys(sourceFrontmatter);
			for (const field of fields) {
				if (fileFrontmatter[field] === sourceFrontmatter[field]) {
					matchCount++;
					matches.push(`${field}: ${sourceFrontmatter[field]}`);
				}
			}

			if (matchCount >= (strategy.config?.minMatchCount || 1)) {
				return {
					file,
					matchCount,
					matchDetails: {
						strategy: 'frontmatter',
						matches
					}
				};
			}
		}
			break;

		// Additional strategies can be implemented here
		case 'tags': {
			const sourceData = await getMetadata(currentFile, app, true);
			const targetData = await getMetadata(file, app, true);
			const sourceTags = new Set<string>(
				Array.isArray(sourceData.tags) ? sourceData.tags : []
			);
			const targetTags = new Set<string>(
				Array.isArray(targetData.tags) ? targetData.tags : []
			);

			const matches: string[] = [];
			let matchCount = 0;

			for (const tag of targetTags) {
				if (sourceTags.has(tag)) {
					matchCount++;
					matches.push(tag);
				}
			}

			if (matchCount >= (strategy.config?.minMatchCount || 1)) {
				return {
					file,
					matchCount,
					matchDetails: {
						strategy: 'tags',
						matches
					}
				};
			}
			return null;
		}
		case 'content':
		case 'links':
			// Placeholder for future implementations
			return null;
	}

	return null;
}

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
