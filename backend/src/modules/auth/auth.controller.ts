import { FastifyReply, FastifyRequest } from 'fastify';
import { UserModel } from '../../models/user.model.js';
// NOTE: using simple hash for demo, in prod use bcrypt/argon2
import crypto from 'crypto';

export const signup = async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as any;
    if (!email || !password) return reply.code(400).send({ error: 'Missing fields' });

    // Simple hash (DO NOT DO THIS IN REAL PROD, USE BCRYPT)
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    try {
        const user = await UserModel.create({ email, passwordHash });
        const token = await reply.jwtSign({ id: user._id, email });
        return { token, user: { id: user._id, email: user.email } };
    } catch (err: any) {
        return reply.code(400).send({ error: 'User likely exists' });
    }
};

export const login = async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as any;
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const user = await UserModel.findOne({ email, passwordHash });
    if (!user) return reply.code(401).send({ error: 'Invalid credentials' });

    const token = await reply.jwtSign({ id: user._id, email });
    return { token, user: { id: user._id, email: user.email } };
};
