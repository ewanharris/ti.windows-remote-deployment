const exec = require('child_process').exec;

class AppDeployCmd {

	constructor(path, ip) {
		this.path = path;
		this.ip = ip;
	}

	execCmd(args) {
		return new Promise((resolve, reject) => {
			exec(`"${this.path}" ${args.join(' ')}`, function(err, stdout, stderr) {
				return resolve ({err, stdout, stderr});
			});
		})

	}

	list(ip = this.ip) {
		const args = [
			'list',
			'-ip',
			ip
		];
		return new Promise((resolve, reject) => {
			this.execCmd(args)
				.then(result => {
					if (result.err) {
						return reject(err);
					}
					return resolve(result.stdout);
				});
		});
	}

	/**
	 * Parse the output of winappdeploycmd list to detect if an app is installed, returning the appid if so
	 * @param  {String}  appID 		App ID for the application, tiapps id tag
	 * @return {Boolean|Array} 		False if not installed, array of possible app IDs if detected as installed
	 */
	isAppInstalled(appID) {
		return this.list()
			.then(output => {
				const idregex = new RegExp(appID, 'i');
				if (idregex.test(output)) {
					// Obtain the appid
					return output.split('\r\n').filter(appID => idregex.test(appID));
				} else {
					return false;
				}
			});
	}

	install() {

	}

	update() {

	}

	uninstall() {

	}

	pairDevice(code, ip = this.ip) {
		// In lieu of a real pairing command, the easiest way is to just attempt a list
		// and provide the pin at the sam time
		const args = [
			'list',
			'-ip',
			ip,
			'-pin',
			code
		];
		return new Promise((resolve, reject) => {
			this.execCmd(args)
				.then(result => {
					if (result.err) {
						return reject(result.err);
					}
					return resolve(result.stdout);
				});
		});
	}
}

module.exports = AppDeployCmd;
