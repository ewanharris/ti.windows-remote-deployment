# ti.windows-remote-deployment

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]

## Installation

```
    npm install -t ti.windows-remote-deployment
```


## Usage

This package comes in two parts, the ti pair-device command and build time `--remote-deploy` hook.

### ti pair-device

Use this command to pair two Windows devices it takes the following arguments

- `--ip`
    - The IP of the device to pair with

- `--code`
    - The code presented in the dialog shown


### --remote-deploy hook

This hook is activated by using the `--remote-deploy` flag on build. When detected it will force the `--build-only` flag to true. It accepts the following argument

- `--ip`
    - Specifies the ip of the device to deploy to


#### Some notes

- If the application is installed on the device it will remove that application first

- It currently does not install any dependencies such as VCLibs

- It current does not work with logging

- To work with LiveView use the `--liveview` flag and specify the `--liveview-ip` option to be the IP of the machine you are building from



[npm-image]: https://img.shields.io/npm/v/ti.windows-remote-deployment.svg
[npm-url]: https://npmjs.org/package/ti.windows-remote-deployment
[downloads-image]: https://img.shields.io/npm/dm/ti.windows-remote-deployment.svg
[downloads-url]: https://npmjs.org/package/ti.windows-remote-deployment
