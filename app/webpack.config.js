const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    taskpane: "./src/taskpane.js",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "src"),
    },
    compress: true,
    port: 3000,
    hot: true,
    allowedHosts: "all",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].bundle.js",
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
};
