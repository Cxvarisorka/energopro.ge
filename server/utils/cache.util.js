const NodeCache = require('node-cache');

// Default TTL: 5 minutes, check period: 60 seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cacheMiddleware = (keyFn, ttl) => async (req, res, next) => {
  const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;
  const cached = cache.get(key);
  if (cached) {
    return res.json(cached);
  }

  // Override res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    cache.set(key, data, ttl);
    return originalJson(data);
  };
  next();
};

const invalidatePattern = (pattern) => {
  const keys = cache.keys();
  for (const key of keys) {
    if (key.startsWith(pattern)) {
      cache.del(key);
    }
  }
};

const invalidate = (key) => cache.del(key);

module.exports = { cache, cacheMiddleware, invalidatePattern, invalidate };
