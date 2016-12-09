'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _home = require('./home');

var home = _interopRequireWildcard(_home);

var _bikepoint = require('./bikepoint');

var bikepoint = _interopRequireWildcard(_bikepoint);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.default = { home, bikepoint };