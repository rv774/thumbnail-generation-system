import { FastifyInstance } from 'fastify';
import { signup, login } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/signup', signup);
    fastify.post('/login', login);
}
