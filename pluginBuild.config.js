import { join } from 'path';
import { homedir } from 'os';
export const pluginBuildConfig = {
	installTargets: [
		"test-vault-myplugin",
		join(homedir(), 'obsidian-note/obsidian-personal')
	],
	copyFiles: [
		"manifest.json",
		"main.js",
		"styles.css",
	]
};