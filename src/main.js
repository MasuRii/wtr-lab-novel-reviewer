/**
 * Main Initialization Module
 * Handles initialization and setup of the WTR-Lab Novel Reviewer
 */

import { loadConfig } from "./config/settings.js"
import { validateAndBuildSerieIdMap } from "./core/mapping.js"
import { createSettingsPanel, createApiKeyModal, setupConfig } from "./ui/components/panels.js"
import { displayCachedAssessments } from "./processing/workflow.js"
import { showMappingFailureNotification } from "./core/mapping.js"

// Import CSS styles
import "./ui/styles/index.js"

/**
 * Main initialization function
 */
export async function main() {
	loadConfig()

	// Validate and build serie_id mapping with retry logic
	const mappingSuccess = await validateAndBuildSerieIdMap()
	if (!mappingSuccess) {
		console.error("INITIALIZATION FAILED: Unable to build serie_id mapping after all retries")
		showMappingFailureNotification()
		// Continue with initialization but user will be notified
	}

	createSettingsPanel()
	createApiKeyModal()
	setupConfig()

	const observer = new MutationObserver(() => {
		if (document.querySelector(".series-list")) {
			displayCachedAssessments()
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}
