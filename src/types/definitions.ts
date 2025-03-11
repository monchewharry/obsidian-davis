import type { Language } from "iztro/lib/data/types/general";
import type {
	EarthlyBranchName,
	FiveElementsClassName,
	GenderName,
	PalaceName,
	StarName,
} from "iztro/lib/i18n";

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
/**
 * Topic identifiers for different areas of functionality.
 * Used to categorize and route different types of content and operations.
 */
export enum TopicIds {
	/** General purpose topics */
	general = "topic-general",
	/** Numerology-related content */
	numerology = "topic-numerology",
	/** Divination-related content */
	divination = "topic-divination",
}
export interface BaseTopicInputs {
	topicId: TopicIds.general; // Discriminator field
}

export interface NumerologyInputs {
	topicId: TopicIds.numerology; // Discriminated union
	solarDateStr: string;
	timeIndex: number;
	gender: GenderName;
}
export interface DivinationInputs {
	topicId: TopicIds.divination; // Discriminated union
	currentHex?: HexagramObj[];
	currentGua?: GuaObj;
	hexagram: string;
	method?: "六爻" | "梅花易数" | "奇门遁甲";
	startQuestion?: string;
}
export type TopicInputs = BaseTopicInputs | NumerologyInputs | DivinationInputs;

export interface BySolarProps extends NumerologyInputs {
	fixLeap?: boolean;
	language?: Language;
}

/**
 * The 6 row hexagram
 */
export interface HexagramObj {
	change: boolean | null;
	yang: boolean;
	separate: boolean;
	id: number;
}
export interface GuaObj {
	guaTitle: string; // 周易第59卦
	guaMark: string; // 26.山天大畜
	guaResult: string; // 乾卦(乾为天)_乾上乾下
	guaChange: string; // 变爻: 九四,九五
}

export interface TopicInputProps {
	onInputChange: (input?: TopicInputs) => void; // expose the input to the parent component
}

/**
 * Types of natal charts available for astrological analysis.
 * @remarks Chinese terms are used as these represent traditional concepts.
 */
export enum NatalChartDataType {
	/** Original birth chart (本命盘) */
	Original = "本命盘",
	/** Destiny/scope chart (运限盘) */
	Scope = "运限盘",
}
export interface NatalChartDataOriginal {
	palaceName: PalaceName;
	majorStars: { name: StarName; mutagen: string }[];
	majorStarMutagens: string[];
	minorStars: StarName[];
	adjStars: StarName[];
	hasStars: boolean;
}

export interface NatalChartData {
	natalChartType: NatalChartDataType;
	gender: string;
	solarDate: string;
	lunarDate: string;
	bazi: string;
	sign: string;
	zodiac: string;
	earthlyBranchOfSoulPalace: EarthlyBranchName;
	soulPalace: PalaceName;
	earthlyBranchOfBodyPalace: EarthlyBranchName;
	bodyPalace: PalaceName;
	soul: StarName;
	body: StarName;
	fiveElementsClass: FiveElementsClassName;
	natalChartOriginalData: NatalChartDataOriginal[];
}

export type ClientToolCallResult = string | NatalChartData | GuaObj | undefined;

export interface ContentSection {
	type: string;
	content: string;
}

export interface MarkdownSection {
	title: string;
	level: number;
	sections: ContentSection[];
	children: MarkdownSection[];
}
