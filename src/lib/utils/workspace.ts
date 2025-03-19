import { BuiltInLeafTypes } from "@/types/viewType";
import { App, TFile, TFolder, Workspace } from "obsidian";
import { getMetadata } from "./frontmatter";
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


