import builtins from "builtin-modules";
import esbuild from "esbuild";
import { lessLoader } from "esbuild-plugin-less";
import process from "process";
import { copyFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
const banner = `/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = process.argv[2] === "production";
async function copyDir(src, dest) {
	const entries = await readdir(src, { withFileTypes: true });
	await mkdir(dest, { recursive: true });

	for (const entry of entries) {
		const srcPath = join(src, entry.name);
		const destPath = join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath);
		} else {
			await copyFile(srcPath, destPath);
		}
	}
}

const copyPlugin = {
	name: 'copy-plugin',
	setup(build) {
		build.onEnd(async () => {
			try {
				const vaultPath = 'test-vault-myplugin';
				// Ensure plugin directory exists
				await mkdir(`${vaultPath}/.obsidian/plugins/my-plugin`, { recursive: true });
				// Copy manifest.json
				await copyFile('manifest.json', `${vaultPath}/.obsidian/plugins/my-plugin/manifest.json`);
				await copyFile('main.js', `${vaultPath}/.obsidian/plugins/my-plugin/main.js`);
				await copyFile('styles.css', `${vaultPath}/.obsidian/plugins/my-plugin/styles.css`);
				await copyFile('hugo.blogheader.yaml', `${vaultPath}/.obsidian/plugins/my-plugin/hugo.blogheader.yaml`);
				// Copy all content from mockOb directory
				await copyDir('mockOb', `${vaultPath}`);
				console.log('✓ Plugin files copied successfully');
			} catch (error) {
				console.error('Error copying plugin files:', error);
				process.exit(1);
			}
		});
	},
};

const copyPlugin2 = {
	name: 'copy-plugin2',
	setup(build) {
		build.onEnd(async () => {
			const pluginPath = join(homedir(), 'obsidian-note/obsidian-personal/.obsidian/plugins/my-plugin');
			try {
				// Ensure plugin directory exists
				await mkdir(pluginPath, { recursive: true });
				await copyFile('manifest.json', `${pluginPath}/manifest.json`);
				await copyFile('main.js', `${pluginPath}/main.js`);
				await copyFile('styles.css', `${pluginPath}/styles.css`);
				await copyFile('.hotreload', `${pluginPath}/.hotreload`);
				await copyFile('hugo.blogheader.yaml', `${pluginPath}/hugo.blogheader.yaml`);
				console.log('✓ Plugin files copied successfully into', pluginPath);
			} catch (error) {
				console.error('Error copying plugin files:', error);
				process.exit(1);
			}
		});
	},
};

const cssLoaderPlugin = {
	name: "css-loader",
	setup(build) {
		build.onLoad({ filter: /\.css$/ }, async (args) => {
			const { readFile } = await import("fs/promises");
			const contents = await readFile(args.path, "utf8");
			return {
				contents: `const style = document.createElement('style');
					 style.innerText = ${JSON.stringify(contents)};
					 document.head.appendChild(style);`,
				loader: "js", // Treat the output as JavaScript
			};
		});
	},
};

const context = await esbuild.context({
	banner: {
		js: banner,
		css: banner,
	},
	entryPoints: ["./src/main.ts", "./src/styles.less"],
	outdir: "./",
	bundle: true,
	external: [
		"obsidian",
		"electron",
		"@codemirror/autocomplete",
		"@codemirror/collab",
		"@codemirror/commands",
		"@codemirror/language",
		"@codemirror/lint",
		"@codemirror/search",
		"@codemirror/state",
		"@codemirror/view",
		"@lezer/common",
		"@lezer/highlight",
		"@lezer/lr",
		...builtins,
	],
	format: "cjs",
	target: "es2018",
	logLevel: "info",
	sourcemap: prod ? false : "inline",
	treeShaking: true, // dead code elimination
	// outfile: "main.js",
	minify: prod, // Minify the code
	plugins: [cssLoaderPlugin, lessLoader(), copyPlugin, copyPlugin2],
	jsx: "automatic", // 'transform|automatic|null' "jsx": "react-jsx" in tsconfig.json
});

if (prod) {
	await context.rebuild();
	process.exit(0);
} else {
	await context.watch();
}
