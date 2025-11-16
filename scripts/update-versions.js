#!/usr/bin/env node
// scripts/update-versions.js
// Automated version synchronization for WTR-Lab Novel Reviewer

const fs = require("fs");
const path = require("path");
const { VERSION_INFO } = require("../config/versions.js");

// Files to update with version information
const FILES_TO_UPDATE = [
  {
    file: "package.json",
    patterns: [
      { search: /"version":\s*"[^"]*"/g, replace: `"version": "${VERSION_INFO.NPM}"` }
    ]
  },
  {
    file: "README.md",
    patterns: [
      { search: /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+\)/g, replace: `![Version](https://img.shields.io/badge/version-${VERSION_INFO.BADGE}-blue)` }
    ]
  },
  {
    file: "GreasyForkREADME.md",
    patterns: [
      { search: /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+\)/g, replace: `![Version](https://img.shields.io/badge/version-${VERSION_INFO.BADGE}-blue)` }
    ]
  }
];

const command = process.argv[2] || "update";

/**
 * Safely update a file using explicit patterns.
 * Returns:
 * - true if any changes were written
 * - false if no changes were needed
 * - throws on hard failure (I/O or unexpected error)
 */
function updateFile(filePath, patterns) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    let updatedContent = content;
    let hasChanges = false;

    patterns.forEach(({ search, replace }) => {
      if (search.test(updatedContent)) {
        updatedContent = updatedContent.replace(search, replace);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, "utf8");
      console.log(`✅ Updated ${filePath}`);
      return true;
    }

    console.log(`ℹ️  No changes needed for ${filePath}`);
    return false;
  } catch (error) {
    // Treat as hard failure so build can surface the problem
    console.error(`❌ Error updating ${filePath}:`, error.message);
    throw error;
  }
}

function generateBanner() {
  const banner = `/**
 * WTR-Lab Novel Reviewer v${VERSION_INFO.SEMANTIC}
 * Built: ${VERSION_INFO.BUILD_DATE} (${VERSION_INFO.BUILD_ENV})
 *
 * A powerful userscript for comprehensive novel analysis of WTR Lab chapters
 * using Gemini AI with smart rotation and background processing.
 *
 * @version ${VERSION_INFO.SEMANTIC}
 * @build ${VERSION_INFO.BUILD_ENV}
 * @date ${VERSION_INFO.BUILD_DATE}
 */`;

  const bannerPath = path.join(__dirname, "../src/banner.js");
  fs.writeFileSync(bannerPath, banner, "utf8");
  console.log(`📝 Generated build banner: ${bannerPath}`);
  return bannerPath;
}

function generateHeader() {
  const header = `// ==UserScript==
// @name         WTR-Lab Novel Reviewer v${VERSION_INFO.SEMANTIC}
// @namespace    http://tampermonkey.net/
// @version      ${VERSION_INFO.SEMANTIC}
// @description  Comprehensive novel analysis for WTR Lab chapters using Gemini AI. Supports multiple API keys with smart rotation, dynamic model fetching, and background processing.
// @author       MasuRii
// @license      MIT
// @match        https://wtr-lab.com/en/for-you*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com
// @connect      generativelanguage.googleapis.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @supportURL   https://github.com/wtr-lab/wtr-lab-novel-reviewer/issues
// @website      https://github.com/wtr-lab/wtr-lab-novel-reviewer
// ==/UserScript==

`;

  const headerPath = path.join(__dirname, "../src/header.js");
  fs.writeFileSync(headerPath, header, "utf8");
  console.log(`📋 Generated script header: ${headerPath}`);
  return headerPath;
}

function checkVersion() {
  console.log("📋 Current Version Information:");
  console.log(`   Semantic Version: ${VERSION_INFO.SEMANTIC}`);
  console.log(`   Display Version: ${VERSION_INFO.DISPLAY}`);
  console.log(`   Build Environment: ${VERSION_INFO.BUILD_ENV}`);
  console.log(`   Build Date: ${VERSION_INFO.BUILD_DATE}`);
  console.log(`   GreasyFork Version: ${VERSION_INFO.GREASYFORK}`);
  console.log(`   NPM Version: ${VERSION_INFO.NPM}`);
  console.log(`   Badge Version: ${VERSION_INFO.BADGE}`);
  console.log(`   Changelog Version: ${VERSION_INFO.CHANGELOG}`);
}

// Main execution
console.log("🔄 WTR-Lab Novel Reviewer - Version Management");
console.log("=" .repeat(55));

switch (command) {
  case "update":
    console.log("🔄 Updating versioned files...");

    let updatedFiles = 0;
    let hadHardFailure = false;

    // 1) Update all configured files (package.json, README, etc.)
    FILES_TO_UPDATE.forEach(({ file, patterns }) => {
      const filePath = path.join(__dirname, "..", file);
      try {
        if (updateFile(filePath, patterns)) {
          updatedFiles++;
        }
      } catch (error) {
        hadHardFailure = true;
      }
    });

    // 2) Generate banner and header directly from VERSION_INFO
    try {
      generateBanner();
      updatedFiles++;
    } catch (error) {
      console.error("❌ Failed to generate banner.js:", error.message);
      hadHardFailure = true;
    }

    try {
      generateHeader();
      updatedFiles++;
    } catch (error) {
      console.error("❌ Failed to generate header.js:", error.message);
      hadHardFailure = true;
    }

    if (hadHardFailure) {
      console.error("❌ Version update failed. Build aborted due to version sync errors.");
      process.exit(1);
    }

    console.log(`✅ Completed! Updated ${updatedFiles} items (including banner.js and header.js).`);
    break;

  case "check":
    checkVersion();
    break;

  case "banner":
    try {
      generateBanner();
    } catch (error) {
      console.error("❌ Failed to generate banner.js:", error.message);
      process.exit(1);
    }
    break;

  case "header":
    try {
      generateHeader();
    } catch (error) {
      console.error("❌ Failed to generate header.js:", error.message);
      process.exit(1);
    }
    break;

  default:
    console.log("❓ Unknown command:", command);
    console.log("📖 Available commands:");
    console.log("   update  - Update all versioned files (default)");
    console.log("   check   - Display current version information");
    console.log("   banner  - Generate build banner only");
    console.log("   header  - Generate script header only");
    process.exit(1);
}

// Success exit
process.exit(0);