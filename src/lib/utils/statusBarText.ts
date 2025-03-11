import { BySolarProps, TopicIds } from "@/types/definitions";
import { bySolar } from "iztro/lib/astro/astro";
import type FunctionalAstrolabe from "iztro/lib/astro/FunctionalAstrolabe";

function getSelectedAstrolabeData(props: BySolarProps): FunctionalAstrolabe {
	const { solarDateStr, timeIndex, gender, fixLeap, language } = props;

	return bySolar(solarDateStr, timeIndex, gender, fixLeap, language);
}

export function setStatusBarText(): string {
	const today = new Date().toISOString().slice(0, 10);
	const result = getSelectedAstrolabeData({
		topicId: TopicIds.numerology,
		solarDateStr: today,
		timeIndex: 0,
		gender: "male",
	});
	return result.solarDate;
}
