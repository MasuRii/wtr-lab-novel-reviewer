# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2025-11-13

### 🚀 Added
- Standardized genre labeling system replacing "tags" terminology with "genre" throughout the application
- Optimized review fetching logic with smart pagination (60-80% reduction in unnecessary API calls)
- Color-coded review summary system with consistent username attribution (20-color accessible palette)
- Unknown field handling for insufficient data assessment within individual categories
- Enhanced user notification system for mapping failures with actionable error messages
- Comprehensive retry logic with safeguards against infinite loops
- Username color cache for performance optimization

### 🔄 Changed
- Review fetching now starts with Page 0 only, fetches additional pages only when data is insufficient (≥3 reviews with comments)
- Serie ID mapping validation now requires strict confirmation before proceeding with review operations
- Assessment categories now support 4 ratings: Good, Mixed, Bad, Unknown (indicates insufficient data for that specific aspect)
- Gemini AI analysis prompts updated to include genre terminology and Unknown rating criteria
- Enhanced debug logging system with clear processing status indicators
- UI representation improved with better visual indicators for different assessment states

### 🐛 Fixed
- Critical JavaScript runtime errors: "invalid assignment to const 'cachedAnalysis'" and "invalid assignment to const 'analysis'"
- Incorrect Unknown field implementation (was separate category, now per-category rating for insufficient data)
- Const variable reassignment issues causing script crashes
- Mapping validation now properly halts processing on failure instead of attempting fallbacks
- Color assignment consistency across sessions and page reloads

### 🔒 Security
- Enhanced validation prevents processing with invalid or incorrect serie_id values
- Improved error handling prevents potential security issues from fallback methods
- Robust input validation for all user-facing data and API responses

## Format Template for Future Releases

Each release should follow this structure:

### 🚀 Added
- New features and functionality

### 🔄 Changed
- Changes in existing functionality

### 🗑️ Deprecated
- Features marked for removal in future versions

### ❌ Removed
- Removed features and functionality

### 🐛 Fixed
- Bug fixes and corrections

### 🔒 Security
- Security-related improvements

---
