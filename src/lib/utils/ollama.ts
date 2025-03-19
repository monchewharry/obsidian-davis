import { Editor } from "obsidian";
import MyPlugin from "@/main";
import { OllamaCommand } from "@/types/ollama";
export function kebabCase(str: string): string {
	return str
		.replace(/[^a-zA-Z0-9 ]/g, " ")
		.replace(/\s+/g, "-")
		.toLocaleLowerCase();
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

