/**
 * Serie ID Mapping System
 * Handles mapping between raw_id and serie_id for API calls
 */

import { MAPPING_RETRY_ATTEMPTS, MAPPING_RETRY_DELAY } from "../config/constants.js"
import { delay } from "../utils/delay.js"
import { debugLog } from "../utils/debug.js"

// Map from raw_id to serie_id for correct review API calls
const serieIdMap = new Map()

// Track if user has been notified about mapping failure
let mappingFailureNotified = false

/**
 * Build serie_id mapping from __NEXT_DATA__
 * @returns {Promise<boolean>} Success status
 */
export async function buildSerieIdMap() {
	debugLog("Building serie_id mapping from __NEXT_DATA__")
	const nextDataScript = document.querySelector('script[id="__NEXT_DATA__"]')
	if (!nextDataScript) {
		console.warn("__NEXT_DATA__ script not found. Unable to build serie_id mapping.")
		return false
	}

	try {
		const nextData = JSON.parse(nextDataScript.textContent)
		const pageProps = nextData.props?.pageProps
		const currentUrl = window.location.href

		if (currentUrl.includes("wtr-lab.com/en/novel-finder")) {
			if (pageProps?.series) {
				pageProps.series.forEach((item) => {
					if (item.raw_id && item.id) {
						serieIdMap.set(item.raw_id.toString(), item.id.toString())
					}
				})
			}
		} else if (pageProps?.list) {
			pageProps.list.forEach((item) => {
				if (item.raw_id && item.serie_id) {
					serieIdMap.set(item.raw_id.toString(), item.serie_id.toString())
				}
			})
		}
		debugLog(`Built serie_id map with ${serieIdMap.size} entries`)

		// Validate mapping was successful
		if (serieIdMap.size === 0) {
			console.error("Serie ID mapping failed: Map is empty after building")
			return false
		}
		return true
	} catch (error) {
		console.error("Error parsing __NEXT_DATA__:", error)
		return false
	}
}

/**
 * Validate and build serie_id mapping with retry logic
 * @returns {Promise<boolean>} Success status
 */
export async function validateAndBuildSerieIdMap() {
	for (let attempt = 1; attempt <= MAPPING_RETRY_ATTEMPTS; attempt++) {
		debugLog(`Attempting to build serie_id map (Attempt ${attempt}/${MAPPING_RETRY_ATTEMPTS})`)
		const success = await buildSerieIdMap()

		if (success) {
			debugLog("Serie ID mapping validation: SUCCESS")
			return true
		}

		console.warn(`Serie ID mapping failed on attempt ${attempt}/${MAPPING_RETRY_ATTEMPTS}`)

		if (attempt < MAPPING_RETRY_ATTEMPTS) {
			debugLog(`Retrying in ${MAPPING_RETRY_DELAY}ms...`)
			await delay(MAPPING_RETRY_DELAY)
		}
	}

	// All attempts failed
	console.error("Serie ID mapping validation: FAILED after all retry attempts")
	return false
}

/**
 * Validate serie_id mapping
 * @param {string} rawId - The raw ID
 * @param {string} serieId - The serie ID to validate
 * @returns {boolean} Validation result
 */
export function validateSerieIdMapping(rawId, serieId) {
	// Check if serieId is valid
	if (!serieId || serieId === null || serieId === undefined || serieId === "") {
		debugLog(`Mapping validation FAILED: Invalid serie_id for raw_id ${rawId}`)
		return false
	}

	// Check if serieId is a valid format (should be numeric string)
	if (!/^\d+$/.test(serieId.toString())) {
		debugLog(`Mapping validation FAILED: Invalid serie_id format "${serieId}" for raw_id ${rawId}`)
		return false
	}

	debugLog(`Mapping validation SUCCESS: raw_id ${rawId} -> serie_id ${serieId}`)
	return true
}

/**
 * Get serie_id for a raw_id
 * @param {string} rawId - The raw ID
 * @returns {string|null} The mapped serie_id or null if not found
 */
export function getSerieIdForRawId(rawId) {
	return serieIdMap.get(rawId) || null
}

/**
 * Get the entire serieIdMap
 * @returns {Map<string, string>} The serie ID map
 */
export function getSerieIdMap() {
	return serieIdMap
}

/**
 * Check if mapping is available for a raw_id
 * @param {string} rawId - The raw ID to check
 * @returns {boolean} Whether mapping exists
 */
export function hasMappingForRawId(rawId) {
	return serieIdMap.has(rawId)
}

/**
 * Get the size of the mapping
 * @returns {number} Number of mappings
 */
export function getMappingSize() {
	return serieIdMap.size
}

/**
 * Reset mapping failure notification flag
 */
export function resetMappingFailureNotification() {
	mappingFailureNotified = false
}

/**
 * Show mapping failure notification to user
 */
export function showMappingFailureNotification() {
	if (mappingFailureNotified) {
		return // Already notified, don't spam
	}

	mappingFailureNotified = true

	// Create notification element with fallback icon
	const iconClass = window.__ICON_REPLACEMENTS__ ? "material-icons-fallback" : "material-icons"
	const errorIcon = window.__ICON_REPLACEMENTS__ ? "⚠️" : "error"

	const notification = document.createElement("div")
	notification.id = "gemini-mapping-failure-notification"
	notification.innerHTML = `
		<div class="notification-content">
			<span class="${iconClass} notification-icon">${errorIcon}</span>
			<div class="notification-text">
				<strong>Serie ID Mapping Failed</strong>
				<p>Unable to map novel IDs correctly. Please refresh the page to retry.</p>
			</div>
			<button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
		</div>
	`

	document.body.appendChild(notification)

	console.error("MAPPING FAILURE: User has been notified to refresh the page")
	debugLog("Mapping failure notification displayed to user")
}
