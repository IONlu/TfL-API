'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.compileStream = exports.streamSingle = exports.fireHose = exports.get = exports.all = exports.load = undefined;

var _aev = require('../../source/weather/aev');

var aev = _interopRequireWildcard(_aev);

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

var _redis = require('../../redis');

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const CACHE_NAME = (0, _config2.default)('NAME_VERSION', true) + '_cache_weather_airquality';
const STREAM_NAME = (0, _config2.default)('NAME_VERSION', true) + '_weather_airquality';
const UNAVAILABLE_ERROR = _boom2.default.serverUnavailable('all /Weather/Airquality endpoints are temporarily unavailable');

const load = exports.load = (() => {
    var _ref = _asyncToGenerator(function* () {
        try {
            return yield aev.load();
        } catch (err) {
            throw UNAVAILABLE_ERROR;
        }
    });

    return function load() {
        return _ref.apply(this, arguments);
    };
})();

const all = exports.all = () => {
    return _redis.redis.get(CACHE_NAME).then(function (result) {
        if (result && result !== '') {
            return result;
        } else {
            throw UNAVAILABLE_ERROR;
        }
    }).catch(() => {
        throw UNAVAILABLE_ERROR;
    });
};

const get = exports.get = (() => {
    var _ref2 = _asyncToGenerator(function* (weatherStation) {
        var weatherStations = JSON.parse((yield all())).features;
        for (var i = 0; i < weatherStations.length; i++) {
            if (weatherStations[i].properties.id == weatherStation) {
                return weatherStations[i];
            }
        }
        throw _boom2.default.notFound('Weather stations [' + weatherStation + '] not found');
    });

    return function get(_x) {
        return _ref2.apply(this, arguments);
    };
})();

_redis.redisPubSub.subscribe(STREAM_NAME);
const fireHose = exports.fireHose = callback => {
    const messageCallback = (channel, message) => {
        if (channel === STREAM_NAME) {
            callback(JSON.parse(message));
        }
    };
    all().then(data => {
        data = JSON.parse(data);
        callback({
            type: 'new',
            data: data.features.map(compileStream)
        });
    });

    _redis.redisPubSub.on('message', messageCallback);

    return {
        off: function () {
            _redis.redisPubSub.removeListener('message', messageCallback);
        }
    };
};

const streamSingle = exports.streamSingle = (weatherStation, callback) => {
    const messageCallback = (channel, message) => {
        if (channel === STREAM_NAME) {
            message = JSON.parse(message);
            for (var i = 0; i < message.data.length; i++) {
                if (message.data[i].id == weatherStation) {
                    callback({
                        type: 'update',
                        data: [compileStream(message.data[i].data)]
                    });
                }
            }
        }
    };
    all().then(data => {
        data = JSON.parse(data);
        for (var key in data.features) {
            if (data.features[key].properties.id == weatherStation) {
                callback({
                    type: 'new',
                    data: [compileStream(data.features[key])]
                });
            }
        }
    });
    _redis.redisPubSub.on('message', messageCallback);

    return {
        off: function () {
            _redis.redisPubSub.removeListener('message', messageCallback);
        }
    };
};

const compileStream = exports.compileStream = weatherStation => {
    return {
        id: weatherStation.properties.id,
        data: weatherStation
    };
};