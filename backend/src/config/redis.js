const Redis = require('ioredis');
const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS || 'redis://127.0.0.1:6379';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds

// Use lazyConnect so we can attempt explicit connect with retry limits
const redis = new Redis(REDIS_URL, { lazyConnect: true });

let connected = false;

async function connectWithRetry() {
  let attempts = 0;
  while (attempts < MAX_RETRIES && !connected) {
    try {
      attempts += 1;
      console.log(`Redis: attempting connection (${attempts}/${MAX_RETRIES})`);
      await redis.connect();
      connected = true;
      console.log('Redis: connected');
      break;
    } catch (err) {
      console.error(`Redis: connection attempt ${attempts} failed:`, err.message || err);
      if (attempts < MAX_RETRIES) {
        console.log(`Redis: retrying in ${RETRY_DELAY_MS / 1000}s...`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        console.error('Redis: all connection attempts failed');
      }
    }
  }
}

// Start connecting (don't block module load)
connectWithRetry();

redis.on('ready', () => console.log('Redis: ready'));
redis.on('connect', () => console.log('Redis: connect event'));
redis.on('error', (err) => console.error('Redis: error', err));
redis.on('close', () => console.warn('Redis: connection closed'));
redis.on('end', () => console.warn('Redis: connection ended'));
redis.on('reconnecting', (delay) => console.log('Redis: reconnecting in', delay, 'ms'));

// Factory that creates a Bull queue using the same REDIS_URL. Bull creates its own clients per role.
function createQueue(queueName, opts = {}) {
  return new Queue(queueName, Object.assign({
    createClient: function (type) {
      // For each role, return a fresh ioredis instance using the same URL.
      // Bull expects separate connections for client, subscriber, and bclient.
      return new Redis(REDIS_URL);
    },
  }, opts));
}

module.exports = {
  redis,
  createQueue,
};
