'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.getStopPoints = exports.get = exports.all = exports.load = undefined;

var _transitfeeds = require('../source/line/transitfeeds');

var transitfeeds = _interopRequireWildcard(_transitfeeds);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _redis = require('../redis');

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const CACHE_NAME = (0, _config2.default)('NAME_VERSION', true) + '_cache_line';
const UNAVAILABLE_ERROR = _boom2.default.serverUnavailable('all /Line endpoints are temporarily unavailable');

const load = exports.load = (() => {
    var _ref = _asyncToGenerator(function* () {
        try {
            return yield transitfeeds.lines();
        } catch (err) {
            throw _boom2.default.serverUnavailable('the /Line endpoint is temporarily unavailable' + err);
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
    var _ref2 = _asyncToGenerator(function* (line) {
        return _redis.redis.get(CACHE_NAME + '_' + line).then(function (result) {
            if (result && result !== '') {
                return result;
            } else {
                throw UNAVAILABLE_ERROR;
            }
        }).catch(function () {
            throw _boom2.default.notFound('Line [' + line + '] not found');
        });
    });

    return function get(_x) {
        return _ref2.apply(this, arguments);
    };
})();

const getStopPoints = exports.getStopPoints = (() => {
    var _ref3 = _asyncToGenerator(function* (line) {
        return _redis.redis.get(CACHE_NAME + '_stoppoints_' + line).then(function (result) {
            if (result && result !== '') {
                return result;
            } else {
                throw UNAVAILABLE_ERROR;
            }
        }).catch(function () {
            throw _boom2.default.notFound('Line [' + line + '] not found');
        });
    });

    return function getStopPoints(_x2) {
        return _ref3.apply(this, arguments);
    };
})();