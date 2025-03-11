export interface FormattingRule {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	pattern: {
		match: string;
		flags: string;
		replacement: string;
	};
	check: {
		match: string;
		flags: string;
	};
	excludeFrontmatter?: boolean;
}

export interface FormatterConfig {
	rules: FormattingRule[];
}
