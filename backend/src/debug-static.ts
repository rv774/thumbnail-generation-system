
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({ logger: true });

const staticRoot = path.join(__dirname, '../../uploads');
console.log('Root:', staticRoot);

server.register(staticPlugin, {
    root: staticRoot,
    prefix: '/files/',
    list: true
});

const start = async () => {
    try {
        await server.listen({ port: 3002 });
        console.log('Debug server listening on 3002');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
