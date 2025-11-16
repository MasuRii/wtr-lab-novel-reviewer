# WTR Lab Term Inconsistency Finder

[![WTR Lab Term Inconsistency](https://pixvid.org/images/2025/11/11/kBrXW.gif)](https://pixvid.org/image/kBrXW)

[![Version](https://img.shields.io/badge/version-5.3.7-blue)](https://github.com/MasuRii/wtr-term-inconsistency-finder/blob/main/CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Greasy Fork](https://img.shields.io/badge/Install-Greasy%20Fork-green.svg)](https://greasyfork.org/en/scripts/554989-wtr-lab-term-inconsistency-finder)

A sophisticated userscript that finds translation inconsistencies in WTR Lab chapters using the Google Gemini AI. Perfect for translators and proofreaders who want to ensure term consistency across entire novels.

---

### Table of Contents

-   [🚀 Features](#-features)
-   [🔧 Installation](#-installation)
-   [💡 Usage](#-usage)
-   [⚙️ For Developers](#️-for-developers)
    -   [Prerequisites](#prerequisites)
    -   [Setup and Installation](#setup-and-installation)
    -   [Available Scripts](#available-scripts)
    -   [Project Structure](#project-structure)
-   [🤝 Contributing](#-contributing)
-   [📜 Changelog](#-changelog)
-   [📄 License](#-license)
-   [🌟 Acknowledgments](#-acknowledgments)
-   [💬 Support](#-support)

---

## 🚀 Features

-   **🤖 AI-Powered Analysis**: Leverages Google Gemini to intelligently detect contextual term inconsistencies.
-   **🔄 Multi-API Key Support**: Automatically rotates keys to manage rate limits, with smart cooldowns and persistent state.
-   **🔍 Deep Analysis**: Performs multiple analysis iterations (1-5) for more comprehensive and accurate results.
-   **💾 Session Persistence**: Automatically saves and restores analysis results, allowing you to pick up where you left off.
-   **🎛️ Advanced Filtering**: Filter results by priority (`CRITICAL`, `HIGH`, `MEDIUM`, etc.) and status (`New`, `Verified`).
-   **🛠️ Term Replacer Integration**: Seamlessly apply suggested fixes with the external [WTR Lab Term Replacer](https://greasyfork.org/en/scripts/452202-wtr-lab-term-replacer) userscript.
-   **📊 Real-time Status**: A clean UI with live progress indicators and detailed status messages.
-   **📱 Modern & Responsive**: The interface is designed to work smoothly on all screen sizes.

## 🔧 Installation

The easiest way to install is directly from Greasy Fork.

1.  **Install a Userscript Manager**: You need an extension like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2.  **Install the Script**: Click the link below to install.
    -   <a href="https://greasyfork.org/en/scripts/554989-wtr-lab-term-inconsistency-finder" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Install from Greasy Fork</a>
3.  **Get a Gemini API Key**: This script requires a free Google Gemini API key.
    -   Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to create one.

## 💡 Usage

1.  **Navigate** to any WTR Lab chapter.
2.  **Click the Finder icon (🔍)** in the top-right corner to open the panel.
3.  **Configure**: In the "Configuration" tab, paste your Gemini API key(s) and click "Save".
4.  **Analyze**: Go back to the "Analysis" tab, select your chapters, and click "Start Analysis".
5.  **Review**: Once the analysis is complete, review the found inconsistencies.
6.  **Apply/Copy**: Use the "Apply" buttons to send terms to the WTR Lab Term Replacer script, or "Copy" buttons to copy them to your clipboard.

## ⚙️ For Developers

This project is built with a modern JavaScript toolchain for maintainability and ease of development.

### Prerequisites

-   Node.js (v16 or higher)
-   npm (v8 or higher)
-   A userscript manager like Tampermonkey for testing.

### Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MasuRii/wtr-term-inconsistency-finder.git
    cd wtr-term-inconsistency-finder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Available Scripts

-   **Start the development server (with hot-reloading):**
    ```bash
    npm run dev
    ```
    This creates a proxy script at `dist/wtr-term-inconsistency-finder.proxy.user.js`. Install this proxy script in Tampermonkey to get automatic updates whenever you save a file.

-   **Build for production:**
    ```bash
    npm run build
    ```
    This bundles and minifies the script into `dist/wtr-term-inconsistency-finder.user.js`, ready for distribution.

-   **Lint and format code:**
    ```bash
    npm run lint
    npm run lint:fix
    ```

### Project Structure

```
.
├── dist/                   # Build output
├── src/
│   ├── modules/            # Core logic (API, state, UI, utils)
│   ├── styles/             # CSS styles
│   └── index.js            # Main entry point
├── .github/                # GitHub Actions workflows
├── eslint.config.js        # ESLint configuration
├── .prettierrc.json        # Prettier configuration
├── package.json            # Project dependencies and scripts
└── webpack.config.js       # Webpack configuration
```

## 🤝 Contributing

Contributions are welcome! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to submit pull requests, report issues, and suggest features.

## 📜 Changelog

All notable changes to this project are documented in the [CHANGELOG.md](CHANGELOG.md) file.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

-   **Google** for the powerful Gemini AI model.
-   **The WTR Lab community** for their feedback and support.
-   **Webpack Userscript Plugin** for simplifying the build process.

## 💬 Support

If you encounter a bug or have a feature request, please use the following channels:

-   **Bug Reports & Feature Requests**: [GitHub Issues](https://github.com/MasuRii/wtr-term-inconsistency-finder/issues)
-   **Questions & Discussions**: [GitHub Discussions](https://github.com/MasuRii/wtr-term-inconsistency-finder/discussions)
-   **User Feedback**: [Greasy Fork Feedback Section](https://greasyfork.org/en/scripts/554989-wtr-lab-term-inconsistency-finder/feedback)

---

**Made with ❤️ for the WTR Lab translation community.**