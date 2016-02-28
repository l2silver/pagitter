'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.reverseTransformContent = exports.getContent = exports.reverse = exports.checkPagitterStoresExist = exports.addNewStores = exports.checkNewStores = undefined;
exports.newStoresCreate = newStoresCreate;
exports.addContent = addContent;
exports.checkEndStores = checkEndStores;
exports.setEndStoreNames = setEndStoreNames;
exports.writePagitter = writePagitter;
exports.checkFilenameExists = checkFilenameExists;
exports.reverseTransformRegExp = reverseTransformRegExp;
exports.reverseGlobalVariables = reverseGlobalVariables;
exports.flipMap = flipMap;

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
var readFile = (0, _bluebird.promisify)(_fs2.default.readFile);
var stat = (0, _bluebird.promisify)(_fs2.default.stat);

exports.default = function (state) {
	var promise = [checkNewStores, addContent, checkEndStores].reduce(function (chainedFunctions, fn) {
		return function (state) {
			return chainedFunctions(state).then(function (nextState) {
				return fn(nextState);
			});
		};
	}, _bluebird2.default.method(function (state) {
		return state;
	}));
	return promise(state);
};

var checkNewStores = exports.checkNewStores = _bluebird2.default.method(function (state) {
	if (state.hasIn(['globalVariables', 'pagitterStoresCreate'])) {
		return addNewStores(state);
	}
	return state;
});

var addNewStores = exports.addNewStores = function addNewStores(state) {
	var newStores = newStoresCreate(state.getIn(['globalVariables', 'pagitterStoresCreate']));
	var nextState = state.merge((0, _immutable.Map)({ pagitterStores: newStores }));
	var globalVariables = state.get('globalVariables').delete('pagitterStoresCreate');
	return nextState.set('globalVariables', globalVariables);
};

function newStoresCreate(pagitterStoresCreate) {
	if (pagitterStoresCreate.match(/\[.+\]/)) {
		var storeNames = eval(pagitterStoresCreate);
		return storeNames.reduce(function (stores, name) {
			return stores.set(name, '');
		}, (0, _immutable.Map)());
	} else {
		return (0, _immutable.Map)().set(pagitterStoresCreate, '');
	}
}

function addContent(state) {
	if (state.has('pagitterStores')) {
		return state.get('pagitterStores').keySeq().toArray().reduce(function (state, storeName) {
			return state.updateIn(['pagitterStores', storeName], function (content) {
				return content + state.get('code') + state.get('content');
			});
		}, state);
	}
	return state;
}

function checkEndStores(state) {
	if (state.hasIn(['globalVariables', 'pagitterStoresEnd']) || state.has('last') && state.has('pagitterStores')) {
		var stateWithEndStores = setEndStoreNames(state);
		var stateWithoutGlobalVariablesEndStores = stateWithEndStores.deleteIn(['globalVariables', 'pagitterStoresEnd']);
		return writeStores(stateWithoutGlobalVariablesEndStores);
	}
	return state;
}

function setEndStoreNames(state) {
	if (state.has('last') && state.has('pagitterStores')) {
		return state.set('pagitterStoresEnd', (0, _immutable.List)(state.get('pagitterStores').keySeq().toArray()));
	}

	var pagitterStoresEnd = state.getIn(['globalVariables', 'pagitterStoresEnd']);
	if (pagitterStoresEnd) {
		if (pagitterStoresEnd.match(/\[.+\]/)) {
			return state.set('pagitterStoresEnd', (0, _immutable.List)(eval(pagitterStoresCreate)));
		} else if (pagitterStoresEnd.match(/^ALL$/)) {
			return state.set('pagitterStoresEnd', (0, _immutable.List)(state.get('pagitterStores').keySeq().toArray()));
		} else {
			return state.set('pagitterStoresEnd', (0, _immutable.List)([pagitterStoresEnd]));
		}
	}
	return state;
}

var writeStores = _bluebird2.default.method(function (state) {
	var store = state.get('pagitterStoresEnd').last();
	var storeContent = state.getIn(['pagitterStores', store]);
	var stateWithOneLessStore = state.update('pagitterStores', function (stores) {
		return stores.delete(store);
	});
	var nextState = stateWithOneLessStore.update('pagitterStoresEnd', function (list) {
		return list.pop();
	});
	return checkPagitterStoresExist(state).then(function () {
		return writeFile(process.cwd() + '/.pagitterStores/' + store + '.js', storeContent);
	}).then(function () {
		if (nextState.get('pagitterStoresEnd').count() > 0) {
			return writeStores(nextState);
		} else {
			return nextState.delete('pagitterStoresEnd');
		}
	});
});

var checkPagitterStoresExist = exports.checkPagitterStoresExist = _bluebird2.default.method(function (state) {
	return stat('.pagitterStores').then(function () {
		return state;
	}).catch(function () {
		return mkdirp('.pagitterStores').then(function () {
			return state;
		});
	});
});

var reverse = exports.reverse = _bluebird2.default.method(function (state) {
	return reverseTransformContent(state).then(function (nextState) {
		if (nextState.has('last')) {
			return writePagitter(nextState);
		} else {
			return nextState;
		}
	});
});

function writePagitter(state) {
	return writeFile('pagitter.js', state.get('reverseContent'));
}

var getContent = exports.getContent = _bluebird2.default.method(function (state) {
	var filename = checkFilenameExists(state);
	if (filename) {
		return readFile(filename, 'utf8').then(function (content) {
			return state.set('pagitterStoresExternalContent', content);
		}).catch(function () {
			return state.set('pagitterStoresExternalContent', '');
		});
	} else {
		return state.set('pagitterStoresExternalContent', '');
	}
});

function checkFilenameExists(state) {
	if (state.get('filename')) {
		return state.get('globalVariables').has('base') ? './' + state.get('globalVariables').get('base') + '/' + state.get('filename') : './' + state.get('filename');
	}
	return false;
}

var reverseTransformContent = exports.reverseTransformContent = _bluebird2.default.method(function (state) {
	var nextState = reverseGlobalVariables(state);
	return getContent(nextState).then(function (nextNextState) {
		var newContent = nextNextState.get('pagitterStoresExternalContent').replace(reverseTransformRegExp(nextNextState.get('reverseGlobalVariables')), function (matched) {
			var switchedMatch = nextNextState.getIn(['reverseGlobalVariables', matched]);
			return '<!' + switchedMatch + '!>';
		});
		return nextNextState.updateIn(['reverseContent'], function (content) {
			return content ? content + nextNextState.get('code') + newContent : nextNextState.get('code') + newContent;
		});
	});
});

function reverseTransformRegExp(reverseGlobalVariables) {
	var pattern = (0, _immutable.List)(reverseGlobalVariables.keySeq().toArray()).reduce(function (prev, current) {
		return prev + current + '|';
	}, '');
	return new RegExp(pattern.slice(0, -1), 'g');
}

function reverseGlobalVariables(state) {
	var globalVariables = state.get('globalVariables');
	return state.set('reverseGlobalVariables', flipMap(globalVariables));
}

function flipMap(object) {
	return object.toSeq().flip().toMap();
}