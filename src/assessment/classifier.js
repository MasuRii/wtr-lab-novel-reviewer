/**
 * Rating Classification
 * Handles classification of assessment ratings to CSS classes
 */

/**
 * Get CSS class for rating
 * @param {string} rating - The rating value
 * @returns {string} CSS class name
 */
export function getRatingClass(rating) {
	if (!rating) {
		return ""
	}
	const ratingLower = rating.toLowerCase()
	if (
		ratingLower.includes("good") ||
		ratingLower.includes("excellent") ||
		ratingLower.includes("outstanding") ||
		ratingLower.includes("very good") ||
		ratingLower.includes("strong")
	) {
		return "good"
	} else if (
		ratingLower.includes("mixed") ||
		ratingLower.includes("average") ||
		ratingLower.includes("decent") ||
		ratingLower.includes("fair") ||
		ratingLower.includes("moderate")
	) {
		return "mixed"
	} else if (
		ratingLower.includes("bad") ||
		ratingLower.includes("poor") ||
		ratingLower.includes("weak") ||
		ratingLower.includes("lacking") ||
		ratingLower.includes("needs improvement")
	) {
		return "bad"
	} else if (
		ratingLower.includes("unknown") ||
		ratingLower.includes("missing") ||
		ratingLower.includes("unspecified") ||
		ratingLower.includes("undetermined") ||
		ratingLower.includes("insufficient")
	) {
		return "unknown"
	}
	return ""
}
