const axios = require('axios');

class SSRReloadServerPlugin {
    constructor({ host, port, protocol }) {
        if (!host || !port || !protocol) {
            throw new Error(`Wrong params provided to SsrReloadServerPlugin: host = ${host}; port = ${port}; protocol = ${protocol}`);
        }
        this.host = host;
        this.port = port;
        this.protocol = protocol;
    }

    apply(compiler) {
        compiler.hooks.done.tap('done', async () => {
            console.dir('Server bundle compiled', { colors: true });
            try {
                const res = await axios(`${this.protocol}://${this.host}:${this.port}?server=ready`);
                if (res.status === 200) {
                    console.dir('Reloading server responded on server bundle compilation', { colors: true });
                } else {
                    console.dir(`Reloading server responded with status ${res.status}`, { colors: true });
                }
            } catch (error) {
                console.dir(error, { colors: true });
            }
        });
    }
}

module.exports = SSRReloadServerPlugin;
