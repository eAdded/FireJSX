import {resolve} from "path"
import {Args} from "./ArgsMapper";
import {parse as parseYaml} from "yaml";
import {mkdirp} from "fs-extra";
import {existsSync, readFileSync} from "fs";

export interface TrimmedConfig {
    outDir?: string,
    cacheDir?: string,
    staticDir?: string,
    lib?: string,               //name of the lib folder, defaults to lib
    prefix?: string,
    staticPrefix?: string,
    plugins?: [],
    custom?: { [key: string]: any },
    pages?: string
    devServer?: {
        gzip?: boolean
    }
}

export interface Config {
    paths?: {                   //paths absolute or relative to root
        pages?: string,         //pages dir, default : root/src/pages
        out?: string,           //production dist, default : root/out
        dist?: string,          //production dist, default : root/out/dist
        cache?: string,         //cache dir, default : root/out/.cache
        fly?: string,           //cache dir, default : root/out/fly
        disk?: string,
        static?: string,        //dir where page static elements are stored eg. images, default : root/src/static
    },
    lib?: string,               //name of the lib folder, defaults to lib
    prefix?: string,
    staticPrefix?: string,
    plugins?: [],
    custom?: { [key: string]: any },
    devServer?: {
        gzip?: boolean
    }
}

export function getUserConfig(path: string): Config | never {
    if (existsSync(resolve(path))) {
        if (path.endsWith(".yml"))
            return parseYaml(readFileSync(path, "utf8").toString()) || {};
        else if (path.endsWith(".js"))
            return require(path) || {}
        else
            throw new Error("Unknown config file type. Expected [.js, .yml]")
    } else if (path)
        throw new Error(`Config not found at ${path}`)
}

export function parseConfig(config: Config = {}, args: Args = {_: []}): TrimmedConfig {
    config.paths = config.paths || {}
    config.devServer = config.devServer || {}
    const out = makeDirIfNotFound(resolve(args["--out"] || config.paths.out || "out"))
    return {
        outDir: makeDirIfNotFound(resolve(args["--disk"] ? config.paths.disk || `${out}/disk` :
            args["--export"] ? args["--dist"] || config.paths.dist || `${out}/dist` :
                args["--export-fly"] ? args["--fly"] || config.paths.fly || `${out}/fly` :
                    config.paths.disk || `${out}/disk`)),
        cacheDir: makeDirIfNotFound(resolve(args["--cache"] || config.paths.cache || `${out}/.cache`)),
        pages: throwIfNotFound("pages dir", resolve(args["--pages"] || config.paths.pages || "src/pages")),
        staticDir: undefinedIfNotFound(args["--static"] || config.paths.static || "src/static"),
        lib: config.lib || "lib",
        prefix: args["--prefix"] || config.prefix || "",
        staticPrefix: args["--static-prefix"] || config.staticPrefix || "/static",
        devServer: {
            gzip: args["--disable-gzip"] ? false : config.devServer.gzip === undefined ? true : config.devServer.gzip
        },
        custom: config.custom || {},
        plugins: config.plugins
    }
}

function throwIfNotFound(name: string, pathTo: string, extra = ""): never | string {
    if (!existsSync(pathTo))
        throw new Error(`${name} not found. ${pathTo}\n${extra}`);
    return pathTo
}

function undefinedIfNotFound(path): string | undefined {
    return existsSync(path) ? path : undefined
}

function makeDirIfNotFound(path: string) {
    if (!existsSync(path))
        mkdirp(path, e => {
            if (e)
                throw e
        });
    return path
}