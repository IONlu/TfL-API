'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.middleware = exports.requestTime = undefined;

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _influxdbNodejs = require('influxdb-nodejs');

var _influxdbNodejs2 = _interopRequireDefault(_influxdbNodejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var influxdb = false;
if ((0, _config2.default)('INFLUXDB')) {
    influxdb = new _influxdbNodejs2.default((0, _config2.default)('INFLUXDB') + (0, _config2.default)('NAME_VERSION'));
}

const onData = data => {
    if (!influxdb) return;
    if (data.RESPONSE_TIME) {
        if (data.ROUTE_ACCESS) {
            data.RESPONSE_TIME.path = data.ROUTE_ACCESS.path;
        }
        influxdb.write('responses').field(data.RESPONSE_TIME).then().catch(err => {
            console.log('INFLUX DB ERROR', err.message);
        });
    } else if (data.REQUEST_TIME) {
        influxdb.write('requests').field(data.REQUEST_TIME).then().catch(err => {
            console.log('INFLUX DB ERROR', err.message);
        });
    }
};

const routeAccess = router => {
    return (() => {
        var _ref = _asyncToGenerator(function* (ctx, next) {
            const startTime = Date.now();

            const setMonitorData = function () {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const matched = router.match(ctx.request.url, ctx.request.method);
                const layer = matched.pathAndMethod[matched.pathAndMethod.length - 1];

                ctx.monitor.ROUTE_ACCESS = {
                    path: layer.path,
                    responseTime
                };
            };

            try {
                yield next();
            } catch (err) {
                setMonitorData();
                throw err;
            }

            setMonitorData();
        });

        return function (_x, _x2) {
            return _ref.apply(this, arguments);
        };
    })();
};

const responseTime = () => {
    return (() => {
        var _ref2 = _asyncToGenerator(function* (ctx, next) {
            const startTime = Date.now();

            const setMonitorData = function (status) {
                const endTime = Date.now();
                const responseTime = endTime - startTime;

                ctx.monitor.RESPONSE_TIME = {
                    url: ctx.request.url,
                    method: ctx.request.method,
                    status: status || ctx.response.status,
                    responseTime
                };
            };
            try {
                yield next();
            } catch (err) {
                setMonitorData(500);
                throw err;
            }

            setMonitorData();
        });

        return function (_x3, _x4) {
            return _ref2.apply(this, arguments);
        };
    })();
};

const requestTime = response => {
    const requestTime = response.config.endTime - response.config.startTime;
    onData({
        REQUEST_TIME: {
            name: response.config.name || null,
            url: response.config.url,
            method: response.config.method,
            status: response.status,
            requestTime
        }
    });
};

const middleware = {
    responseTime,
    routeAccess
};

exports.requestTime = requestTime;
exports.middleware = middleware;

exports.default = () => {
    return (() => {
        var _ref3 = _asyncToGenerator(function* (ctx, next) {
            ctx.monitor = {};
            try {
                yield next();
            } catch (err) {
                onData(ctx.monitor);
                throw err;
            }
            onData(ctx.monitor);
        });

        return function (_x5, _x6) {
            return _ref3.apply(this, arguments);
        };
    })();
};