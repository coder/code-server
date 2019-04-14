const webpack = require("webpack");
const path = require("path");
const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackPwaManifest = require("webpack-pwa-manifest");
const { GenerateSW } = require("workbox-webpack-plugin");

// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const root = path.join(__dirname, "..");
const prod = process.env.NODE_ENV === "production" || process.env.CI === "true";

module.exports = (options = {}) => merge(
  require("./webpack.general.config")(options), {
    devtool: prod ? "none" : "cheap-module-eval-source-map",
    mode: prod ? "production" : "development",
    entry: prod ? options.entry : [
      "webpack-hot-middleware/client?reload=true&quiet=true",
      options.entry,
    ],
    module: {
      rules: [{
        test: /\.s?css$/,
        // This is required otherwise it'll fail to resolve CSS in common.
        include: root,
        use: [{
          loader: MiniCssExtractPlugin.loader,
        }, {
          loader: "css-loader",
        }, {
          loader: "sass-loader",
        }],
      }, {
        test: /\.(png|ttf|woff|eot|woff2)$/,
        use: [{
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]",
          },
        }],
      }, {
        test: /\.svg$/,
        loader: 'url-loader'
      }],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css"
      }),
      new HtmlWebpackPlugin({
        template: options.template
      }),
      new PreloadWebpackPlugin({
        rel: "preload",
        as: "script"
      }),
      new WebpackPwaManifest({
        name: "Coder",
        short_name: "Coder",
        description: "Run VS Code on a remote server",
        background_color: "#e5e5e5",
        icons: [
          {
            src: path.resolve("./assets/logo.png"),
            sizes: [96, 128, 192, 256, 384]
          }
        ]
      })
    ].concat(prod ? [
      new GenerateSW({
        runtimeCaching: [
          {
            urlPattern: new RegExp(".*"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "code-server",
              expiration: {
                maxAgeSeconds: 86400
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
          // Network first caching is also possible.
          /*{
        urlPattern: "",
        handler: "NetworkFirst",
        options: {
          networkTimeoutSeconds: 4,
          cacheName: "code-server",
          expiration: {
            maxAgeSeconds: 86400,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      }*/
        ]
      })
    ] : [new webpack.HotModuleReplacementPlugin()]),
    target: "web"
  });
