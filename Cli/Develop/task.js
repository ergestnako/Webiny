// We need this to override some webpack classes (did not have time to tinker with pull requests, etc.)
const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');
const chalk = require('chalk');
const fs = require('fs-extra');
const browserSync = require('browser-sync').create();
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const WriteFilePlugin = require('write-file-webpack-plugin');
const Webiny = require('webiny-cli/lib/webiny');
const Build = require('./../Build/task');
const HttpServer = require('./HttpServer');

// Override logger callbacks - we do not need the default output
const Logger = require('browser-sync/lib/logger');
Logger.callbacks['service:running'] = (bs) => {
    const urls = bs.options.get('urls').toJS();
    Webiny.info(`Browsersync is listening on ${chalk.magenta(urls.local)}`);
};
Logger.callbacks['file:watching'] = _.noop;

let httpServer = null;
let devMiddlewareInstance = null;

class Develop extends Build {

    constructor(config) {
        super(config);
        this.port = _.get(Webiny.getConfig(), 'browserSync.port', 3000);
        this.domain = _.get(Webiny.getConfig(), 'browserSync.domain', 'http://localhost');
        this.webpackCallback = config.webpackCallback || null;
        this.progressCallback = config.progressCallback || null;
    }

    run() {
        const vendorConfigs = this.getVendorConfigs();

        const msg = 'Please be patient, the initial webpack build may take a few moments...';
        const line = new Array(msg.length + 3).join('-');
        Webiny.log(line);
        Webiny.info(msg);
        Webiny.log(line);

        // Remove all files from build folder
        this.config.apps.map(app => {
            fs.emptyDirSync(Webiny.projectRoot('public_html') + '/build/development/' + app.getPath());
        });

        const statsConfig = {
            all: false,
            errors: true,
            moduleTrace: true,
            colors: true
        };

        if (vendorConfigs.length) {
            Webiny.info('Building vendors...');
            return this.buildConfigs(vendorConfigs, false).then(stats => {
                stats.toJson().children.map(s => {
                    Webiny.log(`webpack built ${s.name} vendors ${s.hash} in ${s.time} ms`);
                });
                const appConfigs = this.getAppConfigs();
                return Webiny.processHook('before-webpack', {configs: appConfigs}).then(() => {
                    return this.buildAndWatch(appConfigs, statsConfig);
                });
            });
        }

        const appConfigs = this.getAppConfigs();
        return Webiny.processHook('before-webpack', {configs: appConfigs}).then(() => {
            return this.buildAndWatch(appConfigs, statsConfig);
        });
    }

    buildAndWatch(configs, statsConfig) {
        // Write webpack files to disk to trigger BrowserSync injection on CSS
        const wfp = {log: false, test: /^((?!hot-update).)*$/};
        configs.map(config => {
            config.devServer = {outputPath: config.output.path};
            config.plugins.push(new WriteFilePlugin(wfp));
        });

        // Create webpack compiler
        // If we are only building one app we MUST NOT pass an array!!
        // An array causes webpack to treat it as MultiCompiler and it resolves hot update file paths incorrectly thus breaking hot reload
        const compiler = webpack(configs);

        if (this.progressCallback) {
            compiler.apply(new webpack.ProgressPlugin(this.progressCallback));
        }

        let publicPath = this.domain + '/build/development/';
        if (configs.length === 1) {
            publicPath = this.domain + '/build/development/' + configs[0].name.replace('.', '_') + '/';
        }

        // If there is an existing instance of dev-middleware running, we need to stop it.
        if (devMiddlewareInstance) {
            devMiddlewareInstance.close();
        }

        devMiddlewareInstance = devMiddleware(compiler, {
            publicPath,
            noInfo: false,
            stats: statsConfig
        });

        if (this.webpackCallback) {
            devMiddlewareInstance.waitUntilValid(this.webpackCallback);
        }

        // Run browser-sync server
        const bsConfig = {
            ui: false,
            open: false,
            logPrefix: 'Webiny',
            online: false,
            port: this.port,
            socket: {
                domain: this.domain + ':' + this.port
            },
            server: {
                baseDir: Webiny.projectRoot('public_html'),
                middleware: [
                    (req, res, next) => {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                        next();
                    },
                    devMiddlewareInstance,
                    hotMiddleware(compiler)
                ]
            },
            watchOptions: {
                ignoreInitial: true,
                ignored: '*.{html,js,json}'
            },
            // Files being watched for changes (add CSS of apps selected for build)
            files: configs.map(c => {
                return c.output.path + '/*.css'
            })
        };

        // Start a hidden listener to allow http interaction with build process
        this.initHttpServer();

        // Return a promise which never resolves. It will keep the task running until you abort the process.
        return new Promise(() => {
            Webiny.info('Building apps...');
            browserSync.init(bsConfig);
        });
    }

    initHttpServer() {
        if (!httpServer) {
            httpServer = new HttpServer(browserSync, this.port).run();
        }
    }
}

module.exports = Develop;