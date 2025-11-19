/**
 * Main Initialization Module
 * Handles initialization and setup of the WTR-Lab Novel Reviewer
 */

import { loadConfig } from "./config/settings.js"
import {
	validateAndBuildSerieIdMap,
	updateMappingFromFetch,
	showMappingFailureNotification,
	resetMappingFailureNotification,
} from "./core/mapping.js"
import { createSettingsPanel, createApiKeyModal, setupConfig } from "./ui/components/panels.js"
import { displayCachedAssessments } from "./processing/workflow.js"
import { setupRouteChangeListener } from "./utils/router.js"
import { debugLog } from "./utils/debug.js"

// Import CSS styles
import "./ui/styles/index.js"

// Supported routes regex patterns
const SUPPORTED_ROUTES = [/^https:\/\/wtr-lab\.com\/en\/for-you/, /^https:\/\/wtr-lab\.com\/en\/novel-finder/]

// Debounce timer
let debounceTimer = null

// Global observer reference
let observer = null

/**
 * Initialize application logic for the current view
 */
async function initView() {
	debugLog("Initializing view context...")
	resetMappingFailureNotification()

	// Validate and build serie_id mapping
	// We use the retry logic here to allow time for DOM/data to settle
	const mappingSuccess = await validateAndBuildSerieIdMap()

	if (!mappingSuccess) {
		console.warn("View initialization: Unable to build/update serie_id mapping")
		// We don't necessarily block everything, as cached data might still work
		// if the map isn't strictly required for display (though it is for processing)
		showMappingFailureNotification()
	} else {
		// If mapping succeeded, ensure we update the UI
		displayCachedAssessments()
	}
}

/**
 * Check if the current route is supported
 * @param {string} url - The URL to check
 * @returns {boolean} True if supported
 */
function isRouteSupported(url) {
	return SUPPORTED_ROUTES.some((regex) => regex.test(url))
}

/**
 * Handle client-side route changes
 * @param {string} url - The new URL
 */
async function handleRouteChange(url) {
	// Clear existing timer
	if (debounceTimer) {
		clearTimeout(debounceTimer)
	}

	// Set new timer for debounce
	debounceTimer = setTimeout(async () => {
		debugLog(`Processing route change for: ${url}`)

		if (!isRouteSupported(url)) {
			debugLog("[WTR-Lab] Unsupported route. Going idle.")
			return
		}

		// Attempt to update mapping from Next.js data
		// This is crucial for SPA navigation where __NEXT_DATA__ is stale
		const success = await updateMappingFromFetch(url)

		if (success) {
			resetMappingFailureNotification()
			displayCachedAssessments()
		} else {
			// Fallback to standard initialization (checks DOM/stale data)
			await initView()
		}
	}, 500)
}

/**
 * Main initialization function
 */
export async function main() {
	debugLog("WTR-Lab Novel Reviewer starting...")
	loadConfig()

	// Setup global UI components (one-time setup)
	createSettingsPanel()
	createApiKeyModal()
	setupConfig()

	// Setup route change listener for SPA navigation
	setupRouteChangeListener(handleRouteChange)

	// Run initial view setup
	await initView()

	// Setup MutationObserver to handle dynamic content loading
	// This ensures cards are processed as they appear in the DOM
	if (observer) {
		observer.disconnect()
	}

	observer = new MutationObserver((mutations) => {
		if (!isRouteSupported(window.location.href)) {
			return
		}

		// Check if we should update (basic debounce/check could be added if needed)
		const hasRelevantMutation = mutations.some(
			(m) =>
				m.addedNodes.length > 0 &&
				(m.target.classList?.contains("series-list") ||
					document.querySelector(".series-list") ||
					document.querySelector(".card")),
		)

		if (hasRelevantMutation) {
			displayCachedAssessments()
		}
	})

	observer.observe(document.body, { childList: true, subtree: true })
	debugLog("MutationObserver started")
}
