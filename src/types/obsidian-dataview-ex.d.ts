import { DateTime } from "luxon";
// add/expose typescript support for obsidian-dataview
declare module "obsidian-dataview" {
	export type Literal = string | number | boolean | Date | Link | Literal[] | null; // expose

	export interface Link { // expose
		path: string;
		type: "file" | "header" | "block";
		embed: boolean;
		display?: string;
	}

	export interface PageMetadata { // expose PageMetadata  class as interface
		/** The path this file exists at. */
		public path: string;
		/** Obsidian-provided date this page was created. */
		public ctime: DateTime;
		/** Obsidian-provided date this page was modified. */
		public mtime: DateTime;
		/** Obsidian-provided size of this page in bytes. */
		public size: number;
		/** The day associated with this page, if relevant. */
		public day?: DateTime;
		/** The first H1/H2 header in the file. May not exist. */
		public title?: string;
		/** All of the fields contained in this markdown file - both frontmatter AND in-file links. */
		public fields: Map<string, Literal>;
		/** All of the exact tags (prefixed with '#') in this file overall. */
		public tags: Set<string>;
		/** All of the aliases defined for this file. */
		public aliases: Set<string>;
		/** All OUTGOING links (including embeds, header + block links) in this file. */
		public links: Link[];
		/** All list items contained within this page. Filter for tasks to get just tasks. */
		public lists: ListItem[];
		/** The raw frontmatter for this document. */
		public frontmatter: Record<string, Literal>;

	}

	export interface DataviewPage extends Record<string, Literal> {
		file: PageMetadata;
	}
	export interface DataArray<T> { // expose
		length: number;
		values: T[];
		where(fn: (item: T) => boolean): DataArray<T>;
		sort(fn: (a: T, b: T) => number): DataArray<T>;
		groupBy(fn: (item: T) => any): DataArray<T>[];
		map<U>(fn: (item: T) => U): DataArray<U>;
		filter(fn: (item: T) => boolean): DataArray<T>;
	}

	export interface DataviewApi { // expose class DataviewApi as interface
		pagePaths(query?: string, originFile?: string): DataArray<string>;
		page(path: string | Link, originFile?: string): DataviewPage | undefined;
		pages(query?: string, originFile?: string): DataArray<DataviewPage>;

		// table(headers: string[], values: any[][]): void;
		// list(values: any[]): void;
		// execute(source: string): Promise<any>;
		// current(): DataviewPage | null;
	}

	export function getAPI(app: any): DataviewApi | null;
}
