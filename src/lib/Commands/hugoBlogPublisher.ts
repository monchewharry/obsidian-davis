import { DavisSettings } from "@/settings";
import { App, MarkdownFileInfo, MarkdownView, Notice } from "obsidian";
// https://docs.hugoblox.com/reference/markdown/
export interface MarkdownRule {
	name: string;
	description: string;
	pattern: string;
	replacement: string;
}
export interface HugoFrontmatter {
	draft?: boolean;
	authors?: string[];
	title?: string;
	date?: string;
	summary?: string;
	categories?: string[];
	tags?: string[];
}
export async function publishHugoBlog(view: MarkdownView | MarkdownFileInfo, app: App, settings: DavisSettings) {
	if (!settings.hugobloxPostsPath) {
		new Notice('❌ Please set your Hugo posts directory path in settings');
		return;
	}

	const currentFile = view.file;
	if (!currentFile) {
		new Notice('❌ No active file');
		return;
	}

	try {
		// Use Node.js fs promises to copy file
		const fs = require('fs').promises;
		const path = require('path');
		const YAML = require('yaml');

		// Read the template yaml
		const templatePath = path.join(app.vault.adapter.basePath, '.obsidian/plugins/my-plugin/hugo.blogheader.yaml');
		const templateContent = await fs.readFile(templatePath, 'utf8');
		const templateYaml = YAML.parse(templateContent);

		// Read current file content
		const fileContent = await app.vault.read(currentFile);
		let frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
		let existingFrontmatter = {} as HugoFrontmatter;
		let contentWithoutFrontmatter = fileContent;

		if (frontmatterMatch) {
			existingFrontmatter = (YAML.parse(frontmatterMatch[1]) || {}) as HugoFrontmatter;
			contentWithoutFrontmatter = fileContent.slice(frontmatterMatch[0].length).trim();
		}

		// Configure new frontmatter
		const newFrontmatter = {
			...templateYaml,
			draft: true,
			authors: ['admin'],
			title: currentFile.basename,
			date: new Date(currentFile.stat.mtime).toISOString().split('T')[0],
			// Keep user specified values if they exist
			summary: existingFrontmatter.summary || templateYaml.summary,
			categories: existingFrontmatter.categories || templateYaml.categories,
			tags: existingFrontmatter.tags || templateYaml.tags
		};

		// Create new content with updated frontmatter
		const newContent = `---\n${YAML.stringify(newFrontmatter)}---\n\n${contentWithoutFrontmatter}`;

		// Ensure target directory exists
		await fs.mkdir(settings.hugobloxPostsPath, { recursive: true });

		// Create target path in Hugo posts directory
		const targetPath = path.join(settings.hugobloxPostsPath, currentFile.name);

		// Load markdown conversion rules
		const rulesPath = path.join(app.vault.adapter.basePath, '.obsidian/plugins/my-plugin/hugo.markdown.json');
		const rulesContent = await fs.readFile(rulesPath, 'utf8');
		const { markdownRules } = JSON.parse(rulesContent);

		// Apply markdown conversion rules
		const convertedContent = (markdownRules as MarkdownRule[]).reduce((content: string, rule: MarkdownRule) => {
			return content.replace(new RegExp(rule.pattern, 'g'), rule.replacement);
		}, newContent);

		// Write the converted content to target file
		await fs.writeFile(targetPath, convertedContent, 'utf8');
		new Notice(`✅ Published to Hugo: ${currentFile.name}`);
	} catch (error) {
		console.error('Error publishing to Hugo:', error);
		new Notice(`❌ Error publishing to Hugo: ${error.message}`);
	}
}