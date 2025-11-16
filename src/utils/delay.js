/**
 * Promise-based delay utility
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after the delay
 */
export function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}
