const async = require('neo-async');
const http = require('http');
const path = require('path');

class SSRReloadClientPlugin {
    constructor({ appDomain, host, port, protocol, template, timeout }) {
        if (!appDomain || !host || !port || !template || !timeout) {
            throw new Error(`Wrong params provided to SsrReloadClientPlugin: 
            appDomain = ${appDomain}; host = ${host}; port = ${port}; protocol = ${protocol}; template = ${template}; timeout = ${timeout}`);
        }
        this.buildStatus = {
            server: false,
            client: false
        };
        this.appDomain = appDomain;
        this.host = host;
        this.port = port;
        this.protocol = protocol;
        this.res = null;
        this.template = template;
        this.timeout = timeout;
        this.server = http.createServer((req, res) => {
            if (req.url === '/?server=ready') {
                console.log(req.url, req.headers.host);
                res.writeHead(200);
                res.end();
                this.buildStatus.server = true;
                if (this.res && this.buildStatus.client) {
                    console.dir('Sending reload message to browser after server bundle compilation', { colors: true });
                    this.res.write(
                        `data: reload\n\n`
                    );
                    this.buildStatus = {
                        server: false,
                        client: false
                    };
                }
            } else {
                this.res = res;
                this.res.setHeader('Access-Control-Allow-Credentials', 'true');
                this.res.setHeader('Access-Control-Allow-Headers', '*');
                this.res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
                this.res.setHeader('Access-Control-Allow-Origin', this.appDomain);
                this.res.setHeader('Access-Control-Expose-Headers', '*');
                this.res.setHeader('Access-Control-Request-Method', '*');
                if (req.method === 'OPTIONS') {
                    this.res.writeHead(200);
                    this.res.end();
                    return;
                }
                this.res.writeHead(200, {
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Content-Type': 'text/event-stream'
                });
                this.res.write(`data: Connected to reload server at ${this.protocol}://${this.host}:${this.port}\n\n`
                );
            }
        });

        this.server.listen(this.port, this.host, () => {
            console.dir(
                `Reload server listening on ${this.host}:${this.port}. Pushing events to client at ${this.appDomain}`
            );
        });
    }

    apply(compiler) {
        compiler.hooks.done.tap('done', () => {
            this.buildStatus.client = true;
            console.dir('Client bundle compiled', { colors: true });
            if (this.res && this.buildStatus.server) {
                console.dir('Sending reload message to browser after client bundle compilation', { colors: true });
                this.res.write(
                    `data: reload\n\n`
                );
                this.buildStatus = {
                    server: false,
                    client: false
                };
            }
        });

        compiler.hooks.afterEmit.tap('afterEmit ', compilation => {
                let outputPath;

                const emitFiles = error => {
                    if (error) {
                        console.log(error);
                        return;
                    }
                    async.forEach(compilation.assets, (source, file, callback) => {
                            let targetFile = file;
                            let flag = false;
                            const queryStringIdx = targetFile.indexOf(this.template);
                            flag = queryStringIdx >= 0;

                            const writeOut = error => {
                                if (error) {
                                    console.log(error);
                                    return callback();
                                }
                                const targetPath = compiler.outputFileSystem.join(outputPath, targetFile);
                                if (source.existsAt === targetPath) {
                                    source.emitted = false;
                                    return callback();
                                }
                                let content = source.source();
                                if (flag) {
                                    const serverAddress = `${this.protocol}://${this.host}:${this.port}`;
                                    content = content.replace('</body>',
                                        `<script>
                                            const es = new EventSource("${serverAddress}", {withCredentials: true});
                                            es.onmessage = event => {
                                                if (event.data === 'reload') {
                                                    console.log('%c Reloading...', 'color: "blue"');
                                                    setTimeout(()=> {
                                                         location.reload();
                                                    }, this.timeout);
                                                } else {
                                                    console.log(event.data);
                                                }
                                            };
                                        </script>
                                        </body>`);
                                }

                                if (!Buffer.isBuffer(content)) {
                                    content = Buffer.from(content, "utf8");
                                }

                                source.existsAt = targetPath;
                                source.emitted = true;
                                compiler.outputFileSystem.writeFile(targetPath, content, callback);
                            };

                            if (targetFile.match(/\/|\\/)) {
                                const dir = path.dirname(targetFile);
                                compiler.outputFileSystem.mkdirp(
                                    compiler.outputFileSystem.join(outputPath, dir),
                                    writeOut
                                );
                            } else {
                                writeOut();
                            }
                        },
                        error => {
                            if (error) {
                                console.log(error);
                            }
                        }
                    );
                };

                compiler.hooks.emit.callAsync(compilation, error => {
                    if (error) {
                        console.log(error);
                    }
                    outputPath = compilation.getPath(compiler.outputPath);
                    compiler.outputFileSystem.mkdirp(outputPath, emitFiles);
                });
            }
        );
    }
}

module.exports = SSRReloadClientPlugin;
