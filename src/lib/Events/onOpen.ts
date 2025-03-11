import { type App, TFile } from "obsidian";

/**
 * Handler that runs when any file is opened in the vault, mainly for update path and updatedAt time fields
 * @param app The Obsidian App instance
 * @param file The file that was just saved
 */
export const onOpenHandler = async (app: App, file: TFile | null) => {
    // Only process markdown files
    if (!file || file.extension !== 'md' || file.name.startsWith('Untitled')) {
        return;
    }

    try {
        await app.fileManager.processFrontMatter(file, (frontmatter) => {
            // 1. Add/update last modified date
            frontmatter['updatedAt'] = new Date(file.stat.mtime).toISOString().slice(0, 10) + ' ' + new Date(file.stat.mtime).toISOString().slice(11, 19);
            frontmatter['path'] = file.path;
            frontmatter['folderName'] = file.parent?.path || '/';
            // . Add any other metadata you want to update on save
        });
    } catch (error) {
        console.error(`Error processing frontmatter for ${file.path}:`, error);
    }
};