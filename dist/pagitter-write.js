'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.writeFilePromise = undefined;
exports.location = location;
exports.basename = basename;
exports.generateFolders = generateFolders;

var _immutable = require('immutable');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mkdirp = (0, _bluebird.promisify)(_mkdirp2.default);
var writeFile = (0, _bluebird.promisify)(_fs2.default.writeFile);

exports.default = function (state) {
	if (state.get('filename')) {
		return location(state).then(function (fullLocation) {
			return writeFilePromise(fullLocation, state);
		});
	} else {
		return _bluebird2.default.method(function (state) {
			return state;
		});
	}
};

var writeFilePromise = exports.writeFilePromise = _bluebird2.default.method(function (fullLocation, state) {
	return writeFile(fullLocation, state.get('content')).then(function () {
		return state.set('filename', false);
	});
});

function location(state) {
	var filename = state.get('filename');
	var fullFilename = process.cwd() + '/' + basename(state.get('globalVariables')) + filename;
	return generateFolders(fullFilename).then(function () {
		return fullFilename;
	});
}

function basename(globalVariables) {
	if (globalVariables.has('base')) {
		return globalVariables.get('base') + '/';
	} else {
		return '';
	}
}

function generateFolders(filename) {
	var foldersAndFilename = (0, _immutable.List)(filename.split('/'));
	var folders = foldersAndFilename.pop();
	var foldersConc = folders.join('/');
	return mkdirp(foldersConc);
}