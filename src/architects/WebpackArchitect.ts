import {$, WebpackConfig} from "../FireJSX_App"
import {join, relative} from "path"
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin'
import * as webpack from "webpack";
import {CleanWebpackPlugin} from "clean-webpack-plugin";

export default class {
    private readonly $: $;
    public readonly config: WebpackConfig;
    public readonly proOrSSR: boolean

    constructor($: $) {
        this.$ = $;
        this.proOrSSR = $.ssr || $.pro
        this.config = {
            target: 'web',
            mode: process.env.NODE_ENV as "development" | "production" | "none",
            optimization: {
                sideEffects: false,
                minimize: true,
                runtimeChunk: "single",
                usedExports: true,
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            enforce: true
                        }
                    }
                }
            },
            entry: {},
            output: {
                filename: `m.${this.proOrSSR ? "[contenthash]" : "[id][hash]"}.js`,
                chunkFilename: "c.[contenthash].js",
                publicPath: `${this.$.prefix}/${this.$.lib}/`,
                path: `${this.$.outDir}/${this.$.lib}/`,
                globalObject: 'window',
                //hot
                hotUpdateMainFilename: `h[hash].hot.json`,
                hotUpdateChunkFilename: `h[hash].hot.js`
            },
            externals: {
                react: "React",
                "react-dom": 'ReactDOM'
            },
            module: {
                rules: [{
                    test: /\.(js|jsx)$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                sourceType: 'unambiguous',
                                cacheDirectory: join(this.$.cacheDir, "babelCache"),
                                presets: [["@babel/preset-env", {
                                    modules: false,
                                    targets: {
                                        browsers: [`last 2 versions`, `not ie <= 11`, `not android 4.4.3`],
                                    },
                                }], "@babel/preset-react"],
                                plugins: ["@babel/plugin-syntax-dynamic-import", "@babel/plugin-transform-runtime",
                                    "@babel/plugin-transform-modules-commonjs",
                                    ...(this.proOrSSR ? [] : ["react-hot-loader/babel"])]
                            }
                        }, {//adds wrapper to App function
                            loader: join(__dirname, '../loader/wrapper.js'),
                            options: {
                                pages_path: this.$.pages,
                                proOrSSR: this.proOrSSR
                            }
                        }
                    ]
                }, {
                    test: /\.css$/,
                    use: [
                        ...(this.proOrSSR ? [MiniCssExtractPlugin.loader] : ['style-loader']),
                        {
                            loader: 'css-loader',
                            options: {
                                modules: true
                            },
                        },
                    ]
                }]
            },
            plugins: [
                new MiniCssExtractPlugin({
                    filename: "cs.[contenthash].css",
                    chunkFilename: "cs.[contenthash].css"
                }),
                ...(this.proOrSSR ? [] : [
                    new webpack.HotModuleReplacementPlugin({
                        multiStep: true
                    }),
                    new CleanWebpackPlugin({
                        verbose: this.$.verbose,
                        cleanOnceBeforeBuildPatterns: ['**/*', '!map/!*', '!e.*'],
                    })
                ])
            ],
            resolve: {
                extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx']
            }
        };
    }

    forExternals(): WebpackConfig {
        const conf: WebpackConfig = {
            target: 'web',
            mode: process.env.NODE_ENV as "development" | "production" | "none",
            entry: {
                e: [
                    ...(this.proOrSSR ? [] : ['react-hot-loader/patch']),
                    join(__dirname, "../web/externalGroupSemi.ts")
                ]
            },
            output: {
                path: `${this.$.outDir}/${this.$.lib}/`,
                filename: "[name].[contenthash].js"
            },
            resolve: {
                alias: (this.proOrSSR ? {} : {
                    'react-dom': '@hot-loader/react-dom',
                })
            }
        }
        //only create full when ssr
        if (this.$.ssr)
            conf.entry[join(relative(`${this.$.outDir}/${this.$.lib}/`, this.$.cacheDir), "f")] = join(__dirname, "../web/externalGroupFull.ts")
        return conf;
    }

    forPages(): WebpackConfig {
        this.$.pageMap.forEach(page => {
            this.config.entry[page.toString()] = [
                join(this.$.pages, page.toString()),
                ...(this.proOrSSR ? [] : [
                    `webpack-hot-middleware/client?path=/__webpack_hmr&reload=true&quiet=true`])
            ]
        })
        this.$.hooks.initWebpack.forEach(initWebpack => initWebpack(this.config))
        return this.config;
    }
}
