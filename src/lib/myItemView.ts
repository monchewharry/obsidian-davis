import { CustomViewTypes } from "@/types/viewType";
import { IconName, ItemView, WorkspaceLeaf } from "obsidian";
/**
 * A view that renders an iframe
 * @param leaf
 * @param iframeSource
 * @param viewtype
 */
export abstract class MyItemView extends ItemView {
	private viewtype: string;
	private displayText: string;
	icon: string;

	constructor(
		leaf: WorkspaceLeaf,
		viewtype: CustomViewTypes | CustomViewTypes.IframeViewTypes,
		icon: IconName,
		displayText: string
	) {
		super(leaf);
		this.viewtype = viewtype;
		this.icon = icon;
		this.displayText = displayText;
	}
	getIcon(): IconName {
		return this.icon;
	}
	getViewType(): string {
		return this.viewtype;
	}

	getDisplayText(): string {
		return this.displayText;
	}

	async onClose() {
		this.containerEl.empty();
	}
}
