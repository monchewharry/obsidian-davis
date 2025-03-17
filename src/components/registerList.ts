import {
	IframeView,
	IztroView,
	NoteInfoView,
	ResumeView,
	TranscriptView,
	VideoView,
	YoutubeShortView,
	IframeVideoCollectionView,
} from "@/components/Views";
import {
	formatNote,
	parseResumeYaml,
	updateMetadataBatchCommand,
	updateMetadataCommand,
	regexCommand,
} from "@/lib/Commands";
import { onOpenHandler } from "@/lib/Events";
import { CustomViewTypes } from "@/types/viewType";
import { activateSideBarView, setStatusBarText, testDV } from "@/lib/utils";
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
	Plugin,
} from "obsidian";
import { DavisSettings } from "@/lib/config/settings";
import { publishHugoBlog } from "@/lib/Commands/hugoBlogPublisher";
import MyPlugin from "@/main";
import { openYtTranscriptView } from "@/lib/Commands/ytTranscriptView";
import { YtPromptModal } from "./Modals/ytPromptModal";
import { runOtherPluginCommand } from "@/lib/utils/pluginApi";

interface RibbonList {
	icon: IconName; // Ribbons, https://lucide.dev/
	title: string;
	callback: (evt: MouseEvent) => any;
	className?: string;
}

export const ribbonList = (app: App, settings: DavisSettings): RibbonList[] => {
	return [
		{
			icon: "play-circle",
			title: "Open iframe Videos",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.IFRAME_VIDEO_VIEW_TYPE);
			},
		},
		{
			icon: "youtube",
			title: "Open YouTube Shorts",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.YOUTUBE_SHORT_VIEW_TYPE);
			},
		},
		{
			icon: "video",
			title: "Open Video Archive",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.VIDEO_VIEW_TYPE);
			},
		},
		{
			icon: "arrow-up-from-line",
			title: "Commit and Sync",
			callback: async () => {
				runOtherPluginCommand(app, "obsidian-git", "push");
			},
		},
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
					url: settings.personalWebsiteUrl, // https://monchewharry.github.io/
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
export const viewList = (plugin: MyPlugin): ViewList[] => [
	{
		type: CustomViewTypes.IFRAME_VIDEO_VIEW_TYPE,
		viewCreator: (leaf) => new IframeVideoCollectionView(leaf, plugin),
	},
	{
		type: CustomViewTypes.YOUTUBE_SHORT_VIEW_TYPE,
		viewCreator: (leaf) => new YoutubeShortView(leaf, plugin),
	},
	{
		type: CustomViewTypes.VIDEO_VIEW_TYPE,
		viewCreator: (leaf) => new VideoView(leaf, plugin),
	},
	{
		type: CustomViewTypes.TRANSCRIPT_TYPE_VIEW,
		viewCreator: (leaf) => new TranscriptView(leaf, plugin),
	},
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
		type: CustomViewTypes.IframeFullViewTypes.CHATBOT_VIEW_TYPE,
		viewCreator: (leaf) =>
			new IframeView(
				leaf,
				"https://player.bilibili.com/player.html?isOutside=true&aid=1256358045&bvid=BV1KE4m1d7C4&cid=1639341950&p=1",//"https://nextjs-chat-ruby-sigma-91.vercel.app",
				CustomViewTypes.IframeFullViewTypes.CHATBOT_VIEW_TYPE,
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

export const commandList = (app: App, settings: DavisSettings, plugin: MyPlugin): Command[] => {
	return [
		{
			id: "open-bilibili-videos",
			name: "Open Bilibili Videos",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.IFRAME_VIDEO_VIEW_TYPE);
			}
		},
		{
			id: "open-youtube-shorts",
			name: "Open YouTube Shorts",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.YOUTUBE_SHORT_VIEW_TYPE);
			}
		},
		{
			id: "my-video-view",
			name: "Open Video Archive",
			callback: async () => {
				await activateSideBarView(app, CustomViewTypes.VIDEO_VIEW_TYPE);
			}
		},
		{
			id: "my-commit-and-sync",
			name: "Commit and Sync (obsidian-git)",
			callback: async () => {
				runOtherPluginCommand(app, "obsidian-git", "push");
			}
		},
		{
			id: "transcript-from-prompt",
			name: "Get YouTube transcript from url prompt",
			callback: async () => {
				const prompt = new YtPromptModal(app);
				const url: string = await new Promise((resolve) =>
					prompt.openAndGetValue(resolve, () => { }),
				);
				if (url) {
					openYtTranscriptView(app, url);
				}
			}
		},
		{
			id: 'my-regex-replace',
			name: 'Find and Replace using regular expressions',
			editorCallback: (editor) => {
				regexCommand(app, editor, settings, plugin);
			},
		},
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
				await publishHugoBlog(view, app, settings);
			},
		},
		{
			id: "chatbot-iframe-view",
			name: "Chatbot iframe view",
			callback: async () => {
				await activateSideBarView(
					app,
					CustomViewTypes.IframeFullViewTypes.CHATBOT_VIEW_TYPE
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
