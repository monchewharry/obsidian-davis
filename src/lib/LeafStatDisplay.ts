interface LeafData {
	DisplayText: string;
	ViewState: {
		active?: boolean;
		[key: string]: any;
	};
	EphemeralState?: {
		[key: string]: any;
	};
}

export class LeafStatDisplay {
	private container: HTMLElement;
	private data: LeafData[];

	constructor(container: HTMLElement, data: LeafData[]) {
		this.container = container;
		this.data = data;
	}

	render() {
		const list = this.container.createEl("ul", {
			cls: "markdown-leaves-list",
		});

		this.data.forEach((leafData, index) => {
			this.createLeafItem(list, leafData, index);
		});
	}

	private createLeafItem(list: HTMLElement, leafData: LeafData, index: number) {
		const li = list.createEl("li", { cls: "markdown-leaf-item" });
		const header = this.createHeader(li, leafData, index);
		const content = this.createContent(li, leafData);

		// Add mousedown handler to toggle content visibility
		this.setupToggleHandler(header, content);

		// Start collapsed, unless this is the active leaf
		if (!leafData.ViewState.active === true) {
			content.addClass("collapsed");
			header.addClass("collapsed");
		}
	}

	private createHeader(li: HTMLElement, leafData: LeafData, index: number) {
		const isActive = leafData.ViewState.active;
		const header = li.createEl("div", {
			cls: `leaf-header${isActive ? " active" : ""}`,
		});
		header.createEl("span", {
			text: `${index + 1}. ${leafData.DisplayText || "Untitled"}`,
			cls: "leaf-title",
		});
		return header;
	}

	private createContent(li: HTMLElement, leafData: LeafData) {
		const content = li.createEl("div", { cls: "leaf-content" });

		// Add view state info
		if (leafData.ViewState) {
			this.createStateSection(content, "View State", leafData.ViewState);
		}

		// Add ephemeral state info if present
		if (leafData.EphemeralState && Object.keys(leafData.EphemeralState).length > 0) {
			this.createStateSection(content, "Ephemeral State", leafData.EphemeralState);
		}

		return content;
	}

	private createStateSection(container: HTMLElement, title: string, stateData: Record<string, any>) {
		const sectionDiv = container.createEl("div", { cls: "leaf-section" });
		sectionDiv.createEl("strong", { text: `${title}:` });
		const stateList = sectionDiv.createEl("ul");

		Object.entries(stateData).forEach(([key, value]) => {
			stateList.createEl("li", {
				text: `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`,
			});
		});
	}

	private setupToggleHandler(header: HTMLElement, content: HTMLElement) {
		header.addEventListener("mousedown", (e) => {
			e.preventDefault(); // Prevent focus change
			const isCollapsed = content.hasClass("collapsed");
			content.toggleClass("collapsed", !isCollapsed);
			header.toggleClass("collapsed", !isCollapsed);
		});
	}
}
