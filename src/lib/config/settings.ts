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
}

export interface DavisSettings extends hugoBloxSettings, RfrPluginSettings, YTranscriptSettings, VideoArchiveSettings {

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
};
