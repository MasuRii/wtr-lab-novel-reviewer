/**
 * Novel Card Components
 * Handles card UI updates and modifications for novel assessment display
 */

import { colorCodeReviewSummary } from "../../utils/colors.js"

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
	// Populate unknown field if missing (backward compatibility)
	analysis = populateUnknownField(analysis)

	if (!analysis || !analysis.assessment || !analysis.summary) {
		return
	}

	const assessmentLower = analysis.assessment.toLowerCase()
	if (assessmentLower === "good") {
		card.classList.add("gemini-good-novel")
	} else if (assessmentLower === "mixed") {
		card.classList.add("gemini-mixed-novel")
	} else if (assessmentLower === "bad") {
		card.classList.add("gemini-bad-novel")
	}

	const container = document.createElement("div")
	container.className = "gemini-summary-container"

	const overallClass = getRatingClass(analysis.assessment)
	const characterClass = getRatingClass(analysis.characterDevelopment)
	const plotClass = getRatingClass(analysis.plotStructure)
	const worldClass = getRatingClass(analysis.worldBuilding)
	const themesClass = getRatingClass(analysis.themesAndMessages)
	const writingClass = getRatingClass(analysis.writingStyle)
	const unknownClass = getRatingClass(analysis.unknown)

	// Extract usernames for color coding (if available in analysis)
	const availableUsernames = analysis.availableUsernames || []

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
		const displayValue = analysis.themesAndMessages === "Unknown" ? "Insufficient Data" : analysis.themesAndMessages
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

	// Find the title-wrap element within the card
	const titleWrap = card.querySelector(".title-wrap")

	// Create the trigger button as a separate element
	const summaryTrigger = document.createElement("div")
	summaryTrigger.className = "gemini-summary-trigger"
	summaryTrigger.title = "Show AI Summary"
	summaryTrigger.innerHTML = `<span class="${iconConfig.iconClass}">${iconConfig.autoAwesomeIcon}</span>`

	// Add toggle functionality after DOM insertion
	const summaryCard = container.querySelector(".gemini-summary-card")
	const toggles = summaryCard.querySelectorAll(".summary-toggle")

	// Add click event to toggle lock state
	let isLocked = false
	summaryTrigger.addEventListener("click", function (event) {
		event.stopPropagation()
		isLocked = !isLocked
		if (isLocked) {
			summaryCard.classList.add("locked")
		} else {
			summaryCard.classList.remove("locked")
		}
	})

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
