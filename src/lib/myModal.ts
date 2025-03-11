import { App, Modal } from "obsidian";

export default class MyModal extends Modal {

	constructor(
		app: App,
		title: string,
	) {
		super(app);
		this.setTitle(title);
		const { modalEl } = this;
		modalEl.addClass('my-plugin-modal');
	}
	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
