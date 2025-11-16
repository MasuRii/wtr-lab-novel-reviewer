/**
 * Username Color System
 * Provides consistent username colors across sessions using deterministic color generation
 */

import { USERNAME_COLORS, ANONYMOUS_USER_COLOR } from "../config/constants.js"

// Cache for consistent username colors across sessions
const usernameColorCache = new Map()

/**
 * Generate a consistent color for a username
 * @param {string} username - The username to generate a color for
 * @returns {string} Hex color code
 */
export function getUsernameColor(username) {
	// Handle null/undefined/empty usernames
	if (!username || username === "null" || username === "undefined" || username.trim() === "") {
		return ANONYMOUS_USER_COLOR
	}

	// Check cache first
	if (usernameColorCache.has(username)) {
		return usernameColorCache.get(username)
	}

	// Generate deterministic color based on username
	let hash = 0
	for (let i = 0; i < username.length; i++) {
		const char = username.charCodeAt(i)
		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32-bit integer
	}

	// Use absolute value to ensure positive index
	const colorIndex = Math.abs(hash) % USERNAME_COLORS.length
	const color = USERNAME_COLORS[colorIndex]

	// Cache the result
	usernameColorCache.set(username, color)
	return color
}

/**
 * Extract unique usernames from reviews
 * @param {Array} reviews - Array of review objects
 * @returns {Array} Array of unique usernames
 */
export function extractUsernamesFromReviews(reviews) {
	const usernames = new Set()
	reviews.forEach((review) => {
		if (review.username) {
			// Handle various username formats
			const username = review.username.trim()
			if (username && username !== "null" && username !== "undefined") {
				usernames.add(username)
			}
		}
	})
	return Array.from(usernames)
}

/**
 * Apply color coding to review summary text
 * @param {string} reviewSummary - The review summary text
 * @param {Array} availableUsernames - Array of usernames to color code
 * @returns {string} HTML string with color-coded usernames
 */
export function colorCodeReviewSummary(reviewSummary, availableUsernames) {
	if (!reviewSummary || !availableUsernames || availableUsernames.length === 0) {
		return reviewSummary
	}

	let coloredSummary = reviewSummary

	// Sort usernames by length (longest first) to avoid partial matches
	const sortedUsernames = [...availableUsernames].sort((a, b) => b.length - a.length)

	sortedUsernames.forEach((username) => {
		const color = getUsernameColor(username)
		// Create regex to match username in text (word boundaries, case insensitive)
		const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		const usernameRegex = new RegExp(`\\b${escapedUsername}\\b`, "gi")

		// Check if this is an anonymous/null user
		const isAnonymous = !username || username === "null" || username === "undefined" || username.trim() === ""
		const cssClass = isAnonymous ? "username-color-coded anonymous" : "username-color-coded"

		// Replace with color-coded version
		coloredSummary = coloredSummary.replace(usernameRegex, (match) => {
			return `<span class="${cssClass}" style="color: ${color}; font-weight: 600;">${match}</span>`
		})
	})

	return coloredSummary
}
