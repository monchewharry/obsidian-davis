import { Editor, Notice, requestUrl } from "obsidian";
import { updateFrontmatter } from "./frontmatter";
import MyPlugin from "@/main";
import { OllamaCommand } from "@/types/ollama";
export function kebabCase(str: string): string {
	return str
		.replace(/[^a-zA-Z0-9 ]/g, " ")
		.replace(/\s+/g, "-")
		.toLocaleLowerCase();
};

export const ollamaSummaryField = async (editor: Editor, plugin: MyPlugin, override: boolean = false) => {
	const text = editor.getValue();
	const file = plugin.app.workspace.getActiveFile();
	if (!file) {
		new Notice("❌ No active file");
		return;
	}

	// Check if summary already exists and we're not overriding
	if (!override) {
		const fileCache = plugin.app.metadataCache.getFileCache(file);
		if (fileCache?.frontmatter?.summary) {
			new Notice("ℹ️ Summary already exists. Use override=true to update.");
			return;
		}
	}

	new Notice("✍️ Generating summary...");

	try {
		console.log("using prompt", "Identify the topic of the following text and generate output within 40 words:")
		const response = await requestUrl({
			method: "POST",
			url: `${plugin.settings.ollamaUrl}/api/generate`,
			body: JSON.stringify({
				system: "You are an assistant that helps identify the topic and purpose of the text into one single sentence.",
				prompt: "Identify the topic of the following text and generate output within 40 words:\n\n" + text,
				model: plugin.settings.defaultModel,
				stream: false,
				options: {
					temperature: 0.01,
				},
			}),
		});

		const steps = response.text
			.split("\n")
			.filter((step) => step && step.length > 0)
			.map((step) => JSON.parse(step));

		const summary = steps.map((step) => step.response).join("").trim();
		console.log(summary);
		await updateFrontmatter(plugin.app, file, "summary", summary);
		new Notice("✅ Summary updated");
	} catch (error) {
		console.error("Error generating summary:", error);
		new Notice("❌ Error generating summary");
	}
};

export const ollamaEditorCallback = (editor: Editor, plugin: MyPlugin, command: OllamaCommand) => {
	const selection = editor.getSelection();
	const text = selection ? selection : editor.getValue();

	const cursorPosition = editor.getCursor();

	editor.replaceRange("✍️", cursorPosition);

	requestUrl({
		method: "POST",
		url: `${plugin.settings.ollamaUrl}/api/generate`,
		body: JSON.stringify({
			prompt: command.prompt + "\n\n" + text,
			model: command.model || plugin.settings.defaultModel,
			options: {
				temperature: command.temperature || 0.2,
			},
		}),
	})
		.then((response) => {
			const steps = response.text
				.split("\n")
				.filter((step) => step && step.length > 0)
				.map((step) => JSON.parse(step));

			const output = '\n```markdown\n' + steps.map((step) => step.response).join("").trim() + '\n```\n';
			editor.replaceRange(
				output,
				cursorPosition,
				{
					ch: cursorPosition.ch + 1,
					line: cursorPosition.line,
				}
			);
		})
		.catch((error) => {
			new Notice(`Error while generating text: ${error.message}`);
			editor.replaceRange("", cursorPosition, {
				ch: cursorPosition.ch + 1,
				line: cursorPosition.line,
			});
		});
}

