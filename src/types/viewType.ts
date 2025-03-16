/**
 * Custom view types specific to this plugin.
 * These represent additional view types beyond Obsidian's built-in ones.
 */
export enum CustomViewTypes {
	/** Iztro analysis view */
	IZTRO_VIEW_TYPE = "iztro-view",
	/** Resume preview interface */
	RESUME_VIEW_TYPE = "resume-preview",
	/** Console and debugging view */
	CONSOLE_VIEW_TYPE = "console-view",
	/** Youtube Transcript view */
	TRANSCRIPT_TYPE_VIEW = "ytTranscript-view",
	/** Video archive view */
	VIDEO_VIEW_TYPE = "video-archive-view",
	/** YouTube Shorts view */
	YOUTUBE_SHORT_VIEW_TYPE = "youtube-shorts-view"
}

/**
 * Namespace containing additional view type enums.
 */
export namespace CustomViewTypes {
	/**
	 * View types that use iframes for content display.
	 */
	export enum IframeViewTypes {
		/** Chatbot interface view */
		CHATBOT_VIEW_TYPE = "chat-bot-view",
	}
}

/**
 * Built-in leaf types available in Obsidian's workspace.
 * These represent different types of views that can be opened in the workspace.
 * @see https://docs.obsidian.md/Plugins/User+interface/Workspace
 */
export enum BuiltInLeafTypes {
	/** Content leaves - Primary content display */

	/** Markdown editor and preview */
	Markdown = "markdown",
	/** Web browser view */
	Webviewer = "webviewer",

	/** Navigation leaves - File and content discovery */

	/** File system navigation */
	FileExplorer = "file-explorer",
	/** Full-text search interface */
	Search = "search",
	/** Saved bookmarks view */
	Bookmarks = "bookmarks",
	/** Tag explorer and filter */
	Tag = "tag",

	/** Reference leaves - Content relationships and structure */

	/** Incoming links to current note */
	Backlink = "backlink",
	/** Outgoing links from current note */
	Outgoing = "outgoing-link",
	/** Document structure view */
	Outline = "outline"
}