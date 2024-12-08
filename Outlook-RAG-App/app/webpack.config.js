const path = require("path");
const webpack = require("webpack");
const fs = require("fs");
const os = require("os");

module.exports = {
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser"),
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer/"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      process: require.resolve("process/browser"),
    },
  },
  entry: {
    taskpane: "./src/taskpane.js",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "/src"),
    },
    compress: true,
    port: 3000,
    hot: true,
     allowedHosts: "all",
    server: {
      type: "https",
      options: {
        key: fs.readFileSync("C:/Users/adles/.office-addin-dev-certs/localhost.key"),
        cert: fs.readFileSync("C:/Users/adles/.office-addin-dev-certs/localhost.crt"),
      }
    },
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
  ],
};
