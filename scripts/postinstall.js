const path = require('path');
const spawnSync = require('child_process').spawnSync;
const exec = require('child_process').execSync;

const hookPath = path.join(__dirname, '..', 'hook');
const commandPath = path.join(__dirname, '..', 'command');

let command;

Promise.all([])
	.then(() => {
		try {
			const spawnedProc = exec('appc');
			command = 'appc ti config -a';
		} catch (e) {
			command = 'ti config -a';
		}
	})
	.then(() => {
		const hookCmd = `${command} paths.hooks ${hookPath}`;
		const commandCmd = `${command} paths.commands ${commandPath}`;
		try {
			console.log(`Adding hook path to titanium config`);
			const spawnedProc = exec(hookCmd);
		} catch (e) {
			console.error('Failed to add hook');
			console.error(`Please run ${hookCmd} yourself`);
		}

		try {
			console.log(`Adding command path to titanium config`);
			const spawnedProc = exec(commandCmd);
		} catch (e) {
			console.error('Failed to add command');
			console.error(`Please run ${commandCmd} yourself`);
		}
	});
