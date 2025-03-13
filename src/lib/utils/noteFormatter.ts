import { FormatterConfig } from "@/types/formatter";
import { NoteFormatterConfig } from "@/lib/config/configParser";

const defaultConfig: FormatterConfig = {
	rules: []
};
let formatterConfig: FormatterConfig = defaultConfig;

/**
 * Load formatter configuration from the JSON file
 * @param app Obsidian App instance
 */
export const loadFormatterConfig = () => {
	try {
		formatterConfig = { ...defaultConfig, ...NoteFormatterConfig };
	} catch (error) {
		console.error('Error loading formatter config:', error);
		// Use default config if loading fails
		formatterConfig = defaultConfig;
	}
};

/**
 * Check if content needs formatting by looking for specific patterns
 */
export const needsFormatting = (content: string): boolean => {
	const { rules } = formatterConfig;
	const enabledRules = rules.filter(rule => rule.enabled);

	for (const rule of enabledRules) {
		const checkRegex = new RegExp(rule.check.match, rule.check.flags);

		if (rule.excludeFrontmatter) {
			// For rules that should exclude frontmatter
			const parts = content.split(/^---\s*$/m);
			if (parts.length >= 3) {
				// If we have frontmatter, only check the content after it
				const mainContent = parts.slice(2).join('---');
				if (checkRegex.test(mainContent)) return true;
			} else if (checkRegex.test(content)) {
				return true;
			}
		} else {
			// For rules that apply to the entire content
			if (checkRegex.test(content)) return true;
		}
	}

	return false;
};

/**
 * Apply cleaning rules to content
 * @param content Content to clean
 * @returns Cleaned content
 */
const cleanContent = (content: string): string => {
	const { rules } = formatterConfig;
	const enabledRules = rules.filter(rule => rule.enabled);

	return enabledRules.reduce((cleaned, rule) => {
		const { pattern } = rule;
		const regex = new RegExp(pattern.match, pattern.flags);
		return cleaned.replace(regex, pattern.replacement);
	}, content).trim();
};
/**
 * Process content with formatting rules while preserving frontmatter
 */
export const processContent = (content: string): string => {
	// Split content to preserve YAML frontmatter
	const parts = content.split(/^---\s*$/m);

	// If we have YAML frontmatter (content split into 3 parts)
	if (parts.length >= 3) {
		const [_, frontmatter, ...rest] = parts;
		const mainContent = rest.join('---'); // Rejoin any remaining parts
		return `---${frontmatter}---\n${cleanContent(mainContent)}`;
	}

	// No frontmatter, clean entire content
	return cleanContent(content);
};
