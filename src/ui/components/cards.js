/**
 * Novel Card Components
 * Handles card UI updates and modifications for novel assessment display
 */

import { colorCodeReviewSummary } from "../../utils/colors.js"
import { processSpecificNovel } from "../../processing/workflow.js"

/**
 * Get CSS class for rating
 * @param {string} rating - The rating value
 * @returns {string} CSS class name
 */
function getRatingClass(rating) {
	if (!rating) {
		return ""
	}
	const ratingLower = rating.toLowerCase()
	if (
		ratingLower.includes("good") ||
		ratingLower.includes("excellent") ||
		ratingLower.includes("outstanding") ||
		ratingLower.includes("very good") ||
		ratingLower.includes("strong")
	) {
		return "good"
	} else if (
		ratingLower.includes("mixed") ||
		ratingLower.includes("average") ||
		ratingLower.includes("decent") ||
		ratingLower.includes("fair") ||
		ratingLower.includes("moderate")
	) {
		return "mixed"
	} else if (
		ratingLower.includes("bad") ||
		ratingLower.includes("poor") ||
		ratingLower.includes("weak") ||
		ratingLower.includes("lacking") ||
		ratingLower.includes("needs improvement")
	) {
		return "bad"
	} else if (
		ratingLower.includes("unknown") ||
		ratingLower.includes("missing") ||
		ratingLower.includes("unspecified") ||
		ratingLower.includes("undetermined") ||
		ratingLower.includes("insufficient")
	) {
		return "unknown"
	}
	return ""
}

/**
 * Populate unknown field for backward compatibility
 * @param {Object} analysis - The analysis object
 * @returns {Object} Analysis with unknown field populated
 */
function populateUnknownField(analysis) {
	// Ensure unknown field exists for backward compatibility with cached data
	if (!analysis.unknown) {
		// Default unknown field to "Mixed" if not present in cached data
		analysis.unknown = "Mixed"
	}
	return analysis
}

/**
 * Update card UI with assessment data
 * @param {Element} card - The DOM card element
 * @param {Object} analysis - The assessment analysis
 */
export function updateCardUI(card, analysis) {
	// Check if we have analysis data to display
	const hasAnalysis = analysis && analysis.assessment && analysis.summary

	// Only populate unknown field and add card styling if we have analysis
	if (hasAnalysis) {
		// Populate unknown field if missing (backward compatibility)
		analysis = populateUnknownField(analysis)

		const assessmentLower = analysis.assessment.toLowerCase()
		if (assessmentLower === "good") {
			card.classList.add("gemini-good-novel")
		} else if (assessmentLower === "mixed") {
			card.classList.add("gemini-mixed-novel")
		} else if (assessmentLower === "bad") {
			card.classList.add("gemini-bad-novel")
		}
	}

	// Use fallback icons if Material Icons are not available
	const iconConfig = window.__ICON_REPLACEMENTS__
		? {
				iconClass: "material-icons-fallback",
				expandIcon: "▼",
				autoAwesomeIcon: "⭐",
			}
		: {
				iconClass: "material-icons",
				expandIcon: "expand_more",
				autoAwesomeIcon: "auto_awesome",
			}

	const container = document.createElement("div")
	container.className = "gemini-summary-container"

	let summaryCard = null

	// Only create the summary content if we have analysis data
	if (hasAnalysis) {
		const overallClass = getRatingClass(analysis.assessment)
		const characterClass = getRatingClass(analysis.characterDevelopment)
		const plotClass = getRatingClass(analysis.plotStructure)
		const worldClass = getRatingClass(analysis.worldBuilding)
		const themesClass = getRatingClass(analysis.themesAndMessages)
		const writingClass = getRatingClass(analysis.writingStyle)
		const unknownClass = getRatingClass(analysis.unknown)

		// Extract usernames for color coding (if available in analysis)
		const availableUsernames = analysis.availableUsernames || []

		let detailedAssessment = `<h4>AI Novel Assessment</h4>`
		detailedAssessment += `<div class="summary-toggle collapsed" data-target="novel-summary">`
		detailedAssessment += `<span>Novel Summary</span>`
		detailedAssessment += `<span class="${iconConfig.iconClass} toggle-icon">${iconConfig.expandIcon}</span>`
		detailedAssessment += `</div>`
		detailedAssessment += `<div class="summary-content" id="novel-summary">`
		detailedAssessment += `<p>${analysis.novelSummary}</p>`
		detailedAssessment += `</div>`

		// Apply color coding to review summary
		const coloredReviewSummary = colorCodeReviewSummary(analysis.reviewSummary, availableUsernames)

		detailedAssessment += `<div class="summary-toggle collapsed" data-target="review-summary">`
		detailedAssessment += `<span>Review Summary</span>`
		detailedAssessment += `<span class="${iconConfig.iconClass} toggle-icon">${iconConfig.expandIcon}</span>`
		detailedAssessment += `</div>`
		detailedAssessment += `<div class="summary-content" id="review-summary">`
		detailedAssessment += `<p>${coloredReviewSummary}</p>`
		detailedAssessment += `</div>`

		detailedAssessment += `<div class="assessment-section">`
		detailedAssessment += `<strong>Overall Assessment:</strong> <span class="assessment-rating ${overallClass}">${analysis.assessment}</span><br><hr style="margin: 5px 0;">`
		detailedAssessment += `<strong>Analysis Summary:</strong> ${analysis.summary}<br><hr style="margin: 5px 0;">`

		if (analysis.characterDevelopment) {
			const displayValue =
				analysis.characterDevelopment === "Unknown" ? "Insufficient Data" : analysis.characterDevelopment
			detailedAssessment += `<strong>Character Development:</strong> <span class="assessment-rating ${characterClass}">${displayValue}</span><br>`
		}
		if (analysis.plotStructure) {
			const displayValue = analysis.plotStructure === "Unknown" ? "Insufficient Data" : analysis.plotStructure
			detailedAssessment += `<strong>Plot Structure:</strong> <span class="assessment-rating ${plotClass}">${displayValue}</span><br>`
		}
		if (analysis.worldBuilding) {
			const displayValue = analysis.worldBuilding === "Unknown" ? "Insufficient Data" : analysis.worldBuilding
			detailedAssessment += `<strong>World-Building:</strong> <span class="assessment-rating ${worldClass}">${displayValue}</span><br>`
		}
		if (analysis.themesAndMessages) {
			const displayValue =
				analysis.themesAndMessages === "Unknown" ? "Insufficient Data" : analysis.themesAndMessages
			detailedAssessment += `<strong>Themes & Messages:</strong> <span class="assessment-rating ${themesClass}">${displayValue}</span><br>`
		}
		if (analysis.writingStyle) {
			const displayValue = analysis.writingStyle === "Unknown" ? "Insufficient Data" : analysis.writingStyle
			detailedAssessment += `<strong>Writing Style:</strong> <span class="assessment-rating ${writingClass}">${displayValue}</span><br>`
		}

		// Only show the legacy Unknown section for backward compatibility with cached assessments
		// New assessments won't have meaningful unknown data since Unknown is now per-category
		if (analysis.unknown && analysis.unknown !== "Mixed") {
			detailedAssessment += `<strong>Legacy Unknown Data:</strong> <span class="assessment-rating ${unknownClass}">${analysis.unknown}</span><br>`
		}

		detailedAssessment += `</div>`

		container.innerHTML = `
			<div class="gemini-summary-card">
				${detailedAssessment}
			</div>
		`

		summaryCard = container.querySelector(".gemini-summary-card")
	}

	// Find the title-wrap element within the card
	const titleWrap = card.querySelector(".title-wrap")

	// Create the trigger button as a separate element
	const summaryTrigger = document.createElement("div")
	summaryTrigger.className = "gemini-summary-trigger"
	summaryTrigger.title = hasAnalysis ? "Show AI Summary" : "Analyze Novel"
	summaryTrigger.innerHTML = `<span class="${iconConfig.iconClass}">${iconConfig.autoAwesomeIcon}</span>`

	// Add click event for dual-purpose functionality
	let isLocked = false
	summaryTrigger.addEventListener("click", async function (event) {
		event.stopPropagation()

		// If no analysis (no cache), initiate analysis workflow
		if (!hasAnalysis) {
			try {
				await processSpecificNovel(card)
			} catch (error) {
				console.error("Error processing specific novel:", error)
			}
			return
		}

		// If analysis exists (has cache), execute existing toggle logic
		isLocked = !isLocked
		if (isLocked) {
			summaryCard.classList.add("locked")
		} else {
			summaryCard.classList.remove("locked")
		}
	})

	// Add toggle functionality after DOM insertion only if we have analysis
	if (hasAnalysis) {
		const toggles = summaryCard.querySelectorAll(".summary-toggle")
		toggles.forEach((toggle) => {
			toggle.addEventListener("click", function () {
				const targetId = this.dataset.target
				const content = summaryCard.querySelector(`#${targetId}`)
				const isCollapsed = this.classList.contains("collapsed")

				if (isCollapsed) {
					this.classList.remove("collapsed")
					content.classList.add("expanded")
				} else {
					this.classList.add("collapsed")
					content.classList.remove("expanded")
				}
			})
		})
	}

	// Move trigger button to title-wrap and container (with summary card) to card
	if (titleWrap) {
		titleWrap.appendChild(summaryTrigger)
	}
	card.appendChild(container)
}

/**
 * Add loading overlay to a card
 * @param {Element} card - The card element
 * @returns {Element} The overlay element
 */
export function addLoadingOverlay(card) {
	const overlay = document.createElement("div")
	overlay.className = "gemini-processing-overlay"
	overlay.textContent = "Analyzing..."
	const cardBody = card.querySelector(".card-body")
	if (cardBody) {
		cardBody.style.position = "relative"
		cardBody.appendChild(overlay)
	}
	return overlay
}
/**
 * Parse novel data from a novel-finder card
 * @param {Element} card - The card element
 * @returns {Object|null} The extracted novel data or null if parsing fails
 */
export function parseNovelFinderCard(card) {
	const titleElement = card.querySelector(".title-wrap .title")
	const rawTitleElement = card.querySelector(".rawtitle")
	const urlElement = card.querySelector(".title-wrap a")
	const coverElement = card.querySelector("picture source[srcset]")
	const detailLines = card.querySelectorAll(".detail-line")
	const genres = Array.from(card.querySelectorAll(".genres .genre")).map((g) => g.textContent.trim())
	const descriptionElement = card.querySelector(".desc-wrap .description")

	if (!titleElement || !urlElement) {
		return null
	}

	const url = urlElement.href
	const match = url.match(/\/novel\/(\d+)\//)
	if (!match || !match[1]) {
		return null
	}
	const rawId = match[1]
	const serieId = match[1]

	let status = "Unknown"
	let views = "0"
	let chapters = "0"
	let readers = "0"

	if (detailLines.length > 0) {
		const statusLine = detailLines[0].textContent.trim()
		const statusMatch = statusLine.match(/•\s*(\w+)/)
		if (statusMatch && statusMatch[1]) {
			status = statusMatch[1]
		}
		const viewsMatch = statusLine.match(/·\s*([\d,]+)\s*views/i)
		if (viewsMatch && viewsMatch[1]) {
			views = viewsMatch[1].replace(/,/g, "")
		}
	}

	if (detailLines.length > 1) {
		const chapterLine = detailLines[1].textContent.trim()
		const chapterMatch = chapterLine.match(/([\d,]+)\s*Chapters/i)
		if (chapterMatch && chapterMatch[1]) {
			chapters = chapterMatch[1].replace(/,/g, "")
		}
		const readersMatch = chapterLine.match(/·\s*([\d,]+)\s*Readers/i)
		if (readersMatch && readersMatch[1]) {
			readers = readersMatch[1].replace(/,/g, "")
		}
	}

	return {
		serie_id: serieId, // This will be null
		raw_id: rawId,
		title: titleElement.firstChild.textContent.trim(),
		raw_title: rawTitleElement ? rawTitleElement.textContent.trim() : "",
		url: url,
		cover_url: coverElement ? coverElement.srcset.split(" ")[0] : "",
		status: status,
		views: parseInt(views, 10),
		chapters: parseInt(chapters, 10),
		readers: parseInt(readers, 10),
		genres: genres,
		description: descriptionElement ? descriptionElement.textContent.trim() : "",
	}
}
