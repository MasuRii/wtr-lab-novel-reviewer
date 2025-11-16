/**
 * Caching System
 * Handles localStorage-based caching of assessments with backward compatibility
 */

/**
 * Check if localStorage is available
 * @returns {boolean} Whether localStorage is available
 */
function isLocalStorageAvailable() {
	try {
		const testKey = "__localStorage_test__"
		localStorage.setItem(testKey, "test")
		localStorage.removeItem(testKey)
		return true
	} catch (e) {
		return false
	}
}

/**
 * Generate cache key for a serieId
 * @param {string} serieId - The serie ID
 * @returns {string} Cache key
 */
function getCacheKey(serieId) {
	return `geminiAssessment_${serieId}`
}

/**
 * Get cached assessment for a serieId
 * @param {string} serieId - The serie ID
 * @returns {Object|null} Cached assessment or null if not found
 */
export function getCachedAssessment(serieId) {
	if (!isLocalStorageAvailable()) {
		return null
	}

	try {
		const key = getCacheKey(serieId)
		const cached = localStorage.getItem(key)
		if (cached) {
			const parsed = JSON.parse(cached)
			// Validate structure (basic check)
			if (parsed && typeof parsed === "object" && parsed.assessment) {
				return parsed
			}
		}
	} catch (e) {
		console.warn("Error retrieving cached assessment for serieId:", serieId, e)
	}
	return null
}

/**
 * Set cached assessment for a serieId
 * @param {string} serieId - The serie ID
 * @param {Object} assessment - The assessment to cache
 */
export function setCachedAssessment(serieId, assessment) {
	if (!isLocalStorageAvailable()) {
		return
	}

	try {
		const key = getCacheKey(serieId)
		localStorage.setItem(key, JSON.stringify(assessment))
	} catch (e) {
		if (e.name === "QuotaExceededError") {
			console.warn("Local storage quota exceeded, unable to cache assessment for serieId:", serieId)
		} else {
			console.warn("Error caching assessment for serieId:", serieId, e)
		}
	}
}

/**
 * Clear all cached assessments from localStorage
 * @returns {boolean} True if successful, false otherwise
 */
export function clearAllCachedAssessments() {
	if (!isLocalStorageAvailable()) {
		return false
	}

	try {
		const prefix = "geminiAssessment_"
		let clearedCount = 0
		let errorCount = 0

		// Get all localStorage keys
		const keys = []
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i)
			if (key) {
				keys.push(key)
			}
		}

		// Iterate through all keys and remove those with the geminiAssessment_ prefix
		for (const key of keys) {
			if (key.startsWith(prefix)) {
				try {
					localStorage.removeItem(key)
					clearedCount++
				} catch (e) {
					console.warn("Error removing cached assessment key:", key, e)
					errorCount++
				}
			}
		}

		// Log summary
		console.log(`Cleared ${clearedCount} cached assessments from localStorage`)
		if (errorCount > 0) {
			console.warn(`Encountered ${errorCount} errors while clearing cached assessments`)
		}

		return errorCount === 0
	} catch (e) {
		console.warn("Error clearing all cached assessments:", e)
		return false
	}
}
