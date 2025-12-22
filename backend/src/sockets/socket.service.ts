import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';

console.error('!!! SOCKET SERVICE FILE LOADED !!!');

const redisSubscriber = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const initializeSocketIO = (io: SocketIOServer) => {
    // Auth Middleware
    // Auth Middleware
    io.use((socket, next) => {
        process.stdout.write('[TRACE] Middleware Entered\n'); // FORCE LOG
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            process.stdout.write('[TRACE] No Token Found\n');
            return next(new Error('Authentication error: Missing Token'));
        }

        try {
            process.stdout.write(`[TRACE] Token found: ${token.substring(0, 10)}\n`);
            const secret = process.env.JWT_SECRET || 'supersecret';
            const decoded = jwt.verify(token as string, secret);
            (socket as any).user = decoded;
            process.stdout.write('[TRACE] Verify Success\n');
            next();
        } catch (err: any) {
            process.stdout.write(`[TRACE] Verify Failed: ${err.message}\n`);
            // THE BANANA TEST: If frontend shows this, we own the code.
            next(new Error(`Authentication error: BANANA (${err.message})`));
        }
    });

    io.on('connection', (socket) => {
        const user = (socket as any).user;
        if (user) {
            const room = `user:${user.id}`;
            socket.join(room);
            console.log(`User ${user.id} joined room ${room}`);
        }
    });

    // Listen to Redis events from Worker
    redisSubscriber.subscribe('updates');
    redisSubscriber.on('message', (channel, message) => {
        if (channel === 'updates') {
            const data = JSON.parse(message);
            io.to(`user:${data.userId}`).emit('file:update', data);
        }
    });
};
