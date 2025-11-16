/**
 * DOM Utilities
 * Common DOM manipulation utilities
 */

// Main application stylesheet content
const MAIN_STYLES = `/* Main stylesheet for WTR-Lab Novel Reviewer */

/* Card modifications */
.gemini-good-novel .card-body {
	background-color: #2e462e !important;
	border: 1px solid #578857;
} /* Dark Green */
.gemini-mixed-novel .card-body {
	background-color: #46402e !important;
	border: 1px solid #887a57;
} /* Dark Yellow/Orange */
.gemini-bad-novel .card-body {
	background-color: #462e2e !important;
	border: 1px solid #885757;
} /* Dark Red */
.gemini-processing-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgb(0 0 0 / 50%);
	color: white;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 1.2em;
	z-index: 10;
	border-radius: var(--bs-card-inner-border-radius);
}

/* Color coding for assessment ratings */
.assessment-rating {
	font-weight: bold;
	padding: 2px 6px;
	border-radius: 3px;
}

.assessment-rating.good {
	color: #4caf50;
	background-color: rgb(76 175 80 / 10%);
}

.assessment-rating.mixed {
	color: #ff9800;
	background-color: rgb(255 152 0 / 10%);
}

.assessment-rating.bad {
	color: #f44336;
	background-color: rgb(244 67 54 / 10%);
}

.assessment-rating.unknown {
	color: #9e9e9e;
	background-color: rgb(158 158 158 / 10%);
	border: 1px solid rgb(158 158 158 / 30%);
	font-style: italic;
}

/* Summary Icon and Tooltip */
.gemini-summary-container {
	/* This container is now a direct child of the .card element */
}

.gemini-summary-trigger {
	position: absolute;
	top: 50%;
	right: -40px; /* Position outside the card container */
	transform: translateY(-50%);
	cursor: pointer;
	z-index: 5;
	background-color: rgb(0 0 0 / 60%);
	border-radius: 50%;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
}

.gemini-summary-trigger .material-icons {
	font-size: 20px;
}

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
	box-shadow: 0 6px 12px rgb(0 0 0 / 40%);
	overflow-y: auto;
}

.gemini-summary-card h4 {
	margin: 0 0 8px;
	color: #fff;
	font-size: 1.1em;
	font-weight: 600;
}

.gemini-summary-card h5 {
	margin: 10px 0 5px;
	color: #adb5bd;
	font-size: 1em;
	font-weight: 500;
}

.gemini-summary-card p {
	margin: 0 0 10px;
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
	background-color: rgb(255 255 255 / 5%);
	padding: 8px 12px;
	border-radius: 4px;
	margin-bottom: 8px;
	transition: background-color 0.2s ease;
}

.gemini-summary-card .summary-toggle:hover {
	background-color: rgb(255 255 255 / 10%);
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

.gemini-summary-card.locked {
	display: block;
}

.gemini-summary-card:hover:not(.locked),
.gemini-summary-trigger:hover + .gemini-summary-card:not(.locked) {
	display: block;
}

/* Color-coded Username Styling */
.username-color-coded {
	background-color: rgb(255 255 255 / 10%);
	padding: 1px 3px;
	border-radius: 2px;
	font-weight: 600;
	transition: all 0.2s ease;
	border: 1px solid transparent;
}

.username-color-coded:hover {
	background-color: rgb(255 255 255 / 20%);
	border-color: rgb(255 255 255 / 30%);
	transform: translateY(-1px);
}

/* Anonymous user styling */
.username-color-coded.anonymous {
	background-color: rgb(149 165 166 / 20%);
	color: #bdc3c7 !important;
	border: 1px solid rgb(189 195 199 / 30%);
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
	box-shadow: 0 4px 8px rgb(0 0 0 / 30%);
	z-index: 9998;
	transition: background-color 0.3s ease;
}

#gemini-floating-analyze-btn:hover {
	background-color: #0b5ed7;
}

#gemini-floating-analyze-btn .material-icons {
	font-size: 28px;
}

/* Settings Panel */
#gemini-settings-panel {
	display: none;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: #2c3034;
	color: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 5px 15px rgb(0 0 0 / 50%);
	z-index: 9999;
	width: 400px;
}

#gemini-settings-panel h3 {
	margin-top: 0;
}

#gemini-settings-panel label {
	display: block;
	margin: 10px 0 5px;
}

#gemini-settings-panel input,
#gemini-settings-panel select {
	width: 100%;
	padding: 8px;
	border-radius: 4px;
	border: 1px solid #495057;
	background-color: #212529;
	color: white;
	box-sizing: border-box;
}

#gemini-settings-panel .buttons {
	margin-top: 20px;
	text-align: right;
}

#gemini-settings-panel button {
	margin-left: 10px;
	padding: 8px 15px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
}

#gemini-settings-save {
	background-color: #0d6efd;
	color: white;
}

#gemini-settings-close {
	background-color: #6c757d;
	color: white;
}

/* API Key Modal */
#gemini-api-key-modal {
	display: none;
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: #2c3034;
	color: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 5px 15px rgb(0 0 0 / 50%);
	z-index: 9999;
	width: 500px;
	max-height: 80vh;
	overflow-y: auto;
}

#gemini-api-key-modal h3 {
	margin-top: 0;
	color: #fff;
	text-align: center;
}

#gemini-api-key-modal .instructions {
	margin-bottom: 20px;
}

#gemini-api-key-modal .instructions ol {
	text-align: left;
	padding-left: 20px;
}

#gemini-api-key-modal .instructions li {
	margin-bottom: 8px;
}

#gemini-api-key-modal label {
	display: block;
	margin: 10px 0 5px;
	font-weight: bold;
}

#gemini-api-key-modal input {
	width: 100%;
	padding: 8px;
	border-radius: 4px;
	border: 1px solid #495057;
	background-color: #212529;
	color: white;
	box-sizing: border-box;
}

#gemini-api-key-modal .buttons {
	margin-top: 20px;
	text-align: center;
}

#gemini-api-key-modal button {
	margin: 0 10px;
	padding: 8px 15px;
	border-radius: 4px;
	border: none;
	cursor: pointer;
	background-color: #0d6efd;
	color: white;
}

#gemini-api-key-modal-close {
	background-color: #6c757d;
}

/* Mapping Failure Notification */
#gemini-mapping-failure-notification {
	position: fixed;
	top: 80px;
	right: 20px;
	width: 400px;
	background-color: #dc3545;
	color: white;
	border-radius: 8px;
	box-shadow: 0 6px 16px rgb(0 0 0 / 40%);
	z-index: 10000;
	animation: slide-in-right 0.3s ease-out;
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

@keyframes slide-in-right {
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
@media (width <= 768px) {
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

/* Material Icons font declaration */
.material-icons {
	font-family: 'Material Icons';
	font-weight: normal;
	font-style: normal;
	font-size: 24px;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	display: inline-block;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	-webkit-font-feature-settings: 'liga';
	-webkit-font-smoothing: antialiased;
}`

/**
 * Inject Material Icons stylesheet and main styles
 */
export function injectCSS() {
	// Try to load Material Icons from Google Fonts first
	const materialIconsUrl = "https://fonts.googleapis.com/icon?family=Material+Icons"

	GM_xmlhttpRequest({
		method: "GET",
		url: materialIconsUrl,
		headers: {
			Accept: "text/css,*/*;q=0.1",
		},
		onload: function (response) {
			if (response.status === 200 && response.responseText) {
				console.log("Successfully loaded Material Icons from Google Fonts")
				GM_addStyle(response.responseText)
			} else {
				console.warn("Failed to load Material Icons from Google Fonts, using fallback icons")
				applyIconFallbacks()
			}
		},
		onerror: function () {
			console.warn("Failed to load Material Icons, using fallback icons")
			applyIconFallbacks()
		},
	})

	// Inject main application styles immediately
	GM_addStyle(MAIN_STYLES)
}

/**
 * Apply fallback icons using Unicode characters
 */
function applyIconFallbacks() {
	// Replace Material Icons classes with Unicode fallbacks
	const iconReplacements = {
		auto_awesome: "⭐", // Star
		assessment: "📊", // Bar chart
		expand_more: "▼", // Down arrow
		error: "⚠️", // Warning
	}

	// Add CSS to make icons consistent
	const fallbackCSS = `
.material-icons {
	font-style: normal;
	font-weight: normal;
	font-size: 20px;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	display: inline-block;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	-webkit-font-smoothing: antialiased;
	vertical-align: middle;
}
`
	GM_addStyle(fallbackCSS)

	// Store replacements for use when creating elements
	window.__ICON_REPLACEMENTS__ = iconReplacements
}
