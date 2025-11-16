/**
 * WTR-Lab Reviews API
 * Handles fetching reviews from the WTR-Lab API
 */

import { MAX_PAGES, PAGE_DELAY_MS } from "../config/constants.js"
import { delay } from "../utils/delay.js"
import { debugLog } from "../utils/debug.js"

/**
 * Fetch reviews for a serieId
 * @param {string} serieId - The serie ID
 * @returns {Promise<Array>} Array of review objects
 */
export async function fetchReviews(serieId) {
	let allReviews = []

	// First, fetch page 0 to check if we have sufficient data
	const url = `https://wtr-lab.com/api/review/get?serie_id=${serieId}&page=0&sort=most_liked`
	debugLog(`Fetching reviews for serieId ${serieId}, Page 0 from: ${url}`)

	try {
		const response = await fetch(url)
		if (!response.ok) {
			debugLog(`Review API response not OK for ${serieId}. Status: ${response.status}`)
			return [] // Return empty array if first page fails
		}
		const data = await response.json()
		debugLog(`Review API raw data for ${serieId}, Page 0:`, data)

		if (data.success && data.data && data.data.length > 0) {
			allReviews = allReviews.concat(data.data)
			debugLog(`Page 0 received ${data.data.length} reviews for ${serieId}`)

			// Check if page 0 has sufficient data (>= 3 reviews with comments for good analysis)
			const reviewsWithComments = data.data.filter((r) => r.comment)
			if (reviewsWithComments.length >= 3) {
				debugLog(
					`Page 0 has sufficient data (${reviewsWithComments.length} reviews with comments) for ${serieId} - stopping here`,
				)
				return allReviews
			}
		} else {
			// No data in page 0, return empty
			debugLog(`No reviews found in page 0 for ${serieId}`)
			return []
		}
	} catch (error) {
		console.error(`Error fetching reviews for serie_id ${serieId} on page 0:`, error)
		return [] // Return empty array on error
	}

	// If we get here, page 0 has data but it's insufficient, so fetch remaining pages
	for (let page = 1; page < MAX_PAGES; page++) {
		const pageUrl = `https://wtr-lab.com/api/review/get?serie_id=${serieId}&page=${page}&sort=most_liked`
		debugLog(`Fetching reviews for serieId ${serieId}, Page ${page} from: ${pageUrl}`)

		try {
			const response = await fetch(pageUrl)
			if (!response.ok) {
				debugLog(`Review API response not OK for ${serieId}. Status: ${response.status}`)
				break // Stop fetching if API returns an error status
			}
			const data = await response.json()
			debugLog(`Review API raw data for ${serieId}, Page ${page}:`, data)

			if (data.success && data.data && data.data.length > 0) {
				allReviews = allReviews.concat(data.data)
			} else {
				// Stop fetching if success is false or data array is empty
				break
			}
		} catch (error) {
			console.error(`Error fetching reviews for serie_id ${serieId} on page ${page}:`, error)
			break // Stop fetching on network/parsing error
		}
		await delay(PAGE_DELAY_MS) // Short delay between pages to be polite
	}

	return allReviews
}
