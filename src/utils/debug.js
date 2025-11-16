/**
 * Debug logging utilities
 */

import { isDebugLoggingEnabled } from "../config/settings.js"

/**
 * Debug logging function
 * @param {string} message - Debug message
 * @param {*} data - Optional data to log
 */
export function debugLog(message, data) {
	if (isDebugLoggingEnabled()) {
		console.log(`[WTR-Lab Novel Reviewer Debug] ${message}`, data || "")
	}
}
