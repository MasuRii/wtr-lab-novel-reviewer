// webpack.config.js
// Multi-build configuration for WTR Term Inconsistency Finder

const path = require("path");
const { UserscriptPlugin } = require("webpack-userscript");
const pkg = require("./package.json");
const { VERSION_INFO, getVersion } = require("./config/versions.js");

// Common metadata for all builds
const COMMON_META = {
  description: pkg.description,
  author: pkg.author,
  license: pkg.license,
  namespace: "http://tampermonkey.net/",
  match: "https://wtr-lab.com/en/novel/*/*/*",
  icon: "https://www.google.com/s2/favicons?sz=64&domain=wtr-lab.com",
  connect: "generativelanguage.googleapis.com",
  grant: [
    "GM_setValue",
    "GM_getValue",
    "GM_addStyle",
    "GM_registerMenuCommand",
    "GM_xmlhttpRequest",
  ],
  "run-at": "document-idle",
  supportURL: "https://github.com/MasuRii/wtr-term-inconsistency-finder/issues",
  website: "https://github.com/MasuRii/wtr-term-inconsistency-finder",
};

// Script name constants
const SCRIPT_NAME = "WTR Lab Term Inconsistency Finder";
const PACKAGE_NAME = pkg.name;

// Build time for development builds
const buildTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15);

// 1. Performance Build (Production)
const performanceConfig = {
  name: "performance",
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${PACKAGE_NAME}.user.js`,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      }
    ]
  },
  optimization: {
    minimize: true,
    usedExports: true,
    concatenateModules: true,
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new UserscriptPlugin({
      headers: {
        ...COMMON_META,
        name: SCRIPT_NAME,
        version: getVersion("semantic"),
        downloadURL: `https://raw.githubusercontent.com/MasuRii/wtr-term-inconsistency-finder/main/dist/${PACKAGE_NAME}.user.js`,
        updateURL: `https://raw.githubusercontent.com/MasuRii/wtr-term-inconsistency-finder/main/dist/${PACKAGE_NAME}.user.js`,
      },
      proxyScript: false,
    }),
  ],
};

// 2. GreasyFork Build
const greasyforkConfig = {
  name: "greasyfork",
  mode: "production",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${PACKAGE_NAME}.greasyfork.user.js`,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      }
    ]
  },
  optimization: {
    minimize: false,
    usedExports: true,
    concatenateModules: true,
  },
  plugins: [
    new UserscriptPlugin({
      headers: {
        ...COMMON_META,
        name: SCRIPT_NAME,
        version: getVersion("semantic"),
        // No updateURL/downloadURL for GreasyFork compliance
      },
      proxyScript: false,
    }),
  ],
};

// 3. Development Build
const devConfig = {
  name: "dev",
  mode: "development",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `${PACKAGE_NAME}.dev.user.js`,
    publicPath: "http://localhost:8080/",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 8080,
    hot: true,
    liveReload: false,
    client: {
      webSocketURL: "ws://localhost:8080/ws",
      overlay: false,
      logging: "none",
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      }
    ]
  },
  optimization: {
    minimize: false,
    usedExports: true,
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new UserscriptPlugin({
      headers: {
        ...COMMON_META,
        name: `${SCRIPT_NAME} [DEV]`,
        version: getVersion("dev"),
      },
      proxyScript: {
        baseUrl: "http://localhost:8080",
        filename: "[basename].proxy.user.js",
        enable: true,
      },
    }),
  ],
};

// Export all configurations
module.exports = [performanceConfig, greasyforkConfig, devConfig];