
import { FormatterConfig } from "@/types/formatter";
import { MarkdownRule } from "../Commands/hugoBlogPublisher";
import HugoConfigData from '@/lib/config/hugo.markdown.json';
import NoteConfigData from "@/lib/config/note.formatter.json";

const HugoMarkdownConfig = HugoConfigData as MarkdownRule[];
const NoteFormatterConfig = NoteConfigData as FormatterConfig;

export { HugoMarkdownConfig, NoteFormatterConfig };