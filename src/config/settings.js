/**
 * Runtime Settings Management
 * Handles loading and saving of user settings using GM_* functions
 */

import { DEFAULT_BATCH_LIMIT, DEFAULT_GEMINI_MODEL, DEFAULT_DEBUG_LOGGING_ENABLED } from "./constants.js"

// Runtime settings state
let runtimeSettings = {
	apiKey: "",
	batchLimit: DEFAULT_BATCH_LIMIT,
	geminiModel: DEFAULT_GEMINI_MODEL,
	debugLoggingEnabled: DEFAULT_DEBUG_LOGGING_ENABLED,
}

/**
 * Load configuration from GM_* storage
 */
export function loadConfig() {
	runtimeSettings.apiKey = GM_getValue("geminiApiKey", "")
	runtimeSettings.batchLimit = parseInt(GM_getValue("batchLimit", DEFAULT_BATCH_LIMIT.toString()), 10)
	runtimeSettings.geminiModel = GM_getValue("geminiModel", DEFAULT_GEMINI_MODEL)
	runtimeSettings.debugLoggingEnabled = GM_getValue("debugLoggingEnabled", DEFAULT_DEBUG_LOGGING_ENABLED)
}

/**
 * Save configuration to GM_* storage
 * @param {Object} newSettings - Settings object to save
 */
export function saveConfig(newSettings) {
	GM_setValue("geminiApiKey", newSettings.apiKey)
	GM_setValue("batchLimit", newSettings.batchLimit)
	GM_setValue("geminiModel", newSettings.geminiModel)
	GM_setValue("debugLoggingEnabled", newSettings.debugLoggingEnabled)

	// Update runtime settings
	runtimeSettings = { ...newSettings }
}

/**
 * Get current runtime settings
 * @returns {Object} Current runtime settings
 */
export function getRuntimeSettings() {
	return { ...runtimeSettings }
}

/**
 * Get API key
 * @returns {string} Current API key
 */
export function getApiKey() {
	return runtimeSettings.apiKey
}

/**
 * Set API key
 * @param {string} apiKey - API key to set
 */
export function setApiKey(apiKey) {
	runtimeSettings.apiKey = apiKey
	GM_setValue("geminiApiKey", apiKey)
}

/**
 * Get batch limit
 * @returns {number} Current batch limit
 */
export function getBatchLimit() {
	return runtimeSettings.batchLimit
}

/**
 * Set batch limit
 * @param {number} batchLimit - Batch limit to set
 */
export function setBatchLimit(batchLimit) {
	runtimeSettings.batchLimit = batchLimit
	GM_setValue("batchLimit", batchLimit)
}

/**
 * Get Gemini model
 * @returns {string} Current Gemini model
 */
export function getGeminiModel() {
	return runtimeSettings.geminiModel
}

/**
 * Set Gemini model
 * @param {string} geminiModel - Gemini model to set
 */
export function setGeminiModel(geminiModel) {
	runtimeSettings.geminiModel = geminiModel
	GM_setValue("geminiModel", geminiModel)
}

/**
 * Get debug logging enabled status
 * @returns {boolean} Debug logging status
 */
export function isDebugLoggingEnabled() {
	return runtimeSettings.debugLoggingEnabled
}

/**
 * Set debug logging enabled status
 * @param {boolean} debugLoggingEnabled - Debug logging status
 */
export function setDebugLoggingEnabled(debugLoggingEnabled) {
	runtimeSettings.debugLoggingEnabled = debugLoggingEnabled
	GM_setValue("debugLoggingEnabled", debugLoggingEnabled)
}
