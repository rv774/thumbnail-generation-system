import { FastifyInstance } from 'fastify';
import { uploadFile, getFiles } from './upload.controller.js';

export async function uploadRoutes(fastify: FastifyInstance) {
    fastify.addHook('onRequest', async (req, reply) => {
        try {
            await req.jwtVerify();
        } catch (err) {
            reply.send(err);
        }
    });

    fastify.post('/', uploadFile);
    fastify.get('/', getFiles);
}
