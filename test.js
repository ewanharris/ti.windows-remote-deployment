const AppDeployCmd = require('./winappdeploycmd');


const deploycmd = new AppDeployCmd("C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\WinAppDeployCmd.exe", '192.168.0.38');

// deploycmd.list().then(res => console.log(res));
//
deploycmd
	.pairDevice('z9P1f3')
	.then(res => console.log(res))
	.catch(err => console.log(err))
