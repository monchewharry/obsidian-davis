import { type App, MarkdownView, Notice, TFile, TFolder } from "obsidian";
import BatchMetadataModal, { type MetadataMode } from "@/components/Modals/batchMetadataModal";
import MetadataModal from "@/components/Modals/metaDataModal";

/**
 * update metadata fields into the current file using Obsidian's FileManager API.
 */
export const updateMetadataCommand = (view: MarkdownView, app: App) => {
	new MetadataModal(app, (field: string, value: string) => {
		const file = view.file;
		if (!file) {
			new Notice('⚠️ No active file');
			return;
		}

		app.fileManager.processFrontMatter(file, (frontmatter) => {
			frontmatter[field] = value;
		});

		new Notice(`✅ Added ${field} metadata field`);
	}).open();
};

/**
 * update metadata fields into all markdown files under a specified folder using Obsidian's FileManager API
 */
export const updateMetadataBatchCommand = (app: App) => {
	const activeFile = app.workspace.getActiveFile();
	const defaultFolderPath = activeFile
		? activeFile.parent?.path || '/'
		: '/';

	new BatchMetadataModal(
		app,
		async (field: string, value: string, folder: TFolder, mode: MetadataMode) => {
			let processedCount = 0;
			let updatedCount = 0;

			const processFiles = async (currentFolder: TFolder) => {
				for (const child of currentFolder.children) {
					if (child instanceof TFile && child.extension === 'md') {
						processedCount++;
						try {
							await app.fileManager.processFrontMatter(child, (frontmatter) => {
								const oldValue = frontmatter[field];
								
								if (mode === 'update') {
									if (value === '' || value === null) {
										// Delete the field if value is empty or NULL
										delete frontmatter[field];
										if (oldValue !== undefined) {
											updatedCount++;
										}
									} else {
										// Update the field with new value
										frontmatter[field] = value;
										if (oldValue !== value) {
											updatedCount++;
										}
									}
								} else if (mode === 'rename' && oldValue !== undefined) {
									// Rename field key while preserving its value
									delete frontmatter[field];
									frontmatter[value] = oldValue;
									updatedCount++;
								}
							});
						} catch (error) {
							console.error(`Error processing file ${child.path}:`, error);
						}
					} else if (child instanceof TFolder) {
						await processFiles(child);
					}
				}
			};

			try {
				await processFiles(folder);
				const message = mode === 'update'
					? `✅ Updated ${updatedCount} of ${processedCount} files with metadata field '${field}'`
					: `✅ Renamed field '${field}' to '${value}' in ${updatedCount} of ${processedCount} files`;
				new Notice(message);
			} catch (error) {
				console.error('Error during batch metadata update:', error);
				new Notice('❌ Error updating metadata. Check console for details.');
			}
		}, defaultFolderPath).open();
};
