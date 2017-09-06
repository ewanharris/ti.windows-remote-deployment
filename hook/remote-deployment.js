/**
 * This hook deploys the built application to a remote device
 *
 * @copyright
 * Copyright (c) 2017 by Ewan Harris. All Rights Reserved.
 */

'use strict';

// TODO:
// - Break winappdeploycmd stuff out into a seperate file
// - Add prompting for code in this hook
// - Figure out if logging is possible
// - Allow storage of IPs? i.e. when we pair add to a 'database'

'use strict';

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const utils = require('../utils');

let appxLocation;
let deployCmd;
let deviceIP;
let fields;
let windowslib;

exports.id = 'com.eh.remote-deployment';

/** The Titanium CLI version that this hook is compatible with */
exports.cliVersion = '>=3.2';

/**
 * Initialize the hook.
 *
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 * @param {Object} appc - The node-appc library
 */
exports.init = function init(logger, config, cli, appc) {
	utils.injectSDKModulePath(cli.env.getSDK().path);
	windowslib = require('windowslib');
	fields = require('fields');

	// Configures our little batch of options
	cli.addHook('build.windows.config', function (data, finished) {
		// We don't need the extra logic here as Windows support wasn't in 3.2.1
		const r = data.result[1] || {};
		r.flags || (r.flags = {});
		r.flags['remote-deploy'] = {
			default: false,
			desc: 'enable remote deployment'
		};

		r.options || (r.options = {});
		r.options.ip = {
			default: null,
			desc: 'Device IP address'
		};
		finished(null, data);
	});

	cli.addHook('build.pre.construct', function(data, finished) {
		if(cli.argv['remote-deploy']) {
			cli.argv['build-only'] = true;
		}
		finished();
	});


	/**
	 * General thoughts on the structure of the plugin
	 * - Get the target, use it to determine win.ARM vs win10.x86
	 * - Get the build dir look get the location of the .appxbundle
	 * - Maybe pull the app id? Then we can look up whether it is installed and determine whether to uninstall first?
	 * - Install the app
	 * - Handle any potential mess
	 */
	cli.on('build.post.compile', function(data, finished) {
		if (cli.argv['remote-deploy']) {
			cli.argv['build-only'] = true;

			// Performs the setup functionality
			// 1. Obtain the appxbundle location
			// 2. Obtain the winappdeploycmd path
			const setup = [
				new Promise((resolve, reject) => {
					const appNameRegex = new RegExp(cli.tiapp.name, 'i');
					const appVerRegex = new RegExp(cli.tiapp.name + '_(\\d+\\.*){4}_(Test|Debug_Test)', 'i');
					const target = cli.argv['T'] || cli.argv.target;
					const dirName = target === 'wp-device' ? 'win10.ARM' : 'win10.x86';
					// We're only gonna go to the AppxPackages, from there it's gonna be a minefield
					// to guess the path so we'll just do some further work from there.
					logger.trace(`Project type is ${dirName}`);
					const projectDir = cli.argv['project-dir'] || cli.arg['d'];
					let appxLookupPath = path.join(projectDir, 'build', 'windows', dirName, 'AppPackages');
					logger.trace(`Looking for ${appxLookupPath}`);
					if (!fs.existsSync(appxLookupPath)) {
						return finished(new Error('Cannot find the AppPackages dir, please ensure you\'re using --win-sdk 10.0'))
					}
					const appNameDir = fs.readdirSync(appxLookupPath).filter(item => appNameRegex.test(item));
					logger.trace(`${appxLookupPath} contents are ${appNameDir}`);
					appxLookupPath = path.join(appxLookupPath, appNameDir[0]);
					logger.trace(`Looking for ${appxLookupPath}`);
					const appVerDir = fs.readdirSync(appxLookupPath).filter(item => appVerRegex.test(item));
					logger.trace(`${appxLookupPath} contents are ${appVerDir}`);
					appxLookupPath = path.join(appxLookupPath, appVerDir[0]);
					logger.trace(`Looking for ${appxLookupPath}`);
					const appxName = fs.readdirSync(appxLookupPath).filter(item => path.extname(item) === '.appxbundle');
					const appxLocation = path.join(appxLookupPath, appxName[0]);
					logger.trace(`Looking for ${appxLocation}`);
					if (fs.existsSync(appxLocation)) {
						return resolve(appxLocation);
					} else {
						return reject('Unable to find appxbundle')
					}
				}),
				new Promise((resolve, reject) => {
					windowslib.windowsphone.detect(function(err, results) {
						if (err) {
							return reject(err);
						}
						const cmd = `"${results['windowsphone']['10.0'].deployCmd}"`;
						deployCmd = cmd;
						return resolve(cmd);
					});
				})
			];
			// Performs some checks before we attempt to connect and install
			// 1. Were we given an ip
			//	- If not, prompt
			// 2. Can we connect to the device with winappdeploycmd
			//	- If not, prompt for a code, maybe with a link to pairing docs
		 	// 3. Is the app already installed on the device
			//	- If yes, run uninstall first
			// 4. Install the app (finally);
			Promise.all(setup)
				.then(results => {
					return new Promise((resolve, reject) => {
						appxLocation = results[0];
						if (!cli.argv['ip']) {
							logger.info('No device-ip argument specified, prompting for one');
							fields.text({
								title: 'What is the device-ip?',
								validate: function (value) {
									return !!value;
								}
							}).prompt(function (err, value) {
								if (err) {
									logger.error('There was an error!\n' + err);
								} else {
									deviceIP = value;
									resolve(deviceIP);
								}
							});
						} else {
							deviceIP = cli.argv['ip'];
							resolve(deviceIP);
						}
					});
				}).then(ip => {
					deviceIP = ip;
					return new Promise(function(resolve, reject) {
						exec(`${deployCmd} list -ip ${deviceIP}`, function(err, stdout, stderr) {
							if (err) {
								// Maybe we're not paired? Prompt for code with docs
								logger.warn('Was unable to connect to the specified IP');
								logger.warn('Guiding through the pairing process');
								logger.error('Please use ti pair-device as this is currently unimplemented');
								process.exit(1);
							} else {
								// All good in the hood, lets move on...
								// after checking if the app is installed
								logger.info('Able to connect to the specified IP');
								const id = cli.tiapp.windows.id || cli.tiapp.id;
								return resolve(utils.parseListData(stdout, id));
							}
						});
					});
				})
				.then(installed => {
					return new Promise((resolve, reject) => {
						if (installed) {
							// Uninstall the app
							logger.info('Application is already installed on device, uninstalling it first');
							exec(`${deployCmd} uninstall -ip ${deviceIP} -file ${appxLocation}`, function(err, stdout, stderr) {
								if (err) {
									logger.error('Was unable to uninstall the application')
									return reject(err);
								} else {
									logger.info('App uninstalled');
									return resolve();
								}
							});
						} else {
							return resolve();
						}
					});
				})
				.then(() => {
					logger.info('Installing the application')
					exec(`${deployCmd} install -ip ${deviceIP} -file ${appxLocation}`, function(err, stdout, stderr) {
						if (err) {
							logger.error('Was unable to install the application')
							finished();
						} else {
							logger.info('App installed');
							finished();
						}
					});
				}).catch(err =>{
					logger.error('Oh no something went wrong');
					logger.error(err)
					logger.error('Maybe try logging an issue over here => link')
				});
		} else {
			finished();
		}
	});
};
