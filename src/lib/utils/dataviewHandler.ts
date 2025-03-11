import { App } from "obsidian";
import { getAPI, DataArray, Link, DataviewPage } from "obsidian-dataview";

/**
 * Get all pages from the ob-RAG folder using Dataview API
 */
export function testDV(app: App) {

	// Now TypeScript knows about the pages method and its return type
	// let result = dvPagePaths(app, '"ob-RAG"');
	// let result = dvPages(app, '"ob-RAG"');
	// let result = dvPages(app, "#diary");
	// let result = dvPagePaths(app, "#diary");
	let result = dvPage(app, "Diary/each-diary-file/2024-11-09.md");
	console.log(result);
}

// returns a data array of paths of pages that match the given source.
export function dvPagePaths(app: App, query?: string, originFile?: string): DataArray<string> | undefined {
	const api = getAPI(app);
	if (!api) return undefined;
	const paths = api.pagePaths(query, originFile);
	return paths;
}
export function dvPage(app: App, path: string | Link, originFile?: string): DataviewPage | undefined {
	const api = getAPI(app);
	if (!api) return undefined;
	// Now TypeScript knows about the pages method and its return type
	const onepage = api.page(path, originFile);
	return onepage;
}

export function dvPages(app: App, query?: string, originFile?: string): DataArray<DataviewPage> | undefined {
	const api = getAPI(app);
	if (!api) return undefined;
	// Now TypeScript knows about the pages method and its return type
	const pages = api.pages(query, originFile);
	return pages;
}
