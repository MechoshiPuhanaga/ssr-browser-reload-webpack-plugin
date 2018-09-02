# ssr-browser-reload-webpack-plugin
Plugins for reloading you browser on changes when developing a server side rendered app and using `Webpack` as a bundler.

## Important
Consider the following:
* This is still an experimental package. 
* It's tested on localhost. 
* Currently supports only http protocol.
* Is used in a single page application project.
* Does not reload on changes in your `index.html` file.

## How to install
* In your project's folder terminal execute:
```
npm install --save-dev ssr-browser-reload-webpack-plugin
```

## How to use
* Require the plugins:
```
const {SSRReloadClientPlugin, SSRReloadServerPlugin} = require('ssr-browser-reload-webpack-plugin');
```
* Add an instance of the `SSRReloadClientPlugin` to your webpack config for the `client bundle` and provide all parameters to the constructor.
* Add an instance of the `SSRReloadServer Plugin` to your webpack config for the `server bundle` and provide all parameters to the constructor.
* Build your code, start your ssr-server and open your app in the browser, then the browser will reload after changes in your `JavaScript` or `style` files.

## How it works
Under the hood in `webpack` `development` `mode` the `SSRReloadClientPlugin` starts a server that will send `Server Sent Events` to your app which should reload after a defined timeout. For this purpose the plugin also adds some code to the `index.html` of your project. This logic is used to make connection to the server, listen to the messages sent by the server and reload when needed.
The `SSRReloadServerPlugin` is needed in order to notify the reload server when the server build is ready, so that the reload to be made after the new server code is ready. To ensure that the server is up and running on reload, a certain timeout should be set.
## Exported plugins
The package exports two webpack plugins: `SSRReloadClientPlugin` and `SSRReloadServerPlugin`.
The first one must be used in the webpack config for the client bundle and the second one - in the server bundle config.

### SSRReloadClientPlugin
In `development` mode add to `plugins` array a new instance of the plugin, by providing the following parameters to the constructor:

* `appDomain` -  the domain that serves your ssr app, for example `http://localhost:3000`
* `host` - the host where the build is being made, for example `127.0.0.1`
* `port` - the port on the host for the reload server
* `protocol` - currently supports only `http`
* `template` - the relative path to your `index.html` file
* `timeout` - the timeout after which the browser should reload (in milliseconds)

### SSRReloadClientPlugin
In `development` mode add to `plugins` array a new instance of the plugin, by providing the following parameters to the constructor:
* `host` - the host where the build is being made, for example `127.0.0.1`
* `port` - the port on the host for the reload server
* `protocol` - currently supports only `http`