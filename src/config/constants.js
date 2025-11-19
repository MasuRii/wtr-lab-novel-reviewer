/**
 * Application Constants
 * Contains fixed configuration values and constants used throughout the application
 */

export const GEMINI_MODELS = [
	"gemini-2.5-pro",
	"gemini-flash-latest",
	"gemini-flash-lite-latest",
	"gemini-2.5-flash",
	"gemini-2.5-flash-lite",
]

// Retry and timeout constants
export const MAX_RETRIES = 3
export const INITIAL_DELAY_MS = 1000

// Mapping constants
export const MAPPING_RETRY_ATTEMPTS = 3
export const MAPPING_RETRY_DELAY = 2000

// Username color system constants
export const USERNAME_COLORS = [
	"#e74c3c", // Red
	"#3498db", // Blue
	"#2ecc71", // Green
	"#f39c12", // Orange
	"#9b59b6", // Purple
	"#1abc9c", // Teal
	"#e67e22", // Dark Orange
	"#34495e", // Dark Blue-Gray
	"#e91e63", // Pink
	"#ff5722", // Deep Orange
	"#795548", // Brown
	"#607d8b", // Blue Gray
	"#8bc34a", // Light Green
	"#ffc107", // Amber
	"#673ab7", // Deep Purple
	"#00bcd4", // Cyan
	"#ff9800", // Orange
	"#4caf50", // Green
	"#2196f3", // Blue
	"#f44336", // Red
	"#9c27b0", // Purple
]

export const ANONYMOUS_USER_COLOR = "#95a5a6" // Gray

// API constants
export const MAX_PAGES = 5 // Limit to 5 pages (e.g., 50 reviews) to prevent excessive fetching
export const PAGE_DELAY_MS = 100 // Short delay between pages to be polite
export const FETCH_DELAY_MS = 300 // Wait 300ms between each fetch to be polite

// Default configuration values
export const DEFAULT_BATCH_LIMIT = 1
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
export const DEFAULT_DEBUG_LOGGING_ENABLED = false

// Supported routes for script execution (Regex patterns)
export const SUPPORTED_ROUTES = [/^https:\/\/wtr-lab\.com\/en\/for-you/, /^https:\/\/wtr-lab\.com\/en\/novel-finder/]
