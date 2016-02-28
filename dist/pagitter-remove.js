'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.remove = remove;
exports.location = location;
exports.basename = basename;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var deleteFile = (0, _bluebird.promisify)(_fs2.default.unlink);

exports.default = _bluebird2.default.method(function (state) {
	return state;
});
function remove(state) {
	if (state.get('filename')) {
		var fullFilename = location(state);
		return deleteFile(fullFilename).then(function () {
			return state;
		}).catch(function (err) {
			if (err.code == 'ENOENT') {
				return state;
			}
			throw err;
		});
	} else {
		return _bluebird2.default.method(function (state) {
			return state;
		});
	}
}

function location(state) {
	var filename = state.get('filename');
	var fullFilename = process.cwd() + '/' + basename(state.get('globalVariables')) + filename;
	return fullFilename;
}

function basename(globalVariables) {
	if (globalVariables.has('base')) {
		return globalVariables.get('base') + '/';
	} else {
		return '';
	}
}