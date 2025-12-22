import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticPlugin from '@fastify/static';
import jwt from '@fastify/jwt';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

// Import modules
import { uploadRoutes } from './modules/upload/upload.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { initializeSocketIO } from './sockets/socket.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = Fastify({
    logger: false,
    bodyLimit: 5 * 1024 * 1024 * 1024 // 5GB global limit
});

// PING route to verify server version
server.get('/ping', async () => ({ status: 'ok', version: 'debug-v3' }));

// Debug route - placed early
// server.get('/manual-files/*', async (request, reply) => {
//     const relativePath = (request.params as any)['*'];
//     const filePath = path.join(__dirname, '../uploads', relativePath);
//     console.log(`[Debug Serve] ${filePath}`);

//     if (fs.existsSync(filePath)) {
//         return reply.send(fs.createReadStream(filePath));
//     } else {
//         return reply.status(404).send({ error: 'Not found', path: filePath, root: path.join(__dirname, '../uploads') });
//     }
// });

server.get('/files/*', async (request, reply) => {
    const relativePath = (request.params as any)['*'];
    const filePath = path.join(__dirname, '../uploads', relativePath); // Explicit path to avoid any variable hoisting issues

    if (fs.existsSync(filePath)) {
        const stream = fs.createReadStream(filePath);
        return reply.send(stream);
    } else {
        return reply.status(404).send({ error: 'File not found', path: filePath });
    }
});

// Socket.io
const io = new Server(server.server, {
    cors: { origin: '*' }
});
initializeSocketIO(io);

// Plugins
server.register(cors, { origin: '*' }); // TODO: Restrict in production
server.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });

const staticRoot = path.join(__dirname, '../uploads');
console.log('Static Root:', staticRoot);
console.log('Static Root Exists:', fs.existsSync(staticRoot));

// Register static plugin
// server.register(staticPlugin, {
//     root: staticRoot,
//     prefix: '/files/',
//     decorateReply: false,
//     list: true
// });

// Fallback manual file serving route
// This route is now redundant due to the earlier /files/* debug route, but kept for context if needed.
// server.get('/files/*', async (request, reply) => {
//     const relativePath = (request.params as any)['*'];
//     const filePath = path.join(staticRoot, relativePath);

//     if (fs.existsSync(filePath)) {
//         return reply.sendFile(relativePath); // Try fastify-static sendFile if available or stream it
//     }
// });

// Debug route
// server.get('/manual-files/*', async (request, reply) => {
//     const relativePath = (request.params as any)['*'];
//     const filePath = path.join(staticRoot, relativePath);
//     console.log(`[Debug Serve] ${filePath}`);
//     if (fs.existsSync(filePath)) {
//         return reply.send(fs.createReadStream(filePath));
//     } else {
//         return reply.status(404).send({ error: 'Not found', path: filePath, root: staticRoot });
//     }
// });

server.register(multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB
    }
});

// Database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/thumbnail-db';
console.log('Attempting MongoDB connection...');
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        server.log.info('MongoDB connected');
    })
    .catch(err => {
        console.error('MONGO CONNECT ERROR:', err);
        server.log.error(err);
    });

// Routes
console.log('Registering Routes...');
server.register(async (instance) => {
    instance.register(authRoutes, { prefix: '/auth' });
    instance.register(uploadRoutes, { prefix: '/upload' });
});
console.log('Routes Registered');

// Start
const start = async () => {
    try {
        // Ensure upload directories exist
        if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
        if (!fs.existsSync('uploads/originals')) fs.mkdirSync('uploads/originals', { recursive: true });

        const port = parseInt(process.env.PORT || '3001');
        await server.listen({ port, host: '0.0.0.0' });
        console.log('🚀 SERVER STARTED [DEBUG-v2] - Watching for updates...');
    } catch (err) {
        console.error('SERVER START ERROR:', err);
        server.log.error(err);
        process.exit(1);
    }
};

// Set long timeouts for large uploads (30 mins)
server.server.requestTimeout = 30 * 60 * 1000;
server.server.headersTimeout = 30 * 60 * 1000;
server.server.keepAliveTimeout = 30 * 60 * 1000;

start();
