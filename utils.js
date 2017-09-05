/**
 * Inject the SDKs node_modules paths into the Node.js module resolutions. Reworked from eslint-config-axway
 * @param  {String} sdkPath  The path of the SDK
 */
exports.injectSDKModulePath = function(sdkPath) {
	var Module = require('module').Module;
	var origFindPath = Module._findPath;
	var path = require('path');
	var sdkDir = [
		path.join(sdkPath, 'node_modules')
	];
	Module._findPath = function (request, paths, isMain) {
		return origFindPath.call(this, request, paths.concat(sdkDir), isMain);
	};
}

/**
 * Parse the output of winappdeploycmd list to check if an app is installed
 * @param  {String} output  The output from winappdeploycmd
 * @param  {String} tiappID The tiapp id value
 * @return {Boolean}         Whether the app is installed or not
 */
exports.parseListData = function(output, tiappID) {
	const idregex = new RegExp(tiappID, 'i');
	if (idregex.test(output)) {
		// Obtain the appid
		return output.split('\r\n').filter(appID => idregex.test(appID));
	} else {
		return false;
	}
}
