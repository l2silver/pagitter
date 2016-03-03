import Promise, {promisify} from 'bluebird';
import {List, Map} from 'immutable';
const writeFile = promisify(require('fs').writeFile);
const readFile = promisify(require('fs').readFile);
export function run(file = 'pagitter.js', pluginsList = []){
					const plugins = generatePluginFunctions(pluginsList);
					const initialState = Map({
						globalVariables: Map(),
						pagitterFilepath: file
					});
					return readFile(file, 'utf8')
					.then((file)=>{
						const actions = List([updateGlobalVariables, updateFilename, transformContent, plugins]);
						const codes = splitCode(file);
						const contents = splitContent(file);
						return codes.reduce((promiseReturningState, code, index)=>{
							return promiseReturningState
							.then((state)=>{
								return runActionsOnState(
									actions, 
									addContentAndCode(
										checkLast(
											state,
											index,
											codes
										),
									contents.get(index)
									, code)
								);
							})
						},
						initialStatePromise(initialState)
						);
					})
					.catch((error)=>{
						console.log('error', error);
					});
				}
export const initialStatePromise = Promise.method((state)=>{
	return state
});

export function checkLast(state, index, codes){
	if((index + 1) == codes.size){
		return state.set('last', true)
	}
	return state;
}

export function addContentAndCode(state, content, code){
	return state.merge({
						code,
						content
					});
}

export function runActionsOnState(actions, state){
	return actions.reduce(
		(promiseReturningState, action)=>{
			return promiseReturningState.then((currentState)=>{
				return action(currentState);
			});
		},
		initialStatePromise(state)
	);
}

export function generatePluginFunctions(plugins){
	return pluginStream(plugins);
}

export function pluginStream(plugins){
	const pluginFunctions = plugins.reduce((oldFunction, plugin)=>{
		return function(state){
			return oldFunction(state)
			.then((oldFunctionState)=>{
				return plugin(oldFunctionState);
			})
		}
	}, initialPluginPromise);
	return pluginFunctions
}


export const initialPluginPromise = Promise.method(function initialPluginPromise(state){
	return state;
});

export function splitCode(file){
	return List(file.match(/\/\*_(.|\s)+?\*\//g));
}

export function splitContent(file){
	const contents = List(file.split(/\/\*_(?:.|\s)+?\*\//g));
	return contents.shift();
}

export function getRawVariables(code){
	return List(code.match(rawVariableRegExp));
}
export const rawVariableRegExp = /\<\!(.|\s)+?\!\>/ig

export const updateGlobalVariables = Promise.method((state)=>{
	const rawVariables = getRawVariables(state.get('code'));
	console.log('rawVariables', rawVariables);
	return state.set('globalVariables', 
		rawVariables.reduce( (updatingGlobalVariables, rawVariable) => {
			return updatingGlobalVariables.merge(convertRawVariableToObject(rawVariable, updatingGlobalVariables));
		}, state.get('globalVariables'))
	);
});

export function convertRawVariableToObject(rawVariable, globalVariables){
	console.log('rawVariable', rawVariable);
	const cleanRawVariable 	= rawVariable.slice(2, -2);
	const rawVariableKey 	= getRawVariableKey(cleanRawVariable);
	const rawVariableValue 	= getRawVariableValue(cleanRawVariable);
	const processedVariableValue = transform(rawVariableValue, globalVariables);
	const evaluateVariableValue = transformEvaluate(processedVariableValue);
	return Map().set(rawVariableKey, evaluateVariableValue);
}



export function getRawVariableKey(rawVariable){
	return rawVariable.match(rawVariableKeyRegExp)[0];
}
export const rawVariableKeyRegExp = /^(.|\s)+?(?=\=)/;
export function getRawVariableValue(rawVariable){
	return rawVariable.replace(rawVariableValueRegExp, '');
}
export const rawVariableValueRegExp = /^(.|\s)+?\=/;

export const processedVariableValueRegExp = /\!\w+?\!/;

export const updateFilename = Promise.method((state)=>{
	const filename = getFilename(state.get('code'), state.get('globalVariables'));
	return state.set('filename', filename)
});

export function getFilename(code, globalVariables){
	const rawFilename = code.replace(allButFilenameRegExp, '');
	return transform(rawFilename, globalVariables);

}

const _StartRegExp = /\/\*_/
const _EndRegExp = /\*\//
const allButFilenameRegExp = new RegExp(
									_StartRegExp.source
									+'|'+_EndRegExp.source
									+'|'+rawVariableRegExp.source
									+'|'+'\\s'
									, 'g');

export const transformContent = Promise.method((state)=>{
	if(state.get('globalVariables').toList().size > 0){
		return state.set('content', 
			transform(state.get('content'), state.get('globalVariables'))
		);
	}
	return state;
});
const removeTagsRegExp = /^\<\!|\!\>|^\@|\@$/g;

export function trimContent(content){
	return content.replace(/(\\n)*$|^(\\n)*/g, '');
}

export function transform(content, globalVariables){
	return trimContent(content).replace(transformRegExp(globalVariables), (matched)=>{
			const globalVariable = matched.replace(removeTagsRegExp, '');
			return globalVariables.get(globalVariable);
		})
}

export function transformRegExp(globalVariables){
	if(globalVariables.toSeq().size > 0){
		const pattern = List(globalVariables.keySeq().toArray()).reduce((prev, current)=>{
			return prev + transformMatchRegExp(current)+'|';
		}, '')
		return new RegExp(pattern.slice(0, -1), 'g');	
	}else{
		return /^aAc5D8g3B1bCvSD$/;
	}
	
}

export function transformMatchRegExp(global){
	return '(\\@'+global+'\\@)';
}

export function transformEvaluate(value){
	if(value.slice(0, 2) == '^^'){
		return eval(value.slice(2));
	}
	return value;
}
