// The declaration in this file adds Dataview-specific events to Obsidian's
// MetadataCache interface. When you import from 'obsidian' anywhere in your
// project, TypeScript automatically includes these additional type definitions.

import { App, type EventRef, type Plugin } from "obsidian";

/**
 * Dataview event types
 */
export type DataviewEvent =
	| "dataview:index-ready" // Dataview index is ready
	| "dataview:metadata-change"; // Dataview metadata has changed

// Extend MetadataCache and App to include plugin events
declare module "obsidian" {
	interface MetadataCache {
		/**
		 * Register a callback for Dataview events
		 * @param name The event name
		 * @param callback The callback function
		 */
		on(name: DataviewEvent, callback: () => void): EventRef;
	}
}
