import MyModal from "@/lib/myModal";
import { Modal, TextComponent, ButtonComponent, App } from "obsidian";

export class YtPromptModal extends MyModal {
	private resolve: (value: string) => void;
	private reject: () => void;
	private submitted = false;
	private value: string;

	constructor(app: App) {
		super(app, "Youtube Transcript Url");
	}

	listenInput(evt: KeyboardEvent) {
		if (evt.key === "Enter") {
			evt.preventDefault();
			this.enterCallback(evt);
		}
	}

	onOpen(): void {
		this.titleEl.setText("YouTube URL");
		this.createForm();
	}

	onClose(): void {
		this.contentEl.empty();
		if (!this.submitted) {
			this.reject();
		}
	}

	createForm(): void {
		// Input field
		const textInput = new TextComponent(this.contentEl);
		textInput.inputEl.style.width = "100%";
		textInput.onChange((value) => (this.value = value));
		textInput.inputEl.addEventListener("keydown", (evt: KeyboardEvent) =>
			this.enterCallback(evt),
		);
		textInput.inputEl.focus();

		// Submit button
		const buttonDiv = this.modalEl.createDiv();
		buttonDiv.addClass("modal-button-container");
		const submitButton = new ButtonComponent(buttonDiv);
		submitButton.buttonEl.addClass("mod-cta");
		submitButton.setButtonText("Submit").onClick((evt: Event) => {
			this.resolveAndClose(evt);
		});
	}

	private enterCallback(evt: KeyboardEvent) {
		if (evt.key === "Enter") {
			this.resolveAndClose(evt);
		}
	}

	private resolveAndClose(evt: Event | KeyboardEvent) {
		this.submitted = true;
		evt.preventDefault();
		this.resolve(this.value);
		this.close();
	}

	async openAndGetValue(
		resolve: (value: string) => void,
		reject: () => void,
	): Promise<void> {
		this.resolve = resolve;
		this.reject = reject;
		this.open();
	}
}
