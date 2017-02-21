import * as route from '../service/line/route';
import config     from '../config';
import {redis}    from '../redis';

var newData = [];
var cache;

const CACHE_TTL              = config('CACHE_TTL_LINE', true);
const CRAWL_TTL              = config('CRAWL_TTL_LINE', true);
const CACHE_TABLE            = config('NAME_VERSION', true) + '_cache_line_route';
const CACHE_TABLE_STOPPOINTS = config('NAME_VERSION', true) + '_cache_line_stoppoints_';

var nextCrawlTimeoutHandle = null;
var nextCrawlStartTime = null;
const nextCrawl = () => {
    if (nextCrawlTimeoutHandle) {
        clearTimeout(nextCrawlTimeoutHandle);
    }

    var timeOut = 0;
    if (nextCrawlStartTime) {
        var diffTime = Date.now() - nextCrawlStartTime;
        timeOut = CRAWL_TTL - diffTime < 0 ? 0 : CRAWL_TTL - diffTime;
    }

    var timeoutPromise = new Promise(resolve => {
        nextCrawlTimeoutHandle = setTimeout(() => {
            resolve();
        }, timeOut);
    });
    return timeoutPromise.then(() => {
        nextCrawlStartTime = Date.now();
        try {
            return crawl();
        } catch (err) {
            console.log('LINE/ROUTE CRAWLER ERROR', err.message);
        }
    });
};

const loadCache = async () => {
    if (cache) {
        return false;
    }

    try {
        cache = await route.load();

        for (let i=0;i<cache.length;i++) {
            await redis.set(
                CACHE_TABLE + '_' + cache[i].id,
                JSON.stringify(cache[i]),
                'EX',
                CACHE_TTL
            );
            await redis.set(
                CACHE_TABLE_STOPPOINTS + cache[i].id,
                JSON.stringify(cache[i].stopPoints),
                'EX',
                CACHE_TTL
            );
        }

        await redis.set(
            CACHE_TABLE,
            JSON.stringify(cache),
            'EX',
            CACHE_TTL
        );
        if (process.env.TRAVIS) {
            process.exit();
        }
    } catch (err) {
        console.log('LINE/ROUTE CRAWLER LOAD CACHE ERROR', err.message);
    }

    return true;
};

const crawl = async () => {
    if (await loadCache()) {
        return nextCrawl();
    }

    try {
        newData = await route.load();
    } catch (err) {
        return nextCrawl();
    }

    cache = newData;

    for (let i=0;i<cache.length;i++) {
        await redis.set(
            CACHE_TABLE + '_' + cache[i].id,
            JSON.stringify(cache[i]),
            'EX',
            CACHE_TTL
        );
        await redis.set(
            CACHE_TABLE_STOPPOINTS + cache[i].id,
            JSON.stringify(cache[i].stopPoints),
            'EX',
            CACHE_TTL
        );
    }

    await redis.set(
        CACHE_TABLE,
        JSON.stringify(cache),
        'EX',
        CACHE_TTL
    );

    nextCrawl();
};

// Run crawler
nextCrawl();
