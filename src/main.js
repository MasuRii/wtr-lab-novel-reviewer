/**
 * Main Initialization Module
 * Handles initialization and setup of the WTR-Lab Novel Reviewer
 */

import { loadConfig } from "./config/settings.js"
import { validateAndBuildSerieIdMap } from "./core/mapping.js"
import { injectCSS } from "./utils/dom.js"
import { createSettingsPanel, createApiKeyModal, setupConfig } from "./ui/components/panels.js"
import { createFloatingButton } from "./ui/components/buttons.js"
import { displayCachedAssessments } from "./processing/workflow.js"
import { showMappingFailureNotification } from "./core/mapping.js"

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

	injectCSS()
	createSettingsPanel()
	createApiKeyModal()
	setupConfig()

	const observer = new MutationObserver(() => {
		if (document.querySelector(".series-list")) {
			createFloatingButton()
			displayCachedAssessments()
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}
