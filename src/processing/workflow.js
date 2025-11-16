/**
 * Processing Workflow Management
 * Handles the main processing workflow including API key management and single novel processing
 */

import { getApiKey } from "../config/settings.js"
import { showApiKeyModal } from "../ui/components/panels.js"
import {
	getSerieIdForRawId,
	getMappingSize,
	validateSerieIdMapping,
	showMappingFailureNotification,
} from "../core/mapping.js"
import { getCachedAssessment } from "../core/cache.js"
import { updateCardUI } from "../ui/components/cards.js"
import { populateUnknownField } from "../assessment/schema.js"
import { processBatch } from "./batch.js"
import { addLoadingOverlay } from "../ui/components/cards.js"
import { debugLog } from "../utils/debug.js"

/**
 * Display cached assessments on the page
 */
export function displayCachedAssessments() {
	const novelCards = Array.from(
		document.querySelectorAll(
			".series-list > .card:not([data-gemini-processed]):not([data-gemini-cached-checked])",
		),
	)
	novelCards.forEach((card) => {
		const linkElement = card.querySelector("a[data-novel-id]")
		let serieId = null
		let rawId = null

		if (linkElement) {
			rawId = linkElement.dataset.novelId
			if (rawId) {
				serieId = getSerieIdForRawId(rawId)
			} else {
				// Fallback: Extract from href or use raw_id directly
				if (linkElement.href) {
					const match = linkElement.href.match(/\/novel\/(\d+)\//)
					if (match && match[1]) {
						serieId = match[1]
					}
				}
				if (!serieId && rawId) {
					serieId = rawId // Last resort
				}
			}
		}

		if (serieId) {
			let cachedAnalysis = getCachedAssessment(serieId)
			if (cachedAnalysis) {
				// Ensure cached analysis has availableUsernames for color coding
				if (!cachedAnalysis.availableUsernames) {
					cachedAnalysis.availableUsernames = []
				}
				// Ensure unknown field exists for backward compatibility
				cachedAnalysis = populateUnknownField(cachedAnalysis)
				updateCardUI(card, cachedAnalysis)
			}
		}
		// Mark as checked for cached status
		card.dataset.geminiCachedChecked = "true"
	})
}

/**
 * Main function to process novels
 */
export async function processNovels() {
	if (!getApiKey()) {
		const modalSet = await showApiKeyModal()
		if (!modalSet) {
			return // User cancelled or closed modal
		}
	}

	// Validate serie_id mapping before proceeding
	if (getMappingSize() === 0) {
		console.error("PROCESSING HALTED: Serie ID map is empty. Cannot proceed with invalid mappings.")
		debugLog("Processing aborted: Serie ID map validation failed (empty map)")
		showMappingFailureNotification()
		return
	}

	const allNovelCards = Array.from(document.querySelectorAll(".series-list > .card"))
	const uncachedNovelCards = []

	for (const card of allNovelCards) {
		const linkElement = card.querySelector("a[data-novel-id]")
		let serieId = null
		let rawId = null

		if (linkElement) {
			rawId = linkElement.dataset.novelId
			if (rawId) {
				serieId = getSerieIdForRawId(rawId)

				// Strict validation: verify the mapping is valid
				if (serieId && !validateSerieIdMapping(rawId, serieId)) {
					console.error(`PROCESSING HALTED: Invalid serie_id mapping detected for raw_id ${rawId}`)
					debugLog(`Processing aborted: Mapping validation failed for raw_id ${rawId}`)
					showMappingFailureNotification()
					return
				}
			} else {
				// NO FALLBACK - strict mapping required
				console.warn(`No serie_id mapping found for raw_id ${rawId}. Skipping this novel.`)
				debugLog(`Skipping novel with raw_id ${rawId}: No mapping in serieIdMap`)
				continue
			}
		}

		if (serieId && !getCachedAssessment(serieId)) {
			uncachedNovelCards.push(card)
		}
	}

	if (uncachedNovelCards.length === 0) {
		alert("No new novels to analyze.")
		return
	}

	const batch = uncachedNovelCards.slice(0, 1)
	const overlays = batch.map((card) => addLoadingOverlay(card))

	try {
		const result = await processBatch(batch, overlays)

		// Check if novel was cached
		if (result.novelsData.length === 0) {
			debugLog("Novel was cached - no API call needed")
		}
	} catch (error) {
		console.error("An error occurred during single novel processing:", error)
		overlays.forEach((overlay) => {
			if (overlay) {
				overlay.textContent = "Processing Failed"
				setTimeout(() => overlay.remove(), 4000)
			}
		})
	}
}
