const { client } = require("../config/redis");

const setCache = async (key, value, ttl = 60) => {
    await client.set(key, JSON.stringify(value), {
        EX: ttl,
    });
};

const getCache = async (key) => {
    const data = await client.get(key);
    return data && JSON.parse(data);
};

const deleteCache = async (pattern) => {
    const keys = await client.keys(pattern);
    if (keys.length) {
        await client.del(keys);
    }
};

module.exports = {
    setCache,
    getCache,
    deleteCache,
};