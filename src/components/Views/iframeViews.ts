import { CustomViewTypes } from "@/types/definitions";
import { WorkspaceLeaf } from "obsidian";
import { MyItemView } from "@/lib/myItemView";

/**
 * A view that renders an iframe
 * @param leaf
 * @param iframeSource
 * @param viewtype
 */
export class IframeView extends MyItemView {
	private iframeSource: string;
	constructor(
		leaf: WorkspaceLeaf,
		iframeSource: string,
		viewtype: CustomViewTypes.IframeViewTypes,
		displayText: string
	) {
		super(leaf, viewtype, "picture-in-picture", displayText);
		this.iframeSource = iframeSource;
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("iframe-container");

		const iframe = document.createElement("iframe");
		iframe.src = this.iframeSource;
		container.appendChild(iframe);
	}

	async onClose() {
		this.containerEl.empty();
	}
}
