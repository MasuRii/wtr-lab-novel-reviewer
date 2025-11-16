# WTR-Lab Novel Reviewer

[![Novel Reviewer](https://pixvid.org/images/2025/11/12/kfTws.fr.jpeg)](https://pixvid.org/video/kfTws)

A powerful userscript that uses Google's Gemini AI to analyze novels on WTR-Lab. Get comprehensive AI-powered assessments, color-coded review summaries, and detailed analysis across multiple categories without leaving the "For You" page.

[![Install WTR-Lab Novel Reviewer](https://img.shields.io/badge/Install%20directly-Greasy%20Fork-green.svg)](https://greasyfork.org/en/scripts/555556)
[![Version](https://img.shields.io/badge/Version-1.8.1-blue.svg)](#changelog)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## ✨ Features

### 🤖 AI-Powered Analysis
- **Comprehensive Novel Assessment**: Get detailed analysis across 5 categories: Character Development, Plot Structure, World-Building, Themes & Messages, and Writing Style
- **Smart Rating System**: Each category rated as Good, Mixed, Bad, or Unknown (for insufficient data)
- **Batch Processing**: Analyze multiple novels efficiently with configurable batch sizes
- **Optimized API Usage**: Smart review fetching with intelligent pagination (60-80% reduction in unnecessary API calls)

### 🎨 Visual Enhancements
- **Color-Coded Review Summaries**: Username attribution with 20-color accessible palette for easy reading
- **Visual Highlighting**: Cards color-coded based on overall assessment (Good=Dark Green, Mixed=Dark Yellow, Bad=Dark Red)
- **Enhanced UI**: Clean pop-up summaries with collapsible sections and smooth animations
- **Mobile Responsive**: Optimized display for all screen sizes

### 🛠️ Advanced Features
- **Smart Caching**: Local storage caching prevents redundant API calls
- **Error Recovery**: Robust retry logic with comprehensive error handling
- **Genre System**: Standardized genre labeling replacing outdated "tags" terminology
- **Debug Mode**: Optional logging for troubleshooting and optimization
- **Accessibility**: Color-blind friendly design with proper contrast ratios

---

## 🚀 Installation & Setup

### Prerequisites
- A userscript manager: [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)
- A Google Gemini API key (free tier available)

### Step 1: Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "**Create API key**"
4. Copy the generated key
5. *Note: The Gemini API has a generous free tier, but check [Google's pricing](https://ai.google.dev/pricing) for heavy usage*

### Step 2: Install the Script
1. Click the "**Install**" button at the top of the Greasy Fork page
2. Confirm installation in your userscript manager

### Step 3: Configure Your API Key
1. Navigate to the [WTR-Lab "For You" page](https://wtr-lab.com/en/for-you)
2. Click the Tampermonkey icon in your browser's toolbar
3. Under "WTR-Lab Novel Reviewer", click "**Open Settings**"
4. Paste your Gemini API Key into the input field
5. Click "**Save**"

### Step 4: Start Analyzing!
1. On the "For You" page, look for the floating **Analyze** button (📊)
2. Click to start analyzing the next batch of novels
3. Hover over the ✨ icon on processed cards to view detailed assessments

---

## ⚙️ Configuration

Access settings anytime through the Tampermonkey menu or the floating settings icon.

### Available Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Gemini API Key** | Your Google AI API key (required) | - |
| **Batch Limit** | Number of novels to analyze per click | `5` |
| **Gemini Model** | AI model for analysis | `gemini-2.5-flash` |
| **Debug Logging** | Enable detailed logging for troubleshooting | `Disabled` |

### Gemini Model Options
- **`gemini-2.5-flash`**: Fast and cost-effective, perfect for general use
- **`gemini-2.5-pro`**: More powerful model for detailed analysis (higher cost)
- **`gemini-flash-latest`**: Latest flash model with recent improvements
- **`gemini-flash-lite-latest`**: Ultra-fast model for quick assessments
- **`gemini-2.5-flash-lite`**: Lightweight version for efficient processing

---

## 📊 Understanding the Analysis

### Rating System
Each novel receives assessments across multiple categories:

#### Overall Assessment
- **Good** ⭐: High-quality novel with positive user feedback
- **Mixed** ⚖️: Average quality with mixed reviews
- **Bad** ❌: Poor quality or problematic content

#### Category Ratings
- **Good**: Strong implementation of that aspect
- **Mixed**: Average or inconsistent execution
- **Bad**: Poor or problematic implementation
- **Unknown**: Insufficient data to make a reliable assessment

### Analysis Categories
- **Character Development**: Character depth, growth, consistency, dialogue authenticity
- **Plot Structure**: Pacing, narrative flow, story coherence, conflict resolution
- **World-Building**: Setting details, consistency, immersion, cultural depth
- **Themes & Messages**: Clarity, relevance, integration, thought provocation
- **Writing Style**: Prose quality, descriptive language, dialogue naturalness

### Color-Coded Elements
- **Review Summaries**: Usernames are color-coded for easy identification
- **Card Highlighting**: Background colors indicate overall assessment
- **Rating Badges**: Colored tags show individual category ratings

---

## 🆘 Troubleshooting

### Common Issues & Solutions

#### "Batch Failed" or Analysis Errors
**Check the browser console** (`F12` → Console tab) for detailed error messages:

**Common Causes:**
- Invalid or incorrect API key
- API request blocked by safety filters
- Network connectivity issues
- Rate limiting from Google API

**Solutions:**
1. Verify your API key is correct and active
2. Try refreshing the page and analyzing again
3. Check your Google AI Studio for any usage limits
4. Enable Debug Logging for more detailed error information

#### No "Analyze" Button Appears
- The button appears after the novel list loads completely
- Try refreshing the page
- Ensure you're on the WTR-Lab "For You" page
- Check that the script is enabled in your userscript manager

#### "Serie ID Mapping Failed" Notification
- This indicates a technical issue with WTR-Lab's website structure
- Refresh the page to retry the mapping process
- If the issue persists, try clearing browser cache
- The script includes automatic retry logic to handle temporary failures

#### Performance Issues
- Reduce the batch size in settings for slower connections
- The script includes intelligent caching to minimize API calls
- Enable Debug Logging to monitor processing times

#### High API Usage
- The script includes smart pagination to fetch only necessary review data
- Reduce batch size to analyze fewer novels at once
- Consider using `gemini-2.5-flash` for cost-effective analysis
- Check your Google AI Studio usage dashboard for monitoring

### Debug Mode
Enable Debug Logging in settings to see:
- API request/response details
- Processing status updates
- Error stack traces
- Performance metrics

---

## 🔄 Version History

### Changelog
For detailed version history, see [Changelog.md](Changelog.md)

### Current Version: 1.8.1 (November 16, 2025)
**Major Refactor:**
- 🏗️ Complete modularization from single 1,325-line file to maintainable 24-file architecture
- 📁 Organized codebase with clear separation of concerns across 8 modular directories
- 📊 Improved maintainability with isolated modules for testing and development
- 🔧 Enhanced build system with comprehensive validation and error resolution
- 🚀 Optimized for three deployment targets (Performance, GreasyFork, Development)

### Previous Version: 1.8.0 (November 13, 2025)
**Major Features:**
- ✨ Color-coded review summary system with username attribution
- 🎨 20-color accessible palette for consistent username colors
- 📊 Enhanced assessment categories with "Unknown" ratings for insufficient data
- 🚀 Optimized review fetching with smart pagination
- 🛡️ Enhanced error handling and user notification system
- 🏷️ Standardized genre labeling system
- ⚡ Improved performance with caching and retry logic

---

## 🤝 Contributing

This is an open-source project. Contributions and feedback are welcome!

### Reporting Issues
When reporting bugs, please include:
- Browser and userscript manager version
- Console error messages (if any)
- Steps to reproduce the issue
- Settings configuration

### Feature Requests
We welcome suggestions for new features and improvements!

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powering the novel analysis
- **WTR-Lab** for providing the platform
- **Greasy Fork** community for hosting and feedback
- **Userscript community** for inspiration and best practices

---

## 📞 Support

Need help? Here's where to get support:

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check this README and the Changelog
- **Community**: Visit the Greasy Fork script page for user discussions

**Happy novel discovering! 📚✨**