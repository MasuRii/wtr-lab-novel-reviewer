/**
 * Runtime Settings Management
 * Handles loading and saving of user settings using GM_* functions
 */

import { DEFAULT_GEMINI_MODEL, DEFAULT_DEBUG_LOGGING_ENABLED } from "./constants.js"

// Runtime settings state
let runtimeSettings = {
	apiKey: "",
	geminiModel: DEFAULT_GEMINI_MODEL,
	debugLoggingEnabled: DEFAULT_DEBUG_LOGGING_ENABLED,
}

/**
 * Load configuration from GM_* storage
 */
export function loadConfig() {
	runtimeSettings.apiKey = GM_getValue("geminiApiKey", "")
	// Load and ignore batchLimit from GM storage for backward compatibility
	GM_getValue("batchLimit", "1")
	runtimeSettings.geminiModel = GM_getValue("geminiModel", DEFAULT_GEMINI_MODEL)
	runtimeSettings.debugLoggingEnabled = GM_getValue("debugLoggingEnabled", DEFAULT_DEBUG_LOGGING_ENABLED)
}

/**
 * Save configuration to GM_* storage
 * @param {Object} newSettings - Settings object to save
 */
export function saveConfig(newSettings) {
	GM_setValue("geminiApiKey", newSettings.apiKey)
	// Remove batchLimit from persistent storage (batch processing decommissioned)
	// Existing batchLimit values in GM storage will be ignored
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
