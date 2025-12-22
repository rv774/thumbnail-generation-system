
import { Redis } from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
});

async function clearLocks() {
    const keys = await redis.keys('lock:thumbnail:*');
    if (keys.length > 0) {
        console.log('Deleting keys:', keys);
        await redis.del(...keys);
    } else {
        console.log('No locks found.');
    }
    await redis.quit();
}

clearLocks();
