import {$, WebpackConfig} from "../FireJSX"
import {join, relative} from "path"
import * as MiniCssExtractPlugin from 'mini-css-extract-plugin'
import * as webpack from "webpack";

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
                filename: `m${this.proOrSSR ? "[contenthash]" : "[id][fullhash]"}.js`,
                chunkFilename: "c[contenthash].js",
                publicPath: `${this.$.prefix}/${this.$.lib}/`,
                path: `${this.$.outDir}/${this.$.lib}/`,
                globalObject: 'window',
                //hot
                hotUpdateMainFilename: `${this.$.lib}/[fullhash].hot.json`,
                hotUpdateChunkFilename: `${this.$.lib}/[fullhash].hot.js`
            },
            externals: {
                react: "React",
                "react-dom": 'ReactDOM',
            },
            module: {
                rules: [{
                    test: /\.(js|jsx)$/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: join(this.$.cacheDir, "babelCache"),
                                presets: [["@babel/preset-env", {
                                    loose: true,
                                    targets: {
                                        browsers: [`last 2 versions`, `not ie <= 11`, `not android 4.4.3`],
                                    },
                                }], "@babel/preset-react"],
                                plugins: ["@babel/plugin-syntax-dynamic-import", "@babel/plugin-transform-runtime",
                                    ...(this.proOrSSR ? [] : ["react-hot-loader/babel"])]
                            }
                        }
                    ]
                },
                    {
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
                    filename: "c[contenthash].css",
                    chunkFilename: "c[contenthash].css"
                }),
                ...(this.proOrSSR ? [] : [
                    new webpack.HotModuleReplacementPlugin({
                        multiStep: true
                    }),
                    //producing deprecated warnings
                    /*new CleanObsoleteChunks({
                        verbose: this.$.verbose
                    })*/
                ])
            ],
            resolve: {
                extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx'],
                alias: (this.proOrSSR ? {} : {
                    'firejsx/Hot': 'react-hot-loader/root',
                    'firejsx/Hot.js': 'react-hot-loader/root'
                }),
            }
        }
    }

    forExternals(): WebpackConfig {
        const conf: WebpackConfig = {
            target: 'web',
            mode: process.env.NODE_ENV as "development" | "production" | "none",
            // @ts-ignore
            entry: {
                e: [
                    ...(this.proOrSSR ? [] : ['react-hot-loader/patch']),
                    join(__dirname, "../web/externalGroupSemi.js")
                ]
            },
            output: {
                path: `${this.$.outDir}/${this.$.lib}/`,
                filename: "[name][contenthash].js"
            },
            resolve: {
                alias: (this.proOrSSR ? {} : {
                    'react-dom': '@hot-loader/react-dom',
                })
            }
        }
        //only create full when ssr
        if (this.$.ssr)
            conf.entry[join(relative(`${this.$.outDir}/${this.$.lib}/`, this.$.cacheDir), "f")] = join(__dirname, "../web/externalGroupFull.js")
        return conf;
    }

    forPages(): WebpackConfig {
        this.$.pageMap.forEach(page => {
            this.config.entry[page.toString()] = [
                join(this.$.pages, page.toString()),
                ...(this.proOrSSR ? [] : [
                    `webpack-hot-middleware/client?path=/__webpack_hmr&reload=true&quiet=true`]),
            ]
        })
        this.$.hooks.initWebpack.forEach(initWebpack => initWebpack(this.config))
        return this.config;
    }
}
