/**
 * Button Components
 * Handles floating action button and other UI buttons
 */

import { processNovels } from "../../processing/workflow.js"

/**
 * Create the floating analyze button
 */
export function createFloatingButton() {
	if (document.getElementById("gemini-floating-analyze-btn")) {
		return
	} // Button already exists

	const button = document.createElement("button")
	button.id = "gemini-floating-analyze-btn"
	button.title = "Analyze Next Novel"

	// Use fallback icon if Material Icons are not available
	const iconClass = window.__ICON_REPLACEMENTS__ ? "material-icons-fallback" : "material-icons"
	const iconText = window.__ICON_REPLACEMENTS__ ? "📊" : "assessment"
	button.innerHTML = `<span class="${iconClass}">${iconText}</span>`

	button.addEventListener("click", processNovels)
	document.body.appendChild(button)
}
