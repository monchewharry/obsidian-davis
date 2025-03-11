import { CustomViewTypes } from "@/types/definitions";
import { WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { MyItemView } from "@/lib/myItemView";
import { ReactView } from "./testReact";

export class IztroView extends MyItemView {
	root: Root | null = null;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf, CustomViewTypes.IZTRO_VIEW_TYPE, "grip", "iztro view");
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			ReactView({
				birthday: "1993-10-10",
				birthTime: 0,
				gender: "male",
				birthdayType: "solar",
			})
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
