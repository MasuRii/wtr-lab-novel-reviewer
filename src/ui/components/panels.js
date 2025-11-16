/**
 * Settings Panel and API Key Modal Components
 * Handles settings and configuration UI components
 */

import { GEMINI_MODELS } from "../../config/constants.js"
import { saveConfig, getRuntimeSettings } from "../../config/settings.js"
import { clearAllCachedAssessments } from "../../core/cache.js"

/**
 * Create the settings panel
 */
export function createSettingsPanel() {
	const modelOptions = GEMINI_MODELS.map((model) => `<option value="${model}">${model}</option>`).join("")
	const panelHTML = `
	<div id="gemini-settings-panel">
		<h3>Gemini Reviewer Settings</h3>
		<label for="gemini-api-key-input">Gemini API Key:</label>
		<input type="password" id="gemini-api-key-input">
		<label for="gemini-model-select">Gemini Model:</label>
		<select id="gemini-model-select">${modelOptions}</select>
		<label for="gemini-debug-logging-input" style="display: flex; align-items: center;">
			<input type="checkbox" id="gemini-debug-logging-input" style="width: auto; margin-right: 10px;">
			Enable Debug Logging (Logs prompts and responses)
		</label>
		<div class="buttons">
			<button id="clear-cache-button" style="background-color: #dc3545; margin-right: auto;">Clear Analyzed Novel Cache</button>
			<button id="gemini-settings-close">Close</button>
			<button id="gemini-settings-save">Save</button>
		</div>
	</div>
`
	document.body.insertAdjacentHTML("beforeend", panelHTML)
}

/**
 * Create the API key modal
 */
export function createApiKeyModal() {
	const modalHTML = `
		<div id="gemini-api-key-modal">
			<h3>How to Get Your FREE Gemini API Token</h3>
			<div class="instructions">
				<ol>
					<li>Go to <a href="https://aistudio.google.com/" target="_blank" style="color: #0d6efd;">Google AI Studio</a></li>
					<li>Sign in with your Google account</li>
					<li>Click "Get API key in Google AI Studio"</li>
					<li>Create a new API key or use an existing one</li>
					<li>Copy the API key and paste it below</li>
				</ol>
			</div>
			<label for="gemini-api-key-modal-input">Gemini API Key:</label>
			<input type="password" id="gemini-api-key-modal-input" placeholder="Enter your Gemini API key here">
			<div class="buttons">
				<button id="gemini-api-key-modal-close">Cancel</button>
				<button id="gemini-api-key-modal-save">Save & Continue</button>
			</div>
		</div>
	`
	document.body.insertAdjacentHTML("beforeend", modalHTML)
}

/**
 * Setup configuration menu commands
 */
export function setupConfig() {
	// Open Settings menu command
	GM_registerMenuCommand("Open Settings", () => {
		const settings = getRuntimeSettings()
		document.getElementById("gemini-api-key-input").value = settings.apiKey
		document.getElementById("gemini-model-select").value = settings.geminiModel
		document.getElementById("gemini-debug-logging-input").checked = settings.debugLoggingEnabled
		document.getElementById("gemini-settings-panel").style.display = "block"
	})

	// Settings save button
	document.getElementById("gemini-settings-save").addEventListener("click", () => {
		const newSettings = {
			apiKey: document.getElementById("gemini-api-key-input").value,
			geminiModel: document.getElementById("gemini-model-select").value,
			debugLoggingEnabled: document.getElementById("gemini-debug-logging-input").checked,
		}

		saveConfig(newSettings)
		alert("Settings saved.")
		document.getElementById("gemini-settings-panel").style.display = "none"
	})

	// Settings close button
	document.getElementById("gemini-settings-close").addEventListener("click", () => {
		document.getElementById("gemini-settings-panel").style.display = "none"
	})

	// Clear cache button
	document.getElementById("clear-cache-button").addEventListener("click", () => {
		const confirmed = confirm(
			"Are you sure you want to clear the cache for all analyzed novels? This action cannot be undone.",
		)
		if (confirmed) {
			const success = clearAllCachedAssessments()
			if (success) {
				alert("Cache cleared successfully. Refreshing page...")
				window.location.reload()
			} else {
				alert("Failed to clear cache. Check console for details.")
			}
		}
	})
}

/**
 * Show API key modal
 * @returns {Promise<boolean>} Promise resolving to true if user saved, false if cancelled
 */
export function showApiKeyModal() {
	return new Promise((resolve) => {
		document.getElementById("gemini-api-key-modal-input").value = ""
		document.getElementById("gemini-api-key-modal").style.display = "block"

		const saveButton = document.getElementById("gemini-api-key-modal-save")
		const closeButton = document.getElementById("gemini-api-key-modal-close")

		const handleSave = () => {
			const apiKey = document.getElementById("gemini-api-key-modal-input").value.trim()
			if (apiKey) {
				saveConfig({ ...getRuntimeSettings(), apiKey })
				document.getElementById("gemini-api-key-modal").style.display = "none"
				resolve(true)
			} else {
				alert("Please enter a valid API key.")
			}
		}

		const handleClose = () => {
			document.getElementById("gemini-api-key-modal").style.display = "none"
			resolve(false)
		}

		saveButton.addEventListener("click", handleSave, { once: true })
		closeButton.addEventListener("click", handleClose, { once: true })
	})
}
