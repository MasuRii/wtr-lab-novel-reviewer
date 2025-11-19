/**
 * Batch Processing Logic
 * Handles the main batch processing workflow for novel analysis
 */

import { fetchReviews } from "../api/reviews.js"
import { getGeminiAnalysis } from "../api/gemini.js"
import { updateCardUI, parseNovelFinderCard } from "../ui/components/cards.js"
import { setCachedAssessment } from "../core/cache.js"
import { extractUsernamesFromReviews } from "../utils/colors.js"
import { populateUnknownField } from "../assessment/schema.js"
import { getSerieIdForRawId, showMappingFailureNotification } from "../core/mapping.js"
import { delay } from "../utils/delay.js"
import { FETCH_DELAY_MS } from "../config/constants.js"

/**
 * Process a batch of novels
 * @param {Array} batch - Array of card elements to process
 * @param {Array} overlays - Array of overlay elements
 * @returns {Promise<Array>} Promise resolving to batch results
 */
export async function processBatch(batch, overlays) {
	const novelsData = []
	const batchResults = [] // Array to hold {card, analysis, overlay, serieId} for each processed novel

	for (let i = 0; i < batch.length; i++) {
		const card = batch[i]
		const overlay = overlays[i]

		const currentUrl = window.location.href
		let novelData
		let serieId
		let rawId

		if (currentUrl.includes("wtr-lab.com/en/novel-finder")) {
			novelData = parseNovelFinderCard(card)
			if (!novelData) {
				console.warn("Skipping card, failed to parse novel-finder card.", card)
				continue
			}
			rawId = novelData.raw_id
			serieId = getSerieIdForRawId(rawId)
		} else {
			const linkElement = card.querySelector("a.title")
			rawId = linkElement.dataset.novelId
			serieId = getSerieIdForRawId(rawId)

			if (!serieId) {
				console.error("PROCESSING HALTED: Unable to obtain valid serie_id")
				showMappingFailureNotification()
				overlays.forEach((o) => o && o.remove())
				throw new Error("No valid serie_id available")
			}

			const titleElement = card.querySelector("a.title")
			let title = titleElement ? titleElement.textContent.trim() : "No title"
			if (titleElement && title.startsWith("#")) {
				title = title.split(" ").slice(1).join(" ")
			}
			const rawTitleSpan = titleElement ? titleElement.querySelector(".rawtitle") : null
			if (rawTitleSpan) {
				title = title.replace(rawTitleSpan.textContent, "").trim()
			}

			const viewsLine = card.querySelector(".detail-buttons .detail-line:nth-of-type(1)")
			let totalViews = 0
			if (viewsLine) {
				const match = viewsLine.textContent.match(/(\d+) views/)
				if (match) {
					totalViews = parseInt(match[1], 10)
				}
			}

			const readersLine = card.querySelector(".detail-buttons .detail-line:nth-of-type(2)")
			let totalReaders = 0
			if (readersLine) {
				const match = readersLine.textContent.match(/(\d+) Readers/)
				if (match) {
					totalReaders = parseInt(match[1], 10)
				}
			}

			const ratingElement = card.querySelector(".rating-text")
			let rating = 0
			if (ratingElement) {
				const match = ratingElement.textContent.match(/(\d+\.\d+)/)
				if (match) {
					rating = parseFloat(match[1])
				}
			}

			const tagElements = card.querySelectorAll(".genres .genre")
			const genres = Array.from(tagElements).map((el) => el.textContent.trim())
			const description = card.querySelector(".description")?.textContent.trim() || "No description."

			novelData = {
				serie_id: serieId,
				raw_id: rawId,
				title,
				totalViews,
				totalReaders,
				rating,
				genres,
				description,
			}
		}

		const reviews = await fetchReviews(serieId)
		const reviewsWithComments = reviews.filter((r) => r.comment)
		const reviewsText = reviewsWithComments
			.map((r) => `- User: ${r.username || "Unknown"}\n- Rating: ${r.rate}/5\n- Comment: ${r.comment}`)
			.join("\n\n")
		const availableUsernames = extractUsernamesFromReviews(reviewsWithComments)

		novelsData.push({
			...novelData,
			reviewsText,
			availableUsernames,
		})
		batchResults.push({ card, overlay, serieId: serieId })

		await delay(FETCH_DELAY_MS) // Wait between each fetch to be polite
	}

	if (novelsData.length === 0) {
		// All novels in batch were cached - return successfully without error
		return { batchResults, novelsData: [] }
	}

	const analyses = await getGeminiAnalysis(novelsData)

	if (analyses.length !== novelsData.length) {
		throw new Error("Mismatch between number of novels sent and analyses received.")
	}

	// Apply analyses and cache them
	batchResults.forEach(({ card, overlay, serieId }, index) => {
		let analysis = analyses[index]
		const novelData = novelsData[index]
		if (analysis) {
			// Ensure analysis has availableUsernames for color coding
			if (!analysis.availableUsernames && novelData && novelData.availableUsernames) {
				analysis.availableUsernames = novelData.availableUsernames
			}
			// Ensure unknown field exists (forward compatibility)
			analysis = populateUnknownField(analysis)
			updateCardUI(card, analysis)
			setCachedAssessment(serieId, analysis)
			// Mark as processed only after successful analysis and caching
			card.dataset.geminiProcessed = "true"
		}
		if (overlay) {
			overlay.remove()
		}
	})

	return { batchResults, novelsData }
}
