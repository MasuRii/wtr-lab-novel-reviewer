/**
 * Gemini AI Integration
 * Handles communication with Google's Gemini API for novel analysis
 */

import { MAX_RETRIES, INITIAL_DELAY_MS } from "../config/constants.js"
import { getApiKey, getGeminiModel } from "../config/settings.js"
import { debugLog } from "../utils/debug.js"

/**
 * Get Gemini analysis for novels
 * @param {Array} novelsData - Array of novel data objects
 * @returns {Promise<Array>} Promise resolving to array of analysis objects
 */
export function getGeminiAnalysis(novelsData) {
	const prompt = `
	              Analyze the following list of novels. For each novel, use its title, view count, reader count, rating, genres, description, and user reviews to provide a comprehensive assessment across multiple categories.
	              Return a single JSON array. Each object in the array must correspond to a novel in the input list, maintaining the original order.

	              For each novel, provide:
	              1. A novel summary: A concise 2-3 sentence summary of what the novel is about, based primarily on the title, description, genres, and user reviews.
	              2. A review summary: A balanced summary of user feedback from the reviews, including positive and negative points, with proper attribution to usernames (e.g., "According to [User], ..."). Use EXACT usernames from the availableUsernames list when making attributions.

	              Then provide detailed assessments in the following categories:
	              - Overall assessment (Good/Mixed/Bad)
	              - Character Development (Good/Mixed/Bad/Unknown)
	              - Plot Structure (Good/Mixed/Bad/Unknown)
	              - World-Building (Good/Mixed/Bad/Unknown)
	              - Themes & Messages (Good/Mixed/Bad/Unknown)
	              - Writing Style (Good/Mixed/Bad/Unknown)

	              For each category, include specific criteria:
	              - Character Development: character depth, growth, consistency, dialogue authenticity, relationship dynamics
	              - Plot Structure: pacing, narrative flow, story coherence, conflict resolution, foreshadowing
	              - World-Building: setting details, consistency, immersion, cultural depth, originality
	              - Themes & Messages: clarity, relevance, integration, thought provocation, balance
	              - Writing Style: prose quality, descriptive language, dialogue naturalness, grammar, technical execution

	              CRITICAL: Each category can be rated as "Unknown" when:
	              - Character Development: No character development information found in available data
	              - Plot Structure: No plot structure information found in available data
	              - World-Building: No world-building details found in available data
	              - Themes & Messages: No theme or message information found in available data
	              - Writing Style: No writing style information found in available data

	              Important distinctions:
	              - "Unknown" means: insufficient data to make a reliable assessment for that specific aspect
	              - "Bad" means: poor quality or problematic implementation of that aspect
	              - Use "Unknown" when data is genuinely missing or insufficient, NOT when quality is poor

	              Novels List:
	              ${JSON.stringify(novelsData, null, 2)}
	      `

	const schema = {
		type: "array",
		items: {
			type: "object",
			properties: {
				novelSummary: {
					type: "string",
					description: "A concise 2-3 sentence summary of what the novel is about.",
				},
				reviewSummary: {
					type: "string",
					description: "A balanced summary of user feedback with proper username attribution.",
				},
				assessment: { type: "string", enum: ["Good", "Mixed", "Bad"] },
				summary: {
					type: "string",
					description: "A brief 2-3 sentence summary explaining the overall assessment.",
				},
				characterDevelopment: { type: "string", enum: ["Good", "Mixed", "Bad", "Unknown"] },
				plotStructure: { type: "string", enum: ["Good", "Mixed", "Bad", "Unknown"] },
				worldBuilding: { type: "string", enum: ["Good", "Mixed", "Bad", "Unknown"] },
				themesAndMessages: { type: "string", enum: ["Good", "Mixed", "Bad", "Unknown"] },
				writingStyle: { type: "string", enum: ["Good", "Mixed", "Bad", "Unknown"] },
			},
			required: [
				"novelSummary",
				"reviewSummary",
				"assessment",
				"summary",
				"characterDevelopment",
				"plotStructure",
				"worldBuilding",
				"themesAndMessages",
				"writingStyle",
			],
		},
	}

	const safetySettings = [
		{ category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
		{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
		{ category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
		{ category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
	]

	const requestData = JSON.stringify({
		contents: [{ parts: [{ text: prompt }] }],
		generationConfig: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.3 },
		safetySettings: safetySettings,
	})

	debugLog("Gemini Prompt:", prompt)

	return new Promise((resolve, reject) => {
		let retries = 0
		const executeRequest = () => {
			const apiKey = getApiKey()
			const model = getGeminiModel()

			GM_xmlhttpRequest({
				method: "POST",
				url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
				headers: { "Content-Type": "application/json" },
				data: requestData,
				onload: function (response) {
					try {
						const apiResponse = JSON.parse(response.responseText)
						debugLog("Gemini Raw Response:", apiResponse)

						if (apiResponse.candidates && apiResponse.candidates.length > 0) {
							const analyses = JSON.parse(apiResponse.candidates[0].content.parts[0].text)
							resolve(analyses)
						} else {
							const errorMsg = apiResponse.promptFeedback
								? `Gemini block reason: ${JSON.stringify(apiResponse.promptFeedback)}`
								: "Gemini API returned no candidates."
							console.error("Gemini API Response Error:", apiResponse)

							if (retries < MAX_RETRIES) {
								retries++
								const delayMs = INITIAL_DELAY_MS * Math.pow(2, retries - 1)
								console.warn(
									`Retrying Gemini request in ${delayMs}ms (Attempt ${retries}/${MAX_RETRIES}). Error: ${errorMsg}`,
								)
								setTimeout(executeRequest, delayMs)
							} else {
								reject(`Gemini API failed after ${MAX_RETRIES} retries. Last error: ${errorMsg}`)
							}
						}
					} catch (e) {
						if (retries < MAX_RETRIES) {
							retries++
							const delayMs = INITIAL_DELAY_MS * Math.pow(2, retries - 1)
							console.warn(
								`Retrying Gemini request in ${delayMs}ms (Attempt ${retries}/${MAX_RETRIES}). Error: Failed to parse response: ${e}`,
							)
							setTimeout(executeRequest, delayMs)
						} else {
							reject(
								`Failed to parse Gemini response after ${MAX_RETRIES} retries: ${e}\nResponse: ${response.responseText}`,
							)
						}
					}
				},
				onerror: (response) => {
					if (retries < MAX_RETRIES) {
						retries++
						const delayMs = INITIAL_DELAY_MS * Math.pow(2, retries - 1)
						console.warn(
							`Retrying Gemini request in ${delayMs}ms (Attempt ${retries}/${MAX_RETRIES}). Error: API request failed: ${response.statusText}`,
						)
						setTimeout(executeRequest, delayMs)
					} else {
						reject(`Gemini API request failed after ${MAX_RETRIES} retries: ${response.statusText}`)
					}
				},
			})
		}
		executeRequest()
	})
}
