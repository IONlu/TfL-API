'use strict';

var _stoppoint = require('../service/stoppoint');

var stoppoint = _interopRequireWildcard(_stoppoint);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _redis = require('../redis');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var newData = [];
var cache;

const CACHE_TTL = (0, _config2.default)('CACHE_TTL_STOPPOINT', true);
const CRAWL_TTL = (0, _config2.default)('CRAWL_TTL_STOPPOINT', true);
const PUB_TABLE = (0, _config2.default)('NAME_VERSION', true) + '_stoppoint';
const CACHE_TABLE = (0, _config2.default)('NAME_VERSION', true) + '_cache_stoppoint';

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
            console.log('STOPPOINT CRAWLER ERROR', err.message);
        }
    });
};

const loadCache = (() => {
    var _ref = _asyncToGenerator(function* () {
        if (cache) {
            return false;
        }

        try {
            cache = yield stoppoint.load();

            yield _redis.redis.set(CACHE_TABLE, JSON.stringify(cache), 'EX', CACHE_TTL);
            if (process.env.TRAVIS) {
                process.exit();
            }
        } catch (err) {
            console.log('STOPPOINT CRAWLER LOAD CACHE ERROR', err.message);
        }

        return true;
    });

    return function loadCache() {
        return _ref.apply(this, arguments);
    };
})();

const crawl = (() => {
    var _ref2 = _asyncToGenerator(function* () {
        if (yield loadCache()) {
            return nextCrawl();
        }

        try {
            newData = yield stoppoint.load();
        } catch (err) {
            return nextCrawl();
        }

        // update
        var updatedStopPoints = cache.features.filter(function (row) {
            var oldRow = newData.features.find(function (row2) {
                return row2.properties.id === row.properties.id;
            });
            return oldRow && JSON.stringify(row) != JSON.stringify(oldRow);
        });

        // update
        if (updatedStopPoints.length) {
            _redis.redis.publish(PUB_TABLE, JSON.stringify({
                type: 'update',
                data: updatedStopPoints.map(stoppoint.compileStream)
            }));
        }

        // new
        var newStopPoints = newData.features.filter(function (row) {
            return !cache.features.find(function (row2) {
                return row2.properties.id === row.properties.id;
            });
        });

        if (newStopPoints.length) {
            _redis.redis.publish(PUB_TABLE, JSON.stringify({
                type: 'new',
                data: newStopPoints.map(stoppoint.compileStream)
            }));
        }

        // deleted
        var deletedStopPoints = cache.features.filter(function (row) {
            return !newData.features.find(function (row2) {
                return row2.properties.id === row.properties.id;
            });
        });
        if (deletedStopPoints.length) {
            _redis.redis.publish(PUB_TABLE, JSON.stringify({
                type: 'delete',
                data: deletedStopPoints.map(stoppoint.compileStream)
            }));
        }

        cache = newData;

        yield _redis.redis.set(CACHE_TABLE, JSON.stringify(cache), 'EX', CACHE_TTL);

        nextCrawl();
    });

    return function crawl() {
        return _ref2.apply(this, arguments);
    };
})();

// Run crawler
nextCrawl();