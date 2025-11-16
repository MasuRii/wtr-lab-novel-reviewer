// ==UserScript==
// @name         WTR-Lab Novel Reviewer
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Uses Gemini to analyze novels on wtr-lab.com. Adds a floating button to start analysis and displays an AI summary icon on each novel card. Expanded assessment criteria includes Character Development, Plot Structure, World-Building, Themes & Messages, and Writing Style. Version 1.8: Corrected Unknown field implementation - Unknown is now a rating value within each category when data is insufficient, not a separate assessment category.
// @author       MasuRii
// @match        https://wtr-lab.com/en/for-you*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @connect      generativelanguage.googleapis.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @resource     materialIcons https://fonts.googleapis.com/icon?family=Material+Icons
// @license      MIT
// ==/UserScript==

;(function () {
	'use strict'

	// --- CONFIGURATION ---
	let GEMINI_API_KEY = ''
	let BATCH_LIMIT = 5
	let GEMINI_MODEL = 'gemini-2.5-flash'
	const MAX_RETRIES = 3
	const INITIAL_DELAY_MS = 1000
	let DEBUG_LOGGING_ENABLED = false
	// Note: Some model names provided by the user may not be valid.
	// The script will use them as requested, but API calls may fail if the name is incorrect.
	const GEMINI_MODELS = ['gemini-2.5-pro', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']

	let serieIdMap = new Map() // Map from raw_id to serie_id for correct review API calls
	let mappingFailureNotified = false // Track if user has been notified about mapping failure
	const MAPPING_RETRY_ATTEMPTS = 3 // Number of times to retry building the map
	const MAPPING_RETRY_DELAY = 2000 // Delay between retries in milliseconds

	// --- USERNAME COLOR SYSTEM ---
	let usernameColorCache = new Map() // Cache for consistent username colors across sessions

	// Accessible color palette for color-blind users
	const USERNAME_COLORS = [
		'#e74c3c', // Red
		'#3498db', // Blue
		'#2ecc71', // Green
		'#f39c12', // Orange
		'#9b59b6', // Purple
		'#1abc9c', // Teal
		'#e67e22', // Dark Orange
		'#34495e', // Dark Blue-Gray
		'#e91e63', // Pink
		'#ff5722', // Deep Orange
		'#795548', // Brown
		'#607d8b', // Blue Gray
		'#8bc34a', // Light Green
		'#ffc107', // Amber
		'#673ab7', // Deep Purple
		'#00bcd4', // Cyan
		'#ff9800', // Orange
		'#4caf50', // Green
		'#2196f3', // Blue
		'#f44336', // Red
		'#9c27b0' // Purple
	]

	// Anonymous/null user color
	const ANONYMOUS_USER_COLOR = '#95a5a6' // Gray

	function getUsernameColor(username) {
		// Handle null/undefined/empty usernames
		if (!username || username === 'null' || username === 'undefined' || username.trim() === '') {
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

	function extractUsernamesFromReviews(reviews) {
		const usernames = new Set()
		reviews.forEach(review => {
			if (review.username) {
				// Handle various username formats
				const username = review.username.trim()
				if (username && username !== 'null' && username !== 'undefined') {
					usernames.add(username)
				}
			}
		})
		return Array.from(usernames)
	}

	function colorCodeReviewSummary(reviewSummary, availableUsernames) {
		if (!reviewSummary || !availableUsernames || availableUsernames.length === 0) {
			return reviewSummary
		}

		let coloredSummary = reviewSummary

		// Sort usernames by length (longest first) to avoid partial matches
		const sortedUsernames = [...availableUsernames].sort((a, b) => b.length - a.length)

		sortedUsernames.forEach(username => {
			const color = getUsernameColor(username)
			// Create regex to match username in text (word boundaries, case insensitive)
			const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const usernameRegex = new RegExp(`\\b${escapedUsername}\\b`, 'gi')

			// Check if this is an anonymous/null user
			const isAnonymous = !username || username === 'null' || username === 'undefined' || username.trim() === ''
			const cssClass = isAnonymous ? 'username-color-coded anonymous' : 'username-color-coded'

			// Replace with color-coded version
			coloredSummary = coloredSummary.replace(usernameRegex, match => {
				return `<span class="${cssClass}" style="color: ${color}; font-weight: 600;">${match}</span>`
			})
		})

		return coloredSummary
	}

	async function buildSerieIdMap() {
		debugLog('Building serie_id mapping from __NEXT_DATA__')
		const nextDataScript = document.querySelector('script[id="__NEXT_DATA__"]')
		if (!nextDataScript) {
			console.warn('__NEXT_DATA__ script not found. Unable to build serie_id mapping.')
			return false
		}

		try {
			const nextData = JSON.parse(nextDataScript.textContent)
			if (nextData.props?.pageProps?.list) {
				nextData.props.pageProps.list.forEach(item => {
					if (item.raw_id && item.serie_id) {
						serieIdMap.set(item.raw_id.toString(), item.serie_id.toString())
					}
				})
			}
			debugLog(`Built serie_id map with ${serieIdMap.size} entries`)

			// Validate mapping was successful
			if (serieIdMap.size === 0) {
				console.error('Serie ID mapping failed: Map is empty after building')
				return false
			}
			return true
		} catch (error) {
			console.error('Error parsing __NEXT_DATA__:', error)
			return false
		}
	}

	async function validateAndBuildSerieIdMap() {
		for (let attempt = 1; attempt <= MAPPING_RETRY_ATTEMPTS; attempt++) {
			debugLog(`Attempting to build serie_id map (Attempt ${attempt}/${MAPPING_RETRY_ATTEMPTS})`)
			const success = await buildSerieIdMap()

			if (success) {
				debugLog('Serie ID mapping validation: SUCCESS')
				return true
			}

			console.warn(`Serie ID mapping failed on attempt ${attempt}/${MAPPING_RETRY_ATTEMPTS}`)

			if (attempt < MAPPING_RETRY_ATTEMPTS) {
				debugLog(`Retrying in ${MAPPING_RETRY_DELAY}ms...`)
				await delay(MAPPING_RETRY_DELAY)
			}
		}

		// All attempts failed
		console.error('Serie ID mapping validation: FAILED after all retry attempts')
		return false
	}

	function validateSerieIdMapping(rawId, serieId) {
		// Check if serieId is valid
		if (!serieId || serieId === null || serieId === undefined || serieId === '') {
			debugLog(`Mapping validation FAILED: Invalid serie_id for raw_id ${rawId}`)
			return false
		}

		// Check if serieId is a valid format (should be numeric string)
		if (!/^\d+$/.test(serieId.toString())) {
			debugLog(`Mapping validation FAILED: Invalid serie_id format "${serieId}" for raw_id ${rawId}`)
			return false
		}

		debugLog(`Mapping validation SUCCESS: raw_id ${rawId} -> serie_id ${serieId}`)
		return true
	}

	function showMappingFailureNotification() {
		if (mappingFailureNotified) {
			return // Already notified, don't spam
		}

		mappingFailureNotified = true

		// Create notification element
		const notification = document.createElement('div')
		notification.id = 'gemini-mapping-failure-notification'
		notification.innerHTML = `
			<div class="notification-content">
				<span class="material-icons notification-icon">error</span>
				<div class="notification-text">
					<strong>Serie ID Mapping Failed</strong>
					<p>Unable to map novel IDs correctly. Please refresh the page to retry.</p>
				</div>
				<button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
			</div>
		`

		document.body.appendChild(notification)

		console.error('MAPPING FAILURE: User has been notified to refresh the page')
		debugLog('Mapping failure notification displayed to user')
	}

	function debugLog(message, data) {
		if (DEBUG_LOGGING_ENABLED) {
			console.log(`[WTR-Lab Novel Reviewer Debug] ${message}`, data || '')
		}
	}

	function loadConfig() {
		GEMINI_API_KEY = GM_getValue('geminiApiKey', '')
		BATCH_LIMIT = parseInt(GM_getValue('batchLimit', '5'), 10)
		GEMINI_MODEL = GM_getValue('geminiModel', 'gemini-2.5-flash')
		DEBUG_LOGGING_ENABLED = GM_getValue('debugLoggingEnabled', false)
	}

	// --- CACHING UTILITIES ---
	function isLocalStorageAvailable() {
		try {
			const testKey = '__localStorage_test__'
			localStorage.setItem(testKey, 'test')
			localStorage.removeItem(testKey)
			return true
		} catch (e) {
			return false
		}
	}

	function getCacheKey(serieId) {
		return `geminiAssessment_${serieId}`
	}

	function getCachedAssessment(serieId) {
		if (!isLocalStorageAvailable()) return null
		try {
			const key = getCacheKey(serieId)
			const cached = localStorage.getItem(key)
			if (cached) {
				const parsed = JSON.parse(cached)
				// Validate structure (basic check)
				if (parsed && typeof parsed === 'object' && parsed.assessment) {
					return parsed
				}
			}
		} catch (e) {
			console.warn('Error retrieving cached assessment for serieId:', serieId, e)
		}
		return null
	}

	function setCachedAssessment(serieId, assessment) {
		if (!isLocalStorageAvailable()) return
		try {
			const key = getCacheKey(serieId)
			localStorage.setItem(key, JSON.stringify(assessment))
		} catch (e) {
			if (e.name === 'QuotaExceededError') {
				console.warn('Local storage quota exceeded, unable to cache assessment for serieId:', serieId)
			} else {
				console.warn('Error caching assessment for serieId:', serieId, e)
			}
		}
	}

	// --- STYLES ---
	function injectCSS() {
		// Inject Material Icons stylesheet
		const materialIconsCss = GM_getResourceText('materialIcons')
		GM_addStyle(materialIconsCss)

		const styles = `
            /* Card modifications */
            .gemini-good-novel .card-body { background-color: #2E462E !important; border: 1px solid #578857; } /* Dark Green */
            .gemini-mixed-novel .card-body { background-color: #46402E !important; border: 1px solid #887A57; } /* Dark Yellow/Orange */
            .gemini-bad-novel .card-body { background-color: #462E2E !important; border: 1px solid #885757; } /* Dark Red */
            .gemini-processing-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); color: white; display: flex; justify-content: center; align-items: center; font-size: 1.2em; z-index: 10; border-radius: var(--bs-card-inner-border-radius); }
            
            /* Color coding for assessment ratings */
            .assessment-rating { font-weight: bold; padding: 2px 6px; border-radius: 3px; }
            .assessment-rating.good { color: #4CAF50; background-color: rgba(76, 175, 80, 0.1); }
            .assessment-rating.mixed { color: #FF9800; background-color: rgba(255, 152, 0, 0.1); }
            .assessment-rating.bad { color: #F44336; background-color: rgba(244, 67, 54, 0.1); }
            .assessment-rating.unknown { color: #9E9E9E; background-color: rgba(158, 158, 158, 0.1); border: 1px solid rgba(158, 158, 158, 0.3); font-style: italic; }

            /* Summary Icon and Tooltip */
            .gemini-summary-container { /* This container is now a direct child of the .card element */ }
            .gemini-summary-trigger {
                position: absolute;
                top: 50%;
                right: -40px; /* Position outside the card container */
                transform: translateY(-50%);
                cursor: pointer;
                z-index: 5;
                background-color: rgba(0,0,0,0.6);
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .gemini-summary-trigger .material-icons { font-size: 20px; }
            .gemini-summary-card {
                display: none;
                position: absolute;
                top: 50%;
                right: calc(100% + 15px); /* Positioned to the right of the novel card */
                transform: translateY(-50%);
                width: 400px;
                max-height: 600px;
                background-color: #212529;
                border: 1px solid #495057;
                border-radius: 8px;
                padding: 15px;
                z-index: 100;
                color: #f8f9fa;
                font-size: 0.9em;
                box-shadow: 0 6px 12px rgba(0,0,0,0.4);
                overflow-y: auto;
            }
            .gemini-summary-card h4 {
                margin: 0 0 8px 0;
                color: #ffffff;
                font-size: 1.1em;
                font-weight: 600;
            }
            .gemini-summary-card h5 {
                margin: 10px 0 5px 0;
                color: #adb5bd;
                font-size: 1em;
                font-weight: 500;
            }
            .gemini-summary-card p {
                margin: 0 0 10px 0;
                line-height: 1.4;
            }
            .gemini-summary-card .assessment-section {
                margin-bottom: 12px;
            }
            .gemini-summary-card .assessment-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 8px;
                margin-top: 8px;
            }
            .gemini-summary-card .assessment-item {
                font-size: 0.85em;
            }
            .gemini-summary-card .summary-toggle {
                cursor: pointer;
                user-select: none;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background-color: rgba(255,255,255,0.05);
                padding: 8px 12px;
                border-radius: 4px;
                margin-bottom: 8px;
                transition: background-color 0.2s ease;
            }
            .gemini-summary-card .summary-toggle:hover {
                background-color: rgba(255,255,255,0.1);
            }
            .gemini-summary-card .summary-toggle .toggle-icon {
                font-size: 1.2em;
                transition: transform 0.2s ease;
            }
            .gemini-summary-card .summary-toggle.collapsed .toggle-icon {
                transform: rotate(-90deg);
            }
            .gemini-summary-card .summary-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
                margin-bottom: 10px;
            }
            .gemini-summary-card .summary-content.expanded {
                max-height: 200px; /* Scrolling enabled for long content */
                overflow-y: auto;
            }
            .gemini-summary-card .summary-content p {
                margin: 10px 0;
                line-height: 1.4;
                padding: 0 12px;
            }
            .gemini-summary-card.locked { display: block; }
            .gemini-summary-trigger:hover + .gemini-summary-card:not(.locked), .gemini-summary-card:hover:not(.locked) { display: block; }

            /* Color-coded Username Styling */
            .username-color-coded {
                background-color: rgba(255, 255, 255, 0.1);
                padding: 1px 3px;
                border-radius: 2px;
                font-weight: 600;
                transition: all 0.2s ease;
                border: 1px solid transparent;
            }
            .username-color-coded:hover {
                background-color: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }

            /* Anonymous user styling */
            .username-color-coded.anonymous {
                background-color: rgba(149, 165, 166, 0.2);
                color: #bdc3c7 !important;
                border: 1px solid rgba(189, 195, 199, 0.3);
            }

            /* Floating Action Button */
            #gemini-floating-analyze-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                background-color: #0d6efd;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                z-index: 9998;
                transition: background-color 0.3s ease;
            }
            #gemini-floating-analyze-btn:hover { background-color: #0b5ed7; }
            #gemini-floating-analyze-btn .material-icons { font-size: 28px; }

            /* Settings Panel */
            #gemini-settings-panel { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #2c3034; color: white; padding: 20px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 9999; width: 400px; }
            #gemini-settings-panel h3 { margin-top: 0; }
            #gemini-settings-panel label { display: block; margin: 10px 0 5px; }
            #gemini-settings-panel input, #gemini-settings-panel select { width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #495057; background-color: #212529; color: white; box-sizing: border-box; }
            #gemini-settings-panel .buttons { margin-top: 20px; text-align: right; }
            #gemini-settings-panel button { margin-left: 10px; padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; }
            #gemini-settings-save { background-color: #0d6efd; color: white; }
            #gemini-settings-close { background-color: #6c757d; color: white; }

            /* API Key Modal */
            #gemini-api-key-modal { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #2c3034; color: white; padding: 20px; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 9999; width: 500px; max-height: 80vh; overflow-y: auto; }
            #gemini-api-key-modal h3 { margin-top: 0; color: #ffffff; text-align: center; }
            #gemini-api-key-modal .instructions { margin-bottom: 20px; }
            #gemini-api-key-modal .instructions ol { text-align: left; padding-left: 20px; }
            #gemini-api-key-modal .instructions li { margin-bottom: 8px; }
            #gemini-api-key-modal label { display: block; margin: 10px 0 5px; font-weight: bold; }
            #gemini-api-key-modal input { width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #495057; background-color: #212529; color: white; box-sizing: border-box; }
            #gemini-api-key-modal .buttons { margin-top: 20px; text-align: center; }
            #gemini-api-key-modal button { margin: 0 10px; padding: 8px 15px; border-radius: 4px; border: none; cursor: pointer; background-color: #0d6efd; color: white; }
            #gemini-api-key-modal-close { background-color: #6c757d; }

            /* Mapping Failure Notification */
            #gemini-mapping-failure-notification {
                position: fixed;
                top: 80px;
                right: 20px;
                width: 400px;
                background-color: #dc3545;
                color: white;
                border-radius: 8px;
                box-shadow: 0 6px 16px rgba(0,0,0,0.4);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
            }
            #gemini-mapping-failure-notification .notification-content {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }
            #gemini-mapping-failure-notification .notification-icon {
                font-size: 28px;
                flex-shrink: 0;
            }
            #gemini-mapping-failure-notification .notification-text {
                flex: 1;
            }
            #gemini-mapping-failure-notification .notification-text strong {
                display: block;
                font-size: 1.1em;
                margin-bottom: 4px;
            }
            #gemini-mapping-failure-notification .notification-text p {
                margin: 0;
                font-size: 0.95em;
                line-height: 1.4;
            }
            #gemini-mapping-failure-notification .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                line-height: 1;
                flex-shrink: 0;
            }
            #gemini-mapping-failure-notification .notification-close:hover {
                opacity: 0.8;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            /* Mobile considerations */
            @media (max-width: 768px) {
                .gemini-summary-card {
                    width: 300px;
                    max-height: 400px;
                }
                #gemini-api-key-modal {
                    width: 90%;
                    padding: 15px;
                }
                #gemini-mapping-failure-notification {
                    width: calc(100% - 40px);
                    right: 20px;
                    left: 20px;
                }
            }
        `
		GM_addStyle(styles)
	}

	// --- SETTINGS PANEL ---
	function createSettingsPanel() {
		const modelOptions = GEMINI_MODELS.map(model => `<option value="${model}">${model}</option>`).join('')
		const panelHTML = `
	           <div id="gemini-settings-panel">
	               <h3>Gemini Reviewer Settings</h3>
	               <label for="gemini-api-key-input">Gemini API Key:</label>
	               <input type="password" id="gemini-api-key-input">
	               <label for="gemini-batch-limit-input">Batch Limit:</label>
	               <input type="number" id="gemini-batch-limit-input" min="1">
	               <label for="gemini-model-select">Gemini Model:</label>
	               <select id="gemini-model-select">${modelOptions}</select>
	               <label for="gemini-debug-logging-input" style="display: flex; align-items: center;">
	                   <input type="checkbox" id="gemini-debug-logging-input" style="width: auto; margin-right: 10px;">
	                   Enable Debug Logging (Logs prompts and responses)
	               </label>
	               <div class="buttons">
	                   <button id="gemini-settings-close">Close</button>
	                   <button id="gemini-settings-save">Save</button>
	               </div>
	           </div>
	       `
		document.body.insertAdjacentHTML('beforeend', panelHTML)
	}

	// --- API KEY MODAL ---
	function createApiKeyModal() {
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
		document.body.insertAdjacentHTML('beforeend', modalHTML)
	}

	function setupConfig() {
		GM_registerMenuCommand('Open Settings', () => {
			document.getElementById('gemini-api-key-input').value = GEMINI_API_KEY
			document.getElementById('gemini-batch-limit-input').value = BATCH_LIMIT
			document.getElementById('gemini-model-select').value = GEMINI_MODEL
			document.getElementById('gemini-debug-logging-input').checked = DEBUG_LOGGING_ENABLED
			document.getElementById('gemini-settings-panel').style.display = 'block'
		})

		document.getElementById('gemini-settings-save').addEventListener('click', () => {
			const newApiKey = document.getElementById('gemini-api-key-input').value
			const newBatchLimit = parseInt(document.getElementById('gemini-batch-limit-input').value, 10)
			const newModel = document.getElementById('gemini-model-select').value
			const newDebugLoggingEnabled = document.getElementById('gemini-debug-logging-input').checked

			GM_setValue('geminiApiKey', newApiKey)
			GM_setValue('batchLimit', newBatchLimit)
			GM_setValue('geminiModel', newModel)
			GM_setValue('debugLoggingEnabled', newDebugLoggingEnabled)

			loadConfig() // Reload config into active variables
			alert('Settings saved.')
			document.getElementById('gemini-settings-panel').style.display = 'none'
		})

		document.getElementById('gemini-settings-close').addEventListener('click', () => {
			document.getElementById('gemini-settings-panel').style.display = 'none'
		})
	}

	function showApiKeyModal() {
		return new Promise(resolve => {
			document.getElementById('gemini-api-key-modal-input').value = ''
			document.getElementById('gemini-api-key-modal').style.display = 'block'

			const saveButton = document.getElementById('gemini-api-key-modal-save')
			const closeButton = document.getElementById('gemini-api-key-modal-close')

			const handleSave = () => {
				const apiKey = document.getElementById('gemini-api-key-modal-input').value.trim()
				if (apiKey) {
					GM_setValue('geminiApiKey', apiKey)
					loadConfig()
					document.getElementById('gemini-api-key-modal').style.display = 'none'
					resolve(true)
				} else {
					alert('Please enter a valid API key.')
				}
			}

			const handleClose = () => {
				document.getElementById('gemini-api-key-modal').style.display = 'none'
				resolve(false)
			}

			saveButton.addEventListener('click', handleSave, {once: true})
			closeButton.addEventListener('click', handleClose, {once: true})
		})
	}

	// --- API CALLS ---
	async function fetchReviews(serieId) {
		const MAX_PAGES = 5 // Limit to 5 pages (e.g., 50 reviews) to prevent excessive fetching
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
				const reviewsWithComments = data.data.filter(r => r.comment)
				if (reviewsWithComments.length >= 3) {
					debugLog(`Page 0 has sufficient data (${reviewsWithComments.length} reviews with comments) for ${serieId} - stopping here`)
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
			const url = `https://wtr-lab.com/api/review/get?serie_id=${serieId}&page=${page}&sort=most_liked`
			debugLog(`Fetching reviews for serieId ${serieId}, Page ${page} from: ${url}`)

			try {
				const response = await fetch(url)
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
			await delay(100) // Short delay between pages to be polite
		}
		return allReviews
	}

	function getGeminiAnalysis(novelsData) {
		const prompt = `
		              Analyze the following list of novels. For each novel, use its title, view count, reader count, rating, genres, description, and user reviews to provide a comprehensive assessment across multiple categories.
		              Return a single JSON array. Each object in the array must correspond to a novel in the input list, maintaining the original order.

		              For each novel, provide:
		              1. A novel summary: A concise 2-3 sentence summary of what the novel is about, based primarily on the title, description, genres, and user reviews.
		              2. A review summary: A balanced summary of user feedback from the reviews, including positive and negative points, with proper attribution to usernames (e.g., "According to [User], ..."). Use EXACT usernames from the availableUsernames list when making attributions.

		              Then provide detailed assessments in the following categories:
		              - Overall assessment (Good/Mixed/Bad)
		              - Character Development (Good/Mixed/Bad/Unknown)
		              - Plot Structure (Good/Mixed/Bad/Unknown)
		              - World-Building (Good/Mixed/Bad/Unknown)
		              - Themes & Messages (Good/Mixed/Bad/Unknown)
		              - Writing Style (Good/Mixed/Bad/Unknown)

		              For each category, include specific criteria:
		              - Character Development: character depth, growth, consistency, dialogue authenticity, relationship dynamics
		              - Plot Structure: pacing, narrative flow, story coherence, conflict resolution, foreshadowing
		              - World-Building: setting details, consistency, immersion, cultural depth, originality
		              - Themes & Messages: clarity, relevance, integration, thought provocation, balance
		              - Writing Style: prose quality, descriptive language, dialogue naturalness, grammar, technical execution

		              CRITICAL: Each category can be rated as "Unknown" when:
		              - Character Development: No character development information found in available data
		              - Plot Structure: No plot structure information found in available data
		              - World-Building: No world-building details found in available data
		              - Themes & Messages: No theme or message information found in available data
		              - Writing Style: No writing style information found in available data

		              Important distinctions:
		              - "Unknown" means: insufficient data to make a reliable assessment for that specific aspect
		              - "Bad" means: poor quality or problematic implementation of that aspect
		              - Use "Unknown" when data is genuinely missing or insufficient, NOT when quality is poor

		              Novels List:
		              ${JSON.stringify(novelsData, null, 2)}
		      	`

		const schema = {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					novelSummary: {type: 'string', description: 'A concise 2-3 sentence summary of what the novel is about.'},
					reviewSummary: {type: 'string', description: 'A balanced summary of user feedback with proper username attribution.'},
					assessment: {type: 'string', enum: ['Good', 'Mixed', 'Bad']},
					summary: {type: 'string', description: 'A brief 2-3 sentence summary explaining the overall assessment.'},
					characterDevelopment: {type: 'string', enum: ['Good', 'Mixed', 'Bad', 'Unknown']},
					plotStructure: {type: 'string', enum: ['Good', 'Mixed', 'Bad', 'Unknown']},
					worldBuilding: {type: 'string', enum: ['Good', 'Mixed', 'Bad', 'Unknown']},
					themesAndMessages: {type: 'string', enum: ['Good', 'Mixed', 'Bad', 'Unknown']},
					writingStyle: {type: 'string', enum: ['Good', 'Mixed', 'Bad', 'Unknown']}
				},
				required: ['novelSummary', 'reviewSummary', 'assessment', 'summary', 'characterDevelopment', 'plotStructure', 'worldBuilding', 'themesAndMessages', 'writingStyle']
			}
		}

		const safetySettings = [
			{category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE'},
			{category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE'},
			{category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE'},
			{category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE'}
		]

		const requestData = JSON.stringify({
			contents: [{parts: [{text: prompt}]}],
			generationConfig: {responseMimeType: 'application/json', responseJsonSchema: schema, temperature: 0.3},
			safetySettings: safetySettings
		})

		debugLog('Gemini Prompt:', prompt)

		return new Promise((resolve, reject) => {
			let retries = 0
			const executeRequest = () => {
				GM_xmlhttpRequest({
					method: 'POST',
					url: `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
					headers: {'Content-Type': 'application/json'},
					data: requestData,
					onload: function (response) {
						try {
							const apiResponse = JSON.parse(response.responseText)
							debugLog('Gemini Raw Response:', apiResponse)

							if (apiResponse.candidates && apiResponse.candidates.length > 0) {
								const analyses = JSON.parse(apiResponse.candidates[0].content.parts[0].text)
								resolve(analyses)
							} else {
								const errorMsg = apiResponse.promptFeedback ? `Gemini block reason: ${JSON.stringify(apiResponse.promptFeedback)}` : 'Gemini API returned no candidates.'
								console.error('Gemini API Response Error:', apiResponse)

								if (retries < MAX_RETRIES) {
									retries++
									const delayMs = INITIAL_DELAY_MS * Math.pow(2, retries - 1)
									console.warn(`Retrying Gemini request in ${delayMs}ms (Attempt ${retries}/${MAX_RETRIES}). Error: ${errorMsg}`)
									setTimeout(executeRequest, delayMs)
								} else {
									reject(`Gemini API failed after ${MAX_RETRIES} retries. Last error: ${errorMsg}`)
								}
							}
						} catch (e) {
							if (retries < MAX_RETRIES) {
								retries++
								const delayMs = INITIAL_DELAY_MS * Math.pow(2, retries - 1)
								console.warn(`Retrying Gemini request in ${delayMs}ms (Attempt ${retries}/${MAX_RETRIES}). Error: Failed to parse response: ${e}`)
								setTimeout(executeRequest, delayMs)
							} else {
								reject(`Failed to parse Gemini response after ${MAX_RETRIES} retries: ${e}\nResponse: ${response.responseText}`)
							}
						}
					},
					onerror: response => {
						if (retries < MAX_RETRIES) {
							retries++
							const delayMs = INITIAL_DELAY_MS * Math.pow(2, retries - 1)
							console.warn(`Retrying Gemini request in ${delayMs}ms (Attempt ${retries}/${MAX_RETRIES}). Error: API request failed: ${response.statusText}`)
							setTimeout(executeRequest, delayMs)
						} else {
							reject(`Gemini API request failed after ${MAX_RETRIES} retries: ${response.statusText}`)
						}
					}
				})
			}
			executeRequest()
		})
	}

	function getRatingClass(rating) {
		if (!rating) return ''
		const ratingLower = rating.toLowerCase()
		if (ratingLower.includes('good') || ratingLower.includes('excellent') || ratingLower.includes('outstanding') || ratingLower.includes('very good') || ratingLower.includes('strong')) {
			return 'good'
		} else if (ratingLower.includes('mixed') || ratingLower.includes('average') || ratingLower.includes('decent') || ratingLower.includes('fair') || ratingLower.includes('moderate')) {
			return 'mixed'
		} else if (ratingLower.includes('bad') || ratingLower.includes('poor') || ratingLower.includes('weak') || ratingLower.includes('lacking') || ratingLower.includes('needs improvement')) {
			return 'bad'
		} else if (ratingLower.includes('unknown') || ratingLower.includes('missing') || ratingLower.includes('unspecified') || ratingLower.includes('undetermined') || ratingLower.includes('insufficient')) {
			return 'unknown'
		}
		return ''
	}

	// --- BACKWARD COMPATIBILITY FOR CACHED ASSESSMENTS ---
	function populateUnknownField(analysis) {
		// Ensure unknown field exists for backward compatibility with cached data
		if (!analysis.unknown) {
			// Default unknown field to "Mixed" if not present in cached data
			analysis.unknown = 'Mixed'
		}
		return analysis
	}

	// --- UI MANIPULATION ---
	function updateCardUI(card, analysis) {
		// Populate unknown field if missing (backward compatibility)
		analysis = populateUnknownField(analysis)

		if (!analysis || !analysis.assessment || !analysis.summary) return

		const assessmentLower = analysis.assessment.toLowerCase()
		if (assessmentLower === 'good') {
			card.classList.add('gemini-good-novel')
		} else if (assessmentLower === 'mixed') {
			card.classList.add('gemini-mixed-novel')
		} else if (assessmentLower === 'bad') {
			card.classList.add('gemini-bad-novel')
		}

		const container = document.createElement('div')
		container.className = 'gemini-summary-container'

		const overallClass = getRatingClass(analysis.assessment)
		const characterClass = getRatingClass(analysis.characterDevelopment)
		const plotClass = getRatingClass(analysis.plotStructure)
		const worldClass = getRatingClass(analysis.worldBuilding)
		const themesClass = getRatingClass(analysis.themesAndMessages)
		const writingClass = getRatingClass(analysis.writingStyle)
		const unknownClass = getRatingClass(analysis.unknown)

		// Extract usernames for color coding (if available in analysis)
		const availableUsernames = analysis.availableUsernames || []

		let detailedAssessment = `<h4>AI Novel Assessment</h4>`
		detailedAssessment += `<div class="summary-toggle collapsed" data-target="novel-summary">`
		detailedAssessment += `<span>Novel Summary</span>`
		detailedAssessment += `<span class="material-icons toggle-icon">expand_more</span>`
		detailedAssessment += `</div>`
		detailedAssessment += `<div class="summary-content" id="novel-summary">`
		detailedAssessment += `<p>${analysis.novelSummary}</p>`
		detailedAssessment += `</div>`

		// Apply color coding to review summary
		const coloredReviewSummary = colorCodeReviewSummary(analysis.reviewSummary, availableUsernames)

		detailedAssessment += `<div class="summary-toggle collapsed" data-target="review-summary">`
		detailedAssessment += `<span>Review Summary</span>`
		detailedAssessment += `<span class="material-icons toggle-icon">expand_more</span>`
		detailedAssessment += `</div>`
		detailedAssessment += `<div class="summary-content" id="review-summary">`
		detailedAssessment += `<p>${coloredReviewSummary}</p>`
		detailedAssessment += `</div>`

		detailedAssessment += `<div class="assessment-section">`
		detailedAssessment += `<strong>Overall Assessment:</strong> <span class="assessment-rating ${overallClass}">${analysis.assessment}</span><br><hr style="margin: 5px 0;">`
		detailedAssessment += `<strong>Analysis Summary:</strong> ${analysis.summary}<br><hr style="margin: 5px 0;">`

		if (analysis.characterDevelopment) {
			const displayValue = analysis.characterDevelopment === 'Unknown' ? 'Insufficient Data' : analysis.characterDevelopment
			detailedAssessment += `<strong>Character Development:</strong> <span class="assessment-rating ${characterClass}">${displayValue}</span><br>`
		}
		if (analysis.plotStructure) {
			const displayValue = analysis.plotStructure === 'Unknown' ? 'Insufficient Data' : analysis.plotStructure
			detailedAssessment += `<strong>Plot Structure:</strong> <span class="assessment-rating ${plotClass}">${displayValue}</span><br>`
		}
		if (analysis.worldBuilding) {
			const displayValue = analysis.worldBuilding === 'Unknown' ? 'Insufficient Data' : analysis.worldBuilding
			detailedAssessment += `<strong>World-Building:</strong> <span class="assessment-rating ${worldClass}">${displayValue}</span><br>`
		}
		if (analysis.themesAndMessages) {
			const displayValue = analysis.themesAndMessages === 'Unknown' ? 'Insufficient Data' : analysis.themesAndMessages
			detailedAssessment += `<strong>Themes & Messages:</strong> <span class="assessment-rating ${themesClass}">${displayValue}</span><br>`
		}
		if (analysis.writingStyle) {
			const displayValue = analysis.writingStyle === 'Unknown' ? 'Insufficient Data' : analysis.writingStyle
			detailedAssessment += `<strong>Writing Style:</strong> <span class="assessment-rating ${writingClass}">${displayValue}</span><br>`
		}

		// Only show the legacy Unknown section for backward compatibility with cached assessments
		// New assessments won't have meaningful unknown data since Unknown is now per-category
		if (analysis.unknown && analysis.unknown !== 'Mixed') {
			detailedAssessment += `<strong>Legacy Unknown Data:</strong> <span class="assessment-rating ${unknownClass}">${analysis.unknown}</span><br>`
		}

		detailedAssessment += `</div>`

		container.innerHTML = `
		          <div class="gemini-summary-trigger" title="Show AI Summary">
		              <span class="material-icons">auto_awesome</span>
		          </div>
		          <div class="gemini-summary-card">
		              ${detailedAssessment}
		          </div>
		      `

		// Add toggle functionality after DOM insertion
		const summaryCard = container.querySelector('.gemini-summary-card')
		const summaryTrigger = container.querySelector('.gemini-summary-trigger')
		const toggles = summaryCard.querySelectorAll('.summary-toggle')

		// Add click event to toggle lock state
		let isLocked = false
		summaryTrigger.addEventListener('click', function (event) {
			event.stopPropagation()
			isLocked = !isLocked
			if (isLocked) {
				summaryCard.classList.add('locked')
			} else {
				summaryCard.classList.remove('locked')
			}
		})

		toggles.forEach(toggle => {
			toggle.addEventListener('click', function () {
				const targetId = this.dataset.target
				const content = summaryCard.querySelector(`#${targetId}`)
				const isCollapsed = this.classList.contains('collapsed')

				if (isCollapsed) {
					this.classList.remove('collapsed')
					content.classList.add('expanded')
				} else {
					this.classList.add('collapsed')
					content.classList.remove('expanded')
				}
			})
		})
		// Append directly to the card, which has position: relative
		card.appendChild(container)
	}

	function addLoadingOverlay(card) {
		const overlay = document.createElement('div')
		overlay.className = 'gemini-processing-overlay'
		overlay.textContent = 'Analyzing...'
		const cardBody = card.querySelector('.card-body')
		if (cardBody) {
			cardBody.style.position = 'relative'
			cardBody.appendChild(overlay)
		}
		return overlay
	}

	function createFloatingButton() {
		if (document.getElementById('gemini-floating-analyze-btn')) return // Button already exists

		const button = document.createElement('button')
		button.id = 'gemini-floating-analyze-btn'
		button.title = `Analyze Next Batch of Novels (${BATCH_LIMIT})`
		button.innerHTML = `<span class="material-icons">assessment</span>`
		button.addEventListener('click', processNovels)
		document.body.appendChild(button)
	}

	function displayCachedAssessments() {
		const novelCards = Array.from(document.querySelectorAll('.series-list > .card:not([data-gemini-processed]):not([data-gemini-cached-checked])'))
		novelCards.forEach(card => {
			const linkElement = card.querySelector('a[data-novel-id]')
			let serieId = null
			let rawId = null

			if (linkElement) {
				rawId = linkElement.dataset.novelId
				if (rawId && serieIdMap.has(rawId)) {
					serieId = serieIdMap.get(rawId)
				} else {
					// Fallback: Extract from href or use raw_id directly
					if (linkElement.href) {
						const match = linkElement.href.match(/\/novel\/(\d+)\//)
						if (match && match[1]) {
							serieId = match[1]
						}
					}
					if (!serieId && rawId) {
						serieId = rawId // Last resort
					}
				}
			}

			if (serieId) {
				let cachedAnalysis = getCachedAssessment(serieId)
				if (cachedAnalysis) {
					// Ensure cached analysis has availableUsernames for color coding
					if (!cachedAnalysis.availableUsernames) {
						cachedAnalysis.availableUsernames = []
					}
					// Ensure unknown field exists for backward compatibility
					cachedAnalysis = populateUnknownField(cachedAnalysis)
					updateCardUI(card, cachedAnalysis)
				}
			}
			// Mark as checked for cached status
			card.dataset.geminiCachedChecked = 'true'
		})
	}

	// --- MAIN LOGIC ---
	const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

	async function processNovels() {
		if (!GEMINI_API_KEY) {
			const modalSet = await showApiKeyModal()
			if (!modalSet) {
				return // User cancelled or closed modal
			}
		}

		// Validate serie_id mapping before proceeding
		if (serieIdMap.size === 0) {
			console.error('PROCESSING HALTED: Serie ID map is empty. Cannot proceed with invalid mappings.')
			debugLog('Processing aborted: Serie ID map validation failed (empty map)')
			showMappingFailureNotification()
			return
		}

		const allNovelCards = Array.from(document.querySelectorAll('.series-list > .card'))
		const uncachedNovelCards = []

		for (const card of allNovelCards) {
			const linkElement = card.querySelector('a[data-novel-id]')
			let serieId = null
			let rawId = null

			if (linkElement) {
				rawId = linkElement.dataset.novelId
				if (rawId && serieIdMap.has(rawId)) {
					serieId = serieIdMap.get(rawId)

					// Strict validation: verify the mapping is valid
					if (!validateSerieIdMapping(rawId, serieId)) {
						console.error(`PROCESSING HALTED: Invalid serie_id mapping detected for raw_id ${rawId}`)
						debugLog(`Processing aborted: Mapping validation failed for raw_id ${rawId}`)
						showMappingFailureNotification()
						return
					}
				} else {
					// NO FALLBACK - strict mapping required
					console.warn(`No serie_id mapping found for raw_id ${rawId}. Skipping this novel.`)
					debugLog(`Skipping novel with raw_id ${rawId}: No mapping in serieIdMap`)
					continue
				}
			}

			if (serieId && !getCachedAssessment(serieId)) {
				uncachedNovelCards.push(card)
			}
		}

		if (uncachedNovelCards.length === 0) {
			alert('No new novels to analyze.')
			return
		}

		const batch = uncachedNovelCards.slice(0, BATCH_LIMIT)
		const overlays = batch.map(card => addLoadingOverlay(card))

		try {
			const novelsData = []
			const batchResults = [] // Array to hold {card, analysis, overlay, serieId} for each processed novel

			for (let i = 0; i < batch.length; i++) {
				const card = batch[i]
				const overlay = overlays[i]

				const linkElement = card.querySelector('a[data-novel-id]')
				let serieId = null
				let rawId = null

				if (linkElement) {
					rawId = linkElement.dataset.novelId
					if (rawId && serieIdMap.has(rawId)) {
						serieId = serieIdMap.get(rawId)
						debugLog(`Mapped raw_id ${rawId} to serie_id ${serieId}`)

						// Strict validation before proceeding
						if (!validateSerieIdMapping(rawId, serieId)) {
							console.error(`PROCESSING HALTED: Invalid serie_id "${serieId}" for raw_id ${rawId}`)
							debugLog(`Processing aborted during batch: Invalid mapping detected`)
							showMappingFailureNotification()
							// Remove all overlays and halt
							overlays.forEach(o => o && o.remove())
							return
						}
					} else {
						// NO FALLBACK - strict mapping required
						console.error(`PROCESSING HALTED: No serie_id mapping for raw_id ${rawId}`)
						debugLog(`Processing aborted: Missing mapping for raw_id ${rawId}`)
						showMappingFailureNotification()
						// Remove all overlays and halt
						overlays.forEach(o => o && o.remove())
						return
					}
				}

				if (!serieId) {
					// If no serieId after validation, halt processing
					console.error('PROCESSING HALTED: Unable to obtain valid serie_id')
					debugLog('Processing aborted: No valid serie_id available')
					showMappingFailureNotification()
					// Remove all overlays and halt
					overlays.forEach(o => o && o.remove())
					return
				}

				// Not cached, prepare for analysis
				const titleElement = card.querySelector('a.title')
				let title = titleElement ? titleElement.textContent.trim() : 'No title'
				if (titleElement && title.startsWith('#')) {
					title = title.split(' ').slice(1).join(' ')
				}
				const rawTitleSpan = titleElement ? titleElement.querySelector('.rawtitle') : null
				if (rawTitleSpan) {
					title = title.replace(rawTitleSpan.textContent, '').trim()
				}

				const viewsLine = card.querySelector('.detail-buttons .detail-line:nth-of-type(1)')
				let totalViews = 0
				if (viewsLine) {
					const match = viewsLine.textContent.match(/(\d+) views/)
					if (match) totalViews = parseInt(match[1], 10)
				}

				const readersLine = card.querySelector('.detail-buttons .detail-line:nth-of-type(2)')
				let totalReaders = 0
				if (readersLine) {
					const match = readersLine.textContent.match(/(\d+) Readers/)
					if (match) totalReaders = parseInt(match[1], 10)
				}

				const ratingElement = card.querySelector('.rating-text')
				let rating = 0
				if (ratingElement) {
					const match = ratingElement.textContent.match(/(\d+\.\d+)/)
					if (match) rating = parseFloat(match[1])
				}

				const tagElements = card.querySelectorAll('.genres .genre')
				const genres = Array.from(tagElements).map(el => el.textContent.trim())

				const description = card.querySelector('.description')?.textContent.trim() || 'No description.'

				const reviews = await fetchReviews(serieId)
				debugLog(`Total reviews received for ${serieId}: ${reviews.length}`)
				const reviewsWithComments = reviews.filter(r => r.comment)
				debugLog(`Reviews with comments for ${serieId}: ${reviewsWithComments.length}`)

				const reviewsText = reviewsWithComments.map(r => `- User: ${r.username || 'Unknown'}\n- Rating: ${r.rate}/5\n- Comment: ${r.comment}`).join('\n\n')
				// Extract usernames for color coding
				const availableUsernames = extractUsernamesFromReviews(reviewsWithComments)
				novelsData.push({serieId, title, totalViews, totalReaders, rating, genres, description, reviewsText, availableUsernames})
				batchResults.push({card, overlay, serieId})

				await delay(300) // Wait 300ms between each fetch to be polite
			}

			if (novelsData.length === 0) {
				// All novels in batch were cached - return successfully without error
				debugLog('All novels in batch were cached - no API call needed')
				return
			}

			const analyses = await getGeminiAnalysis(novelsData)

			if (analyses.length !== novelsData.length) {
				throw new Error('Mismatch between number of novels sent and analyses received.')
			}

			// Apply analyses and cache them
			batchResults.forEach(({card, overlay, serieId}, index) => {
				let analysis = analyses[index]
				const novelData = novelsData[index]
				if (analysis) {
					// Ensure analysis has availableUsernames for color coding
					if (!analysis.availableUsernames && novelData && novelData.availableUsernames) {
						analysis.availableUsernames = novelData.availableUsernames
					}
					// Ensure unknown field exists (forward compatibility)
					analysis = populateUnknownField(analysis)
					updateCardUI(card, analysis)
					setCachedAssessment(serieId, analysis)
					// Mark as processed only after successful analysis and caching
					card.dataset.geminiProcessed = 'true'
				}
				if (overlay) overlay.remove()
			})
		} catch (error) {
			console.error('An error occurred during batch processing:', error)
			overlays.forEach(overlay => {
				if (overlay) {
					overlay.textContent = 'Batch Failed'
					setTimeout(() => overlay.remove(), 4000)
				}
			})
		}
	}

	// --- INITIALIZATION ---
	async function main() {
		loadConfig()

		// Validate and build serie_id mapping with retry logic
		const mappingSuccess = await validateAndBuildSerieIdMap()
		if (!mappingSuccess) {
			console.error('INITIALIZATION FAILED: Unable to build serie_id mapping after all retries')
			showMappingFailureNotification()
			// Continue with initialization but user will be notified
		}

		injectCSS()
		createSettingsPanel()
		createApiKeyModal()
		setupConfig()

		const observer = new MutationObserver(() => {
			if (document.querySelector('.series-list')) {
				createFloatingButton()
				displayCachedAssessments()
			}
		})
		observer.observe(document.body, {childList: true, subtree: true})
	}

	main()
})()
