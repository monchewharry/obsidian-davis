import { getFolderFrontmatterKeys } from "@/lib/utils";
import { App, Notice, TFolder } from "obsidian";
import MyModal from "@/lib/myModal";

export type MetadataMode = 'update' | 'rename';

export default class BatchMetadataModal extends MyModal {
	private field = "";
	private value = "";
	private selectedFolder: TFolder | null = null;
	private onSubmit: (field: string, value: string, folder: TFolder, mode: MetadataMode) => void;
	private defaultFolderPath: string;
	private mode: MetadataMode = 'update';

	constructor(
		app: App,
		onSubmit: (field: string, value: string, folder: TFolder, mode: MetadataMode) => void,
		defaultFolderPath?: string
	) {
		super(app, "Batch Metadata Field Manager");
		this.onSubmit = onSubmit;
		this.defaultFolderPath = defaultFolderPath || "/";
	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.empty();
		// Folder selection
		const folderContainer = contentEl.createDiv();
		folderContainer.createEl("label", { text: "Select folder:" });
		const folderSelect = folderContainer.createEl("select");
		folderSelect.style.width = "200px";

		// Add root folder option
		const rootOption = folderSelect.createEl("option");
		rootOption.value = "/";
		rootOption.text = "Root";

		// Add all folders from the vault
		this.getAllFolders().forEach((folder) => {
			const option = folderSelect.createEl("option");
			option.value = folder.path;
			option.text = folder.path;
			if (folder.path === this.defaultFolderPath) {
				option.selected = true;
			}
		});

		// Set initial folder and get existing keys
		this.selectedFolder =
			this.defaultFolderPath === "/"
				? this.app.vault.getRoot()
				: (this.app.vault.getAbstractFileByPath(
					this.defaultFolderPath
				) as TFolder);

		// Mode selection
		const modeContainer = contentEl.createDiv();
		modeContainer.style.marginTop = "20px";
		modeContainer.createEl("label", { text: "Operation mode:" });
		const modeSelect = modeContainer.createEl("select");
		modeSelect.style.width = "200px";

		// Add mode options
		const updateOption = modeSelect.createEl("option");
		updateOption.value = "update";
		updateOption.text = "Update/Add Field";
		updateOption.selected = true;

		const renameOption = modeSelect.createEl("option");
		renameOption.value = "rename";
		renameOption.text = "Rename Field";

		modeSelect.addEventListener("change", (e) => {
			this.mode = (e.target as HTMLSelectElement).value as MetadataMode;
			// Update value input label and placeholder based on mode
			valueLabel.setText(this.mode === 'update' ? "Value:" : "New field key:");
			valueInput.placeholder = this.mode === 'update' ? "Enter value" : "Enter new field key";
			submitButton.setText(this.mode === 'update' ? "Update Metadata" : "Rename Field");
			footnoteText.setText(this.mode === 'update'
				? "Note: Providing an empty value will delete the field key from the files."
				: "Note: This will rename the selected field key while preserving its values.");
		});

		// Field key input container
		const fieldContainer = contentEl.createDiv();
		fieldContainer.style.marginTop = "20px";
		fieldContainer.createEl("label", { text: this.mode === 'update' ? "Field key:" : "Original field key:" });

		// Create a container for the field input and dropdown
		const fieldInputContainer = fieldContainer.createDiv();
		fieldInputContainer.style.display = "flex";
		fieldInputContainer.style.gap = "10px";

		// Text input for custom key
		const fieldInput = fieldInputContainer.createEl("input", {
			type: "text",
			placeholder: "Type a new or select a key",
		});
		fieldInput.style.width = "200px";
		fieldInput.addEventListener("input", (e) => {
			this.field = (e.target as HTMLInputElement).value;
		});

		// Dropdown for existing keys
		const keySelect = fieldInputContainer.createEl("select");
		keySelect.style.width = "200px";
		keySelect.createEl("option", {
			text: "-- Select existing key --",
			value: "",
		});

		// Populate dropdown with existing keys
		if (this.selectedFolder) {
			const existingKeys = await getFolderFrontmatterKeys(
				this.app,
				this.selectedFolder
			);
			existingKeys.forEach((key) => {
				keySelect.createEl("option", { text: key, value: key });
			});
		}

		// Update field input when selecting from dropdown
		keySelect.addEventListener("change", (e) => {
			const selectedKey = (e.target as HTMLSelectElement).value;
			if (selectedKey) {
				fieldInput.value = selectedKey;
				this.field = selectedKey;
			}
		});

		// Update dropdown when folder changes
		folderSelect.addEventListener("change", async (e) => {
			const path = (e.target as HTMLSelectElement).value;
			this.selectedFolder =
				path === "/"
					? this.app.vault.getRoot()
					: (this.app.vault.getAbstractFileByPath(path) as TFolder);

			// Clear and repopulate the key dropdown
			keySelect.empty();
			keySelect.createEl("option", {
				text: "-- Select existing key --",
				value: "",
			});

			if (this.selectedFolder) {
				const existingKeys = await getFolderFrontmatterKeys(
					this.app,
					this.selectedFolder
				);
				existingKeys.forEach((key) => {
					keySelect.createEl("option", { text: key, value: key });
				});
			}
		});

		// Value/New Key input
		const valueContainer = contentEl.createDiv();
		valueContainer.style.marginTop = "10px";
		const valueLabel = valueContainer.createEl("label", { text: "Value:" });
		const valueInput = valueContainer.createEl("input", {
			type: "text",
			placeholder: "Enter value"
		});
		valueInput.style.width = "200px";
		valueInput.addEventListener("input", (e) => {
			this.value = (e.target as HTMLInputElement).value;
		});

		// Submit button
		const buttonContainer = contentEl.createDiv();
		buttonContainer.style.marginTop = "20px";
		buttonContainer.style.textAlign = "right";
		const submitButton = buttonContainer.createEl("button", {
			text: "Update Metadata",
		});
		submitButton.addEventListener("click", () => {
			if (!this.field || !this.selectedFolder || (this.mode === 'rename' && !this.value)) {
				new Notice("⚠️ Please fill in all required fields");
				return;
			}
			this.onSubmit(this.field, this.value, this.selectedFolder, this.mode);
			this.close();
		});

		// Footnote
		const footnoteContainer = contentEl.createDiv({
			cls: "modal_footnote",
		});
		const footnoteText = footnoteContainer.createEl("p", {
			text: "Note: Providing an empty value will delete the field key from the files.",
		});
	}

	private getAllFolders(): TFolder[] {
		const folders: TFolder[] = [];
		const root = this.app.vault.getRoot();

		const collectFolders = (folder: TFolder) => {
			folder.children.forEach((child) => {
				if (child instanceof TFolder) {
					folders.push(child);
					collectFolders(child);
				}
			});
		};

		collectFolders(root);
		return folders;
	}
}
