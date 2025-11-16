// ==UserScript==
// @name         WTR-Lab Novel Reviewer
// @namespace    http://tampermonkey.net/
// @version      1.8.1
// @description  Uses Gemini to analyze novels on wtr-lab.com. Adds a floating button to start analysis and displays an AI summary icon on each novel card. Comprehensive modular architecture with enhanced maintainability.
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
// @license      MIT
// ==/UserScript==

import { main } from "./main.js"

// Initialize the application when DOM is ready
;(function () {
	"use strict"

	// Wait for DOM to be ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", main)
	} else {
		// DOM is already ready
		main()
	}
})()
