import { TranscriptLine, TranscriptBlock } from "@/types/ytTranscrpt";
import { parse } from "node-html-parser";

export const formatTimestamp = (t: number): string => {
	if (t < 0) return "00:00";
	const fnum = (n: number): string => `${n | 0}`.padStart(2, "0");
	const s = 1000;
	const m = 60 * s;
	const h = 60 * m;
	const hours = Math.floor(t / h);
	const minutes = Math.floor((t - hours * h) / m);
	const seconds = Math.floor((t - hours * h - minutes * m) / s);
	const time = hours ? [hours, minutes, seconds] : [minutes, seconds];
	return time.map(fnum).join(":");
};
/**
 * Highlights matched text in the div
 * @param div - the div that we want to highlight
 * @param searchValue - the value that will be highlight
 */
export const highlightText = (div: HTMLElement, searchValue: string) => {
	const content = div.innerHTML;
	const highlightedContent = content.replace(
		new RegExp(searchValue, "gi"),
		'<span class="yt-transcript__highlight">$&</span>',
	);
	div.innerHTML = highlightedContent;
};
/**
 * Gets an array of transcript render blocks
 * @param data - the transcript data
 * @param timestampMod - the number of seconds between each timestamp
 */
export const getTranscriptBlocks = (
	data: TranscriptLine[],
	timestampMod: number,
) => {
	const transcriptBlocks: TranscriptBlock[] = [];

	//Convert data into blocks
	let quote = "";
	let quoteTimeOffset = 0;
	data.forEach((line, i) => {
		if (i === 0) {
			quoteTimeOffset = line.offset;
			quote += line.text + " ";
			return;
		}
		if (i % timestampMod == 0) {
			transcriptBlocks.push({
				quote,
				quoteTimeOffset,
			});

			//Clear the data
			quote = "";
			quoteTimeOffset = line.offset;
		}
		quote += line.text + " ";
	});

	if (quote !== "") {
		transcriptBlocks.push({
			quote,
			quoteTimeOffset,
		});
	}
	return transcriptBlocks;
};
const YOUTUBE_TITLE_REGEX = new RegExp(
	/<meta\s+name="title"\s+content="([^"]*)">/,
);
export class YoutubeTranscriptError extends Error {
	constructor(err: unknown) {
		if (!(err instanceof Error)) {
			super("");
			return;
		}

		if (err.message.includes("ERR_INVALID_URL")) {
			super("Invalid YouTube URL");
		} else {
			super(err.message);
		}
	}
}
export interface TranscriptConfig {
	lang?: string;
	country?: string;
}
export class YoutubeTranscript {
	public static async fetchTranscript(
		url: string,
		config?: TranscriptConfig,
	) {
		try {
			const langCode = config?.lang ?? "en";

			const videoPageBody = await request(url);
			const parsedBody = parse(videoPageBody);

			const titleMatch = videoPageBody.match(YOUTUBE_TITLE_REGEX);
			let title = "";
			if (titleMatch) title = titleMatch[1];

			const scripts = parsedBody.getElementsByTagName("script");
			const playerScript = scripts.find((script) =>
				script.textContent.includes("var ytInitialPlayerResponse = {"),
			);

			const dataString =
				playerScript!.textContent
					?.split("var ytInitialPlayerResponse = ")?.[1] //get the start of the object {....
					?.split("};")?.[0] + "}"; // chunk off any code after object closure. // add back that curly brace we just cut.

			const data = JSON.parse(dataString.trim());
			const availableCaptions =
				data?.captions?.playerCaptionsTracklistRenderer
					?.captionTracks || [];
			// If languageCode was specified then search for it's code, otherwise get the first.
			let captionTrack = availableCaptions?.[0];
			if (langCode)
				captionTrack =
					availableCaptions.find((track: any) =>
						track.languageCode.includes(langCode),
					) ?? availableCaptions?.[0];

			const captionsUrl = captionTrack?.baseUrl;
			const fixedCaptionsUrl = captionsUrl.startsWith("https://")
				? captionsUrl
				: "https://www.youtube.com" + captionsUrl;

			const resXML = await request(fixedCaptionsUrl).then((xml) =>
				parse(xml),
			);

			const chunks = resXML.getElementsByTagName("text");

			return {
				title: title,
				lines: chunks.map((cue: any) => ({
					text: cue.textContent
						.replaceAll("&#39;", "'")
						.replaceAll("&amp;", "&")
						.replaceAll("&quot;", '"')
						.replaceAll("&apos;", "'")
						.replaceAll("&lt;", "<")
						.replaceAll("&gt;", ">"),
					duration: parseFloat(cue.attributes.dur) * 1000,
					offset: parseFloat(cue.attributes.start) * 1000,
				})),
			};
		} catch (err: any) {
			throw new YoutubeTranscriptError(err);
		}
	}
}