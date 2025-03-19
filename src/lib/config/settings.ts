import { OllamaCommand } from "@/types/ollama";

interface hugoBloxSettings {
	hugobloxPostsPath: string;
	// hugobloxPostHeaders?: any;
};

interface RfrPluginSettings {
	findText: string;
	replaceText: string;
	useRegEx: boolean;
	selOnly: boolean;
	caseInsensitive: boolean;
	processLineBreak: boolean;
	processTab: boolean;
	prefillFind: boolean;
};
interface YTranscriptSettings {
	timestampMod: number;
	lang: string;
	country: string;
	leafUrls: string[];
}

interface VideoArchiveSettings {
	videoArchivePath: string;
	ffmpegPath: string;
	youtubeShortsPath: string;
	iframeVideoPath: string;
}

interface WebsiteSettings {
	personalWebsiteUrl: string;
}


interface OllamaSettings {
	ollamaUrl: string;
	defaultModel: string;
	commands: OllamaCommand[];
}


export interface DavisSettings extends hugoBloxSettings, RfrPluginSettings, YTranscriptSettings, VideoArchiveSettings, WebsiteSettings, OllamaSettings {

};

export const DEFAULT_SETTINGS: DavisSettings = {
	findText: '',
	replaceText: '',
	useRegEx: true,
	selOnly: false,
	caseInsensitive: false,
	processLineBreak: false,
	processTab: false,
	prefillFind: false,
	hugobloxPostsPath: '/Users/dingxiancao/monchewharry.github.io/content/blogs/draft',
	timestampMod: 5,
	lang: "en",
	country: "EN",
	leafUrls: [],
	videoArchivePath: 'private/twitter/video-archive',
	ffmpegPath: '/opt/homebrew/bin/ffmpeg',
	youtubeShortsPath: 'private/videoURL/YoutubeShorts.md',
	iframeVideoPath: 'private/videoURL/iframes.md',
	personalWebsiteUrl: 'https://monchewharry.github.io/',
	ollamaUrl: "http://localhost:11434",
	defaultModel: "llama3.2",
	commands: [
		{
			name: "Summarize selection",
			prompt:
				"Act as a writer. Summarize the text in a view sentences highlighting the key takeaways. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Explain selection",
			prompt:
				"Act as a writer. Explain the text in simple and concise terms keeping the same meaning. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Expand selection",
			prompt:
				"Act as a writer. Expand the text by adding more details while keeping the same meaning. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Rewrite selection (formal)",
			prompt:
				"Act as a writer. Rewrite the text in a more formal style while keeping the same meaning. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Rewrite selection (casual)",
			prompt:
				"Act as a writer. Rewrite the text in a more casual style while keeping the same meaning. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Rewrite selection (active voice)",
			prompt:
				"Act as a writer. Rewrite the text in with an active voice while keeping the same meaning. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Rewrite selection (bullet points)",
			prompt:
				"Act as a writer. Rewrite the text into bullet points while keeping the same meaning. Output only the text and nothing else, do not chat, no preamble, get to the point.",
		},
		{
			name: "Caption selection",
			prompt:
				"Act as a writer. Create only one single heading for the whole text that is giving a good understanding of what the reader can expect. Output only the caption and nothing else, do not chat, no preamble, get to the point. Your format should be ## Caption.",
		},
	],
};
