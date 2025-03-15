import { CustomViewTypes } from "@/types/viewType";

export async function openYtTranscriptView(url: string) {
	const leaf = this.app.workspace.getRightLeaf(false)!;
	await leaf.setViewState({
		type: CustomViewTypes.TRANSCRIPT_TYPE_VIEW,
	});
	this.app.workspace.revealLeaf(leaf);
	leaf.setEphemeralState({
		url,
	});
}