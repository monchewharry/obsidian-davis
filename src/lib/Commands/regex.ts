import RegexFindReplaceModal from "@/components/Modals/regexFindReplaceModel";
import { App, Editor, Plugin } from "obsidian";
import { DavisSettings } from "../config/settings";

export const regexCommand = (app: App, editor: Editor, settings: DavisSettings, plugin: Plugin) => {
	new RegexFindReplaceModal(app, editor, settings, plugin).open();
};