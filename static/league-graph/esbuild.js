import esbuild from 'esbuild';
import yargs from 'yargs';
import path from 'path';
import server from 'live-server';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function liveServer(options = {}) {
    const defaultParams = {
        file: 'index.html',
        host: '0.0.0.0',
        logLevel: 2,
        open: false,
        port: 8080,
        root: '.',
        wait: 200,
    };

    const params = Object.assign({}, defaultParams, options);
    let running = false;

    return {
        start() {
            if (!running) {
                running = true;
                server.start(params);
                console.log(`live-server running on ${params.port}`);
            }
        },
    };
}

function getDistBuild(watch) {
    return {
        entryPoints: [ 'src/mod.ts' ],
        bundle: true,
        outdir: 'build/',
        target: 'es2019',
        format: 'esm',
        sourcemap: false,
        minify: true,
        watch: Boolean(watch),
        plugins: [],
    };
}

async function main(options) {
    const promises = [];

    try {
        promises.push(esbuild.build(getDistBuild(options.watch)));

        await Promise.all(promises);

        if (options['dev-server']) {
            const server = liveServer({
                port: 8090,
                host: '0.0.0.0',
                root: path.resolve(__dirname, 'build/'),
                file: 'index.html',
                open: false,
                wait: 500,
                // proxy: [['/api', 'http://127.0.0.1:8080']], // not needed for now, used to proxy to the server API
                watch: [
                    path.resolve(__dirname, 'build/'),
                ],
                mount: [
                ],
            });
            server.start();
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main(yargs(process.argv).argv);
