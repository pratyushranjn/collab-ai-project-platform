const { client } = require("../config/redis");

const canUseRedis = () => client && client.isOpen;

const setCache = async (key, value, ttl = 60) => {
    if (!canUseRedis()) return;
    try {
        await client.set(key, JSON.stringify(value), {
            EX: ttl,
        });
    } catch (_err) {
        return;
    }
};

const getCache = async (key) => {
    if (!canUseRedis()) return null;
    try {
        const data = await client.get(key);
        return data && JSON.parse(data);
    } catch (_err) {
        return null;
    }
};

const deleteCache = async (pattern) => {
    if (!canUseRedis()) return;
    try {
        const keys = await client.keys(pattern);
        if (keys.length) {
            await client.del(keys);
        }
    } catch (_err) {
        return;
    }
};

module.exports = {
    setCache,
    getCache,
    deleteCache,
};