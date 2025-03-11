import { parse } from 'yaml';

interface ResumeData {
	title: string;
	name_pronounciation?: string;
	first_name?: string;
	last_name?: string;
	status?: {
		icon: string;
	};
	superuser?: boolean;
	role: string;
	organizations: {
		name: string;
		url: string;
	}[];
	profiles: {
		url: string;
		icon: string;
		label?: string;
	}[];
	education: {
		area: string;
		institution: string;
		date_start: string;
		date_end: string;
		summary?: string;
		button?: {
			text: string;
			url: string;
		};
	}[];
	work?: {
		position: string;
		company_name: string;
		company_url?: string;
		company_logo?: string;
		date_start: string;
		date_end?: string;
		summary?: string;
	}[];
	skills?: {
		name: string;
		color?: string;
		color_border?: string;
		items: {
			name: string;
			description: string;
			percent: number;
			icon: string;
		}[];
	}[];
	languages?: {
		name: string;
		percent: number;
	}[];
	awards?: {
		title: string;
		url?: string;
		awarder: string;
		date: string;
		icon?: string;
		summary?: string;
	}[];
	updatedAt?: string;
	path?: string;
	folderName?: string;
}
export function parseResumeYaml(content: string): string {
	// Extract YAML frontmatter
	const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
	if (!yamlMatch) {
		console.error("No YAML frontmatter found");
		return "";
	}

	// Parse YAML
	const resumeData = parse(yamlMatch[1]) as ResumeData;

	// Generate HTML
	const html = generateHTML(resumeData);

	// Return the generated HTML for preview
	return html;
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function generateHTML(data: ResumeData) {
	const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.title || "Resume"}</title>
<style>
	/* Variables */
	:root {
		--primary-color: #2c3e50;
		--secondary-color: #3498db;
		--text-color: #333;
		--background-color: #fff;
		--section-spacing: 2rem;
	}

	/* Base styles */
	body {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		line-height: 1.6;
		color: var(--text-color);
		background: var(--background-color);
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	/* Header */
	.header {
		text-align: center;
		margin-bottom: var(--section-spacing);
	}

	.header h1 {
		font-size: 2.5rem;
		color: var(--primary-color);
		margin: 0;
	}

	.header .subtitle {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}

	.header .role {
		font-size: 1.2rem;
		color: var(--secondary-color);
	}

	.header .organizations {
		font-size: 1.2rem;
	}

	/* Section styles */
	section {
		margin-bottom: var(--section-spacing);
	}

	h2 {
		color: var(--primary-color);
		border-bottom: 2px solid var(--secondary-color);
		padding-bottom: 0.5rem;
	}

	/* Profile links */
	.profiles {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
		margin: 1rem 0;
	}

	.profiles a {
		color: var(--text-color);
		text-decoration: none;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.profiles a:hover {
		color: var(--secondary-color);
		transform: translateY(-2px);
	}

	.icon {
		width: 24px;
		height: 24px;
		display: inline-block;
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	.icon-at { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>'); }
	.icon-twitter { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>'); }
	.icon-github { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>'); }
	.icon-linkedin { background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>'); }

	/* Education and Work */
	.timeline-item {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.timeline-item h3 {
		color: var(--primary-color);
		margin: 0;
	}

	.timeline-item .institution,
	.timeline-item .company {
		color: var(--secondary-color);
	}

	.timeline-item .date {
		color: #666;
		font-size: 0.9rem;
	}

	.timeline-item .summary {
		margin-top: 0.5rem;
	}

	.thesis-button {
		display: inline-block;
		padding: 0.5rem 1rem;
		margin-top: 0.5rem;
		background-color: var(--primary-color);
		color: white;
		text-decoration: none;
		border-radius: 4px;
		transition: all 0.3s ease;
	}

	.thesis-button:hover {
		background-color: var(--secondary-color);
		transform: translateY(-2px);
	}

	/* Skills & Hobbies */
	.skills-hobbies-container {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		margin-bottom: var(--section-spacing);
	}

	.skills-hobbies-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.skills-hobbies-header h2 {
		border: none;
		margin: 0;
		padding: 0;
	}

	.skills-section h3,
	.hobbies-section h3 {
		color: var(--primary-color);
		margin-top: 0;
		margin-bottom: 1rem;
	}

	.skills-group {
		margin-bottom: 1.5rem;
	}

	.skill-bar {
		background: #eee;
		height: 20px;
		border-radius: 10px;
		margin-top: 0.5rem;
		overflow: hidden;
	}

	.skill-progress {
		height: 100%;
		background: var(--secondary-color);
		transition: width 0.3s ease;
	}

	.hobbies-section .skill-progress {
		background: #f1c40f;
	}

	/* Languages */
	.languages-container {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
		margin-top: 1rem;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
	}

	.language-item {
		text-align: center;
	}

	.language-percentage {
		font-size: 2.5rem;
		font-weight: bold;
		color: var(--primary-color);
		margin-bottom: 0.5rem;
	}

	.language-name {
		color: var(--text-color);
		font-size: 1.1rem;
	}

	/* Awards */
	.award {
		margin-bottom: 1rem;
		padding: 1rem;
		border-left: 3px solid var(--secondary-color);
		background: #f8f9fa;
	}

	.award h3 {
		margin-bottom: 0.5rem;
	}

	.award h3 a {
		color: var(--primary-color);
		text-decoration: none;
		transition: all 0.3s ease;
		display: inline-block;
	}

	.award h3 a:hover {
		color: var(--secondary-color);
		transform: translateX(5px);
	}
</style>
</head>
<body>
<div class="header">
	<h1>${data.title}</h1>
	<div class="subtitle">
		${data.role ? `<div class="role">${data.role}</div>` : ""}
		${data.organizations
			? `
			<div class="organizations">
				${data.organizations
				.map(
					(org) => `
					<div>${org.url
							? `
						<a href="${org.url}" target="_blank">${org.name}</a>
					`
							: org.name
						}</div>
				`
				)
				.join("")}
			</div>
		`
			: ""
		}
	</div>
</div>

${data.profiles
			? `
	<section class="profiles">
		${data.profiles
				.map((profile) => {
					let iconClass = "";
					if (profile.icon === "at-symbol") iconClass = "at";
					else if (profile.icon === "brands/x") iconClass = "twitter";
					else if (profile.icon === "brands/github") iconClass = "github";
					else if (profile.icon === "brands/linkedin")
						iconClass = "linkedin";
					return `
			<a href="${profile.url}" target="_blank" title="${profile.label || ""}">
				<span class="icon icon-${iconClass}"></span>
			</a>
		`;
				})
				.join("")}
	</section>
`
			: ""
		}

${data.education
			? `
	<section>
		<h2>Education</h2>
		${data.education
				.map(
					(edu) => `
			<div class="timeline-item">
				<h3>${edu.area}</h3>
				<div class="institution">${edu.institution}</div>
				<div class="date">${formatDate(edu.date_start)} – ${edu.date_end ? formatDate(edu.date_end) : "Present"
						}</div>
				${edu.summary
							? `<div class="summary">${edu.summary.replace(
								/_([^_]+)_/g,
								"<em>$1</em>"
							)}</div>`
							: ""
						}
				${edu.button
							? `<a href="${edu.button.url}" target="_blank" class="thesis-button">${edu.button.text}</a>`
							: ""
						}
			</div>
		`
				)
				.join("")}
	</section>
`
			: ""
		}

${data.work
			? `
	<section>
		<h2>Work Experience</h2>
		${data.work
				.map(
					(job) => `
			<div class="timeline-item">
				<h3>${job.position}</h3>
				<div class="company">
					${job.company_url
							? `
						<a href="${job.company_url}" target="_blank">${job.company_name}</a>
					`
							: job.company_name
						}
				</div>
				<div class="date">${formatDate(job.date_start)} – ${job.date_end ? formatDate(job.date_end) : "Present"
						}</div>
				${job.summary ? `<div class="summary">${job.summary}</div>` : ""}
			</div>
		`
				)
				.join("")}
	</section>
`
			: ""
		}

${data.skills
			? `
	<section>
<h2>Skills & Hobbies</h2>
		<div class="skills-hobbies-container">
			<div class="skills-section">
				<h3>Technical Skills</h3>
				${data.skills
				.map((skillGroup) => {
					if (skillGroup.name === "Hobbies") return "";
					return `
					${skillGroup.items
							.map(
								(skill) => `
						<div class="skill">
							<div class="skill-name">${skill.name}</div>
							<div class="skill-bar">
								<div class="skill-progress" style="width: ${skill.percent}%"></div>
							</div>
						</div>
					`
							)
							.join("")}
				`;
				})
				.join("")}
			</div>
			<div class="hobbies-section">
				<h3>Hobbies</h3>
				${data.skills
				.map((skillGroup) => {
					if (skillGroup.name !== "Hobbies") return "";
					return `
					${skillGroup.items
							.map(
								(skill) => `
						<div class="skill">
							<div class="skill-name">${skill.name}</div>
							<div class="skill-bar">
								<div class="skill-progress" style="width: ${skill.percent}%"></div>
							</div>
						</div>
					`
							)
							.join("")}
				`;
				})
				.join("")}
			</div>
		</div>
	</section>
`
			: ""
		}

${data.languages
			? `
	<section>
		<h2>Languages</h2>
		<div class="languages-container">
			${data.languages
				.map(
					(lang) => `
				<div class="language-item">
					<div class="language-percentage">${lang.percent}%</div>
					<div class="language-name">${lang.name}</div>
				</div>
			`
				)
				.join("")}
		</div>
	</section>
`
			: ""
		}

${data.awards
			? `
	<section>
		<h2>Awards & Achievements</h2>
		${data.awards
				.map(
					(award) => `
			<div class="award">
				<h3>${award.url
							? `<a href="${award.url}" target="_blank">${award.title}</a>`
							: award.title
						}</h3>
				<div>${award.awarder} – ${formatDate(award.date)}</div>
				${award.summary ? `<div class="summary">${award.summary}</div>` : ""}
			</div>
		`
				)
				.join("")}
	</section>
`
			: ""
		}
</body>
</html>`;

	return htmlContent;
}
