
import { FormatterConfig } from "@/types/formatter";
import { MarkdownRule } from "../Commands/hugoBlogPublisher";
import { parse } from 'yaml';
import HugoConfigData from '@/lib/config/hugo.markdown.json';
import NoteConfigData from "@/lib/config/note.formatter.json";
import path from "path";
import fs from 'fs/promises';

const hugoHeaderConfig = async () => {
	const templatePath = path.resolve(__dirname, "hugo.blogheader.yaml");
	const templateContent = await fs.readFile(templatePath, 'utf8');
	const templateYaml = parse(templateContent);
	return templateYaml;
}

const HugoMarkdownConfig = HugoConfigData as MarkdownRule[];
const NoteFormatterConfig = NoteConfigData as FormatterConfig;

export { HugoMarkdownConfig, NoteFormatterConfig, hugoHeaderConfig };