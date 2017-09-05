/**
 * Pair a device using the winappdeploycmd tooling
 *
 * @copyright
 * Copyright (c) 2017 by Ewan Harris. All Rights Reserved.
 */

'use strict';
const exec = require('child_process').exec;
const utils = require('../utils');

let windowslib;
/** The command description */
exports.desc = 'pair a Windows 10 device';

/** An extended description that is display on the help screen */
exports.extendedDesc = 'This command pairs a Windows 10 Device so that it can be deployed to remotely using the hook';

/**
 * Returns the command's configuration.
 *
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 *
 * @returns {Object|Function} The command's configuration or an async callback
 */
exports.config = function config(logger, config, cli) {
	utils.injectSDKModulePath(cli.sdk.path);
	windowslib = require('windowslib');
	require('chalk')
	return {
		/** Options */
		options: {
			'ip': {
				abbr: 'd',
				desc: 'IP address of the device',
				order: 100,
				required: true
			},
			'code': {
				abbr: 'c',
				desc: 'pin displayed in the settings',
				order: 110,
				required: true
			}
		}
	};
};

/**
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 *
 * @returns {Boolean|Function} An async callback that performs the validation
 */
exports.validate = function validate(logger, config, cli) {
	// Perform the validation here. If things look good, simply return true. If
	// something looks funky, you can return anything falsey, or just process.exit(1).


	return true;
};

/**
 * @param {Object} logger - The logger instance
 * @param {Object} config - The CLI config object
 * @param {CLI} cli - The CLI instance
 * @param {Function} [finished(Error, *)] - A callback to fire when the command completes
 *
 * @returns {Boolean|Function} An async callback that performs the validation
 */
exports.run = function run(logger, config, cli, finished) {
	// perform the command's logic
	windowslib.windowsphone.detect(function(err, results) {
		const cmd = `"${results['windowsphone']['10.0'].deployCmd}"`;
		if (cmd) {
			exec(`${cmd} list -pin ${cli.argv.code} -ip ${cli.argv.ip}`, function(err, stdout, stderr) {
				if (err) {
					if (err.code === 2148734208) {
						// valid ip, but invalid code
						logger.error('Unable to pair with the device. Please ensure the code is correct');
						logger.error(`Provided value was ${cli.argv.code}`);
					} else if (err.code === 2147942487) {
						// invalid ip
						logger.error('Unable to pair with the device. Please ensure the IP is correct');
						logger.error(`Provided value was ${cli.argv.ip}`);
					}
					// logger.trace(`error was ${err}`);
					process.exit(1)
				}
				logger.info(`Paired with device at IP ${cli.argv.ip}`);
				finished();
			});
		} else {
			logger.error('Unable to find winappdeploycmd on the system');
			logger.error('Please pair manually');
		}

	});
};
