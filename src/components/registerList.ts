import {
	IframeView,
	IztroView,
	NoteInfoView,
	ResumeView,
} from "@/components/Views";
import {
	formatNote,
	parseResumeYaml,
	updateMetadataBatchCommand,
	updateMetadataCommand,
} from "@/lib/Commands";
import { onOpenHandler } from "@/lib/Events";
import { CustomViewTypes } from "@/types/definitions";
import DavisPlugin from '../main';
import { activateSideBarView, setStatusBarText, testDV } from "@/lib/utils";
import type { DataArray, DataviewPage } from "obsidian-dataview";
import {
	App,
	Command,
	Editor,
	EventRef,
	IconName,
	MarkdownView,
	Notice,
	TFile,
	ViewCreator,
} from "obsidian";
import { DavisSettings } from "@/settings";

interface HugoFrontmatter {
	draft?: boolean;
	authors?: string[];
	title?: string;
	date?: string;
	summary?: string;
	categories?: string[];
	tags?: string[];
}

interface RibbonList {
	icon: IconName; // Ribbons, https://lucide.dev/
	title: string;
	callback: (evt: MouseEvent) => any;
	className?: string;
}

export const ribbonList = (app: App): RibbonList[] => {
	return [
		{
			icon: "locate-fixed",
			title: "test dev functions",
			callback: async () => {
				testDV(app);
			},
		},
		{
			icon: "dice-1",
			title: "Activate iztro view",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.IZTRO_VIEW_TYPE);
			},
		},
		{
			icon: "dice-2",
			title: "Show Note Info",
			callback: async (evt: MouseEvent) => {
				await activateSideBarView(
					app,
					CustomViewTypes.CONSOLE_VIEW_TYPE
				);
			},
		},
		{
			icon: "sparkle",
			title: "open gemini",
			callback: async (evt: MouseEvent) => {
				await activateSideBarView(app, "webviewer", {
					url: "https://gemini.google.com/app",
					navigate: true,
				});
			},
		},
		{
			icon: "contact",
			title: "open personal website",
			callback: async (evt: MouseEvent) => {
				await activateSideBarView(app, "webviewer", {
					url: "https://monchewharry.github.io/",
					navigate: true,
				});
			},
		},
	];
};

interface StatusBarList {
	text: string | (() => string);
	className: string;
}
export const statusBarList: StatusBarList[] = [
	{
		text: setStatusBarText(),
		className: "my-plugin-status-bar-class",
	},
];

interface ViewList {
	type: string;
	viewCreator: ViewCreator;
}
export const viewList: ViewList[] = [
	{
		type: CustomViewTypes.IZTRO_VIEW_TYPE,
		viewCreator: (leaf) => new IztroView(leaf),
	},
	{
		type: CustomViewTypes.CONSOLE_VIEW_TYPE,
		viewCreator: (leaf) => new NoteInfoView(leaf),
	},
	{
		type: CustomViewTypes.RESUME_VIEW_TYPE,
		viewCreator: (leaf) => new ResumeView(leaf),
	},
	{
		type: CustomViewTypes.IframeViewTypes.CHATBOT_VIEW_TYPE,
		viewCreator: (leaf) =>
			new IframeView(
				leaf,
				"https://nextjs-chat-ruby-sigma-91.vercel.app",
				CustomViewTypes.IframeViewTypes.CHATBOT_VIEW_TYPE,
				"Chatbot"
			),
	},
];

export const eventRefList = (app: App): EventRef[] => {
	return [
		app.vault.on("create", () => {
			// console.log("a new file has entered the arena");
		}),
		app.workspace.on("file-open", async (file) => {
			onOpenHandler(app, file);
			if (file instanceof TFile) {
				const success = await formatNote(file, app);
				// Only show notice if formatting was applied
				if (success) {
					new Notice("✅ Note formatting applied");
				}
			}
		}),
	];
};

export const commandList = (app: App, settings: DavisSettings): Command[] => {
	return [
		{
			id: "generate-resume",
			name: "Generate Resume",
			editorCallback: async (editor, view) => {
				const content = editor.getValue();
				const html = parseResumeYaml(content);
				// 1. resume preview in right sidebar
				await activateSideBarView(
					app,
					CustomViewTypes.RESUME_VIEW_TYPE
				);
				// Get the resume view and update its content
				const leaves = app.workspace.getLeavesOfType(
					CustomViewTypes.RESUME_VIEW_TYPE
				);
				if (leaves.length > 0) {
					const view = leaves[0].view as ResumeView;
					view.setContent(html);
				}

				// TODO: 2. insert html into current note and parse with css snippet
				const clearExisting = content.replace(
					/^(---\n[\s\S]*?\n---)([\s\S]*)$/,
					"$1"
				);
				// remove the <style> part, replace tag name <body> with <bodyResume>,
				// <section> -> <div class="section">; <section class="xxx"> -> <div class="section-xxx"
				const mdHtml = html.replace(/<style[\s\S]*?<\/style>/g, "");
				// .replace(/<body/g, "<bodyResume")
				// .replace(/<\/body/g, "</bodyResume");
				// .replace(
				// 	/<section class="([^"]*)"/g,
				// 	'<div class="section-$1"'
				// )
				// .replace(/<section/g, '<div class="section"')
				// .replace(/<\/section/g, "</div");

				const newContent = clearExisting + "\n\n" + mdHtml;
				editor.setValue(newContent);
				// 3.Output resume.html file
				const folderPath = view.file?.parent?.path ?? "";
				const filePath = `${folderPath}/resume.html`;
				try {
					const existingFile =
						app.vault.getAbstractFileByPath(filePath);
					if (existingFile instanceof TFile) {
						await app.vault.modify(existingFile, html);
					} else {
						await app.vault.create(filePath, html);
					}

					new Notice("✅ Resume HTML file created/updated");

					// Open the resume.html file in the active view, with plugin [html reader](https://github.com/nuthrash/obsidian-html-plugin)
					const newFile = app.vault.getAbstractFileByPath(filePath);
					if (newFile instanceof TFile) {
						await app.workspace.getLeaf().openFile(newFile);
					}
				} catch (error) {
					new Notice(
						`❌ Error creating/updating resume HTML file: ${error.message}`
					);
				}
			},
		},
		{
			id: "publish-hugoblox",
			name: "Publish Note to hugoblox (personal website)",
			editorCallback: async (editor, view) => {
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
					const templatePath = path.join(app.vault.adapter.basePath, '.obsidian/plugins/my-plugin/hugoblog.header.yaml');
					const templateContent = await fs.readFile(templatePath, 'utf8');
					const templateYaml = YAML.parse(templateContent);

					// Read current file content
					const fileContent = await app.vault.read(currentFile);
					const fileLines = fileContent.split('\n');
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

					// Write the new content to target file
					await fs.writeFile(targetPath, newContent, 'utf8');
					new Notice(`✅ Published to Hugo: ${currentFile.name}`);
				} catch (error) {
					console.error('Error publishing to Hugo:', error);
					new Notice(`❌ Error publishing to Hugo: ${error.message}`);
				}
			},
		},
		{
			id: "chatbot-iframe-view",
			name: "Chatbot iframe view",
			callback: async () => {
				await activateSideBarView(
					app,
					CustomViewTypes.IframeViewTypes.CHATBOT_VIEW_TYPE
				);
			},
		},
		{
			id: "update-metadata",
			name: "Single-update metadata field (editing mode)",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				updateMetadataCommand(view, app);
			},
		},
		{
			id: "update-metadata-batch",
			name: "Batch-update metadata field",
			callback: () => {
				updateMetadataBatchCommand(app);
			},
		},
		{
			id: "clean-note",
			name: "Clean Note formatting",
			editorCallback: async (_editor: Editor, view: MarkdownView) => {
				try {
					const success = await formatNote(view, app);
					if (success) {
						new Notice("✅ Note formatting applied");
					} else {
						new Notice("ℹ️ No formatting needed");
					}
				} catch (error) {
					new Notice("❌ Error formatting note");
				}
			},
		},
		{
			id: "toggle-note-info",
			name: "Toggle Note Info View",
			callback: async () => {
				await activateSideBarView(
					app,
					CustomViewTypes.CONSOLE_VIEW_TYPE
				);
			},
		},
	];
};
