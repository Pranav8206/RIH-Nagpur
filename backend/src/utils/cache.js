const cacheStore = new Map();

const cloneValue = (value) => {
    if (value === undefined) {
        return undefined;
    }

    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        } catch {
            // Fall through to JSON cloning for plain data structures.
        }
    }

    try {
        return JSON.parse(JSON.stringify(value));
    } catch {
        return value;
    }
};

const isExpired = (entry) => entry.expiresAt !== null && entry.expiresAt <= Date.now();

export const getCache = async (key) => {
    const entry = cacheStore.get(key);

    if (!entry) {
        return null;
    }

    if (isExpired(entry)) {
        cacheStore.delete(key);
        return null;
    }

    return cloneValue(entry.value);
};

export const setCache = async (key, value, ttlSeconds = 300) => {
    const ttl = Number(ttlSeconds);

    if (!Number.isFinite(ttl) || ttl <= 0) {
        cacheStore.delete(key);
        return;
    }

    cacheStore.set(key, {
        value: cloneValue(value),
        expiresAt: Date.now() + ttl * 1000,
    });
};

export const clearCache = async (key) => {
    cacheStore.delete(key);
};
