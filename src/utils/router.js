/**
 * Router Utility
 * Handles detection of client-side route changes (Single Page Application navigation)
 */

import { debugLog } from "./debug.js"

// Store the original history methods
const originalPushState = history.pushState
const originalReplaceState = history.replaceState

/**
 * Setup a listener for route changes
 * Detects History API changes (pushState, replaceState) and popstate events
 * @param {Function} callback - Function to execute when route changes
 */
export function setupRouteChangeListener(callback) {
	debugLog("Setting up route change listener")

	let debounceTimer = null

	// Handler for route changes with debounce
	const handleRouteChange = () => {
		const currentUrl = window.location.href
		debugLog(`Route change detected (raw): ${currentUrl}`)

		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}

		debounceTimer = setTimeout(() => {
			debugLog(`Route change processed (debounced): ${currentUrl}`)
			callback(currentUrl)
		}, 500) // 500ms debounce delay
	}

	// 1. Listen for popstate (browser back/forward buttons)
	window.addEventListener("popstate", handleRouteChange)

	// 2. Monkey-patch pushState
	history.pushState = function (...args) {
		const result = originalPushState.apply(this, args)
		handleRouteChange()
		return result
	}

	// 3. Monkey-patch replaceState
	history.replaceState = function (...args) {
		const result = originalReplaceState.apply(this, args)
		handleRouteChange()
		return result
	}

	// 4. Fallback: Check for URL changes periodically in case other methods miss it
	// (Optional, but useful for some frameworks that suppress events)
	let lastUrl = window.location.href
	setInterval(() => {
		const currentUrl = window.location.href
		if (currentUrl !== lastUrl) {
			lastUrl = currentUrl
			handleRouteChange()
		}
	}, 1000)

	debugLog("Route change listener active")
}
