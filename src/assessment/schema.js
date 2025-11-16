/**
 * Response Schema Validation
 * Handles validation of analysis responses for backward compatibility
 */

/**
 * Populate unknown field for backward compatibility with cached assessments
 * @param {Object} analysis - The analysis object
 * @returns {Object} Analysis with unknown field populated
 */
export function populateUnknownField(analysis) {
	// Ensure unknown field exists for backward compatibility with cached data
	if (!analysis.unknown) {
		// Default unknown field to "Mixed" if not present in cached data
		analysis.unknown = "Mixed"
	}
	return analysis
}
