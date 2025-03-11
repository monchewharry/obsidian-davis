import { App, Notice } from "obsidian";
import MyModal from '@/lib/myModal';
export default class MetadataModal extends MyModal {
	private field = '';
	private value = '';
	private onSubmit: (field: string, value: string) => void;

	constructor(app: App, onSubmit: (field: string, value: string) => void) {
		super(app, "Upate Metadata Field");
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl, titleEl, modalEl, containerEl } = this;

		// Field name input
		const fieldContainer = contentEl.createDiv();
		fieldContainer.createEl('label', { text: 'Field name:' });
		const fieldInput = fieldContainer.createEl('input', { type: 'text' });
		fieldInput.style.width = '200px';
		fieldInput.addEventListener('input', (e) => {
			this.field = (e.target as HTMLInputElement).value;
		});

		// Value input
		const valueContainer = contentEl.createDiv();
		valueContainer.style.marginTop = '10px';
		valueContainer.createEl('label', { text: 'Value:' });
		const valueInput = valueContainer.createEl('input', { type: 'text' });
		valueInput.style.width = '200px';
		valueInput.addEventListener('input', (e) => {
			this.value = (e.target as HTMLInputElement).value;
		});

		// Submit button
		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.marginTop = '20px';
		buttonContainer.style.textAlign = 'right';
		const submitButton = buttonContainer.createEl('button', { text: 'Add Metadata' });
		submitButton.addEventListener('click', () => {
			if (this.field && this.value) {
				this.onSubmit(this.field, this.value);
				this.close();
			} else {
				new Notice('⚠️ Please fill in both field name and value');
			}
		});
	}


}
