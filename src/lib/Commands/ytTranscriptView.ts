import { CustomViewTypes } from "@/types/viewType";
import { App } from "obsidian";

export async function openYtTranscriptView(app: App, url: string) {
	const leaf = app.workspace.getRightLeaf(false)!;
	await leaf.setViewState({
		type: CustomViewTypes.TRANSCRIPT_TYPE_VIEW,
	});
	app.workspace.revealLeaf(leaf);
	leaf.setEphemeralState({
		url,
	});
}